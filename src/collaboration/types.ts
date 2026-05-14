export type AgentRole = "claude" | "codex";

export type Workflow =
  | "claude_plan_codex_execute_claude_review"
  | "claude_execute_codex_review"
  | "claude_direct_execute"
  | "codex_direct_execute";

export type RunMode = "code";

export type RunStatus =
  | "created"
  | "planning"
  | "awaiting_plan_approval"
  | "executing"
  | "reviewing"
  | "awaiting_rework_approval"
  | "reworking"
  | "completed"
  | "failed"
  | "cancelled";

export type StepPhase =
  | "plan"
  | "execute"
  | "review"
  | "approval"
  | "rework";

export type StepStatus = "pending" | "running" | "completed" | "failed";

export type RunEventType =
  | "run_created"
  | "run_continued"
  | "status_changed"
  | "step_started"
  | "step_completed"
  | "approval_required"
  | "approval_resolved"
  | "agent_log"
  | "final_result"
  | "error"
  | "cancelled";

export interface CreateRunRequest {
  workspace: string;
  task: string;
  workflow: Workflow;
  mode: RunMode;
}

export interface ContinueRunRequest {
  task: string;
  workflow: Workflow;
  mode: RunMode;
}

export interface AgentAvailability {
  role: AgentRole;
  available: boolean;
  command: string;
  detail?: string;
}

export interface AgentStep {
  id: string;
  actor: AgentRole | "user" | "system";
  phase: StepPhase;
  status: StepStatus;
  input?: string;
  output?: string;
  files?: string[];
  startedAt?: string;
  endedAt?: string;
  error?: string;
}

export interface PendingApproval {
  id: string;
  kind: "plan" | "execution" | "rework";
  prompt: string;
  stepId?: string;
  createdAt: string;
}

export interface RunEvent {
  id: string;
  runId: string;
  type: RunEventType;
  timestamp: string;
  actor?: AgentRole | "user" | "system";
  message: string;
  data?: unknown;
}

export interface RunContinuation {
  id: string;
  task: string;
  workflow: Workflow;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  workspace: string;
  task: string;
  workflow: Workflow;
  mode: RunMode;
  status: RunStatus;
  currentActor?: AgentRole | "user" | "system";
  createdAt: string;
  updatedAt: string;
  steps: AgentStep[];
  events: RunEvent[];
  continuations?: RunContinuation[];
  activeInstruction?: string;
  pendingApproval?: PendingApproval;
  finalResult?: string;
  error?: string;
}

export type AgentPermissionMode = "read-only" | "workspace-write";

export interface AgentRunInput {
  runId: string;
  stepId: string;
  workspace: string;
  prompt: string;
  phase: StepPhase;
  permissionMode: AgentPermissionMode;
  outputFile: string;
  abortSignal?: AbortSignal;
}

export interface AgentProcessEvent {
  stream: "stdout" | "stderr";
  text: string;
}

export interface AgentRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  output: string;
  outputFile: string;
}

export interface AgentAdapter {
  readonly role: AgentRole;
  checkAvailable(cwd: string): Promise<AgentAvailability>;
  run(
    input: AgentRunInput,
    onEvent: (event: AgentProcessEvent) => void,
  ): Promise<AgentRunResult>;
}
