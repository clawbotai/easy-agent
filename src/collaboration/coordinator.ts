import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createAgentAdapters } from "./agentAdapters.js";
import {
  buildClaudeExecutionPrompt,
  buildClaudePlanPrompt,
  buildClaudeReviewPrompt,
  buildCodexDirectExecutionPrompt,
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
  ContinueRunRequest,
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
    value === "claude_execute_codex_review" ||
    value === "claude_direct_execute" ||
    value === "codex_direct_execute"
  ) {
    return value;
  }
  throw new Error(`Unsupported workflow: ${value}`);
}

function extractMentionedFiles(output: string): string[] {
  const matches = output.match(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+/g) ?? [];
  return [...new Set(matches)].slice(0, 50);
}

function compactOutput(output: string | undefined, maxChars = 7000): string {
  const normalized = (output ?? "").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n\n[内容过长，已截断 ${normalized.length - maxChars} 个字符]`;
}

function buildCompletedResult(run: AgentRun, completionMessage: string): string {
  const latestExecution = [...run.steps]
    .reverse()
    .find((step) => step.status === "completed" && (step.phase === "execute" || step.phase === "rework"));
  const latestReview = [...run.steps]
    .reverse()
    .find((step) => step.status === "completed" && step.phase === "review");
  const touchedFiles = [...new Set(run.steps.flatMap((step) => step.files ?? []))];
  const taskLines = run.activeInstruction
    ? [`任务：${run.activeInstruction}`, `所属任务：${run.task}`]
    : [`任务：${run.task}`];

  return [
    `结论：${completionMessage}`,
    "",
    ...taskLines,
    touchedFiles.length > 0 ? `涉及文件：${touchedFiles.join(", ")}` : "涉及文件：未从输出中识别到文件路径",
    "",
    "执行结果：",
    compactOutput(latestExecution?.output) || "执行方没有返回详细结果。",
    "",
    "审查结果：",
    compactOutput(latestReview?.output) || "该流程没有进入交叉审查。",
  ].join("\n");
}

function buildCancelledResult(run: AgentRun, reason: string): string {
  return [
    "结论：协作任务已取消。",
    "",
    `任务：${run.task}`,
    "",
    "取消原因：",
    reason,
  ].join("\n");
}

function buildFailedResult(run: AgentRun, error: string): string {
  return [
    "结论：协作任务失败。",
    "",
    `任务：${run.task}`,
    "",
    "失败原因：",
    error,
  ].join("\n");
}

function getCompletedMessage(run: AgentRun): string {
  const completionEvent = [...run.events]
    .reverse()
    .find((event) => {
      const data = event.data as { status?: string } | undefined;
      return event.type === "status_changed" && data?.status === "completed";
    });
  return completionEvent?.message ?? "协作任务完成。";
}

function buildTerminalResult(run: AgentRun): string | undefined {
  if (run.status === "completed") return buildCompletedResult(run, getCompletedMessage(run));
  if (run.status === "failed") return buildFailedResult(run, run.error ?? "未知错误");
  if (run.status === "cancelled") return buildCancelledResult(run, "运行已取消。");
  return undefined;
}

function ensureFinalResult(run: AgentRun): AgentRun {
  if (!run.finalResult) {
    run.finalResult = buildTerminalResult(run);
  }
  return run;
}

function isTerminalRun(run: AgentRun): boolean {
  return TERMINAL_STATUSES.has(run.status);
}

function describeInactiveRun(run: AgentRun): string {
  const lastEvent = run.events.at(-1);
  const runningStep = [...run.steps].reverse().find((step) => step.status === "running");
  if (lastEvent?.type === "approval_resolved") {
    return "运行记录已经收到用户审批，但当前 Web 服务没有对应的审批等待器继续推进。通常是服务重启或进程中断导致。";
  }
  if (runningStep) {
    return `${runningStep.actor} 的 ${runningStep.phase} 步骤处于运行中，但当前 Web 服务没有对应的活动进程。通常是 Agent 子进程被中断或服务重启导致。`;
  }
  if (run.pendingApproval || run.status.includes("awaiting")) {
    return "运行记录处于等待审批状态，但当前 Web 服务没有对应的审批等待器。通常是服务重启导致。";
  }
  return "运行记录处于非终态，但当前 Web 服务没有对应的活动任务。通常是服务重启或执行进程中断导致。";
}

function buildRunContext(run: AgentRun): string {
  const previousContinuations = (run.continuations ?? []).slice(0, -1);
  const continuationLines = previousContinuations.map((item, index) => (
    `${index + 1}. ${item.task}（${item.workflow}）`
  ));
  const stepLines = run.steps.slice(-8).map((step, index) => {
    const output = compactOutput(step.output || step.error, 1200) || "无输出";
    return [
      `${index + 1}. ${step.actor} / ${step.phase} / ${step.status}`,
      output,
    ].join("\n");
  });

  return [
    `原始任务：${run.task}`,
    continuationLines.length ? `此前追加指令：\n${continuationLines.join("\n")}` : "",
    stepLines.length ? `已有步骤摘要：\n${stepLines.join("\n\n")}` : "",
    run.finalResult ? `上一次 MOSS 结果：\n${compactOutput(run.finalResult, 1800)}` : "",
  ].filter(Boolean).join("\n\n");
}

function buildPromptInput(
  run: AgentRun,
  extra: { previousOutput?: string; reviewOutput?: string } = {},
): { task: string; workspace: string; workflow: AgentRun["workflow"]; context?: string; previousOutput?: string; reviewOutput?: string } {
  const isContinuation = Boolean(run.activeInstruction);
  return {
    task: run.activeInstruction ?? run.task,
    workspace: run.workspace,
    workflow: run.workflow,
    ...(isContinuation ? { context: buildRunContext(run) } : {}),
    ...extra,
  };
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

  /**
   * 服务启动时恢复非终态的历史 run。
   * 当 Codex/Claude 子进程被中断或服务异常退出时，run 可能停留在非终态。
   * 此方法在服务启动时调用，将这些 run 标记为"已中断/失败"。
   */
  async recoverStaleRuns(): Promise<AgentRun[]> {
    const persisted = await listRuns();
    const recovered: AgentRun[] = [];

    for (const run of persisted) {
      if (!isTerminalRun(run) && !this.activeRuns.has(run.id)) {
        const recoveredRun = await this.markInactiveRun(run);
        recovered.push(recoveredRun);
      }
    }

    if (recovered.length > 0) {
      console.log(`[Easy Agent] 已恢复 ${recovered.length} 个中断的历史运行记录`);
    }

    return recovered;
  }

  async listRuns(): Promise<AgentRun[]> {
    const persisted = await listRuns();
    const runs = await Promise.all(persisted.map((run) => this.hydrateRun(run)));
    return runs;
  }

  async getRun(runId: string): Promise<AgentRun | null> {
    const run = this.activeRuns.get(runId) ?? await loadRun(runId);
    return run ? await this.hydrateRun(run) : null;
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

  async continueRun(runId: string, request: ContinueRunRequest): Promise<AgentRun> {
    if (!request.task.trim()) {
      throw new Error("Task is required");
    }
    if (request.mode !== "code") {
      throw new Error(`Unsupported mode: ${request.mode}`);
    }

    const run = await this.requireRun(runId);
    if (this.activeRuns.has(run.id) && !isTerminalRun(run)) {
      throw new Error("当前任务仍在运行或等待审批，请先完成、取消或刷新状态后再继续。");
    }

    const createdAt = now();
    const continuation = {
      id: crypto.randomUUID(),
      task: request.task.trim(),
      workflow: validateWorkflow(request.workflow),
      createdAt,
    };

    run.workflow = continuation.workflow;
    run.status = "created";
    run.currentActor = "system";
    run.activeInstruction = continuation.task;
    run.continuations = [...(run.continuations ?? []), continuation];
    delete run.pendingApproval;
    delete run.error;
    delete run.finalResult;

    this.activeRuns.set(run.id, run);
    await this.recordEvent(
      run,
      "run_continued",
      "user",
      `用户继续当前任务：${continuation.task}`,
      { continuationId: continuation.id, workflow: continuation.workflow },
    );
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
    run.finalResult = buildCancelledResult(run, reason);
    delete run.pendingApproval;
    await this.recordEvent(run, "cancelled", "system", reason);
    await this.recordFinalResult(run);
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

  private async hydrateRun(run: AgentRun): Promise<AgentRun> {
    const active = this.activeRuns.get(run.id);
    if (active) return ensureFinalResult(active);
    if (!isTerminalRun(run)) {
      return await this.markInactiveRun(run);
    }
    return ensureFinalResult(run);
  }

  private async markInactiveRun(run: AgentRun): Promise<AgentRun> {
    const previousStatus = run.status;
    const reason = describeInactiveRun(run);
    const endedAt = now();

    for (const step of run.steps) {
      if (step.status === "running") {
        step.status = "failed";
        step.error = reason;
        step.endedAt = endedAt;
      }
    }

    run.status = "failed";
    run.currentActor = "system";
    run.error = reason;
    run.finalResult = buildFailedResult(run, reason);
    delete run.pendingApproval;

    await this.recordEvent(run, "error", "system", reason, {
      recovered: true,
      previousStatus,
    });
    await this.recordFinalResult(run);
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
      } else if (run.workflow === "claude_execute_codex_review") {
        await this.runExecuteReview(run, abortController.signal);
      } else if (run.workflow === "claude_direct_execute") {
        await this.runDirectExecute(run, "claude", abortController.signal);
      } else {
        await this.runDirectExecute(run, "codex", abortController.signal);
      }
    } catch (error: unknown) {
      if (run.status !== "cancelled") {
        run.status = "failed";
        run.currentActor = "system";
        run.error = error instanceof Error ? error.message : String(error);
        run.finalResult = buildFailedResult(run, run.error);
        await this.recordEvent(run, "error", "system", run.error);
        await this.recordFinalResult(run);
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
    const plan = await this.runAgentStep(
      run,
      "claude",
      "plan",
      buildClaudePlanPrompt(buildPromptInput(run)),
      "read-only",
      abortSignal,
    );

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
      buildCodexExecutionPrompt(buildPromptInput(run, { previousOutput: plan.result.output })),
      "workspace-write",
      abortSignal,
    );

    for (let reworkCycle = 0; reworkCycle <= MAX_REWORK_CYCLES; reworkCycle += 1) {
      await this.setStatus(run, "reviewing", "claude", "Claude Code 正在只读审查执行结果。");
      const review = await this.runAgentStep(
        run,
        "claude",
        "review",
        buildClaudeReviewPrompt(buildPromptInput(run, { previousOutput: execution.result.output })),
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
        buildReworkPrompt(buildPromptInput(run, {
          previousOutput: execution.result.output,
          reviewOutput: review.result.output,
        })),
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
      buildClaudeExecutionPrompt(buildPromptInput(run)),
      "workspace-write",
      abortSignal,
    );

    for (let reworkCycle = 0; reworkCycle <= MAX_REWORK_CYCLES; reworkCycle += 1) {
      await this.setStatus(run, "reviewing", "codex", "Codex 正在只读审查 Claude Code 的结果。");
      const review = await this.runAgentStep(
        run,
        "codex",
        "review",
        buildCodexReviewPrompt(buildPromptInput(run, { previousOutput: execution.result.output })),
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
        buildReworkPrompt(buildPromptInput(run, {
          previousOutput: execution.result.output,
          reviewOutput: review.result.output,
        })),
        "workspace-write",
        abortSignal,
      );
    }
  }

  private async runDirectExecute(
    run: AgentRun,
    actor: AgentRole,
    abortSignal: AbortSignal,
  ): Promise<void> {
    const actorName = actor === "claude" ? "Claude Code" : "Codex";
    await this.setStatus(run, "executing", actor, `${actorName} 正在直接执行代码任务。`);
    await this.runAgentStep(
      run,
      actor,
      "execute",
      actor === "claude"
        ? buildClaudeExecutionPrompt(buildPromptInput(run))
        : buildCodexDirectExecutionPrompt(buildPromptInput(run)),
      "workspace-write",
      abortSignal,
    );
    await this.completeRun(run, `${actorName} 已完成直接执行，协作任务完成。`);
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
    run.finalResult = buildCompletedResult(run, message);
    delete run.pendingApproval;
    await this.recordEvent(run, "status_changed", "system", message, { status: "completed" });
    await this.recordFinalResult(run);
  }

  private async recordFinalResult(run: AgentRun): Promise<void> {
    if (!run.finalResult) return;
    await this.recordEvent(run, "final_result", "system", run.finalResult, { status: run.status });
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
