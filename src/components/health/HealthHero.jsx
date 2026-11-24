import React from 'react';
import { healthHeadline } from './healthHeadline';
import { useCountUp } from './useCountUp';

const TONE = { 'Óptima': 'positive', 'Adaptándose': 'warning', 'Fatiga Alta': 'danger' };

/** Hero de Salud: frase de estado grande y recuperación como cifra protagonista (spec §3.1). */
export const HealthHero = ({ wellnessMetrics, readinessInfo }) => {
    const value = wellnessMetrics?.todayReadiness;
    const valid = typeof value === 'number';
    const counted = useCountUp(valid ? value : null);
    const h = healthHeadline(readinessInfo.label);
    const tone = TONE[readinessInfo.label] || 'muted';
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div data-health="hero" data-tone={tone} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-5">
            <div className="min-w-0">
                <p data-health="hero-eyebrow" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                    Hoy · {today}{wellnessMetrics?.isSimulated ? ' · Modo demo' : ''}
                </p>
                <h2 data-health="hero-headline" className="mt-2 text-[26px] sm:text-[30px] leading-[1.15] font-bold tracking-[-0.03em] text-ink [text-wrap:balance]">
                    {h.lead} <span data-health="hero-accent">{h.accent}</span> {h.tail}
                </h2>
            </div>
            <div data-health="hero-figure" className="shrink-0 sm:text-right">
                <span data-health="hero-value" className="text-5xl sm:text-[3.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
                    {valid ? Math.round(counted) : '--'}<span className="text-xl font-medium text-ink-4 ml-1">%</span>
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4 mt-1">Recuperación</span>
            </div>
        </div>
    );
};
