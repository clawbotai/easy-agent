import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getRunsRoot } from "../utils/paths.js";
import type { AgentRun } from "./types.js";

function getRunPath(runId: string): string {
  return path.join(getRunsRoot(), `${runId}.json`);
}

async function ensureRunsRoot(): Promise<void> {
  await fs.mkdir(getRunsRoot(), { recursive: true });
}

function parseRun(raw: unknown): AgentRun | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as AgentRun;
  if (
    typeof value.id !== "string" ||
    typeof value.workspace !== "string" ||
    typeof value.task !== "string" ||
    typeof value.workflow !== "string" ||
    typeof value.status !== "string" ||
    !Array.isArray(value.steps) ||
    !Array.isArray(value.events)
  ) {
    return null;
  }
  return value;
}

export async function saveRun(run: AgentRun): Promise<void> {
  await ensureRunsRoot();
  run.updatedAt = new Date().toISOString();
  await fs.writeFile(getRunPath(run.id), `${JSON.stringify(run, null, 2)}\n`, "utf-8");
}

export async function loadRun(runId: string): Promise<AgentRun | null> {
  try {
    const raw = await fs.readFile(getRunPath(runId), "utf-8");
    return parseRun(JSON.parse(raw));
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") return null;
    throw error;
  }
}

export async function listRuns(): Promise<AgentRun[]> {
  await ensureRunsRoot();
  const files = await fs.readdir(getRunsRoot());
  const runs = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        try {
          const raw = await fs.readFile(path.join(getRunsRoot(), file), "utf-8");
          return parseRun(JSON.parse(raw));
        } catch {
          return null;
        }
      }),
  );
  return runs
    .filter((run): run is AgentRun => run !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRunArtifactPath(runId: string, fileName: string): string {
  return path.join(getRunsRoot(), runId, fileName);
}

export async function ensureRunArtifactDir(runId: string): Promise<string> {
  const dir = path.join(getRunsRoot(), runId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
