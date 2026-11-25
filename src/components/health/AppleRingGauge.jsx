import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { chartFigureProps } from '../charts/chartA11y';
import { formatNumber } from '../../utils/formatters';

export const AppleRingGauge = ({ value, max = 100, colorClass, strokeColor, gradientId, size = 150, strokeWidth = 14, icon: Icon, title, unit = '' }) => {
    const numVal = typeof value === 'number' ? value : parseFloat(value);
    const valid = !isNaN(numVal);
    const counted = useCountUp(valid ? numVal : null);
    const pct = valid ? Math.max(0, Math.min(100, (numVal / max) * 100)) : 0;
    const r = (size - strokeWidth) / 2;
    const c = size / 2;
    const dasharray = 2 * Math.PI * r;
    const dashoffset = dasharray - (dasharray * pct) / 100;

    return (
        <div data-health="ring" className="flex flex-col items-center justify-center relative select-none" {...chartFigureProps(title, valid ? `${numVal}${unit} de ${max}${unit}` : 'sin datos')}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={strokeColor || 'currentColor'} stopOpacity="1" />
                        <stop offset="100%" stopColor={strokeColor || 'currentColor'} stopOpacity="0.75" />
                    </linearGradient>
                </defs>
                {/* Pista de fondo */}
                <circle
                    cx={c} cy={c} r={r} fill="none"
                    className="stroke-slate-100 dark:stroke-zinc-800/80"
                    strokeWidth={strokeWidth}
                />
                {/* Relleno de progreso */}
                {valid && (
                    <circle
                        cx={c} cy={c} r={r} fill="none"
                        className={`${colorClass} transition-all duration-1000 ease-out`}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Icon data-health="ring-icon" size={20} className={`${colorClass} mb-1 opacity-90`} />
                <span data-health="ring-value" className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${colorClass}`}>
                    {valid ? (max === 10 ? formatNumber(counted, 1) : Math.round(counted)) : '--'}
                    {unit && <span className="text-sm font-bold text-ink-4 ml-0.5">{unit}</span>}
                </span>
                <span data-health="ring-title" className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mt-0.5 text-center">
                    {title}
                </span>
            </div>
        </div>
    );
};
