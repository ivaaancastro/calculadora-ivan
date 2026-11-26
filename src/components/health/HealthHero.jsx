import React from 'react';
import { healthHeadline } from './healthHeadline';
import { EnergyBank } from './EnergyBank';
import { useCountUp } from '../../hooks/useCountUp';

const TONE = { 'Óptima': 'positive', 'Adaptándose': 'warning', 'Fatiga Alta': 'danger' };

/**
 * Hero de Salud (spec Capa 6, RF-D1): la recuperación es la cifra protagonista y solo aparece
 * aquí. El banco de energía va debajo como barra de contexto, sin repetir la cifra.
 */
export const HealthHero = ({ wellnessMetrics, readinessInfo, energyBankAmount }) => {
    const value = wellnessMetrics?.todayReadiness;
    const valid = typeof value === 'number';
    const counted = useCountUp(valid ? value : null);
    const h = healthHeadline(readinessInfo.label);
    const tone = TONE[readinessInfo.label] || 'muted';
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <section data-health="hero" data-tone={tone} className="hero-rule relative flex flex-col gap-5 pt-5 [font-feature-settings:'tnum'_1,'cv11'_1,'ss03'_1] data-[tone=positive]:[--hero-accent:rgb(var(--positive))] data-[tone=warning]:[--hero-accent:rgb(var(--warning))] data-[tone=danger]:[--hero-accent:rgb(var(--danger))]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="min-w-0">
                    <p data-health="hero-eyebrow" className="motion-safe:animate-rise text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                        Hoy · {today}
                    </p>
                    <h2 data-health="hero-headline" className="motion-safe:animate-rise motion-safe:[animation-delay:0.05s] mt-2 text-[26px] md:text-[30px] leading-[1.15] font-bold tracking-[-0.03em] text-ink [text-wrap:balance]">
                        {h.lead} <span data-health="hero-accent" className="text-[color:var(--hero-accent,inherit)]">{h.accent}</span> {h.tail}
                    </h2>
                </div>
                {valid && (
                    <div data-health="hero-figure" className="shrink-0 md:text-right motion-safe:animate-rise motion-safe:[animation-delay:0.12s]">
                        <span className="block text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4 mb-1">Recuperación</span>
                        <span data-health="hero-value" data-metric="recovery" className="text-[48px] md:text-[3.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
                            {Math.round(counted)}<span className="text-xl font-medium text-ink-4 ml-1">%</span>
                        </span>
                    </div>
                )}
            </div>
            <EnergyBank energyBankAmount={energyBankAmount} />
        </section>
    );
};
