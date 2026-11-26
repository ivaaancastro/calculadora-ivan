import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { Card, ChartTooltip, Segmented } from '../ui';
import { useChartMotion } from '../charts/useChartMotion';
import { chartFigureProps, summarizeSeries } from '../charts/chartA11y';
import { axisProps } from '../charts/axisProps.js';

const OPTIMAL_FROM = 67;
const RANGES = [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '30D' },
];

const TrendTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <ChartTooltip variant="glass">
            <p className="text-2xs font-bold uppercase tracking-[0.05em] text-ink-4 pb-1">{d.dateLabelFull || d.date}</p>
            <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>Recuperación</span><span>{d.readinessScore}%</span></div>
            {d.sleep > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>Sueño</span><span>{d.sleep} h</span></div>}
            {d.rhr > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>FC reposo</span><span>{d.rhr} lpm</span></div>}
            {d.hrv > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>VFC</span><span>{d.hrv} ms</span></div>}
        </ChartTooltip>
    );
};

/**
 * Tendencia de recuperación (spec §3.2): área con degradado, banda «óptima» y línea de sueño.
 * El selector 7D/14D/30D va en la cabecera de este bloque, que es lo que cambia (RF-D3), y
 * `children` (la tira de días del periodo) va dentro, bajo un filete.
 */
export const HistoryTrendChart = ({ historySeries, historyRange, setHistoryRange, ct, children }) => {
    const motion = useChartMotion();
    const figure = chartFigureProps('Tendencia de recuperación y sueño', summarizeSeries(historySeries, [{ key: 'readinessScore', label: 'Recuperación' }], { unit: '%' }));
    return (
        <Card data-health="trend" figures="tnum" className="motion-safe:animate-rise-slow p-card md:p-card-lg flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-ink tracking-tight">Tendencia de recuperación</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-ink-3">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ct.series.readiness }} />Recuperación</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ct.series.sleep }} />Sueño</span>
                    </div>
                </div>
                <Segmented
                    data-health="range"
                    role="group"
                    aria-label="Periodo"
                    className="shrink-0"
                    optionClassName="min-h-[44px] min-w-[44px] md:min-h-[36px]"
                    options={RANGES}
                    value={historyRange}
                    onChange={setHistoryRange}
                />
            </div>
            <div className="h-48 md:h-56 w-full -ml-3 md:ml-0" {...figure}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="health-trend-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={ct.series.readiness} stopOpacity={0.32} />
                                <stop offset="100%" stopColor={ct.series.readiness} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={ct.anatomy.grid} opacity={0.3} vertical={false} />
                        <XAxis dataKey="dateLabel" {...axisProps(ct)} minTickGap={24} />
                        <YAxis yAxisId="left" domain={[0, 100]} {...axisProps(ct)} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 12]} hide />
                        <ReferenceArea yAxisId="left" y1={OPTIMAL_FROM} y2={100} fill={ct.series.readiness} fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: ct.anatomy.cursor, strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} />
                        <Area yAxisId="left" type="monotone" dataKey="readinessScore" stroke={ct.series.readiness} strokeWidth={2} fill="url(#health-trend-fill)" dot={false} {...motion.props} />
                        <Line yAxisId="right" type="monotone" dataKey="sleep" stroke={ct.series.sleep} strokeWidth={2} dot={false} connectNulls {...motion.props} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {children && <div className="border-t border-hairline pt-4">{children}</div>}
        </Card>
    );
};
