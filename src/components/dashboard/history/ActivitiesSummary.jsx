import React from 'react';
import { useCountUp } from '../../../hooks/useCountUp';
import { Sparkline } from '../../charts/Sparkline';
import { useChartTheme } from '../../charts/useChartTheme';
import { formatMinutes, formatNumber } from '../../../utils/formatters';

const Secondary = ({ label, value, unit }) => (
    <div data-history="summary-stat" className="min-w-0">
        <div className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4">{label}</div>
        <div className="mt-0.5 text-[17px] sm:text-[19px] font-semibold tracking-[-0.02em] tabular-nums text-ink">
            {value}{unit && <span className="ml-0.5 text-[11px] font-medium text-ink-3">{unit}</span>}
        </div>
    </div>
);

/**
 * Cabecera de resumen del historial (spec premium-actividades §3.1): nº de sesiones como
 * cifra protagonista, tiempo/distancia/TSS como secundarias y sparkline del TSS semanal.
 * `totals` viene de `summarizeActivities` sobre los datos filtrados.
 */
export const ActivitiesSummary = ({ totals, weekly = [] }) => {
    const ct = useChartTheme();
    const shown = useCountUp(totals.count);
    if (totals.count === 0) return null;
    const km = totals.meters / 1000;
    return (
        <section data-history="summary" aria-label="Resumen de actividades" className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 flex items-end justify-between gap-4 border-b border-hairline">
            <div className="min-w-0 space-y-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Actividades</p>
                    <p className="mt-1 flex items-baseline gap-2">
                        <span data-history="summary-count" className="text-[40px] sm:text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
                            {typeof shown === 'number' ? Math.round(shown) : shown}
                        </span>
                        <span className="text-xs text-ink-3">{totals.count === 1 ? 'sesión' : 'sesiones'}</span>
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-x-5 sm:gap-x-8">
                    <Secondary label="Tiempo" value={formatMinutes(totals.minutes)} />
                    <Secondary label="Distancia" value={km >= 100 ? Math.round(km).toLocaleString('es-ES') : formatNumber(km, 1)} unit="km" />
                    <Secondary label="TSS" value={Math.round(totals.tss).toLocaleString('es-ES')} />
                </div>
            </div>
            {weekly.length >= 3 && (
                <div data-history="summary-spark" className="hidden sm:block shrink-0 text-right">
                    <Sparkline values={weekly} color={ct.series.power} width={140} height={44} label="TSS semanal" />
                    <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4">TSS por semana</p>
                </div>
            )}
        </section>
    );
};
