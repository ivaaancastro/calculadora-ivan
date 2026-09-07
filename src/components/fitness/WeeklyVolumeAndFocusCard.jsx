import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { InfoTooltip } from '../common/InfoTooltip';
import { tooltipStyle } from './fitnessConstants';

export const WeeklyVolumeAndFocusCard = ({
    weeklyChart,
    focusChart,
    zonesChart,
    intensityTimeframe,
    setIntensityTimeframe
}) => {
    return (
        <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 lg:col-span-2 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Volumen Semanal (TSS/Horas)</h3>
                            <InfoTooltip text="Carga de entrenamiento (TSS) y horas totales acumuladas cada semana. Las barras indican el estrés (TSS) y la línea el tiempo." />
                        </div>
                    </div>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={weeklyChart}>
                                <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.1} vertical={false} />
                                <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={15} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} isAnimationActive={false} cursor={{ stroke: '#71717a', strokeWidth: 1 }} />
                                <Bar yAxisId="left" dataKey="tss" name="TSS" fill="#8b5cf6" opacity={0.6} radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="left" type="monotone" dataKey="hours" name="Horas" stroke="#10b981" strokeWidth={3} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 lg:col-span-1 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Distribución de Foco</h3>
                        <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                            {['28d', '90d'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setIntensityTimeframe(t)}
                                    className={`px-3 py-1 text-[8px] font-bold uppercase rounded-lg transition-all ${intensityTimeframe === t ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
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
                                        <span className="text-slate-700 dark:text-zinc-300">{focus.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${focus.value}%`, backgroundColor: focus.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-3">Desglose por Zona</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {zonesChart.filter(z => z.hours > 0).map((z, i) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: z.fill }} />
                                            <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[80px]">{z.name.split(' ')[0]}</span>
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-zinc-200">{z.hours}h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
