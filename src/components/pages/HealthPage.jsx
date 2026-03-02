import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine, ComposedChart, Bar, Cell, Area } from 'recharts';
import { Moon, Info, Shield, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Battery, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

const SectionHeader = ({ title }) => (
    <div className="flex items-center mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
        <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">{title}</h3>
    </div>
);

const Subtitle = ({ text }) => (
    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-2 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{text}</span>
);

export const HealthPage = ({ activities, settings, chartData }) => {
    const { wellnessMetrics, loading: wellnessLoading, error: apiError } = useWellnessInfo(activities, settings, chartData);

    const tooltipStyle = {
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '6px',
        color: '#f4f4f5',
        fontSize: '11px',
        fontWeight: '600',
        padding: '8px 12px',
        zIndex: 1000
    };

    const CustomHrvTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={tooltipStyle} className="shadow-xl min-w-[170px]">
                    <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-wider mb-2 border-b border-zinc-700 pb-1">{data.dateLabel}</p>
                    {data.hrv !== null && data.hrv !== undefined ? (
                        <>
                            <div className="flex items-center justify-between gap-4 mb-1">
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <div className="w-2.5 h-2.5 rounded border border-indigo-400/50 bg-indigo-500/20"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Media 7d</span>
                                </div>
                                <span className="text-xs font-black text-indigo-400">{data.hrv7dAvg} <span className="text-[9px]">ms</span></span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">VFC Noche</span>
                                </div>
                                <span className="text-xs font-black text-emerald-400">{data.hrv} <span className="text-[9px]">ms</span></span>
                            </div>
                            <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-zinc-700 pt-1">
                                Base: {data.baselineBottom} - {data.baselineTop} ms
                            </div>
                        </>
                    ) : (
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center py-1">Sin datos VFC</p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Calculate Whoop-like readiness color and label
    const readinessInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.todayReadiness === '--') {
            return { color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-zinc-800', barFormat: 'stroke-slate-200 dark:stroke-slate-700', label: 'Sin Datos' };
        }
        const r = wellnessMetrics.todayReadiness;
        if (r >= 67) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', barFormat: 'stroke-emerald-500', label: 'Óptima' };
        if (r >= 34) return { color: 'text-amber-500', bg: 'bg-amber-500/10', barFormat: 'stroke-amber-500', label: 'Adecuada' };
        return { color: 'text-red-500', bg: 'bg-red-500/10', barFormat: 'stroke-red-500', label: 'Baja' };
    }, [wellnessMetrics]);

    return (
        <div className="animate-in fade-in duration-300 pb-12 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-2 border-b border-slate-300 dark:border-zinc-800 gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" /> Salud y Recuperación
                    </h3>
                    <Subtitle text="Últimos 90 Días" />
                </div>
                {apiError ? (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <AlertTriangle size={10} /> Error API: Revisa tu Clave
                    </span>
                ) : wellnessMetrics?.isSimulated && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <AlertTriangle size={10} /> Simulador Activo
                    </span>
                )}
            </div>

            {/* SECCIÓN 1: RECOVERY SCORE (Whoop Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                {/* Score Circular */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden lg:col-span-1 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4 w-full text-center flex items-center justify-center gap-1.5">
                        <Battery size={14} className={readinessInfo.color} /> Capacidad Fisiológica
                    </h4>

                    <div className="relative w-40 h-40 flex items-center justify-center my-2">
                        <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth="12" />
                            {wellnessMetrics && wellnessMetrics.todayReadiness !== '--' && (
                                <circle
                                    cx="80" cy="80" r="70" fill="none"
                                    className={`${readinessInfo.barFormat} transition-all duration-1000 ease-out`}
                                    strokeWidth="12"
                                    strokeDasharray="439.8"
                                    strokeDashoffset={439.8 - (439.8 * wellnessMetrics.todayReadiness) / 100}
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                        <div className="flex flex-col items-center">
                            {wellnessLoading ? (
                                <span className="text-4xl font-black font-mono text-slate-300 dark:text-zinc-700 animate-pulse">--</span>
                            ) : (
                                <>
                                    <div className="flex items-baseline">
                                        <span className={`text-5xl font-black font-mono tracking-tighter ${readinessInfo.color} mr-1`}>
                                            {wellnessMetrics?.todayReadiness !== '--' ? Math.round(wellnessMetrics?.todayReadiness) : '--'}
                                        </span>
                                        {wellnessMetrics?.todayReadiness !== '--' && <span className={`text-xl font-bold ${readinessInfo.color}`}>%</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {!wellnessLoading && (
                        <span className={`mt-2.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${readinessInfo.bg} ${readinessInfo.color}`}>
                            {readinessInfo.label}
                        </span>
                    )}
                </div>

                {/* Insights y Key Drivers */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl lg:col-span-2 flex flex-col justify-center shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800 w-full">
                        <Sparkles size={14} className="text-indigo-500" />
                        <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest">Factores Determinantes (Insights)</h4>
                    </div>

                    {wellnessLoading ? (
                        <div className="h-full flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {wellnessMetrics?.insights?.length > 0 ? (
                                wellnessMetrics.insights.map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${insight.type === 'danger' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30' :
                                        insight.type === 'warning' ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30' :
                                            'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                                        }`}>
                                        <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${insight.type === 'danger' ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : insight.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'}`}>
                                            {insight.type === 'danger' ? <ShieldAlert size={14} /> : insight.type === 'warning' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                        </div>
                                        <div>
                                            <span className={`text-[11px] font-black uppercase tracking-widest block mb-0.5 ${insight.type === 'danger' ? 'text-red-700 dark:text-red-400' :
                                                insight.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                                                    'text-emerald-700 dark:text-emerald-400'
                                                }`}>{insight.label}</span>
                                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">{insight.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center text-sm text-slate-500 italic py-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                                    Sincroniza datos de VFC, Sueño y carga de entrenamiento para generar insights de recuperación.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 2: MÉTRICAS BASE GRID (Como Oura/Whoop diarios) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center justify-center shadow-sm relative overflow-hidden group">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">VFC Anoche</span>
                    <div className="flex items-baseline gap-1 mt-1 z-10">
                        <span className={`text-4xl font-black font-mono ${wellnessMetrics?.hrvStatus === 'unbalanced' ? 'text-amber-500' : 'text-emerald-500'}`}>{wellnessMetrics?.latestHrv || '--'}</span>
                        <span className="text-xs font-bold text-slate-400">ms</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center justify-center shadow-sm relative overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">VFC (Media 7d)</span>
                    <div className="flex items-baseline gap-1 mt-1 z-10">
                        <span className="text-4xl font-black font-mono text-slate-700 dark:text-zinc-200">{wellnessMetrics?.avgHrv7d || '--'}</span>
                        <span className="text-xs font-bold text-slate-400">ms</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 z-10 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Rango Base: {wellnessMetrics?.normalHrvRange?.[0] || '--'} - {wellnessMetrics?.normalHrvRange?.[1] || '--'}</span>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">FC Reposo</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-4xl font-black font-mono text-slate-700 dark:text-zinc-200">{wellnessMetrics?.latestRhr !== '--' ? Math.round(wellnessMetrics?.latestRhr) : '--'}</span>
                        <span className="text-xs font-bold text-slate-400">lpm</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Media Base: {wellnessMetrics?.baselineRhr !== '--' ? Math.round(wellnessMetrics?.baselineRhr) : '--'}</span>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Total Sueño</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-4xl font-black font-mono ${wellnessMetrics?.latestSleep < 7 ? (wellnessMetrics?.latestSleep < 6 ? 'text-red-500' : 'text-amber-500') : 'text-blue-500'}`}>
                            {wellnessMetrics?.latestSleep || '--'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">h</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Media 7d: {wellnessMetrics?.avgSleep7d || '--'}h</span>
                </div>
            </div>

            {/* SECCIÓN 3: GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* VFC Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col h-[350px] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 group relative">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Heart size={14} className="text-emerald-500" /> Variabilidad de la FC (VFC) vs Zona Rango
                            </h4>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative -ml-2">
                        {wellnessLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : Number.isInteger(wellnessMetrics?.normalHrvRange?.[0]) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={wellnessMetrics.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHrvLine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#3f3f46" opacity={0.4} vertical={false} />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={20} axisLine={false} tickLine={false} tickMargin={10} />
                                    <YAxis domain={wellnessMetrics.chartData.some(d => d.hrv) ? ['dataMin - 5', 'dataMax + 5'] : [40, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip content={<CustomHrvTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} isAnimationActive={false} />

                                    {/* Normal Range Area */}
                                    {wellnessMetrics.normalHrvRange[0] > 0 && (
                                        <ReferenceArea y1={wellnessMetrics.normalHrvRange[0]} y2={wellnessMetrics.normalHrvRange[1]} fill="#10b981" fillOpacity={0.06} />
                                    )}
                                    {wellnessMetrics.baselineHrv > 0 && (
                                        <ReferenceLine y={wellnessMetrics.baselineHrv} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.4} />
                                    )}

                                    <Area type="monotone" dataKey="hrv7dAvg" stroke="none" fill="url(#colorHrvLine)" connectNulls={true} />
                                    <Line type="monotone" dataKey="hrv7dAvg" name="Media 7d" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={false} connectNulls={true} />

                                    <Line type="monotone" dataKey="hrv" name="VFC Diaria" stroke="none" strokeWidth={0} dot={(props) => {
                                        const { cx, cy, payload } = props;
                                        if (payload.hrv === null || payload.hrv === undefined || isNaN(cx) || isNaN(cy)) return <svg key={`empty-${payload.dateLabel}`}></svg>;
                                        let dotColor = "#cbd5e1";
                                        if (payload.hrv < payload.baselineBottom) dotColor = "#ef4444";
                                        else if (payload.hrv > payload.baselineTop) dotColor = "#3b82f6";
                                        else dotColor = "#10b981";
                                        return <circle cx={cx} cy={cy} r={3.5} fill={dotColor} stroke="none" key={`dot-${payload.dateLabel}`} />;
                                    }} activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0, cursor: 'pointer' }} connectNulls={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sin datos de VFC</div>
                        )}
                    </div>
                </div>

                {/* Sleep Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col h-[350px] shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Moon size={14} className="text-blue-500" /> Horas de Sueño Continuo
                            </h4>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative -ml-2">
                        {wellnessLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : wellnessMetrics?.chartData && wellnessMetrics.chartData.some(d => d.sleep > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={wellnessMetrics.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#3f3f46" opacity={0.4} vertical={false} />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={20} axisLine={false} tickLine={false} tickMargin={10} />
                                    <YAxis domain={[0, wellnessMetrics.chartData.some(d => d.sleep > 10) ? 'dataMax + 1' : 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }} formatter={(value) => [`${value} h`, null]} cursor={{ fill: '#334155', opacity: 0.1 }} />

                                    <ReferenceArea y1={8} y2={14} fill="#10b981" fillOpacity={0.06} />
                                    <ReferenceLine y={8} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.4} label={{ position: 'insideTopLeft', value: 'Óptimo (8h+)', fill: '#10b981', fontSize: 9, fontWeight: 'bold' }} />

                                    <Bar dataKey="sleep" name="Horas de Sueño" radius={[4, 4, 0, 0]} maxBarSize={28}>
                                        {wellnessMetrics.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.sleep >= 8 ? '#10b981' : entry.sleep >= 6 ? '#3b82f6' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                    <Line type="monotone" dataKey="sleep7dAvg" name="Media 7d" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={false} connectNulls={true} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sin datos de sueño</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
