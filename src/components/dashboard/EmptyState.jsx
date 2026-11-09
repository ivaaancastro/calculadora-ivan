import React from 'react';
import { Database } from 'lucide-react';

/**
 * Pantalla mostrada cuando no hay actividades en la base de datos.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function EmptyState() {
  return (
    <div className="text-center py-20 px-4">
      <div className="bg-surface rounded-lg border border-line p-8 max-w-md mx-auto">
        <Database
          size={32}
          className="mx-auto text-ink-4-dim mb-4"
        />
        <h2 className="text-sm font-bold uppercase tracking-widest text-ink-2 mb-2">
          Base de datos vacía
        </h2>
        <p className="text-[10px] text-ink-3-flat uppercase tracking-wider mb-6">
          Conecta Strava para iniciar el análisis.
        </p>
      </div>
    </div>
  );
}
