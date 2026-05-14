interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-mono font-medium uppercase
    border
  `;

  const sizeStyles = {
    sm: 'h-5 px-2 text-[10px]',
    md: 'h-6 px-2.5 text-[11px]',
  };

  const variantStyles = {
    default: `
      bg-bg-surface border-border-strong
      text-text-secondary
    `,
    success: `
      bg-success-dim border-success/30
      text-success
    `,
    warning: `
      bg-warning-dim border-warning/30
      text-warning
    `,
    error: `
      bg-error-dim border-error/30
      text-error
    `,
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} shape-rect-sm ${className}`}>
      {children}
    </span>
  );
}
