import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useCountUp } from '../health/useCountUp';

const RANGES = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '3M' },
    { id: 'all', label: 'Todo' },
];

const TONE_CHIP = {
    neutral: 'text-body-soft bg-fill-3 border-line-muted-2',
    peak: 'text-form-peak bg-form-peak-tint border-form-peak/25',
    productive: 'text-form-productive bg-form-productive-tint border-form-productive/25',
    overload: 'text-form-overload bg-form-overload-tint border-form-overload/25',
    critical: 'text-form-critical bg-form-critical-tint border-form-critical/25',
};
const TONE_ACCENT = {
    neutral: 'rgb(var(--line-strong))',
    peak: 'rgb(var(--form-peak))',
    productive: 'rgb(var(--form-productive))',
    overload: 'rgb(var(--form-overload))',
    critical: 'rgb(var(--form-critical))',
};

/**
 * Héroe del Dashboard (spec premium-dashboard §3.1): resumen narrativo + CTL como cifra
 * protagonista con su variación a 28 días y el estado de forma (TSB) como chip. Sin cajas.
 */
export const FormHero = ({ summary, ctl, loadTrend, timeRange, setTimeRange }) => {
    const shown = useCountUp(Math.round(ctl));
    const hasData = summary.state !== 'insufficient';
    const TrendIcon = loadTrend > 2 ? ArrowUpRight : loadTrend < -2 ? ArrowDownRight : Minus;
    const trendTone = loadTrend > 2 ? 'text-form-peak' : loadTrend < -2 ? 'text-form-critical' : 'text-ink-4';
    return (
        <section
            data-dash="hero"
            data-hero="form"
            style={{ '--hero-accent': TONE_ACCENT[summary.tone] }}
            className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
        >
            <div className="space-y-3 min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                    <span>Estado de forma</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${TONE_CHIP[summary.tone]}`}>
                        {summary.label}
                    </span>
                </p>
                <p data-hero="sentence" className="text-[17px] sm:text-[20px] leading-snug font-medium tracking-[-0.01em] text-ink [text-wrap:balance] max-w-[46ch]">
                    {summary.sentence}
                </p>
                <p data-hero="advice" className="text-xs text-ink-3">{summary.advice}</p>
            </div>

            <div className="flex items-end justify-between gap-4 md:flex-col md:items-end">
                <div data-hero="figure" className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4">Fitness (CTL)</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-[48px] sm:text-[3.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
                            {hasData ? Math.round(shown) : '--'}
                        </span>
                        {hasData && (
                            <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${trendTone}`}>
                                <TrendIcon size={14} strokeWidth={2.5} aria-hidden="true" />
                                {loadTrend > 0 ? '+' : ''}{loadTrend.toFixed(1)}%
                                <span className="sr-only"> en 28 días</span>
                            </span>
                        )}
                    </div>
                </div>

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
            </div>
        </section>
    );
};
