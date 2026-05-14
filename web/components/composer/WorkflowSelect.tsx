'use client';

interface WorkflowOption {
  value: string;
  label: string;
}

const workflows: WorkflowOption[] = [
  { value: 'claude_plan_codex_execute_claude_review', label: 'Claude 规划 · Codex 执行 · Claude 审查' },
  { value: 'claude_execute_codex_review', label: 'Claude 执行 · Codex 审查' },
  { value: 'claude_direct_execute', label: 'Claude Code 直接执行' },
  { value: 'codex_direct_execute', label: 'Codex 直接执行' },
];

export default function WorkflowSelect() {
  return (
    <select
      className="h-8 px-3 shape-rect-sm bg-bg-surface border border-border text-xs text-text-secondary outline-none cursor-pointer transition-all duration-200 hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/30 appearance-none pr-8"
      defaultValue={workflows[0].value}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c5c72' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {workflows.map((wf) => (
        <option key={wf.value} value={wf.value}>
          {wf.label}
        </option>
      ))}
    </select>
  );
}
