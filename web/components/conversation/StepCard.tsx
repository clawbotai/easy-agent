'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Step, shortTime } from '@/lib/types';

const phaseLabels: Record<string, string> = {
  plan: '规划',
  execute: '编辑',
  review: '审查',
  approval: '审批',
  rework: '返工',
};

const actorLabels: Record<string, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  system: 'MOSS',
  user: '用户',
};

interface StepCardProps {
  step: Step;
  index: number;
  totalSteps: number;
}

function stepTitle(step: Step) {
  return `${phaseLabels[step.phase] || step.phase} · ${actorLabels[step.actor] || step.actor}`;
}

function stepFiles(step: Step) {
  return step.files?.length ? step.files.join(', ') : '无文件列表';
}

function statusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'completed') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'error';
  if (status === 'running') return 'warning';
  return 'default';
}

export default function StepCard({ step, index, totalSteps }: StepCardProps) {
  const [isOpen, setIsOpen] = useState(
    step.status === 'running' || step.status === 'failed' || index === totalSteps - 1
  );

  const eventLines = step.events?.length
    ? step.events.map((e) => `${shortTime(e.timestamp)} ${e.actor || e.type}  ${e.message}`).join('\n')
    : '暂无日志';

  const output = step.output || step.error || '等待输出';

  const borderColor = step.status === 'failed' ? 'border-l-error' : step.status === 'running' ? 'border-l-accent' : 'border-l-success';

  return (
    <details
      className={`shape-rect-lg bg-bg-surface border border-border border-l-2 ${borderColor} overflow-hidden transition-all duration-200 group [&[open]]:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]`}
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none transition-colors hover:bg-bg-hover [&::-webkit-details-marker]:hidden">
        <div className="w-6 h-6 shape-rect-sm bg-bg-hover flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span className="flex-1 text-sm font-medium text-text">{stepTitle(step)}</span>
        <span className="text-xs text-text-tertiary font-mono truncate max-w-[200px]">
          {stepFiles(step)}
        </span>
        <Badge variant={statusBadgeVariant(step.status)} size="sm">
          {step.status === 'completed' ? 'DONE' : step.status}
        </Badge>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-tertiary transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </summary>

      <div className="border-t border-border p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">开始</div>
            <div className="text-sm text-text-secondary font-mono">{shortTime(step.startedAt) || '-'}</div>
          </div>
          <div>
            <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">结束</div>
            <div className="text-sm text-text-secondary font-mono">{shortTime(step.endedAt) || '运行中'}</div>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">文件</div>
          <div className="text-sm text-text-secondary font-mono">{stepFiles(step)}</div>
        </div>

        <div>
          <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-2">日志</div>
          <pre className="p-3 shape-rect bg-bg-elevated border border-border text-xs text-text-secondary font-mono overflow-auto max-h-[200px] leading-relaxed">
            {eventLines}
          </pre>
        </div>

        <div>
          <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-2">输出</div>
          <pre className="p-3 shape-rect bg-bg-elevated border border-border text-xs text-text-secondary font-mono overflow-auto max-h-[300px] leading-relaxed">
            {output}
          </pre>
        </div>
      </div>
    </details>
  );
}
