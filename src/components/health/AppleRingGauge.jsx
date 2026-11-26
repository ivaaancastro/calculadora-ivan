import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { chartFigureProps } from '../charts/chartA11y';
import { formatNumber } from '../../utils/formatters';

/**
 * Anillo de una métrica (estilo Whoop/Oura): el arco y su pista llevan el color de la métrica;
 * dentro, solo la cifra. El nombre va fuera del anillo, en la tarjeta (spec Capa 6, RF-D1).
 */
export const AppleRingGauge = ({ value, max = 100, color, size = 112, strokeWidth = 12, title, unit = '', digits = 0, metric }) => {
    const numVal = typeof value === 'number' ? value : parseFloat(value);
    const valid = !isNaN(numVal);
    const counted = useCountUp(valid ? numVal : null);
    const pct = valid ? Math.max(0, Math.min(100, (numVal / max) * 100)) : 0;
    const r = (size - strokeWidth) / 2;
    const c = size / 2;
    const dasharray = 2 * Math.PI * r;
    const dashoffset = dasharray - (dasharray * pct) / 100;

    return (
        <div data-health="ring" className="relative shrink-0 select-none" style={{ width: size, height: size }} {...chartFigureProps(title, valid ? `${numVal}${unit} de ${max}${unit}` : 'sin datos')}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={strokeWidth} />
                {valid && pct > 0 && (
                    <circle
                        cx={c} cy={c} r={r} fill="none"
                        className="motion-safe:animate-ring-draw dark:[filter:drop-shadow(0_0_6px_var(--ring-glow))]"
                        style={{ '--ring-glow': color }}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span data-health="ring-value" data-metric={metric} className="text-[26px] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
                    {valid ? formatNumber(counted, digits) : '—'}
                    {valid && unit && <span className="text-xs font-semibold text-ink-4 ml-0.5">{unit}</span>}
                </span>
            </div>
        </div>
    );
};
