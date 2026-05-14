'use client';

import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { shortTime } from '@/lib/types';

export default function ApprovalCard() {
  const { currentRun, setCurrentRun } = useAppStore();

  if (!currentRun?.pendingApproval) return null;

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/runs/${currentRun.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.run) {
          setCurrentRun(data.run);
        }
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`/api/runs/${currentRun.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.run) {
          setCurrentRun(data.run);
        }
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  return (
    <div className="shape-rect-lg bg-warning-dim border border-warning/20 p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-sm font-medium text-warning">等待审批</span>
        <span className="text-xs text-text-tertiary font-mono ml-auto">
          {shortTime(currentRun.pendingApproval.createdAt)}
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-4 leading-relaxed">
        {currentRun.pendingApproval.prompt}
      </p>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={handleApprove}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          批准继续
        </Button>
        <Button variant="danger" size="sm" onClick={handleReject}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          拒绝并取消
        </Button>
      </div>
    </div>
  );
}
