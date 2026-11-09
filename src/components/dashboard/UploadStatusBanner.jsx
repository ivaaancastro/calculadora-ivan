import React from 'react';

/**
 * Banner de estado de subida (CSV / sync).
 * Extraído de Dashboard.jsx para cumplir SRP.
 * Recibe `uploadStatus` como string opcional; si no hay estado, no renderiza nada.
 */
export function UploadStatusBanner({ uploadStatus }) {
  if (!uploadStatus) return null;

  return (
    <div className="bg-action-4 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top sticky top-[52px] z-30 shadow-sm">
      {uploadStatus}
    </div>
  );
}
