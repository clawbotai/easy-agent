'use client';

import { useAppStore } from '@/store/appStore';
import Message from './Message';
import StepCard from './StepCard';
import ApprovalCard from './ApprovalCard';
import ResultCard from './ResultCard';
import Badge from '@/components/ui/Badge';
import { statusLabels, workflowLabels } from '@/lib/types';

function statusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'completed') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'error';
  if (status.includes('awaiting')) return 'warning';
  return 'default';
}

export default function Thread() {
  const { currentRun } = useAppStore();

  if (!currentRun) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4 animate-fade-in">
      {/* Run Header */}
      <div className="flex items-center justify-between p-4 shape-rect-lg bg-bg-surface border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium text-text">
              {workflowLabels[currentRun.workflow] || currentRun.workflow}
            </span>
          </div>
          <span className="text-xs text-text-tertiary font-mono">{currentRun.workspace}</span>
        </div>
        <Badge variant={statusBadgeVariant(currentRun.status)}>
          {statusLabels[currentRun.status] || currentRun.status}
        </Badge>
      </div>

      {/* User Message */}
      <Message
        avatar="U"
        name="用户"
        time={currentRun.createdAt}
        text={currentRun.task}
      />

      {/* Continuations */}
      {(currentRun.continuations || []).map((item, i) => (
        <Message
          key={`continuation-${item.createdAt}-${i}`}
          avatar="U"
          name="用户"
          time={item.createdAt}
          text={item.task}
          subtitle="继续"
        />
      ))}

      {/* Steps */}
      {currentRun.steps.map((step, index) => (
        <StepCard key={step.id} step={step} index={index} totalSteps={currentRun.steps.length} />
      ))}

      {/* Approval */}
      {currentRun.pendingApproval && <ApprovalCard />}

      {/* Result */}
      {currentRun.finalResult && <ResultCard />}
    </div>
  );
}
