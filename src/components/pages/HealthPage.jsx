import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine, ComposedChart, Bar, Cell, Area } from 'recharts';
import { Moon, Info, Shield, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Battery, Heart, Sparkles, TrendingUp, Zap, Flame } from 'lucide-react';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

const SectionHeader = ({ title }) => (
    <div className="flex items-center mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
        <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">{title}</h3>
    </div>
);

const Subtitle = ({ text }) => (
    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-2 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{text}</span>
);

const RadialScoreCard = ({ title, icon: Icon, value, max = 100, colorClass, bgClass, barClass, label, loading }) => {
    const pct = value !== '--' ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-center items-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4 w-full text-center flex items-center justify-center gap-1.5 line-clamp-1">
                <Icon size={16} className={colorClass} /> {title}
            </h4>
            <div className="relative w-32 h-32 flex items-center justify-center my-1 z-10">
                {/* Background Track */}
                <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle cx="64" cy="64" r="54" fill="none" className="stroke-slate-100 dark:stroke-zinc-800/80" strokeWidth="12" />
                    {value !== '--' && !loading && (
                        <circle
                            cx="64" cy="64" r="54" fill="none"
                            className={`${barClass} transition-all duration-1000 ease-out`}
                            strokeWidth="12"
                            strokeDasharray="339.3"
                            strokeDashoffset={339.3 - (339.3 * pct) / 100}
                            strokeLinecap="round"
                        />
                    )}
                </svg>
                {/* Score Text */}
                <div className="flex flex-col items-center">
                    {loading ? (
                        <span className="text-4xl font-black font-mono text-slate-300 dark:text-zinc-700 animate-pulse">--</span>
                    ) : (
                        <div className="flex items-baseline">
                            <span className={`text-5xl font-black font-mono tracking-tighter ${colorClass} mr-0.5`}>
                                {value !== '--' ? Math.round(value) : '--'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            {!loading && (
                <span className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center ${bgClass} ${colorClass} shadow-sm border border-black/5 dark:border-white/5`}>
                    {label}
                </span>
            )}
        </div>
    );
};


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

    const sleepScoreInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.latestSleepScore === '--') return { color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-zinc-800', barFormat: 'stroke-slate-200 dark:stroke-slate-700', label: 'Sin Datos' };
        const s = wellnessMetrics.latestSleepScore;
        if (s >= 85) return { color: 'text-blue-500', bg: 'bg-blue-500/10', barFormat: 'stroke-blue-500', label: 'Excelente' };
        if (s >= 70) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', barFormat: 'stroke-emerald-500', label: 'Bueno' };
        if (s >= 50) return { color: 'text-amber-500', bg: 'bg-amber-500/10', barFormat: 'stroke-amber-500', label: 'Regular' };
        return { color: 'text-red-500', bg: 'bg-red-500/10', barFormat: 'stroke-red-500', label: 'Pobre' };
    }, [wellnessMetrics]);

    const stressInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.latestStress === '--') return { color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-zinc-800', barFormat: 'stroke-slate-200 dark:stroke-slate-700', label: 'Sin Datos' };
        const s = wellnessMetrics.latestStress;
        if (s <= 25) return { color: 'text-blue-500', bg: 'bg-blue-500/10', barFormat: 'stroke-blue-500', label: 'Reposo' };
        if (s <= 50) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', barFormat: 'stroke-emerald-500', label: 'Bajo' };
        if (s <= 75) return { color: 'text-amber-500', bg: 'bg-amber-500/10', barFormat: 'stroke-amber-500', label: 'Medio' };
        return { color: 'text-orange-500', bg: 'bg-orange-500/10', barFormat: 'stroke-orange-500', label: 'Alto' };
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

            {/* SECCIÓN 1: SCORE CARDS (Readiness, Sleep, Stress, Effort) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <RadialScoreCard
                    title="Recuperación"
                    icon={Battery}
                    value={wellnessMetrics?.todayReadiness}
                    colorClass={readinessInfo.color}
                    bgClass={readinessInfo.bg}
                    barClass={readinessInfo.barFormat}
                    label={readinessInfo.label}
                    loading={wellnessLoading}
                />
                <RadialScoreCard
                    title="Calidad Sueño"
                    icon={Moon}
                    value={wellnessMetrics?.latestSleepScore}
                    colorClass={sleepScoreInfo.color}
                    bgClass={sleepScoreInfo.bg}
                    barClass={sleepScoreInfo.barFormat}
                    label={sleepScoreInfo.label}
                    loading={wellnessLoading}
                />
                <RadialScoreCard
                    title="Nivel de Estrés"
                    icon={Flame}
                    value={wellnessMetrics?.latestStress}
                    colorClass={stressInfo.color}
                    bgClass={stressInfo.bg}
                    barClass={stressInfo.barFormat}
                    label={stressInfo.label}
                    loading={wellnessLoading}
                />
                <RadialScoreCard
                    title="Esfuerzo (Ayer)"
                    icon={Zap}
                    value={wellnessMetrics?.effort?.score ?? '--'}
                    colorClass={wellnessMetrics?.effort?.color || 'text-slate-400'}
                    bgClass={wellnessMetrics?.effort?.color ? `bg-${wellnessMetrics.effort.color.split('-')[1]}-500/10` : 'bg-slate-100 dark:bg-zinc-800'}
                    barClass={wellnessMetrics?.effort?.color ? `stroke-${wellnessMetrics.effort.color.split('-')[1]}-500` : 'stroke-slate-200 dark:stroke-slate-700'}
                    label={wellnessMetrics?.effort?.label || 'Sin Datos'}
                    loading={wellnessLoading}
                />
            </div>

            {/* SECCIÓN 1.5: INSIGHTS (Bevel Style) */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800 w-full px-1">
                    <Sparkles size={16} className="text-indigo-500" />
                    <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">Factores Determinantes</h4>
                </div>

                {wellnessLoading ? (
                    <div className="w-full h-32 flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wellnessMetrics?.insights?.length > 0 ? (
                            wellnessMetrics.insights.map((insight, idx) => {
                                const isDanger = insight.type === 'danger';
                                const isWarning = insight.type === 'warning';
                                const isSuccess = insight.type === 'success';

                                return (
                                    <div key={idx} className={`relative p-5 rounded-3xl border overflow-hidden flex flex-col justify-between min-h-[140px] transition-all hover:-translate-y-1 hover:shadow-md ${isDanger ? 'bg-gradient-to-br from-red-50/80 to-red-100/50 border-red-200 dark:from-red-950/30 dark:to-red-900/10 dark:border-red-900/30' :
                                            isWarning ? 'bg-gradient-to-br from-amber-50/80 to-amber-100/50 border-amber-200 dark:from-amber-950/30 dark:to-amber-900/10 dark:border-amber-900/30' :
                                                'bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/10 dark:border-emerald-900/30'
                                        }`}>
                                        {/* Background large icon */}
                                        <div className={`absolute -right-4 -top-4 opacity-5 pointer-events-none ${isDanger ? 'text-red-900' : isWarning ? 'text-amber-900' : 'text-emerald-900'}`}>
                                            {isDanger ? <ShieldAlert size={120} /> : isWarning ? <AlertTriangle size={120} /> : <ShieldCheck size={120} />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`rounded-xl p-2 shrink-0 ${isDanger ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : isWarning ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'}`}>
                                                    {isDanger ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                                                </div>
                                                <span className={`text-[13px] font-black uppercase tracking-widest ${isDanger ? 'text-red-800 dark:text-red-400' : isWarning ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'}`}>
                                                    {insight.label}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-slate-700 dark:text-zinc-300 font-medium leading-relaxed max-w-[90%] relative z-10">{insight.desc}</p>
                                        </div>

                                        <div className="mt-4 flex items-center gap-1.5 opacity-60">
                                            <Info size={12} className={isDanger ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDanger ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>Impacto en Readiness</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full bg-white dark:bg-zinc-900 flex flex-col items-center justify-center text-center text-sm text-slate-500 italic py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm">
                                <Activity size={32} className="text-slate-300 dark:text-zinc-700 mb-3" />
                                <span className="max-w-md">Sincroniza datos de VFC, Sueño y carga de entrenamiento continuada para generar insights contextuales en tu recuperación.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: MÉTRICAS BASE GRID (Como Oura/Whoop diarios) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center text-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">TSB (Forma)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-4xl font-black font-mono ${wellnessMetrics?.currentTsb === undefined ? 'text-slate-400' :
                            wellnessMetrics.currentTsb < -25 ? 'text-red-500' :
                                wellnessMetrics.currentTsb < -10 ? 'text-amber-500' :
                                    wellnessMetrics.currentTsb > 5 ? 'text-blue-500' :
                                        'text-emerald-500'
                            }`}>
                            {wellnessMetrics?.currentTsb !== undefined ? (wellnessMetrics.currentTsb > 0 ? '+' : '') + Math.round(wellnessMetrics.currentTsb) : '--'}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Fatiga Acumulada
                    </span>
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
