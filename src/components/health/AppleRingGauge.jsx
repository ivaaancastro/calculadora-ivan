import React from 'react';
import { useCountUp } from './useCountUp';
import { chartFigureProps } from '../charts/chartA11y';

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
        <div data-health="ring" className="flex flex-col items-center justify-center relative select-none max-sm:col-start-1 max-sm:row-[1/span_2]" {...chartFigureProps(title, valid ? `${numVal}${unit} de ${max}${unit}` : 'sin datos')}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 max-sm:w-24 max-sm:h-24">
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
                        className={`${colorClass} transition-paint duration-1000 ease-out motion-safe:animate-ring-draw dark:[filter:drop-shadow(0_0_6px_currentColor)]`}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Icon data-health="ring-icon" size={20} className={`${colorClass} mb-1 opacity-90 max-sm:hidden`} />
                <span data-health="ring-value" className={`text-3xl sm:leading-10 max-sm:text-[24px] max-sm:leading-none font-bold tracking-[-0.04em] tabular-nums ${colorClass}`}>
                    {valid ? (max === 10 ? counted.toFixed(1) : Math.round(counted)) : '--'}
                    {unit && <span className="text-sm font-bold text-ink-4 ml-0.5">{unit}</span>}
                </span>
                <span data-health="ring-title" className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em] mt-0.5 text-center max-sm:max-w-16 max-sm:leading-[1.1]">
                    {title}
                </span>
            </div>
        </div>
    );
};
