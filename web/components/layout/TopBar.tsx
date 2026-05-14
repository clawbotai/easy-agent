'use client';

import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { statusLabels } from '@/lib/types';

export default function TopBar() {
  const { currentRun, setCurrentRun } = useAppStore();
  const status = currentRun ? statusLabels[currentRun.status] || currentRun.status : '就绪';
  const canCancel = currentRun && !['completed', 'failed', 'cancelled'].includes(currentRun.status);
  const isRunning = currentRun && ['created', 'planning', 'executing', 'reviewing', 'reworking'].includes(currentRun.status);

  const handleNewTask = () => {
    setCurrentRun(null);
  };

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('refresh-runs'));
  };

  const handleCancel = async () => {
    if (!currentRun) return;
    try {
      const res = await fetch(`/api/runs/${currentRun.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.run) {
          setCurrentRun(data.run);
        }
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  return (
    <header className="col-span-2 flex items-center justify-between h-14 px-4 border-b border-border bg-bg-elevated/80 backdrop-blur-xl z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 shape-rect-sm bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-sm font-semibold text-text tracking-wide">MOSS</span>
        </div>

        <div className="h-4 w-px bg-border mx-2" />

        <div className="flex items-center gap-2 px-3 py-1.5 shape-rect-sm bg-bg-surface border border-border">
          <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-accent animate-pulse-subtle' : 'bg-success'}`} />
          <span className="text-xs text-text-secondary font-mono">{status}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleNewTask}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新任务
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          刷新
        </Button>
        <Button variant="danger" size="sm" disabled={!canCancel} onClick={handleCancel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          取消
        </Button>
      </div>
    </header>
  );
}
