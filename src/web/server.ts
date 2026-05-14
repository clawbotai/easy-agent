#!/usr/bin/env node
import { loadEnv } from "../utils/loadEnv.js";
loadEnv();

import * as http from "node:http";
import { URL } from "node:url";
import { CollaborationCoordinator } from "../collaboration/coordinator.js";
import type { CreateRunRequest } from "../collaboration/types.js";
import { renderClientHtml } from "./clientHtml.js";

const DEFAULT_PORT = 4318;
const coordinator = new CollaborationCoordinator();

interface JsonResponse {
  status?: number;
  body: unknown;
}

function getPort(argv: string[]): number {
  const index = argv.indexOf("--port");
  const raw = index >= 0 ? argv[index + 1] : process.env.EASY_AGENT_WEB_PORT;
  const parsed = raw ? Number(raw) : DEFAULT_PORT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function sendJson(res: http.ServerResponse, response: JsonResponse): void {
  const status = response.status ?? 200;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(response.body));
}

function sendHtml(res: http.ServerResponse, html: string): void {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function sendSse(res: http.ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function readJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  return (raw ? JSON.parse(raw) : {}) as T;
}

function parseRunRoute(pathname: string): { runId: string; action?: string } | null {
  const match = pathname.match(/^\/api\/runs\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return null;
  return {
    runId: decodeURIComponent(match[1]),
    action: match[2],
  };
}

async function routeApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method === "GET" && url.pathname === "/api/agents") {
    const workspace = url.searchParams.get("workspace") || process.cwd();
    const agents = await coordinator.getAgentAvailability(workspace);
    sendJson(res, { body: { agents } });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/runs") {
    const runs = await coordinator.listRuns();
    sendJson(res, { body: { runs } });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/runs") {
    const body = await readJsonBody<CreateRunRequest>(req);
    const run = await coordinator.createRun(body);
    sendJson(res, { status: 201, body: { run } });
    return true;
  }

  const runRoute = parseRunRoute(url.pathname);
  if (!runRoute) {
    return false;
  }

  if (req.method === "GET" && !runRoute.action) {
    const run = await coordinator.getRun(runRoute.runId);
    if (!run) {
      sendJson(res, { status: 404, body: { error: "Run not found" } });
      return true;
    }
    sendJson(res, { body: { run } });
    return true;
  }

  if (req.method === "GET" && runRoute.action === "events") {
    const run = await coordinator.getRun(runRoute.runId);
    if (!run) {
      sendJson(res, { status: 404, body: { error: "Run not found" } });
      return true;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    });
    sendSse(res, "snapshot", { run });
    const unsubscribe = coordinator.subscribe(run.id, (event, nextRun) => {
      sendSse(res, "event", { event, run: nextRun });
    });
    req.on("close", unsubscribe);
    return true;
  }

  if (req.method === "POST" && runRoute.action === "approve") {
    const body = await readJsonBody<{ approved?: unknown; note?: unknown }>(req);
    const run = await coordinator.approve(
      runRoute.runId,
      body.approved === true,
      typeof body.note === "string" ? body.note : undefined,
    );
    sendJson(res, { body: { run } });
    return true;
  }

  if (req.method === "POST" && runRoute.action === "cancel") {
    const run = await coordinator.cancel(runRoute.runId);
    sendJson(res, { body: { run } });
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  void (async () => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        const handled = await routeApi(req, res, url);
        if (!handled) {
          sendJson(res, { status: 404, body: { error: "Not found" } });
        }
        return;
      }

      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        sendHtml(res, renderClientHtml(process.cwd()));
        return;
      }

      sendJson(res, { status: 404, body: { error: "Not found" } });
    } catch (error: unknown) {
      sendJson(res, {
        status: 500,
        body: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  })();
});

server.listen(getPort(process.argv), "127.0.0.1", () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : DEFAULT_PORT;
  console.log(`Easy Agent Web UI: http://127.0.0.1:${port}`);
});
