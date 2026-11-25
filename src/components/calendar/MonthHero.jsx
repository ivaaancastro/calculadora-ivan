import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronDown } from 'lucide-react';
import { Button } from '../ui';
import { useCountUp } from '../../hooks/useCountUp';
import { formatMinutes, formatNumber } from '../../utils/formatters';

const Kpi = ({ label, value, context, delta, bar }) => (
    <div data-cal="kpi" className="min-w-0 rounded-xl border border-line px-3.5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] sm:text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink">{value}</span>
            {delta}
        </div>
        {bar != null && (
            <div className="mt-2 h-1 rounded-full bg-fill-7 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-form-peak" style={{ width: `${Math.min(100, bar)}%` }} />
            </div>
        )}
        <div className="mt-1.5 text-[11px] text-ink-4 truncate">{context}</div>
    </div>
);

const Delta = ({ pct }) => {
    if (pct == null) return null;
    const up = pct >= 2;
    const down = pct <= -2;
    const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
    const tone = up ? 'text-form-peak' : down ? 'text-form-critical' : 'text-ink-4';
    return (
        <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${tone}`}>
            <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
            {pct > 0 ? '+' : ''}{formatNumber(pct, Number.isInteger(pct) ? 0 : 1)}%
            <span className="sr-only"> frente al mes anterior</span>
        </span>
    );
};

/**
 * Cabecera narrativa del mes (spec premium-calendario §3.1): frase + 4 KPI y, al lado,
 * el heatmap de constancia (plegable en móvil). `heatmap` es el nodo ya montado por la página.
 */
export const MonthHero = ({ summary, heatmap, onPlan }) => {
    const [open, setOpen] = useState(false);
    const sessions = useCountUp(summary.sessions);
    const tss = useCountUp(summary.tss);
    return (
        <section data-cal="hero" className="grid gap-4 px-3 sm:px-5 py-4 border-b border-line lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0 space-y-3">
                <p data-cal="sentence" className="text-[17px] sm:text-[20px] leading-snug font-medium tracking-[-0.01em] text-ink [text-wrap:balance] max-w-[52ch]">
                    {summary.sentence}
                </p>
                {summary.empty && onPlan && (
                    <div className="max-w-[220px]"><Button variant="primary" onClick={onPlan}>Planificar</Button></div>
                )}
                {!summary.empty && (
                    <div data-cal="kpis" className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                        <Kpi
                            label="Sesiones"
                            value={Math.round(sessions)}
                            context={summary.pending > 0 ? `${summary.pending} por venir` : summary.planned > 0 ? `${summary.done}/${summary.planned} planificadas` : 'sin plan'}
                        />
                        <Kpi label="Carga (TSS)" value={Math.round(tss)} delta={<Delta pct={summary.deltaPct} />}
                            context={summary.tssPrev > 0
                                ? `${summary.comparedDays ? `días 1–${summary.comparedDays} del mes anterior` : 'mes anterior'}: ${summary.tssPrev}`
                                : 'sin mes anterior'} />
                        <Kpi label="Tiempo" value={formatMinutes(summary.minutes)} context="entrenado este mes" />
                        <Kpi label="Cumplimiento" value={summary.compliance != null ? `${summary.compliance}%` : '--'}
                            bar={summary.compliance} context={summary.planned > 0 ? `${summary.done} de ${summary.planned} hechas` : 'sin plan vencido'} />
                    </div>
                )}
            </div>
            <div data-cal="heatmap-wrap" className="min-w-0">
                <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
                    className="lg:hidden flex items-center gap-1.5 min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                    Constancia <ChevronDown size={14} className={open ? 'rotate-180' : ''} aria-hidden="true" />
                </button>
                <div className={open ? 'block' : 'hidden lg:block'}>{heatmap}</div>
            </div>
        </section>
    );
};
