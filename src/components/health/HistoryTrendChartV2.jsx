import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { Card, ChartTooltip } from '../ui';
import { useChartMotion } from '../charts/useChartMotion';
import { chartFigureProps, summarizeSeries } from '../charts/chartA11y';

const OPTIMAL_FROM = 67;

const TrendTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <ChartTooltip variant="glass">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4 pb-1">{d.dateLabelFull || d.date}</p>
            <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>Recuperación</span><span>{d.readinessScore}%</span></div>
            {d.sleep > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>Sueño</span><span>{d.sleep} h</span></div>}
            {d.rhr > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>FC reposo</span><span>{d.rhr} lpm</span></div>}
            {d.hrv > 0 && <div className="flex justify-between gap-4 font-semibold tabular-nums"><span>VFC</span><span>{d.hrv} ms</span></div>}
        </ChartTooltip>
    );
};

/** Tendencia de recuperación v2 (spec §3.2): área con degradado, banda «óptima» y línea de sueño. */
export const HistoryTrendChartV2 = ({ historySeries, ct }) => {
    const motion = useChartMotion();
    const figure = chartFigureProps('Tendencia de recuperación y sueño', summarizeSeries(historySeries, [{ key: 'readinessScore', label: 'Recuperación' }], { unit: '%' }));
    return (
        <Card data-health="trend" className="p-4 sm:p-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-ink tracking-tight">Tendencia de recuperación</h3>
                    <p className="text-[11px] text-ink-4">Recuperación (%) y horas de sueño del periodo</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-3 shrink-0">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ct.series.readiness }} />Recuperación</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ct.series.sleep }} />Sueño</span>
                </div>
            </div>
            <div className="h-48 sm:h-56 w-full -ml-3 sm:ml-0" {...figure}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="health-trend-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={ct.series.readiness} stopOpacity={0.32} />
                                <stop offset="100%" stopColor={ct.series.readiness} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={ct.anatomy.grid} opacity={0.3} vertical={false} />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: ct.anatomy.axis, fontWeight: 500 }} axisLine={false} tickLine={false} minTickGap={24} />
                        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: ct.anatomy.axis, fontWeight: 500 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 12]} hide />
                        <ReferenceArea yAxisId="left" y1={OPTIMAL_FROM} y2={100} fill={ct.series.readiness} fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: ct.anatomy.cursor, strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} />
                        <Area yAxisId="left" type="monotone" dataKey="readinessScore" stroke={ct.series.readiness} strokeWidth={2} fill="url(#health-trend-fill)" dot={false} {...motion.props} />
                        <Line yAxisId="right" type="monotone" dataKey="sleep" stroke={ct.series.sleep} strokeWidth={2} dot={false} connectNulls {...motion.props} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
