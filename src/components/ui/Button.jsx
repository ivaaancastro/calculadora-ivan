import React from 'react';

/**
 * Button — Un solo par de botones (primary + secondary) del sistema de diseño.
 * variant: 'primary' | 'secondary'
 * size: 'default' (44px) | 'xl' (más grande, solo en close)
 * full: ancho completo en móvil
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  full = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  arrow = false,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn--${variant} ${size === 'xl' ? 'btn--xl' : ''} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
      {arrow && (
        <svg className="m-arrow ml-1.5" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5l6 6-6 6" />
        </svg>
      )}
    </button>
  );
};
