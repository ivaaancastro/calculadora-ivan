import React from 'react';
import { Button, Delta, Stat } from '../ui';
import { useCountUp } from '../../hooks/useCountUp';
import { formatMinutes } from '../../utils/formatters';

/** Cifra del mes, sin caja propia: la cabecera ya vive dentro de la tarjeta del calendario. */
const Kpi = ({ label, value, context, delta, bar, className = '' }) => (
    <div data-cal="kpi" className={`min-w-0 motion-safe:animate-rise motion-safe:[&:nth-child(2)]:[animation-delay:0.06s] motion-safe:[&:nth-child(3)]:[animation-delay:0.12s] motion-safe:[&:nth-child(4)]:[animation-delay:0.18s] ${className}`}>
        <Stat label={label} value={value} delta={delta} size="md" />
        {bar != null && (
            <div className="mt-2 h-1 rounded-full bg-fill-7 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-form-peak" style={{ width: `${Math.min(100, bar)}%` }} />
            </div>
        )}
        <div className="mt-1 text-[12px] text-ink-4 truncate">{context}</div>
    </div>
);

/**
 * Cabecera narrativa del mes (spec premium-calendario §3.1; Capa 6, RF-D8): frase, cifras del mes
 * y, al lado, el heatmap de constancia, visible también en móvil. Sin plan vencido no hay
 * cumplimiento: la cifra no se pinta (nada de «--», RF-D6) y la rejilla se recompone.
 */
export const MonthHero = ({ summary, heatmap, onPlan }) => {
    const sessions = useCountUp(summary.sessions);
    const tss = useCountUp(summary.tss);
    const hasCompliance = summary.compliance != null;
    return (
        <section data-cal="hero" className="[font-feature-settings:'tnum'_1,'cv11'_1] grid gap-6 px-4 sm:px-5 py-5 border-b border-line-faint lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-10">
            <div className="min-w-0 space-y-5">
                <p data-cal="sentence" className="motion-safe:animate-rise text-[17px] sm:text-[18px] leading-snug font-medium tracking-[-0.01em] text-ink [text-wrap:balance] max-w-[52ch]">
                    {summary.sentence}
                </p>
                {summary.empty && onPlan && (
                    <div className="max-w-[220px]"><Button variant="primary" onClick={onPlan}>Planificar</Button></div>
                )}
                {!summary.empty && (
                    <div data-cal="kpis" className={`grid grid-cols-2 gap-x-6 gap-y-5 ${hasCompliance ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
                        <Kpi
                            label="Sesiones"
                            value={Math.round(sessions)}
                            context={summary.pending > 0 ? `${summary.pending} por venir` : 'este mes'}
                        />
                        <Kpi label="Carga (TSS)" value={Math.round(tss)} delta={<Delta value={summary.deltaPct} flat={2} unit="%" label="frente al mes anterior" />}
                            context={summary.tssPrev > 0
                                ? `${summary.comparedDays ? `días 1–${summary.comparedDays} del mes anterior` : 'mes anterior'}: ${summary.tssPrev}`
                                : 'sin mes anterior'} />
                        <Kpi label="Tiempo" value={formatMinutes(summary.minutes)} context="entrenado este mes"
                            className={hasCompliance ? '' : 'col-span-2 xl:col-span-1'} />
                        {hasCompliance && (
                            <Kpi label="Cumplimiento" value={`${summary.compliance}%`}
                                bar={summary.compliance} context={`${summary.done} de ${summary.planned} hechas`} />
                        )}
                    </div>
                )}
            </div>
            <div data-cal="heatmap-wrap" className="min-w-0">{heatmap}</div>
        </section>
    );
};
