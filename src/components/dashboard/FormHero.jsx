import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { Delta, Hero } from '../ui';

const RANGES = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '3M' },
    { id: 'all', label: 'Todo' },
];

/**
 * Héroe del Dashboard (spec premium-dashboard §3.1): resumen narrativo + CTL como cifra
 * protagonista con su variación a 28 días y el estado de forma (TSB) como chip. Sin cajas.
 */
export const FormHero = ({ summary, ctl, loadTrend, timeRange, setTimeRange }) => {
    const shown = useCountUp(Math.round(ctl));
    const hasData = summary.state !== 'insufficient';
    return (
        <Hero
            data-dash="hero"
            data-hero="form"
            className="pt-[22px] pb-1 max-md:order-1 max-md:pt-[18px] max-md:px-3 max-md:pb-0 max-md:gap-3 lg:col-span-full"
            eyebrow="Estado de forma"
            chip={{ label: summary.label, tone: summary.tone }}
            line={summary.sentence}
            sub={summary.advice}
            label="Fitness (CTL)"
            metric="ctl"
            value={hasData ? Math.round(shown) : '--'}
            delta={hasData && <Delta value={loadTrend} flat={2} digits={1} unit="%" label="en 28 días" />}
            aside={
                <div role="group" aria-label="Rango de tiempo" data-hero="range" className="flex bg-fill-6 p-1 rounded-full shadow-xs">
                    {RANGES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            aria-pressed={timeRange === t.id}
                            onClick={() => setTimeRange(t.id)}
                            className={`px-3 min-h-[44px] sm:min-h-[32px] text-xs font-semibold rounded-full select-none touch-manipulation transition-colors ${timeRange === t.id ? 'bg-surface-4 text-ink shadow-xs' : 'text-ink-3 hover:text-ink-2-soft'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            }
        />
    );
};
