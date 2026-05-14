export interface Agent {
  role: string;
  command: string;
  detail?: string;
  available: boolean;
}

export interface Step {
  id: string;
  phase: string;
  actor: string;
  status: string;
  files?: string[];
  startedAt?: string;
  endedAt?: string;
  output?: string;
  error?: string;
  events?: StepEvent[];
}

export interface StepEvent {
  timestamp: string;
  actor?: string;
  type?: string;
  message: string;
}

export interface Run {
  id: string;
  task: string;
  status: string;
  workspace: string;
  workflow: string;
  createdAt: string;
  updatedAt: string;
  finalResult?: string;
  pendingApproval?: {
    createdAt: string;
    prompt: string;
  };
  continuations?: Array<{
    task: string;
    createdAt: string;
  }>;
  steps: Step[];
  events: Array<{
    timestamp: string;
    actor?: string;
    type?: string;
    message: string;
    data?: {
      stepId?: string;
    };
  }>;
}

export const statusLabels: Record<string, string> = {
  created: '已创建',
  planning: '规划中',
  awaiting_plan_approval: '等待审批',
  executing: '执行中',
  reviewing: '审查中',
  awaiting_rework_approval: '等待返工审批',
  reworking: '返工中',
  completed: '完成',
  failed: '失败',
  cancelled: '取消',
};

export const workflowLabels: Record<string, string> = {
  claude_plan_codex_execute_claude_review: '规划执行审查',
  claude_execute_codex_review: '执行审查修正',
  claude_direct_execute: 'Claude Code 直接执行',
  codex_direct_execute: 'Codex 直接执行',
};

export const activeStatuses = [
  'created',
  'planning',
  'awaiting_plan_approval',
  'executing',
  'reviewing',
  'awaiting_rework_approval',
  'reworking',
];

export function shortTime(value?: string): string {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('zh-CN', { hour12: false });
}

export function badgeVariant(status: string): 'default' | 'waiting' | 'failed' {
  if (status === 'failed' || status === 'cancelled') return 'failed';
  if (status.includes('awaiting')) return 'waiting';
  return 'default';
}
