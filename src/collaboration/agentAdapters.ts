import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import { loadCollaborationSettings, type AgentCommandSettings } from "./settings.js";
import type {
  AgentAdapter,
  AgentAvailability,
  AgentProcessEvent,
  AgentRole,
  AgentRunInput,
  AgentRunResult,
} from "./types.js";

async function commandExists(command: string, cwd: string): Promise<{ ok: boolean; detail?: string }> {
  return await new Promise((resolve) => {
    const child = spawn(process.env.SHELL || "bash", ["-lc", `command -v ${JSON.stringify(command)}`], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ ok: false, detail: error.message });
    });
    child.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        resolve({ ok: true, detail: stdout.trim() });
        return;
      }
      resolve({ ok: false, detail: stderr.trim() || `${command} not found` });
    });
  });
}

function appendLineBuffer(
  pending: { value: string },
  chunk: string,
  stream: AgentProcessEvent["stream"],
  onEvent: (event: AgentProcessEvent) => void,
): void {
  pending.value += chunk;
  const lines = pending.value.split(/\r?\n/);
  pending.value = lines.pop() ?? "";
  for (const line of lines) {
    if (line.trim()) {
      onEvent({ stream, text: line });
    }
  }
}

function flushLineBuffer(
  pending: { value: string },
  stream: AgentProcessEvent["stream"],
  onEvent: (event: AgentProcessEvent) => void,
): void {
  if (pending.value.trim()) {
    onEvent({ stream, text: pending.value });
  }
  pending.value = "";
}

function readOutputFile(outputFile: string): Promise<string> {
  return fs.readFile(outputFile, "utf-8").catch(() => "");
}

class LocalCliAgentAdapter implements AgentAdapter {
  constructor(public readonly role: AgentRole) {}

  async checkAvailable(cwd: string): Promise<AgentAvailability> {
    const settings = await loadCollaborationSettings(cwd);
    const agent = settings.agents[this.role];
    const exists = await commandExists(agent.command, cwd);
    return {
      role: this.role,
      available: exists.ok,
      command: [agent.command, ...agent.args].join(" "),
      detail: exists.detail,
    };
  }

  async run(
    input: AgentRunInput,
    onEvent: (event: AgentProcessEvent) => void,
  ): Promise<AgentRunResult> {
    const settings = await loadCollaborationSettings(input.workspace);
    const agent = settings.agents[this.role];
    const args = this.buildArgs(agent, input);

    return await new Promise<AgentRunResult>((resolve, reject) => {
      const child = spawn(agent.command, args, {
        cwd: input.workspace,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;
      const stdoutPending = { value: "" };
      const stderrPending = { value: "" };

      const finish = async (exitCode: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        input.abortSignal?.removeEventListener("abort", onAbort);
        flushLineBuffer(stdoutPending, "stdout", onEvent);
        flushLineBuffer(stderrPending, "stderr", onEvent);
        const output = (await readOutputFile(input.outputFile)) || stdout;
        resolve({
          exitCode,
          stdout,
          stderr,
          output,
          outputFile: input.outputFile,
        });
      };

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        input.abortSignal?.removeEventListener("abort", onAbort);
        reject(error);
      };

      const onAbort = () => {
        child.kill("SIGTERM");
      };

      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
      }, agent.timeoutMs);

      input.abortSignal?.addEventListener("abort", onAbort, { once: true });

      child.stdin.write(input.prompt);
      child.stdin.end();

      child.stdout.on("data", (chunk: Buffer | string) => {
        const text = chunk.toString();
        stdout += text;
        appendLineBuffer(stdoutPending, text, "stdout", onEvent);
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        const text = chunk.toString();
        stderr += text;
        appendLineBuffer(stderrPending, text, "stderr", onEvent);
      });
      child.on("error", fail);
      child.on("close", (code) => {
        void finish(code);
      });
    });
  }

  private buildArgs(agent: AgentCommandSettings, input: AgentRunInput): string[] {
    if (this.role === "codex") {
      return [
        ...agent.args,
        "--cd",
        input.workspace,
        "--sandbox",
        input.permissionMode,
        "--output-last-message",
        input.outputFile,
        "-",
      ];
    }

    const permissionMode = input.permissionMode === "read-only" ? "plan" : "acceptEdits";
    return [
      ...agent.args,
      "--permission-mode",
      permissionMode,
    ];
  }
}

export function createAgentAdapters(): Record<AgentRole, AgentAdapter> {
  return {
    claude: new LocalCliAgentAdapter("claude"),
    codex: new LocalCliAgentAdapter("codex"),
  };
}
