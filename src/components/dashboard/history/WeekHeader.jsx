import React from 'react';
import { formatMinutes } from '../../../utils/formatters';

/** Cabecera de semana del historial: «Semana del 17 nov» y totales de la semana. */
export const WeekHeader = ({ group, refYear }) => {
    const start = new Date(`${group.key}T00:00:00`);
    const opts = { day: 'numeric', month: 'short' };
    if (start.getFullYear() !== refYear) opts.year = 'numeric';
    const { count, minutes, tss } = group.totals;
    return (
        <div data-history="week" className="h-full px-4 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            <span className="truncate">Semana del {start.toLocaleDateString('es-ES', opts)}</span>
            <span className="shrink-0 tabular-nums normal-case tracking-normal font-medium text-ink-4">
                {count} act · {formatMinutes(minutes)}{tss > 0 ? ` · ${Math.round(tss)} TSS` : ''}
            </span>
        </div>
    );
};
