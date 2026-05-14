import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createAgentAdapters } from "./agentAdapters.js";
import {
  buildClaudeExecutionPrompt,
  buildClaudePlanPrompt,
  buildClaudeReviewPrompt,
  buildCodexExecutionPrompt,
  buildCodexReviewPrompt,
  buildReworkPrompt,
  parseReviewDecision,
} from "./prompts.js";
import {
  ensureRunArtifactDir,
  getRunArtifactPath,
  listRuns,
  loadRun,
  saveRun,
} from "./runStore.js";
import { acquireWorkspaceLock } from "./workspaceLocks.js";
import type {
  AgentAdapter,
  AgentAvailability,
  AgentRole,
  AgentRun,
  AgentRunResult,
  AgentStep,
  CreateRunRequest,
  PendingApproval,
  RunEvent,
  RunEventType,
  RunStatus,
  StepPhase,
} from "./types.js";

type RunListener = (event: RunEvent, run: AgentRun) => void;
type ApprovalResult = { approved: boolean; note?: string };

const TERMINAL_STATUSES = new Set<RunStatus>(["completed", "failed", "cancelled"]);
const MAX_REWORK_CYCLES = 2;

function now(): string {
  return new Date().toISOString();
}

function validateWorkflow(value: string): CreateRunRequest["workflow"] {
  if (
    value === "claude_plan_codex_execute_claude_review" ||
    value === "claude_execute_codex_review"
  ) {
    return value;
  }
  throw new Error(`Unsupported workflow: ${value}`);
}

function extractMentionedFiles(output: string): string[] {
  const matches = output.match(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+/g) ?? [];
  return [...new Set(matches)].slice(0, 50);
}

export class CollaborationCoordinator {
  private readonly adapters: Record<AgentRole, AgentAdapter>;
  private readonly listeners = new Map<string, Set<RunListener>>();
  private readonly activeRuns = new Map<string, AgentRun>();
  private readonly approvalWaiters = new Map<string, (result: ApprovalResult) => void>();
  private readonly abortControllers = new Map<string, AbortController>();

  constructor(adapters: Record<AgentRole, AgentAdapter> = createAgentAdapters()) {
    this.adapters = adapters;
  }

  async listRuns(): Promise<AgentRun[]> {
    const persisted = await listRuns();
    return persisted.map((run) => this.activeRuns.get(run.id) ?? run);
  }

  async getRun(runId: string): Promise<AgentRun | null> {
    return this.activeRuns.get(runId) ?? await loadRun(runId);
  }

  async getAgentAvailability(cwd: string): Promise<AgentAvailability[]> {
    const workspace = path.resolve(cwd);
    return await Promise.all([
      this.adapters.claude.checkAvailable(workspace),
      this.adapters.codex.checkAvailable(workspace),
    ]);
  }

