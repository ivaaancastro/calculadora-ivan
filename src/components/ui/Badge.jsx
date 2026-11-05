import React from 'react';

/**
 * Badge — Etiqueta pequeña del sistema de diseño.
 * variant: 'default' | 'secondary' | 'accent'
 */
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider';
  const variants = {
    default: 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400',
    secondary: 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
    accent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>
  );
};
