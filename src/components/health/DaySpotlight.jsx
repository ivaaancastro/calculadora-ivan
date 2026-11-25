import React from 'react';
import { Card } from '../ui';

const Figure = ({ label, value, unit, sub }) => (
    <div data-health="spot-figure" className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4 block">{label}</span>
        <span className="text-[28px] leading-tight font-semibold tabular-nums tracking-[-0.03em] text-ink">
            {value ?? '--'}{value != null && unit && <span className="text-[11px] font-medium text-ink-4 ml-1">{unit}</span>}
        </span>
        <span className="text-[11px] text-ink-4 block">{sub}</span>
    </div>
);

/** Detalle del día (spec §3.2): recuperación protagonista y tres cifras secundarias. */
export const DaySpotlight = ({ currentSelectedDay: d }) => {
    if (!d) return null;
    return (
        <Card data-health="spotlight" className="p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4 pb-4 border-b border-line-soft-2">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">Detalle del día</p>
                    <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-ink capitalize [text-wrap:balance]">{d.dateLabelFull}</h3>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${d.recoveryInfo.badge}`}>{d.recoveryInfo.label}</span>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-5xl leading-none font-semibold tabular-nums tracking-[-0.04em] text-ink">{d.readinessScore}<span className="text-xl font-medium text-ink-4 ml-0.5">%</span></span>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4 mt-1">Recuperación</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
                <Figure label="Sueño" value={d.sleep || null} unit="h" sub={`Score: ${d.sleepScore ? `${d.sleepScore}%` : '--'}`} />
                <Figure label="VFC" value={d.hrv || null} unit="ms" sub={`Media 7d: ${d.hrv7dAvg || '--'}`} />
                <Figure label="FC reposo" value={d.rhr || null} unit="lpm" sub={`Media 7d: ${d.rhr7dAvg || '--'}`} />
            </div>
        </Card>
    );
};
