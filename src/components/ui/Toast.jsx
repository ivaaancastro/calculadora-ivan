import React from 'react';

/**
 * Toast — Notificación ligera del sistema de diseño.
 * Usado por react-hot-toast (estilos de la app).
 */
export const Toast = ({ message, type = 'info', className = '' }) => {
  const variants = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200/50 dark:border-red-800/50',
  };
  return (
    <div
      className={`px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${variants[type]} ${className}`}
      role="alert"
    >
      <span>{message}</span>
    </div>
  );
};
