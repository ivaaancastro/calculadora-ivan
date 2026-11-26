import React from 'react';
import { Card, Delta, Stat } from '../ui';
import { Sparkline } from '../charts/Sparkline';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * KPI primario del Dashboard (spec premium-dashboard §3.1): etiqueta en mayúsculas,
 * cifra grande con cuenta animada, variación con icono y color, y sparkline de 28 días.
 * `delta` = { value, text, tone } o null; `metric` = clave `data-metric` de la cifra (RF-D1); `format(n)` da el texto de la cifra animada.
 */
export const KpiCard = ({ label, metric, icon: Icon, value, format, delta, spark, color, sub, chip, className }) => {
    const shown = useCountUp(typeof value === 'number' ? value : null);
    const text = typeof value === 'number' ? format(shown) : '--';
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
                <Stat
                    className="min-w-0"
                    size="lg"
                    metric={metric}
                    value={text}
                    delta={delta && <Delta value={delta.value} text={delta.text} tone={delta.tone || 'flat'} />}
                    sub={sub}
                />
                {spark && spark.length >= 3 && (
                    <Sparkline values={spark} color={color} width={88} height={32} label={label} className="shrink-0" />
                )}
            </div>
        </Card>
    );
};
