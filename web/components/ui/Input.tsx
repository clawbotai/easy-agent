'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function Input({ className = '', ...props }: InputProps) {
  const baseStyles = `
    w-full h-9 px-3
    bg-bg-surface border border-border
    text-text text-sm
    outline-none
    transition-all duration-200 ease-out
    shape-rect
    placeholder:text-text-tertiary
    hover:border-border-strong hover:bg-bg-hover
    focus:border-accent focus:ring-1 focus:ring-accent/30
    focus:bg-bg-elevated
  `;

  return (
    <input
      className={`${baseStyles} ${className}`}
      {...props}
    />
  );
}