  subscribe(runId: string, listener: RunListener): () => void {
    const listeners = this.listeners.get(runId) ?? new Set<RunListener>();
    listeners.add(listener);
    this.listeners.set(runId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(runId);
      }
    };
  }

  async createRun(request: CreateRunRequest): Promise<AgentRun> {
    if (!request.task.trim()) {
      throw new Error("Task is required");
    }
    if (request.mode !== "code") {
      throw new Error(`Unsupported mode: ${request.mode}`);
    }

    const workspace = path.resolve(request.workspace);
    const stat = await fs.stat(workspace).catch(() => null);
    if (!stat?.isDirectory()) {
      throw new Error(`Workspace does not exist or is not a directory: ${workspace}`);
    }

    const createdAt = now();
    const run: AgentRun = {
      id: crypto.randomUUID(),
      workspace,
      task: request.task.trim(),
      workflow: validateWorkflow(request.workflow),
      mode: "code",
      status: "created",
      currentActor: "system",
      createdAt,
      updatedAt: createdAt,
      steps: [],
      events: [],
    };

    this.activeRuns.set(run.id, run);
    await this.recordEvent(run, "run_created", "system", "协作任务已创建。");
    void this.runWorkflow(run.id);
    return run;
  }

  async approve(runId: string, approved: boolean, note?: string): Promise<AgentRun> {
    const run = await this.requireRun(runId);
    if (!run.pendingApproval) {
      throw new Error("This run is not waiting for approval");
    }

    const approval = run.pendingApproval;
    delete run.pendingApproval;
    await this.recordEvent(
      run,
      "approval_resolved",
      "user",
      approved ? "用户已批准继续执行。" : "用户已拒绝继续执行。",
      { approvalId: approval.id, kind: approval.kind, note },
    );

    const waiter = this.approvalWaiters.get(runId);
    if (waiter) {
      this.approvalWaiters.delete(runId);
      waiter({ approved, note });
    }

    if (!approved) {
      await this.cancel(runId, "用户拒绝审批。");
    }

    return run;
  }

  async cancel(runId: string, reason = "用户取消运行。"): Promise<AgentRun> {
    const run = await this.requireRun(runId);
    if (TERMINAL_STATUSES.has(run.status)) {
      return run;
    }

    this.abortControllers.get(runId)?.abort();
    const waiter = this.approvalWaiters.get(runId);
    if (waiter) {
      this.approvalWaiters.delete(runId);
      waiter({ approved: false, note: reason });
    }

    run.status = "cancelled";
    run.currentActor = "system";
    delete run.pendingApproval;
    await this.recordEvent(run, "cancelled", "system", reason);
    this.activeRuns.delete(run.id);
    return run;
  }

  private async requireRun(runId: string): Promise<AgentRun> {
    const run = await this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    return run;
  }

  private async runWorkflow(runId: string): Promise<void> {
    const run = await this.requireRun(runId);
    const abortController = new AbortController();
    this.abortControllers.set(run.id, abortController);
    let releaseLock: (() => void) | null = null;

    try {
      releaseLock = acquireWorkspaceLock(run.workspace, run.id);
      if (run.workflow === "claude_plan_codex_execute_claude_review") {
        await this.runPlanExecuteReview(run, abortController.signal);
      } else {
        await this.runExecuteReview(run, abortController.signal);
      }
    } catch (error: unknown) {
      if (run.status !== "cancelled") {
        run.status = "failed";
        run.currentActor = "system";
        run.error = error instanceof Error ? error.message : String(error);
        await this.recordEvent(run, "error", "system", run.error);
      }
    } finally {
      releaseLock?.();
      this.abortControllers.delete(run.id);
      if (TERMINAL_STATUSES.has(run.status)) {
        this.activeRuns.delete(run.id);
      }
      await saveRun(run);
    }
  }

  private async runPlanExecuteReview(run: AgentRun, abortSignal: AbortSignal): Promise<void> {
    await this.setStatus(run, "planning", "claude", "Claude Code 正在只读分析并制定计划。");
    const plan = await this.runAgentStep(run, "claude", "plan", buildClaudePlanPrompt(run), "read-only", abortSignal);

    const planApproval = await this.waitForApproval(
      run,
      "plan",
      "Claude Code 已完成计划，请确认是否允许 Codex 按计划修改工作区。",
      plan.step.id,
    );
    if (!planApproval.approved) return;

    await this.setStatus(run, "executing", "codex", "Codex 正在按计划执行代码修改。");
    let execution = await this.runAgentStep(
      run,
      "codex",
      "execute",
      buildCodexExecutionPrompt({ ...run, previousOutput: plan.result.output }),
      "workspace-write",
      abortSignal,
    );

    for (let reworkCycle = 0; reworkCycle <= MAX_REWORK_CYCLES; reworkCycle += 1) {
      await this.setStatus(run, "reviewing", "claude", "Claude Code 正在只读审查执行结果。");
      const review = await this.runAgentStep(
        run,
        "claude",
        "review",
        buildClaudeReviewPrompt({ ...run, previousOutput: execution.result.output }),
        "read-only",
        abortSignal,
      );

      if (parseReviewDecision(review.result.output) === "approve") {
        await this.completeRun(run, "Claude Code 审查通过，协作任务完成。");
        return;
      }

      if (reworkCycle >= MAX_REWORK_CYCLES) {
        throw new Error("Review still requested changes after maximum rework cycles");
      }

      const reworkApproval = await this.waitForApproval(
        run,
        "rework",
        "Claude Code 要求修改，请确认是否允许 Codex 继续返工。",
        review.step.id,
      );
      if (!reworkApproval.approved) return;

      await this.setStatus(run, "reworking", "codex", "Codex 正在根据审查意见返工。");
      execution = await this.runAgentStep(
        run,
        "codex",
        "rework",
        buildReworkPrompt({
          ...run,
          previousOutput: execution.result.output,
          reviewOutput: review.result.output,
        }),
        "workspace-write",
        abortSignal,
      );
    }
  }

  private async runExecuteReview(run: AgentRun, abortSignal: AbortSignal): Promise<void> {
    const executionApproval = await this.waitForApproval(
      run,
      "execution",
      "该流程会让 Claude Code 直接修改工作区，请确认是否允许执行。",
    );
    if (!executionApproval.approved) return;

    await this.setStatus(run, "executing", "claude", "Claude Code 正在执行代码任务。");
    let execution = await this.runAgentStep(
      run,
      "claude",
      "execute",
      buildClaudeExecutionPrompt(run),
      "workspace-write",
      abortSignal,
    );

    for (let reworkCycle = 0; reworkCycle <= MAX_REWORK_CYCLES; reworkCycle += 1) {
      await this.setStatus(run, "reviewing", "codex", "Codex 正在只读审查 Claude Code 的结果。");
      const review = await this.runAgentStep(
        run,
        "codex",
        "review",
        buildCodexReviewPrompt({ ...run, previousOutput: execution.result.output }),
        "read-only",
        abortSignal,
      );

      if (parseReviewDecision(review.result.output) === "approve") {
        await this.completeRun(run, "Codex 审查通过，协作任务完成。");
        return;
      }

      if (reworkCycle >= MAX_REWORK_CYCLES) {
        throw new Error("Review still requested changes after maximum rework cycles");
      }

      const reworkApproval = await this.waitForApproval(
        run,
        "rework",
        "Codex 要求修改，请确认是否允许 Claude Code 继续返工。",
        review.step.id,
      );
      if (!reworkApproval.approved) return;

      await this.setStatus(run, "reworking", "claude", "Claude Code 正在根据 Codex 审查意见返工。");
      execution = await this.runAgentStep(
        run,
        "claude",
        "rework",
        buildReworkPrompt({
          ...run,
          previousOutput: execution.result.output,
          reviewOutput: review.result.output,
        }),
        "workspace-write",
        abortSignal,
      );
    }
  }

  private async runAgentStep(
    run: AgentRun,
    actor: AgentRole,
    phase: StepPhase,
    prompt: string,
    permissionMode: "read-only" | "workspace-write",
    abortSignal: AbortSignal,
  ): Promise<{ step: AgentStep; result: AgentRunResult }> {
    const adapter = this.adapters[actor];
    const availability = await adapter.checkAvailable(run.workspace);
    if (!availability.available) {
      throw new Error(`${actor} is unavailable: ${availability.detail ?? availability.command}`);
    }

    await ensureRunArtifactDir(run.id);
    const step: AgentStep = {
      id: crypto.randomUUID(),
      actor,
      phase,
      status: "running",
      input: prompt,
      startedAt: now(),
    };
    run.steps.push(step);
    await this.recordEvent(run, "step_started", actor, `${actor} 开始 ${phase}。`, { stepId: step.id });

    const outputFile = getRunArtifactPath(run.id, `${step.id}-${actor}-${phase}.txt`);
    try {
      const result = await adapter.run(
        {
          runId: run.id,
          stepId: step.id,
          workspace: run.workspace,
          prompt,
          phase,
          permissionMode,
          outputFile,
          abortSignal,
        },
        (event) => {
          void this.recordEvent(
            run,
            "agent_log",
            actor,
            event.text,
            { stepId: step.id, stream: event.stream },
          );
        },
      );

      if (result.exitCode !== 0) {
        throw new Error(`${actor} exited with code ${result.exitCode ?? -1}: ${result.stderr || result.output}`);
      }

      step.status = "completed";
      step.output = result.output;
      step.files = extractMentionedFiles(result.output);
      step.endedAt = now();
      await this.recordEvent(run, "step_completed", actor, `${actor} 完成 ${phase}。`, {
        stepId: step.id,
        files: step.files,
      });
      return { step, result };
    } catch (error: unknown) {
      step.status = "failed";
      step.error = error instanceof Error ? error.message : String(error);
      step.endedAt = now();
      await this.recordEvent(run, "error", actor, step.error, { stepId: step.id });
      throw error;
    }
  }

  private async waitForApproval(
    run: AgentRun,
    kind: PendingApproval["kind"],
    prompt: string,
    stepId?: string,
  ): Promise<ApprovalResult> {
    run.status = kind === "rework" ? "awaiting_rework_approval" : "awaiting_plan_approval";
    run.currentActor = "user";
    run.pendingApproval = {
      id: crypto.randomUUID(),
      kind,
      prompt,
      stepId,
      createdAt: now(),
    };
    await this.recordEvent(run, "approval_required", "system", prompt, run.pendingApproval);

    return await new Promise<ApprovalResult>((resolve) => {
      this.approvalWaiters.set(run.id, resolve);
    });
  }

  private async setStatus(
    run: AgentRun,
    status: RunStatus,
    currentActor: AgentRole | "user" | "system",
    message: string,
  ): Promise<void> {
    run.status = status;
    run.currentActor = currentActor;
    delete run.pendingApproval;
    await this.recordEvent(run, "status_changed", currentActor, message, { status });
  }

  private async completeRun(run: AgentRun, message: string): Promise<void> {
    run.status = "completed";
    run.currentActor = "system";
    delete run.pendingApproval;
    await this.recordEvent(run, "status_changed", "system", message, { status: "completed" });
  }

  private async recordEvent(
    run: AgentRun,
    type: RunEventType,
    actor: RunEvent["actor"],
    message: string,
    data?: unknown,
  ): Promise<void> {
    const event: RunEvent = {
      id: crypto.randomUUID(),
      runId: run.id,
      type,
      timestamp: now(),
      actor,
      message,
      ...(data === undefined ? {} : { data }),
    };
    run.events.push(event);
    await saveRun(run);
    const listeners = this.listeners.get(run.id);
    if (listeners) {
      for (const listener of listeners) {
        listener(event, run);
      }
    }
  }
}
