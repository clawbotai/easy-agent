'use client';

import { ButtonHTMLAttributes, MouseEvent, useCallback } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    cursor-pointer font-medium
    transition-all duration-200 ease-out
    border
    disabled:cursor-not-allowed disabled:opacity-50
    focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg
  `;

  const sizeStyles = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-6 text-base gap-2.5',
  };

  const variantStyles = {
    primary: `
      bg-accent hover:bg-accent-light
      border-accent hover:border-accent-light
      text-white
      shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]
      hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-bg-surface hover:bg-bg-hover
      border-border-strong hover:border-text-tertiary
      text-text
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent hover:bg-bg-hover
      border-transparent hover:border-border
      text-text-secondary hover:text-text
    `,
    danger: `
      bg-error-dim hover:bg-error/20
      border-error/30 hover:border-error/50
      text-error
      active:scale-[0.98]
    `,
  };

  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
  }, [onClick]);

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} shape-rect ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
