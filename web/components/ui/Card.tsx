interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const baseStyles = `
    border shape-rect-lg
    transition-all duration-200 ease-out
  `;

  const variantStyles = {
    default: `
      bg-bg-surface border-border
    `,
    elevated: `
      bg-bg-elevated border-border-strong
      shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]
    `,
    interactive: `
      bg-bg-surface border-border
      hover:bg-bg-hover hover:border-border-strong
      cursor-pointer
      active:scale-[0.99]
    `,
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
