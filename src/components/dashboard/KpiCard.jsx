import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '../ui';
import { Sparkline } from '../charts/Sparkline';
import { useCountUp } from '../health/useCountUp';

const TONE_TEXT = {
    good: 'text-form-peak',
    bad: 'text-form-critical',
    warn: 'text-form-overload',
    flat: 'text-ink-4',
};

/**
 * KPI primario del Dashboard (spec premium-dashboard §3.1): etiqueta en mayúsculas,
 * cifra grande con cuenta animada, variación con icono y color, y sparkline de 28 días.
 * `delta` = { value, text, tone } o null; `format(n)` da el texto de la cifra animada.
 */
export const KpiCard = ({ label, icon: Icon, value, format, delta, spark, color, sub, chip, className }) => {
    const shown = useCountUp(typeof value === 'number' ? value : null);
    const text = typeof value === 'number' ? format(shown) : '--';
    const DeltaIcon = delta ? (delta.value > 0 ? ArrowUpRight : delta.value < 0 ? ArrowDownRight : Minus) : null;
    return (
        <Card data-kpi="card" figures="ss03" className={`p-4 sm:p-5 flex flex-col gap-3 motion-safe:animate-rise ${className || ''}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 truncate">
                    {Icon && <Icon size={14} strokeWidth={2.25} aria-hidden="true" style={{ color }} />}
                    {label}
                </span>
                {chip}
            </div>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <span data-kpi="value" className="text-[34px] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">{text}</span>
                        {delta && (
                            <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${TONE_TEXT[delta.tone] || TONE_TEXT.flat}`}>
                                <DeltaIcon size={14} strokeWidth={2.5} aria-hidden="true" />
                                {delta.text}
                            </span>
                        )}
                    </div>
                    {sub && <div className="mt-1.5 text-[12px] text-ink-4">{sub}</div>}
                </div>
                {spark && spark.length >= 3 && (
                    <Sparkline values={spark} color={color} width={88} height={32} label={label} className="shrink-0" />
                )}
            </div>
        </Card>
    );
};
