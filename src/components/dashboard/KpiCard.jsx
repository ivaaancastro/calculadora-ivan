import React from 'react';
import { Card, Delta, Stat } from '../ui';
import { Sparkline } from '../charts/Sparkline';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * KPI del Dashboard: eyebrow con icono, cifra grande con cuenta animada, variación y sparkline
 * de 28 días. En móvil la sparkline va debajo de la cifra para que la tarjeta no se apriete.
 * `delta` = { value, text, label, tone } o null; `metric` = clave `data-metric` de la cifra (RF-D1);
 * `format(n)` da el texto de la cifra animada.
 */
export const KpiCard = ({ label, metric, icon: Icon, value, format, delta, spark, color, sub, chip, className }) => {
    const shown = useCountUp(typeof value === 'number' ? value : null);
    if (typeof value !== 'number') return null;
    const hasSpark = spark && spark.length >= 3;
    return (
        <Card data-kpi="card" figures="ss03" className={`p-card md:p-card-lg flex flex-col gap-4 motion-safe:animate-rise ${className || ''}`}>
            <div className="flex items-center justify-between gap-2 min-h-6">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 truncate">
                    {Icon && <Icon size={14} strokeWidth={2.25} aria-hidden="true" style={{ color }} />}
                    {label}
                </span>
                {chip}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Stat
                    className="min-w-0"
                    size="lg"
                    metric={metric}
                    value={format(shown)}
                    delta={delta && <Delta className="whitespace-nowrap" value={delta.value} text={delta.text} label={delta.label} tone={delta.tone || 'flat'} />}
                    sub={sub}
                />
                {hasSpark && (
                    <Sparkline values={spark} color={color} width={88} height={32} label={label} className="shrink-0" />
                )}
            </div>
        </Card>
    );
};
