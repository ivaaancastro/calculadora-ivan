import React, { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { chartFigureProps } from '../../charts/chartA11y';
import { useCursor } from './cursorStore';

/** Lectura de la pista en el punto señalado: lo único que se repinta al mover el cursor. */
function TrackReadout({ format }) {
    const point = useCursor();
    if (!point) return null;
    const text = format(point);
    return text == null ? null : <span className="text-xs font-semibold font-mono tabular-nums text-ink">{text}</span>;
}

/**
 * Una pista del análisis (DUP-4): cabecera con nombre y lectura, y un área sincronizada con las
 * demás por `syncId`. Memoizada: el `mousemove` no la vuelve a pintar (RF-C5).
 */
export const SyncedAreaTrack = memo(function SyncedAreaTrack({
    data, dataKey, label, a11yLabel, summary, color, dotRing, grid, domain, reversed = false, onMove, format,
}) {
    return (
        <div data-detail="track" className="px-4 md:px-6 pt-3 pb-1">
            <div className="flex items-baseline justify-between gap-3 min-h-[20px]">
                <h4 className="text-[12px] font-semibold text-ink-3">{label}</h4>
                <TrackReadout format={format} />
            </div>
            <div {...chartFigureProps(a11yLabel || label, summary)}>
                <ResponsiveContainer width="100%" height={88}>
                    <AreaChart
                        data={data}
                        syncId="st"
                        onMouseMove={onMove}
                        onTouchMove={onMove}
                        onTouchStart={onMove}
                        onClick={onMove}
                        style={{ touchAction: 'pan-y' }}
                    >
                        <defs>
                            <linearGradient id={`track-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={grid} opacity={0.5} />
                        <XAxis dataKey="time" hide />
                        <YAxis reversed={reversed} hide domain={domain} />
                        <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: color, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fill={`url(#track-${dataKey})`}
                            strokeWidth={1.75}
                            dot={false}
                            isAnimationActive={false}
                            activeDot={{ r: 3.5, stroke: dotRing, strokeWidth: 1.5, fill: color }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});
