import { shortTime } from '@/lib/types';

interface MessageProps {
  avatar: string;
  name: string;
  time: string;
  text: string;
  subtitle?: string;
  variant?: 'default' | 'assistant';
}

export default function Message({
  avatar,
  name,
  time,
  text,
  subtitle,
  variant = 'default',
}: MessageProps) {
  return (
    <div className="flex gap-3 animate-slide-up">
      <div className={`w-8 h-8 shape-rect-sm flex items-center justify-center text-xs font-bold shrink-0 ${
        variant === 'assistant'
          ? 'bg-accent-dim text-accent border border-accent/20'
          : 'bg-bg-surface text-text-secondary border border-border'
      }`}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-text">{name}</span>
          <span className="text-xs text-text-tertiary font-mono">
            {subtitle ? `${subtitle} · ` : ''}{shortTime(time)}
          </span>
        </div>
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </div>
      </div>
    </div>
  );
}
