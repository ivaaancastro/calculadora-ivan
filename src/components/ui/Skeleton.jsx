import React from 'react';

/**
 * Skeleton — Estado de carga del sistema de diseño.
 * Una barra pulsante que indica carga sin bloquear.
 */
export const Skeleton = ({ className = '', width = '100%', height = '16px' }) => (
  <div
    className={`animate-pulse bg-slate-200 dark:bg-zinc-800/60 rounded ${className}`}
    style={{ width, height, minHeight: height }}
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height="16px" />
    ))}
  </div>
);
