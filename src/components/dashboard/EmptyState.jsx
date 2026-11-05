import React from 'react';
import { Database } from 'lucide-react';

/**
 * Pantalla mostrada cuando no hay actividades en la base de datos.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function EmptyState() {
  return (
    <div className="text-center py-20 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-8 max-w-md mx-auto">
        <Database
          size={32}
          className="mx-auto text-slate-400 dark:text-zinc-600 mb-4"
        />
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-100 mb-2">
          Base de datos vacía
        </h2>
        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-6">
          Conecta Strava para iniciar el análisis.
        </p>
      </div>
    </div>
  );
}
