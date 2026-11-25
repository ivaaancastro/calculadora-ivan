import React from 'react';
import { formatDuration } from '../../../utils/formatDuration';

const LABEL = { run: 'Carrera', bike: 'Ciclismo', swim: 'Natación', gym: 'Fuerza', other: 'Otros' };
const BAR = { run: 'bg-sport-run', bike: 'bg-sport-bike', swim: 'bg-sport-swim', gym: 'bg-sport-strength', other: 'bg-ink-4' };

/** Panel lateral (≥ 1280 px): reparto del tiempo por deporte sobre los datos filtrados. */
export const SportBreakdown = ({ rows }) => {
    if (!rows.length) return null;
    return (
        <aside data-history="breakdown" aria-label="Reparto por deporte" className="hidden xl:block self-start sticky top-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Reparto por deporte</h3>
            <ul className="mt-4 space-y-4">
                {rows.map((r) => (
                    <li key={r.sport}>
                        <div className="flex items-baseline justify-between gap-3 text-[13px]">
                            <span className="font-semibold text-ink">{LABEL[r.sport]}</span>
                            <span className="tabular-nums text-ink-3">{formatDuration(r.minutes)} · {Math.round(r.share * 100)}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-fill-3 overflow-hidden">
                            <div className={`h-full rounded-full ${BAR[r.sport]}`} style={{ width: `${Math.max(3, Math.round(r.share * 100))}%` }} />
                        </div>
                        <div className="mt-1 text-[11px] text-ink-4 tabular-nums">{r.count} {r.count === 1 ? 'sesión' : 'sesiones'}</div>
                    </li>
                ))}
            </ul>
        </aside>
    );
};
