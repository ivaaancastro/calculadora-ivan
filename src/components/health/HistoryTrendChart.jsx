import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Card } from '../ui';
import { HistoryChartTooltip } from './HistoryChartTooltip';

export const HistoryTrendChart = ({ historySeries, ct }) => (
    <>
        <Card data-health="trend" className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-tight">
                        Tendencia de Recuperación Diaria
                    </h3>
                    <p className="text-[11px] text-ink-4">
                        Puntuación de recuperación (%) y descanso a lo largo del periodo
                    </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Recuperación
                    </span>
                    <span className="flex items-center gap-1 text-sleep">
                        <span className="w-2 h-2 rounded-full bg-sleep" /> Sueño (h)
                    </span>
                </div>
            </div>

            <div className="h-48 sm:h-56 w-full -ml-3 sm:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} vertical={false} opacity={0.6} />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: ct.anatomy.tickZinc, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: ct.anatomy.tickZinc, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 12]} hide />
                        <RechartsTooltip content={<HistoryChartTooltip />} cursor={{ strokeDasharray: '3 3', stroke: ct.anatomy.cursorZinc, opacity: 0.5 }} isAnimationActive={false} />

                        <Bar yAxisId="left" dataKey="readinessScore" fill={ct.series.readiness} radius={[4, 4, 0, 0]} maxBarSize={28} opacity={0.85} />
                        <Line yAxisId="right" type="monotone" dataKey="sleep" stroke={ct.series.sleep} strokeWidth={2.5} dot={{ r: 3, fill: ct.series.sleep, stroke: ct.anatomy.dotRing, strokeWidth: 1.5 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    </>
);
