import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine, ComposedChart, Bar, Cell, Area } from 'recharts';
import { Moon, Info, Shield, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Battery, Heart, Sparkles, TrendingUp, Zap, Flame, BatteryCharging, BrainCircuit, ActivitySquare } from 'lucide-react';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

const BevelCard = ({ children, className = '' }) => (
    <div className={`bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-sm rounded-[32px] overflow-hidden ${className}`}>
        {children}
    </div>
);

const RingGauge = ({ value, max = 100, colorClass, gradientId, size = 160, strokeWidth = 14, icon: Icon, title, subtitle }) => {
    const pct = value !== '--' ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const r = (size - strokeWidth) / 2;
    const c = size / 2;
    const dasharray = 2 * Math.PI * r;
    const dashoffset = dasharray - (dasharray * pct) / 100;

    return (
        <div className="flex flex-col items-center justify-center relative">
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {/* Track */}
                <circle cx={c} cy={c} r={r} fill="none" className="stroke-slate-100 dark:stroke-zinc-800" strokeWidth={strokeWidth} />
                {/* Fill */}
                {value !== '--' && (
                    <circle
                        cx={c} cy={c} r={r} fill="none"
                        className={`${colorClass} transition-all duration-[1.5s] ease-in-out drop-shadow-md`}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Icon size={24} className={`${colorClass} mb-1 opacity-80`} />
                <span className={`text-4xl font-extrabold tracking-tighter ${colorClass}`}>
                    {value !== '--' ? Math.round(value) : '--'}
                    {value !== '--' && max === 100 && <span className="text-xl text-slate-400 font-bold ml-0.5">%</span>}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</span>
            </div>
        </div>
    );
};

export const HealthPage = ({ activities, settings, chartData }) => {
    const { wellnessMetrics, loading: wellnessLoading, error: apiError } = useWellnessInfo(activities, settings, chartData);

    const tooltipStyle = {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        color: '#f4f4f5',
        fontSize: '12px',
        fontWeight: '600',
        padding: '12px 16px',
        zIndex: 1000,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
    };

    const CustomHrvTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={tooltipStyle} className="min-w-[200px]">
                    <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-3 border-b border-zinc-700/50 pb-2">{data.dateLabel}</p>
                    {data.hrv != null ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div> Media 7d
                                </span>
                                <span className="text-sm font-black text-white">{data.hrv7dAvg} <span className="text-[10px] text-zinc-500">ms</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> VFC Diaria
                                </span>
                                <span className="text-sm font-black text-white">{data.hrv} <span className="text-[10px] text-zinc-500">ms</span></span>
                            </div>
                        </div>
                    ) : <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center py-2">Sin datos de VFC</p>}
                </div>
            );
        }
        return null;
    };

    const readinessInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.todayReadiness === '--') return { color: 'text-slate-400', label: 'Desconocida', msg: 'Sincroniza datos para ver tu recuperación', badge: 'bg-slate-100 dark:bg-zinc-800' };
        const r = wellnessMetrics.todayReadiness;
        if (r >= 67) return { color: 'text-emerald-500', label: 'Óptima', msg: 'Tu cuerpo está preparado para rendir al máximo nivel el día de hoy.', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' };
        if (r >= 34) return { color: 'text-amber-500', label: 'Adaptándose', msg: 'Responde bien al estrés. Prioriza la técnica sobre la intensidad.', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' };
        return { color: 'text-red-500', label: 'Fatiga Alta', msg: 'Tu sistema nervioso necesita descanso activo o recuperación total.', badge: 'bg-red-50 text-red-600 dark:bg-red-950/30' };
    }, [wellnessMetrics]);

    const strainInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.effort?.score === undefined || wellnessMetrics.effort?.score === '--') return { color: 'text-slate-400', label: 'N/A', val: '--' };
        const score = wellnessMetrics.effort.score;
        let c = 'text-slate-400';
        let l = 'Muy Ligero';
        if (score >= 9) { c = 'text-red-500'; l = 'Extremo'; }
        else if (score >= 7) { c = 'text-orange-500'; l = 'Muy Duro'; }
        else if (score >= 5) { c = 'text-amber-500'; l = 'Duro'; }
        else if (score >= 3) { c = 'text-blue-500'; l = 'Moderado'; }
        else if (score >= 1) { c = 'text-emerald-500'; l = 'Ligero'; }

        return { color: c, label: l, val: Math.round(score) };
    }, [wellnessMetrics]);

    const sleepInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.latestSleepScore === '--') return { color: 'text-slate-400', label: 'Desconocido' };
        const s = wellnessMetrics.latestSleepScore;
        if (s >= 85) return { color: 'text-blue-500', label: 'Excelente' };
        if (s >= 70) return { color: 'text-emerald-500', label: 'Buen Sueño' };
        if (s >= 50) return { color: 'text-amber-500', label: 'Suficiente' };
        return { color: 'text-red-500', label: 'Malo' };
    }, [wellnessMetrics]);

    const energyBankAmount = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.todayReadiness === '--' || !wellnessMetrics.effort || wellnessMetrics.effort.score === undefined) return '--';
        const readi = wellnessMetrics.todayReadiness;
        const drain = (wellnessMetrics.effort.score / 10) * 80;
        const remaining = Math.max(0, Math.min(100, readi - drain));
        return Math.round(remaining);
    }, [wellnessMetrics]);

    return (
        <div className="animate-in fade-in duration-500 pb-16 w-full max-w-[1400px] mx-auto px-2 sm:px-4">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-4 px-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Estado Diario</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm">
                        {wellnessLoading ? 'Analizando biometrías...' : readinessInfo.msg}
                    </p>
                </div>
                {(apiError || (wellnessMetrics?.isSimulated)) && (
                    <div className="flex gap-2">
                        {apiError && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50/80 dark:bg-red-900/40 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                                <AlertTriangle size={12} /> Error API
                            </span>
                        )}
                        {wellnessMetrics?.isSimulated && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50/80 dark:bg-amber-900/40 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                                <BrainCircuit size={12} /> Simulador Demo
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN RINGS (BEVEL STYLE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* RECOVERY RING */}
                <BevelCard className="p-8 flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <RingGauge
                        value={wellnessMetrics?.todayReadiness}
                        colorClass={readinessInfo.color}
                        gradientId="grad-recovery"
                        icon={Battery}
                        title="Recuperación"
                        size={180}
                        strokeWidth={16}
                    />
                    <div className="mt-8 text-center z-10">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm ${readinessInfo.badge}`}>
                            {readinessInfo.label}
                        </span>
                    </div>
                </BevelCard>

                {/* STRAIN / EFFORT RING */}
                <BevelCard className="p-8 flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <RingGauge
                        value={strainInfo.val}
                        max={100}
                        colorClass={strainInfo.color}
                        gradientId="grad-strain"
                        icon={Zap}
                        title="Esfuerzo (Strain)"
                        size={180}
                        strokeWidth={16}
                    />
                    <div className="mt-8 text-center z-10 w-full px-6">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            <span>Métrica Global</span>
                            <span className={strainInfo.color}>{strainInfo.label}</span>
                        </div>
                    </div>
                </BevelCard>

                {/* SLEEP RING */}
                <BevelCard className="p-8 flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <RingGauge
                        value={wellnessMetrics?.latestSleepScore ?? '--'}
                        max={100}
                        colorClass={sleepInfo.color}
                        gradientId="grad-sleep"
                        icon={Moon}
                        title="Score Sueño"
                        size={180}
                        strokeWidth={16}
                    />
                    <div className="mt-8 text-center z-10 w-full px-6">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            <span>Horas Totales</span>
                            <span className="text-slate-800 dark:text-zinc-200 font-black">{wellnessMetrics?.latestSleep || '--'} h</span>
                        </div>
                    </div>
                </BevelCard>
            </div>

            {/* ENERGY BANK (BEVEL EXCLUSIVE CONCEPT) */}
            <div className="mb-8">
                <BevelCard className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900/80 dark:to-zinc-950/80 border-slate-200/80 dark:border-zinc-800">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                <BatteryCharging size={24} className="text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">Banco de Energía</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                            El banco de energía te indica cuánto "combustible" tienes disponible. Es tu recuperación obtenida de noche restando el esfuerzo realizado durante el día.
                        </p>

                        <div className="w-full h-10 bg-slate-100 dark:bg-zinc-950 rounded-2xl overflow-hidden relative shadow-inner p-1">
                            <div
                                className={`absolute top-1 left-1 bottom-1 rounded-xl transition-all duration-1000 ease-out shadow-sm ${energyBankAmount === '--' ? 'w-0' :
                                    energyBankAmount > 60 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                        energyBankAmount > 30 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                            'bg-gradient-to-r from-red-400 to-red-500'
                                    }`}
                                style={{ width: `${energyBankAmount !== '--' ? Math.max(2, energyBankAmount) : 0}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center justify-center min-w-[140px] pl-4 md:border-l border-slate-200 dark:border-zinc-800">
                        <span className={`text-6xl font-black tracking-tighter ${energyBankAmount === '--' ? 'text-slate-400' :
                            energyBankAmount > 60 ? 'text-emerald-500' :
                                energyBankAmount > 30 ? 'text-amber-500' :
                                    'text-red-500'
                            }`}>
                            {energyBankAmount !== '--' ? energyBankAmount : '--'}<span className="text-2xl text-slate-400 dark:text-zinc-600 ml-1">%</span>
                        </span>
                        <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 dark:text-zinc-500 mt-2">Nivel Restante</span>
                    </div>
                </BevelCard>
            </div>

            {/* INSIGHTS ROW AND HRV DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

                {/* AI INSIGHTS COLUMN */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 mb-4 px-2">
                        <Sparkles size={16} className="text-indigo-500" /> Factores Clave
                    </h3>

                    {wellnessMetrics?.insights?.length > 0 ? (
                        wellnessMetrics.insights.map((insight, idx) => {
                            const isDanger = insight.type === 'danger';
                            const isWarning = insight.type === 'warning';

                            return (
                                <BevelCard key={idx} className="p-5 flex flex-col justify-between group">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${isDanger ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                                            isWarning ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                                                'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                            }`}>
                                            {isDanger ? <ShieldAlert size={20} /> : isWarning ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-xs font-black uppercase tracking-wider mb-1 ${isDanger ? 'text-red-700 dark:text-red-400' :
                                                isWarning ? 'text-amber-700 dark:text-amber-400' :
                                                    'text-emerald-700 dark:text-emerald-400'
                                                }`}>
                                                {insight.label}
                                            </h4>
                                            <p className="text-[13px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                                                {insight.desc}
                                            </p>
                                        </div>
                                    </div>
                                </BevelCard>
                            )
                        })
                    ) : (
                        <div className="h-full min-h-[150px] flex justify-center items-center text-center text-slate-500 dark:text-zinc-600 border border-dashed border-slate-300 dark:border-zinc-800 rounded-[32px] p-6 bg-slate-50/50 dark:bg-zinc-900/20">
                            <div>
                                <ActivitySquare size={28} className="mx-auto mb-3 opacity-50" />
                                <p className="text-xs font-bold uppercase tracking-wider">No se detectan alertas ni Insights</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* DETAILED STATS GRID */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                    <BevelCard className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">VFC (Media 7d)</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tighter text-slate-800 dark:text-zinc-100">{wellnessMetrics?.avgHrv7d || '--'}</span>
                            <span className="text-sm font-bold text-slate-400">ms</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-3 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">Base: {wellnessMetrics?.normalHrvRange?.[0] || '--'} - {wellnessMetrics?.normalHrvRange?.[1] || '--'}</span>
                    </BevelCard>

                    <BevelCard className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">VFC Anoche</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black tracking-tighter ${wellnessMetrics?.hrvStatus === 'unbalanced' ? 'text-amber-500' : 'text-emerald-500'}`}>{wellnessMetrics?.latestHrv || '--'}</span>
                            <span className="text-sm font-bold text-slate-400">ms</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest mt-3 px-3 py-1 rounded-full ${wellnessMetrics?.hrvStatus === 'unbalanced' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'}`}>
                            {wellnessMetrics?.hrvStatus === 'unbalanced' ? 'Fuera de Rango' : 'En Rango Base'}
                        </span>
                    </BevelCard>

                    <BevelCard className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">TSB (Forma)</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black tracking-tighter ${wellnessMetrics?.currentTsb === undefined ? 'text-slate-400' :
                                wellnessMetrics.currentTsb < -25 ? 'text-red-500' :
                                    wellnessMetrics.currentTsb < -10 ? 'text-amber-500' :
                                        wellnessMetrics.currentTsb > 5 ? 'text-blue-500' :
                                            'text-emerald-500'
                                }`}>
                                {wellnessMetrics?.currentTsb !== undefined ? (wellnessMetrics.currentTsb > 0 ? '+' : '') + Math.round(wellnessMetrics.currentTsb) : '--'}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-3 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                            Balance Fatiga/Aptitud
                        </span>
                    </BevelCard>

                    <BevelCard className="p-6 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">FC Reposo</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tighter text-slate-800 dark:text-zinc-100">{wellnessMetrics?.latestRhr !== '--' ? Math.round(wellnessMetrics?.latestRhr) : '--'}</span>
                            <span className="text-sm font-bold text-slate-400">lpm</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-3 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                            Media Base: {wellnessMetrics?.baselineRhr !== '--' ? Math.round(wellnessMetrics?.baselineRhr) : '--'}
                        </span>
                    </BevelCard>
                </div>
            </div>

            {/* VFC TREND CHART (BEVEL GLOW STYLE) */}
            <BevelCard className="p-6 md:p-8 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={18} className="text-indigo-500" /> Tendencia VFC
                        </h3>
                    </div>
                </div>

                <div className="flex-1 w-full relative -ml-4">
                    {wellnessLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : Number.isInteger(wellnessMetrics?.normalHrvRange?.[0]) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={wellnessMetrics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHrvLine" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#27272a" opacity={0.6} vertical={false} />
                                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} minTickGap={30} axisLine={false} tickLine={false} tickMargin={12} />
                                <YAxis domain={wellnessMetrics.chartData.some(d => d.hrv) ? ['dataMin - 10', 'dataMax + 10'] : [40, 100]} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} axisLine={false} tickLine={false} tickMargin={12} />
                                <RechartsTooltip content={<CustomHrvTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#71717a', opacity: 0.5 }} isAnimationActive={false} />

                                {/* Normal Range Area glow */}
                                {wellnessMetrics.normalHrvRange[0] > 0 && (
                                    <ReferenceArea y1={wellnessMetrics.normalHrvRange[0]} y2={wellnessMetrics.normalHrvRange[1]} fill="#10b981" fillOpacity={0.06} />
                                )}

                                <Area type="monotone" dataKey="hrv7dAvg" stroke="none" fill="url(#colorHrvLine)" connectNulls={true} />
                                <Line type="monotone" dataKey="hrv7dAvg" name="Media 7d" stroke="#6366f1" strokeWidth={4} dot={false} activeDot={false} connectNulls={true} style={{ filter: 'drop-shadow(0px 8px 12px rgba(99, 102, 241, 0.4))' }} />

                                <Line type="monotone" dataKey="hrv" name="VFC Diaria" stroke="none" strokeWidth={0} dot={(props) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.hrv == null || isNaN(cx) || isNaN(cy)) return <svg key={`empty-${payload.dateLabel}`} />;
                                    let dotColor = "#71717a";
                                    let outerColor = "rgba(113, 113, 122, 0.15)";
                                    if (payload.hrv < payload.baselineBottom) { dotColor = "#ef4444"; outerColor = "rgba(239, 68, 68, 0.25)"; }
                                    else if (payload.hrv > payload.baselineTop) { dotColor = "#3b82f6"; outerColor = "rgba(59, 130, 246, 0.25)"; }
                                    else { dotColor = "#10b981"; outerColor = "rgba(16, 185, 129, 0.25)"; }

                                    return (
                                        <g key={`dot-${payload.dateLabel}`}>
                                            <circle cx={cx} cy={cy} r={9} fill={outerColor} stroke="none" />
                                            <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke="#fff" strokeWidth={1.5} />
                                        </g>
                                    );
                                }} activeDot={{ r: 8, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} connectNulls={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] uppercase font-bold text-slate-400 tracking-widest">Sin datos suficientes</div>
                    )}
                </div>
            </BevelCard>
        </div>
    );
};
