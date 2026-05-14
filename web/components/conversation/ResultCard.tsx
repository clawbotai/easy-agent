'use client';

import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { shortTime } from '@/lib/types';

export default function ResultCard() {
  const { currentRun } = useAppStore();

  if (!currentRun?.finalResult) return null;

  const resultTitle = currentRun.status === 'completed' ? '最终结论' : '执行结果';
  const isSuccess = currentRun.status === 'completed';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentRun.finalResult || '');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className={`w-8 h-8 shape-rect-sm flex items-center justify-center text-xs font-bold shrink-0 ${
        isSuccess
          ? 'bg-success-dim text-success border border-success/20'
          : 'bg-error-dim text-error border border-error/20'
      }`}>
        M
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-text">MOSS</span>
          <span className="text-xs text-text-tertiary font-mono">
            {shortTime(currentRun.updatedAt)}
          </span>
        </div>
        <div className={`shape-rect-lg border overflow-hidden ${
          isSuccess
            ? 'bg-success-dim border-success/20'
            : 'bg-error-dim border-error/20'
        }`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
            <span className={`text-sm font-medium ${isSuccess ? 'text-success' : 'text-error'}`}>
              {resultTitle}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制
            </Button>
          </div>
          <div className="p-4">
            <pre className="text-sm text-text-secondary font-mono leading-relaxed whitespace-pre-wrap break-words">
              {currentRun.finalResult}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
