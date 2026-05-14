'use client';

import { useAppStore } from '@/store/appStore';

const starters = [
  {
    title: '探索代码库',
    desc: '阅读关键模块，整理结构和风险',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: '规划功能',
    desc: '先生成实施计划，再审批执行',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: '修复 Bug',
    desc: '定位问题，修改代码并交叉审查',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2l1.88 1.88" />
        <path d="M14.12 3.88L16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </svg>
    ),
  },
  {
    title: '审查变更',
    desc: '复核实现结果，输出最终结论',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function StarterGrid() {
  const { workspace, setCurrentRun } = useAppStore();

  const handleClick = async (title: string) => {
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace,
          task: title,
          workflow: 'claude_direct_execute',
          mode: 'code',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.run) {
          setCurrentRun(data.run);
        }
      }
    } catch (error) {
      console.error('Failed to create run:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {starters.map((starter) => (
        <button
          key={starter.title}
          className="group p-4 shape-rect-lg bg-bg-surface border border-border hover:border-accent/30 hover:bg-bg-hover transition-all duration-200 text-left active:scale-[0.99]"
          onClick={() => handleClick(starter.title)}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 shape-rect-sm bg-bg-hover text-text-tertiary group-hover:text-accent group-hover:bg-accent-dim transition-colors">
              {starter.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-text mb-1">{starter.title}</div>
              <div className="text-xs text-text-tertiary leading-relaxed">{starter.desc}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
