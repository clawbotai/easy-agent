'use client';

import { useEffect, useCallback } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { statusLabels, shortTime } from '@/lib/types';

export default function Sidebar() {
  const { workspace, agents, runs, query, currentRun, setWorkspace, setAgents, setRuns, setCurrentRun, setQuery } = useAppStore();

  const refreshAgents = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents?workspace=${encodeURIComponent(workspace)}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, [workspace, setAgents]);

  const refreshRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    }
  }, [setRuns]);

  // 初始化：获取默认工作区并加载数据
  useEffect(() => {
    const init = async () => {
      // 如果 workspace 为空，先获取默认值
      if (!workspace) {
        try {
          const configRes = await fetch('/api/config');
          const config = await configRes.json();
          if (config.workspace) {
            setWorkspace(config.workspace);
            // workspace 更新后会触发 refreshAgents
            return;
          }
        } catch (error) {
          console.error('Failed to fetch config:', error);
        }
      }

      // 加载数据
      refreshAgents();
      refreshRuns();
    };

    init();

    const handleRefresh = () => refreshRuns();
    window.addEventListener('refresh-runs', handleRefresh);
    return () => window.removeEventListener('refresh-runs', handleRefresh);
  }, [workspace, refreshAgents, refreshRuns, setWorkspace]);

  const loadRun = async (id: string) => {
    try {
      const res = await fetch(`/api/runs/${id}`);
      const data = await res.json();
      setCurrentRun(data.run);
    } catch (error) {
      console.error('Failed to load run:', error);
    }
  };

  const filteredRuns = runs.filter((run) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return run.task.toLowerCase().includes(q) || run.status.toLowerCase().includes(q);
  });

  return (
    <aside className="w-[280px] min-h-0 border-r border-border bg-bg-elevated/50 flex flex-col gap-3 p-3 overflow-hidden">
      {/* Workspace */}
      <div className="flex gap-2">
        <Input
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          placeholder="工作区路径"
          title="工作区"
          autoComplete="off"
          className="font-mono text-xs"
        />
        <Button variant="secondary" size="sm" onClick={refreshAgents} className="shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          </svg>
        </Button>
      </div>

      {/* Agents */}
      <div className="grid grid-cols-2 gap-2">
        {agents.length === 0 ? (
          <div className="col-span-2 p-3 shape-rect bg-bg-surface border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-tertiary uppercase tracking-wider">检测中</span>
              <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            </div>
            <code className="text-xs text-text-tertiary font-mono">...</code>
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={`${agent.role}-${agent.command}`}
              className="p-3 shape-rect bg-bg-surface border border-border hover:border-border-strong hover:bg-bg-hover transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary uppercase tracking-wider">{agent.role}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${agent.available ? 'bg-success' : 'bg-error'}`} />
              </div>
              <code className="text-xs text-text-tertiary font-mono truncate block" title={agent.detail || agent.command}>
                {agent.command}
              </code>
            </div>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          placeholder="搜索任务..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          className="pl-9"
        />
      </div>

      {/* Runs List */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium px-1 mb-2">最近任务</div>
        {filteredRuns.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-text-tertiary text-sm">暂无任务</div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRuns.slice(0, 30).map((run) => (
              <button
                key={run.id}
                className={`w-full text-left p-3 shape-rect transition-all duration-200 group ${
                  currentRun?.id === run.id
                    ? 'bg-accent-dim border border-accent/30'
                    : 'bg-transparent border border-transparent hover:bg-bg-hover hover:border-border'
                }`}
                onClick={() => loadRun(run.id)}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1 h-1 mt-1.5 rounded-full shrink-0 ${
                    currentRun?.id === run.id ? 'bg-accent' : 'bg-text-tertiary group-hover:bg-text-secondary'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm truncate ${
                      currentRun?.id === run.id ? 'text-text' : 'text-text-secondary group-hover:text-text'
                    }`}>
                      {run.task || run.id}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-mono ${
                        run.status === 'completed' ? 'text-success' :
                        run.status === 'failed' ? 'text-error' :
                        'text-text-tertiary'
                      }`}>
                        {statusLabels[run.status] || run.status}
                      </span>
                      <span className="text-[11px] text-text-tertiary font-mono">
                        {shortTime(run.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
