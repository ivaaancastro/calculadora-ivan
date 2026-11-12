import React from 'react';
import { Activity } from 'lucide-react';

/** Cabecera de la landing v2: la misma altura que la de la app (--nav-h) y capa `z-nav`. */
export const HeaderV2 = ({ onOpenAuth, onFeatures }) => (
  <nav className="fixed inset-x-0 top-0 z-nav border-b border-line bg-surface-card/95 backdrop-blur">
    <div className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-action-solid p-1.5 text-on-action">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold uppercase tracking-tight text-ink">Forma</span>
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <button onClick={onFeatures} className="min-h-[44px] text-sm font-medium text-ink-3 transition-colors hover:text-ink">
          Funciones
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <button onClick={onOpenAuth} className="min-h-[44px] px-3 text-sm font-semibold text-body-soft transition-colors hover:text-ink">
          Iniciar Sesión
        </button>
        <button
          onClick={onOpenAuth}
          className="min-h-[44px] rounded-xl bg-action-solid px-4 text-sm font-bold text-on-action transition-colors hover:bg-action-hover active:scale-[0.98]"
        >
          Empezar
        </button>
      </div>
    </div>
  </nav>
);
