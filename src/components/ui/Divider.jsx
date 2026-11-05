import React from 'react';

/**
 * Divider — Línea divisoria de 1px del sistema de diseño.
 * Solo dentro de contenido, nunca entre secciones.
 */
export const Divider = ({ className = '' }) => (
  <hr
    className={`border-t border-slate-200 dark:border-zinc-800 my-6 ${className}`}
  />
);
