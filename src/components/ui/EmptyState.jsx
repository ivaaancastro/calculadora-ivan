import React from 'react';

/**
 * EmptyState — Estado vacío del sistema de diseño.
 * Una caja con icono, título y una línea. Sin eslóganes.
 */
export const EmptyState = ({
  title = 'Sin datos',
  subtitle,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-20 px-4 ${className}`}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-8 max-w-md mx-auto">
        {icon && <div className="mx-auto text-slate-400 dark:text-zinc-600 mb-4">{icon}</div>}
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-100 mb-2">
          {title}
        </h2>
        {subtitle && <p className="text-[12px] text-slate-500 dark:text-zinc-500 mb-6">{subtitle}</p>}
        {action}
      </div>
    </div>
  );
};
