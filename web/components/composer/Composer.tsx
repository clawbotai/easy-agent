'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import WorkflowSelect from './WorkflowSelect';
import { useAppStore } from '@/store/appStore';
import { activeStatuses } from '@/lib/types';

export default function Composer() {
  const [task, setTask] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { currentRun, setCurrentRun, workspace } = useAppStore();

  const canContinue = currentRun && !activeStatuses.includes(currentRun.status) && !currentRun.pendingApproval;
  const isRunning = currentRun && activeStatuses.includes(currentRun.status);

  const handleSend = async () => {
    if (!task.trim() || isSending) return;

    if (isRunning) {
      alert('当前任务仍在运行或等待审批，请先完成、取消或刷新状态后再继续。');
      return;
    }

    setIsSending(true);

    try {
      const endpoint = canContinue
        ? `/api/runs/${currentRun?.id}/continue`
        : '/api/runs';

      const payload = canContinue
        ? { task, workflow: 'claude_direct_execute', mode: 'code' }
        : { workspace, task, workflow: 'claude_direct_execute', mode: 'code' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '请求失败');
      }

      const data = await res.json();

      if (data.run) {
        setCurrentRun(data.run);
      }

      setTask('');
    } catch (error) {
      console.error('Failed to send:', error);
      alert(error instanceof Error ? error.message : '发送失败');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-bg-elevated/80 backdrop-blur-xl p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <WorkflowSelect />
          <span className="text-xs text-text-tertiary px-2 py-1 shape-rect-sm bg-bg-surface border border-border font-mono">
            代码任务
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              className="w-full min-h-[80px] max-h-[200px] p-3 shape-rect-lg bg-bg-surface border border-border text-sm text-text leading-relaxed outline-none resize-y transition-all duration-200 placeholder:text-text-tertiary hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/30"
              placeholder={canContinue ? '继续当前任务...' : '输入任务描述，例如：修复登录接口 500 问题...'}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            <div className="absolute bottom-3 right-3 text-[11px] text-text-tertiary font-mono">
              ⌘ + Enter 发送
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={isSending || !task.trim()}
              className="flex-1"
            >
              {isSending ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
              {isSending ? '发送中' : canContinue ? '继续' : '发送'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
