import React from 'react';

/**
 * Avatar — Círculo con imagen o fallback.
 */
export const Avatar = ({ src, size = 36, className = '', alt = 'Perfil' }) => {
  const sizeStyle = { width: size, height: size, minWidth: size, minHeight: size };
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${className}`}
      style={sizeStyle}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover block" style={{ width: '100%', height: '100%' }} />
      ) : (
        <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400" style={{ width: '100%', height: '100%' }}>
          <span style={{ fontSize: size * 0.45 }}>{src ? '' : '?'}</span>
        </div>
      )}
    </div>
  );
};
