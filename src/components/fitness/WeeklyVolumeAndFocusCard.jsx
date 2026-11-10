import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useChartTheme } from '../charts/useChartTheme';
import { Card, chartTooltipStyle, InfoTooltip, Segmented } from '../ui';

export const WeeklyVolumeAndFocusCard = ({
    weeklyChart,
    focusChart,
    zonesChart,
    intensityTimeframe,
    setIntensityTimeframe
}) => {
    const ct = useChartTheme();
    return (
        <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card variant="panel" className="p-6 sm:p-8 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Volumen Semanal (TSS/Horas)</h3>
                            <InfoTooltip text="Carga de entrenamiento (TSS) y horas totales acumuladas cada semana. Las barras indican el estrés (TSS) y la línea el tiempo." />
                        </div>
                    </div>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklyChart}>
                                <CartesianGrid strokeDasharray="2 2" stroke={ct.anatomy.gridZinc} opacity={0.1} vertical={false} />
                                <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: ct.anatomy.tick }} minTickGap={15} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: ct.series.tss }} axisLine={false} tickLine={false} />
                                <RechartsTooltip contentStyle={chartTooltipStyle(ct)} itemStyle={{ color: ct.tooltip.ink }} isAnimationActive={false} cursor={{ stroke: ct.anatomy.cursorZinc, strokeWidth: 1 }} />
                                <Bar yAxisId="left" dataKey="tss" name="TSS" fill={ct.series.tss} opacity={0.6} radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="left" type="monotone" dataKey="hours" name="Horas" stroke={ct.series.hours} strokeWidth={3} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card variant="panel" className="p-6 sm:p-8 lg:col-span-1">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Distribución de Foco</h3>
                        <Segmented
                            variant="card"
                            size="sm"
                            optionClassName="px-3 py-1"
                            value={intensityTimeframe}
                            onChange={setIntensityTimeframe}
                            options={['28d', '90d'].map((t) => ({ value: t, label: t.toUpperCase() }))}
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            {focusChart.map((focus, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <span>{focus.name}</span>
                                            <InfoTooltip text={focus.name === 'AERÓBICO' ? 'Zonas 1 y 2. Base de resistencia.' : (focus.name === 'TEMPO/UMBRAL' ? 'Zonas 3 y 4. Ritmos de carrera sostenidos.' : 'Zonas 5+. Potencia explosiva y series cortas.')} />
                                        </div>
                                        <span className="text-body">{focus.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${focus.value}%`, backgroundColor: focus.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-line-soft-2">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Desglose por Zona</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {zonesChart.filter(z => z.hours > 0).map((z, i) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: z.fill }} />
                                            <span className="text-ink-3 truncate max-w-[80px]">{z.name.split(' ')[0]}</span>
                                        </div>
                                        <span className="font-bold text-body-2">{z.hours}h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
};
