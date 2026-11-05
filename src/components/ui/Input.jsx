import React from 'react';

/**
 * Input — Campo de formulario del sistema de diseño.
 * 48px de alto, label 13px, texto 16px, tap target 44px.
 */
export const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2" className={className}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-500 text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-3 pr-4 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm text-slate-800 dark:text-zinc-200 focus:border-${error ? 'red-500' : 'blue-500'} focus:ring-2 focus-ring-${error ? 'red-500/20' : 'blue-500/10'} outline-none transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
};
