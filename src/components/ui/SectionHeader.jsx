import React from 'react';

/**
 * SectionHeader — Cabecera de sección del sistema de diseño.
 * h2 primero, top-aligned, en la línea izquierda. Un solo h2 por sección.
 */
export const SectionHeader = ({
  title,
  subtitle,
  className = '',
}) => (
  <div className={className}>
    <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight mb-2">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-slate-500 dark:text-zinc-400 measure">{subtitle}</p>
    )}
  </div>
);
