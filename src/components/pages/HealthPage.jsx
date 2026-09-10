import React, { useState, useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    Moon, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Battery,
    Sparkles, Zap, BatteryCharging, BrainCircuit, ActivitySquare, Scale,
    Footprints, Wind, TrendingDown, TrendingUp, Minus, Calendar, ChevronRight
} from 'lucide-react';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

// Componente de Tarjeta Apple iOS
const IosCard = ({ children, className = '' }) => (
    <div className={`ios-card p-4 sm:p-6 transition-all ${className}`}>
        {children}
    </div>
);

// Anillo Circular Estilo Apple Fitness / Health
const AppleRingGauge = ({ value, max = 100, colorClass, strokeColor, gradientId, size = 150, strokeWidth = 14, icon: Icon, title, unit = '' }) => {
    const numVal = typeof value === 'number' ? value : parseFloat(value);
    const valid = !isNaN(numVal);
    const pct = valid ? Math.max(0, Math.min(100, (numVal / max) * 100)) : 0;
    const r = (size - strokeWidth) / 2;
    const c = size / 2;
    const dasharray = 2 * Math.PI * r;
    const dashoffset = dasharray - (dasharray * pct) / 100;

    return (
        <div className="flex flex-col items-center justify-center relative select-none">
            <svg width={size} height={size} className="transform -rotate-90">
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
                        className={`${colorClass} transition-all duration-1000 ease-out`}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dasharray}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Icon size={20} className={`${colorClass} mb-1 opacity-90`} />
                <span className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${colorClass}`}>
                    {valid ? (max === 10 ? numVal.toFixed(1) : Math.round(numVal)) : '--'}
                    {unit && <span className="text-sm font-bold text-slate-400 dark:text-zinc-500 ml-0.5">{unit}</span>}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 text-center">
                    {title}
                </span>
            </div>
        </div>
    );
};

// Tooltip para el gráfico del Historial
const HistoryChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-700/60 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-800 dark:border-zinc-800 pb-1">
                    {d.dateLabelFull || d.dateLabel}
                </p>
                <div className="flex justify-between items-center text-emerald-400 font-bold tabular-nums">
                    <span>Recuperación:</span>
                    <span>{d.readinessScore}%</span>
                </div>
                {d.sleep > 0 && (
                    <div className="flex justify-between items-center text-blue-400 font-bold tabular-nums">
                        <span>Sueño:</span>
                        <span>{d.sleep}h</span>
                    </div>
                )}
                {d.rhr > 0 && (
                    <div className="flex justify-between items-center text-rose-400 font-bold tabular-nums">
                        <span>FC Reposo:</span>
                        <span>{d.rhr} lpm</span>
                    </div>
                )}
                {d.hrv > 0 && (
                    <div className="flex justify-between items-center text-indigo-400 font-bold tabular-nums">
                        <span>VFC:</span>
                        <span>{d.hrv} ms</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

// Helper para calcular la recuperación de cualquier día
const computeDayReadiness = (day, baselineRhr = 50) => {
    if (!day) return { score: '--', label: 'Sin datos', color: 'text-slate-400', dot: 'bg-slate-400', badge: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400' };

    let score = day.readiness;
    if (score == null) {
        let sHrv = 25;
        if (day.hrv && day.baselineBottom && day.baselineTop) {
            if (day.hrv >= day.baselineBottom && day.hrv <= day.baselineTop) sHrv = 45;
            else if (day.hrv > day.baselineTop) sHrv = 35;
            else sHrv = Math.round(45 * Math.max(0, day.hrv / day.baselineBottom));
        }
        let sSleep = 25;
        if (day.sleepScore) sSleep = (day.sleepScore / 100) * 35;
        else if (day.sleep) sSleep = Math.min(35, (day.sleep / 8) * 35);

        let sRhr = 15;
        if (day.rhr) {
            const diff = day.rhr - baselineRhr;
            if (diff <= 2) sRhr = 20;
            else if (diff <= 8) sRhr = 10;
            else sRhr = 0;
        }
        score = Math.max(5, Math.min(100, Math.round(sHrv + sSleep + sRhr)));
    } else {
        score = Math.round(score);
    }

    if (score >= 67) {
        return {
            score,
            label: 'Óptima',
            color: 'text-emerald-500',
            dot: 'bg-emerald-500',
            badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
        };
    }
    if (score >= 34) {
        return {
            score,
            label: 'Adaptándose',
            color: 'text-amber-500',
            dot: 'bg-amber-500',
            badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
        };
    }
    return {
        score,
        label: 'Fatiga Alta',
        color: 'text-rose-500',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
    };
};

export const HealthPage = ({ activities, settings, chartData }) => {
    const { wellnessMetrics, loading: wellnessLoading, error: apiError } = useWellnessInfo(activities, settings, chartData);

    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
    const [historyRange, setHistoryRange] = useState(14); // 7 | 14 | 30 días
    const [selectedDate, setSelectedDate] = useState(null);

    // Preparar lista cronológica de días enriquecida
    const enrichedChartData = useMemo(() => {
        if (!wellnessMetrics?.chartData || wellnessMetrics.chartData.length === 0) return [];
        const baseRhr = wellnessMetrics.baselineRhr || 50;

        return wellnessMetrics.chartData.map(d => {
            const recovery = computeDayReadiness(d, baseRhr);
            const dateObj = new Date(d.date + 'T00:00:00');
            const weekday = !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { weekday: 'short' }) : '';
            const dayNum = !isNaN(dateObj) ? dateObj.getDate() : '';
            const dateLabelFull = !isNaN(dateObj) ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }) : d.date;

            return {
                ...d,
                readinessScore: recovery.score,
                recoveryInfo: recovery,
                weekday: weekday.slice(0, 3),
                dayNum,
                dateLabelFull
            };
        });
    }, [wellnessMetrics]);

    // Último día disponible (Hoy)
    const latestDay = useMemo(() => {
        if (enrichedChartData.length === 0) return null;
        return enrichedChartData[enrichedChartData.length - 1];
    }, [enrichedChartData]);

    // Día actualmente seleccionado para la vista detallada
    const currentSelectedDay = useMemo(() => {
        if (!selectedDate || enrichedChartData.length === 0) return latestDay;
        const found = enrichedChartData.find(d => d.date === selectedDate);
        return found || latestDay;
    }, [selectedDate, enrichedChartData, latestDay]);

    // Filtrar rango para el historial
    const historySeries = useMemo(() => {
        if (enrichedChartData.length === 0) return [];
        return enrichedChartData.slice(-historyRange);
    }, [enrichedChartData, historyRange]);

    // Lista invertida (más reciente primero) para la tabla del historial
    const historyReversed = useMemo(() => {
        return [...historySeries].reverse();
    }, [historySeries]);

    // Información de Recuperación de Hoy
    const readinessInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.todayReadiness === '--') {
            return {
                color: 'text-slate-400',
                label: 'Desconocida',
                msg: 'Registra o sincroniza tus datos biométricos para ver tu estado.',
                badge: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
            };
        }
        const r = wellnessMetrics.todayReadiness;
        if (r >= 67) {
            return {
                color: 'text-emerald-500',
                label: 'Óptima',
                msg: 'Tu cuerpo se encuentra en condiciones óptimas para asimilar entrenamientos de alta intensidad.',
                badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
            };
        }
        if (r >= 34) {
            return {
                color: 'text-amber-500',
                label: 'Adaptándose',
                msg: 'Adaptación fisiológica activa. Es recomendable mantener intensidad controlada y vigilar la fatiga.',
                badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
            };
        }
        return {
            color: 'text-rose-500',
            label: 'Fatiga Alta',
            msg: 'El sistema nervioso autónomo refleja sobrecarga. Prioriza el descanso profundo o una sesión de descarga.',
            badge: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
        };
    }, [wellnessMetrics]);

    // Información de Esfuerzo (Strain)
    const strainInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.effort?.score === undefined || wellnessMetrics.effort?.score === '--') {
            return { color: 'text-slate-400', label: 'Sin Carga', val: '--' };
        }
        const score = wellnessMetrics.effort.score;
        let c = 'text-slate-400';
        let l = 'Muy Ligero';
        if (score >= 9) { c = 'text-rose-500'; l = 'Extremo'; }
        else if (score >= 7) { c = 'text-orange-500'; l = 'Muy Duro'; }
        else if (score >= 5) { c = 'text-amber-500'; l = 'Duro'; }
        else if (score >= 3) { c = 'text-blue-500'; l = 'Moderado'; }
        else if (score >= 1) { c = 'text-emerald-500'; l = 'Ligero'; }

        return { color: c, label: l, val: score };
    }, [wellnessMetrics]);

    // Información de Sueño
    const sleepInfo = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.latestSleepScore === '--') return { color: 'text-slate-400', label: 'Desconocido' };
        const s = wellnessMetrics.latestSleepScore;
        if (s >= 85) return { color: 'text-blue-500', label: 'Excelente' };
        if (s >= 70) return { color: 'text-emerald-500', label: 'Buen Sueño' };
        if (s >= 50) return { color: 'text-amber-500', label: 'Suficiente' };
        return { color: 'text-rose-500', label: 'Insuficiente' };
    }, [wellnessMetrics]);

    // Banco de Energía
    const energyBankAmount = useMemo(() => {
        if (!wellnessMetrics || wellnessMetrics.todayReadiness === '--' || !wellnessMetrics.effort || wellnessMetrics.effort.score === undefined) return '--';
        const readi = wellnessMetrics.todayReadiness;
        const drain = (wellnessMetrics.effort.score / 10) * 80;
        const remaining = Math.max(0, Math.min(100, readi - drain));
        return Math.round(remaining);
    }, [wellnessMetrics]);

    // Early return mientras carga o si no hay datos disponibles
    if (wellnessLoading && !wellnessMetrics) {
        return (
            <div className="animate-in fade-in duration-300 pb-20 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-24 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center shadow-xs">
                    <Activity size={24} className="text-emerald-500 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Salud</h2>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                        Sincronizando métricas fisiológicas...
                    </p>
                </div>
            </div>
        );
    }

    if (!wellnessMetrics) {
        return (
            <div className="animate-in fade-in duration-300 pb-20 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400">
                    <Activity size={24} className="text-slate-400" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sin datos de salud</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        No se han encontrado registros biométricos. Sincroniza tus datos o carga actividades para ver tus métricas de salud.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-20 w-full max-w-[1400px] mx-auto px-3 sm:px-6 space-y-6">
            
            {/* CABECERA ESTILO APPLE CON SELECTOR SEGMENTADO */}
            <div className="pt-2 sm:pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Salud
                            </h1>
                            {wellnessMetrics && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                                    {wellnessMetrics.isSimulated ? 'Modo Demo' : 'Biometría Diaria'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5 max-w-xl">
                            {wellnessLoading ? 'Sincronizando métricas fisiológicas...' : readinessInfo.msg}
                        </p>
                    </div>

                    {/* Selector de Vista: Hoy vs Historial */}
                    <div className="w-full sm:w-auto grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-zinc-800/80 rounded-xl gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('today')}
                            className={`py-1.5 px-4 text-xs font-semibold rounded-lg text-center transition-all active:scale-95 ${
                                activeTab === 'today'
                                    ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs font-bold'
                                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`py-1.5 px-4 text-xs font-semibold rounded-lg text-center transition-all active:scale-95 ${
                                activeTab === 'history'
                                    ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs font-bold'
                                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            Historial
                        </button>
                    </div>
                </div>

                {apiError && (
                    <div className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={14} /> Error al sincronizar datos biométricos
                    </div>
                )}
            </div>

            {/* VISTA 1: HOY (RESUMEN Y ANILLOS APPLE) */}
            {activeTab === 'today' && (
                <div className="space-y-6">
                    {/* ANILLOS APPLE HEALTH / FITNESS HERO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                        {/* ANILLO RECUPERACIÓN */}
                        <IosCard className="flex flex-col items-center justify-between relative text-center">
                            <div className="w-full flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Pilar 01</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${readinessInfo.badge}`}>
                                    {readinessInfo.label}
                                </span>
                            </div>

                            <AppleRingGauge
                                value={wellnessMetrics?.todayReadiness}
                                colorClass={readinessInfo.color}
                                strokeColor="#10b981"
                                gradientId="apple-ring-rec"
                                icon={Battery}
                                title="Recuperación"
                                unit="%"
                                size={160}
                                strokeWidth={14}
                            />

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 w-full text-center">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                    Disponibilidad del SNC
                                </p>
                            </div>
                        </IosCard>

                        {/* ANILLO ESFUERZO / STRAIN */}
                        <IosCard className="flex flex-col items-center justify-between relative text-center">
                            <div className="w-full flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Pilar 02</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40`}>
                                    {strainInfo.label}
                                </span>
                            </div>

                            <AppleRingGauge
                                value={strainInfo.val}
                                max={10}
                                colorClass={strainInfo.color}
                                strokeColor="#f43f5e"
                                gradientId="apple-ring-strain"
                                icon={Zap}
                                title="Carga Diaria"
                                size={160}
                                strokeWidth={14}
                            />

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 w-full text-center">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                    Impacto y fatiga acumulada
                                </p>
                            </div>
                        </IosCard>

                        {/* ANILLO SUEÑO */}
                        <IosCard className="flex flex-col items-center justify-between relative text-center">
                            <div className="w-full flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Pilar 03</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40`}>
                                    {sleepInfo.label}
                                </span>
                            </div>

                            <AppleRingGauge
                                value={wellnessMetrics?.latestSleepScore ?? '--'}
                                colorClass={sleepInfo.color}
                                strokeColor="#3b82f6"
                                gradientId="apple-ring-sleep"
                                icon={Moon}
                                title="Calidad Sueño"
                                unit="%"
                                size={160}
                                strokeWidth={14}
                            />

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 w-full text-center">
                                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                    {wellnessMetrics?.latestSleep || '--'} horas descansadas
                                </p>
                            </div>
                        </IosCard>
                    </div>

                    {/* BANCO DE ENERGÍA ESTILO BATERÍA APPLE */}
                    <IosCard className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950">
                        <div className="flex-1 space-y-2.5 w-full">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <BatteryCharging size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                        Banco de Energía
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                                        Nivel metabólico restante estimado para el día
                                    </p>
                                </div>
                            </div>

                            {/* Barra estilo batería de iPhone */}
                            <div className="w-full h-7 bg-slate-200/70 dark:bg-zinc-800/80 rounded-xl overflow-hidden p-1 relative shadow-inner">
                                <div
                                    className={`h-full rounded-lg transition-all duration-1000 ${
                                        energyBankAmount === '--' ? 'w-0' :
                                        energyBankAmount > 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                        energyBankAmount > 30 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                        'bg-gradient-to-r from-rose-500 to-red-400'
                                    }`}
                                    style={{ width: `${energyBankAmount !== '--' ? Math.max(4, energyBankAmount) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="sm:border-l border-slate-200/80 dark:border-zinc-800 sm:pl-6 text-center sm:text-right shrink-0">
                            <span className={`text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tighter ${
                                energyBankAmount === '--' ? 'text-slate-400' :
                                energyBankAmount > 60 ? 'text-emerald-500' :
                                energyBankAmount > 30 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                                {energyBankAmount !== '--' ? energyBankAmount : '--'}<span className="text-xl font-sans font-bold text-slate-400 ml-1">%</span>
                            </span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Disponible</span>
                        </div>
                    </IosCard>

                    {/* BIOMARCADORES CLAVE (CUADRÍCULA AGURPADA APPLE HEALTH INSET) */}
                    <div>
                        <p className="ios-header mb-3">Biomarcadores Clave</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                            {/* FC Reposo */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">FC Reposo</span>
                                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <Activity size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                                            {wellnessMetrics?.latestRhr !== '--' ? Math.round(wellnessMetrics?.latestRhr) : '--'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">lpm</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        Base: {wellnessMetrics?.baselineRhr !== '--' ? Math.round(wellnessMetrics?.baselineRhr) : '--'}
                                    </span>
                                </div>
                            </div>

                            {/* VFC / HRV */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">VFC Anoche</span>
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <Zap size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                            wellnessMetrics?.hrvStatus === 'unbalanced' ? 'text-amber-500' : 'text-emerald-500'
                                        }`}>
                                            {wellnessMetrics?.latestHrv || '--'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">ms</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        7d: {wellnessMetrics?.avgHrv7d || '--'} ms
                                    </span>
                                </div>
                            </div>

                            {/* Sueño Horas */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Sueño</span>
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                        <Moon size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                                            {wellnessMetrics?.latestSleep || '--'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">h</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        Score: {wellnessMetrics?.latestSleepScore ?? '--'}%
                                    </span>
                                </div>
                            </div>

                            {/* Forma TSB */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Forma TSB</span>
                                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                        <ActivitySquare size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                            typeof wellnessMetrics?.currentTsb !== 'number' ? 'text-slate-400' :
                                            wellnessMetrics.currentTsb < -25 ? 'text-rose-500' :
                                            wellnessMetrics.currentTsb < -10 ? 'text-amber-500' :
                                            wellnessMetrics.currentTsb > 5 ? 'text-blue-500' : 'text-emerald-500'
                                        }`}>
                                            {typeof wellnessMetrics?.currentTsb === 'number' ? (wellnessMetrics.currentTsb > 0 ? '+' : '') + Math.round(wellnessMetrics.currentTsb) : '--'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        Equilibrio fatiga
                                    </span>
                                </div>
                            </div>

                            {/* Pasos */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Pasos</span>
                                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                        <Footprints size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                                            {typeof wellnessMetrics?.latestSteps === 'number'
                                                ? wellnessMetrics.latestSteps.toLocaleString('es-ES')
                                                : (wellnessMetrics?.latestSteps && wellnessMetrics.latestSteps !== '--' ? wellnessMetrics.latestSteps : '--')}
                                        </span>
                                    </div>
                                    {typeof wellnessMetrics?.latestSteps === 'number' && wellnessMetrics.latestSteps > 0 && (
                                        <div className="w-full mt-2 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (wellnessMetrics.latestSteps / 10000) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SpO2 */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">SpO₂ Oxígeno</span>
                                    <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                                        <Wind size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                            typeof wellnessMetrics?.latestSpo2 !== 'number' ? 'text-slate-400' :
                                            wellnessMetrics.latestSpo2 >= 95 ? 'text-sky-500' : 'text-amber-500'
                                        }`}>
                                            {typeof wellnessMetrics?.latestSpo2 === 'number' ? wellnessMetrics.latestSpo2.toFixed(0) : '--'}
                                        </span>
                                        {typeof wellnessMetrics?.latestSpo2 === 'number' && <span className="text-[10px] font-bold text-slate-400">%</span>}
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        Saturación
                                    </span>
                                </div>
                            </div>

                            {/* VO2 Max */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">VO₂ Max</span>
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <TrendingUp size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                                            {typeof wellnessMetrics?.latestVo2max === 'number' ? wellnessMetrics.latestVo2max.toFixed(1) : '--'}
                                        </span>
                                        {typeof wellnessMetrics?.latestVo2max === 'number' && <span className="text-[10px] font-bold text-slate-400">ml/kg</span>}
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">
                                        Capacidad aeróbica
                                    </span>
                                </div>
                            </div>

                            {/* Peso */}
                            <div className="ios-card ios-touch p-3.5 sm:p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Peso</span>
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                        <Scale size={13} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                                            {wellnessMetrics?.latestWeight && wellnessMetrics.latestWeight !== '--' ? wellnessMetrics.latestWeight : '--'}
                                        </span>
                                        {wellnessMetrics?.latestWeight && wellnessMetrics.latestWeight !== '--' && <span className="text-[10px] font-bold text-slate-400">kg</span>}
                                    </div>
                                    {wellnessMetrics?.weightTrend != null ? (
                                        <span className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${
                                            wellnessMetrics.weightTrend < -0.1 ? 'text-emerald-500' :
                                            wellnessMetrics.weightTrend > 0.1 ? 'text-rose-500' : 'text-slate-400'
                                        }`}>
                                            {wellnessMetrics.weightTrend < -0.1 ? <TrendingDown size={11} /> :
                                             wellnessMetrics.weightTrend > 0.1 ? <TrendingUp size={11} /> : <Minus size={11} />}
                                            {wellnessMetrics.weightTrend > 0 ? '+' : ''}{wellnessMetrics.weightTrend} kg (7d)
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block">Estable</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FACTORES CLAVE / INSIGHTS */}
                    {Array.isArray(wellnessMetrics?.insights) && wellnessMetrics.insights.length > 0 && (
                        <div>
                            <p className="ios-header mb-3">Aspectos Destacados</p>
                            <div className="space-y-2.5">
                                {wellnessMetrics.insights.map((insight, idx) => {
                                    const isDanger = insight.type === 'danger';
                                    const isWarning = insight.type === 'warning';
                                    return (
                                        <div key={idx} className="ios-card p-3.5 sm:p-4 flex items-start gap-3.5">
                                            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                                isDanger ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' :
                                                isWarning ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
                                                'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                            }`}>
                                                {isDanger ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {insight.label}
                                                </h4>
                                                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">
                                                    {insight.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VISTA 2: HISTORIAL DIARIO (ESTILO SALUD DE APPLE) */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    
                    {/* SELECTOR DE RANGO DEL HISTORIAL */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <p className="ios-header">Registro Histórico</p>
                            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                                Evolución diaria y biometrías día a día
                            </span>
                        </div>

                        <div className="flex items-center p-1 bg-slate-200/70 dark:bg-zinc-800/80 rounded-xl gap-1">
                            {[
                                { days: 7, label: '7D' },
                                { days: 14, label: '14D' },
                                { days: 30, label: '30D' }
                            ].map(r => (
                                <button
                                    key={r.days}
                                    type="button"
                                    onClick={() => setHistoryRange(r.days)}
                                    className={`py-1 px-3 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                                        historyRange === r.days
                                            ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TIRA DE DÍAS ESTILO CALENDARIO APPLE HEALTH */}
                    <div className="ios-card p-3 sm:p-4 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-0.5">
                            {historySeries.map((d) => {
                                const isSelected = currentSelectedDay?.date === d.date;
                                return (
                                    <button
                                        key={d.date}
                                        type="button"
                                        onClick={() => setSelectedDate(d.date)}
                                        className={`shrink-0 flex flex-col items-center justify-between w-14 sm:w-16 py-2.5 px-1 rounded-2xl transition-all select-none active:scale-95 ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-slate-100/80 dark:bg-zinc-800/60 hover:bg-slate-200/80 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                                            {d.weekday}
                                        </span>
                                        <span className="text-base sm:text-lg font-black font-mono tabular-nums my-0.5">
                                            {d.dayNum}
                                        </span>
                                        {/* Punto indicador de recuperación */}
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : d.recoveryInfo.dot}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* SPOTLIGHT DEL DÍA SELECCIONADO (ESTILO APPLE HEALTH INSPECTOR) */}
                    {currentSelectedDay && (
                        <IosCard className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                        Detalle del Día
                                    </span>
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
                                        {currentSelectedDay.dateLabelFull}
                                    </h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentSelectedDay.recoveryInfo.badge}`}>
                                    Recuperación {currentSelectedDay.readinessScore}% • {currentSelectedDay.recoveryInfo.label}
                                </span>
                            </div>

                            {/* Cuadrícula de Métricas de ese día */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                        Sueño
                                    </span>
                                    <span className="text-lg font-black font-mono tabular-nums text-blue-500">
                                        {currentSelectedDay.sleep ? `${currentSelectedDay.sleep} h` : '--'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Score: {currentSelectedDay.sleepScore ? `${currentSelectedDay.sleepScore}%` : '--'}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                        VFC
                                    </span>
                                    <span className="text-lg font-black font-mono tabular-nums text-emerald-500">
                                        {currentSelectedDay.hrv ? `${currentSelectedDay.hrv} ms` : '--'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Media 7d: {currentSelectedDay.hrv7dAvg || '--'} ms
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                        FC Reposo
                                    </span>
                                    <span className="text-lg font-black font-mono tabular-nums text-rose-500">
                                        {currentSelectedDay.rhr ? `${currentSelectedDay.rhr} lpm` : '--'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Media 7d: {currentSelectedDay.rhr7dAvg || '--'} lpm
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                        Estrés / Pasos
                                    </span>
                                    <span className="text-lg font-black font-mono tabular-nums text-purple-500">
                                        {currentSelectedDay.stress != null ? `${currentSelectedDay.stress}%` : (currentSelectedDay.steps ? `${Math.round(currentSelectedDay.steps / 1000)}k` : '--')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        {currentSelectedDay.steps ? `${Number(currentSelectedDay.steps).toLocaleString('es-ES')} pasos` : 'Nivel estrés'}
                                    </span>
                                </div>
                            </div>
                        </IosCard>
                    )}

                    {/* GRÁFICO DE EVOLUCIÓN HISTÓRICA DE RECUPERACIÓN */}
                    <IosCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    Tendencia de Recuperación Diaria
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                                    Puntuación de recuperación (%) y descanso a lo largo del periodo
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-emerald-500">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Recuperación
                                </span>
                                <span className="flex items-center gap-1 text-blue-500">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Sueño (h)
                                </span>
                            </div>
                        </div>

                        <div className="h-48 sm:h-56 w-full -ml-3 sm:ml-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={historySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" dark:stroke="#27272a" vertical={false} opacity={0.6} />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 12]} hide />
                                    <RechartsTooltip content={<HistoryChartTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#71717a', opacity: 0.5 }} isAnimationActive={false} />
                                    
                                    <Bar yAxisId="left" dataKey="readinessScore" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} opacity={0.85} />
                                    <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </IosCard>

                    {/* LISTA AGRUPADA DÍA A DÍA (ESTILO REGISTRO APPLE HEALTH) */}
                    <div>
                        <p className="ios-header mb-3">Registros Diarios Detallados</p>
                        <div className="ios-card overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 p-0">
                            {historyReversed.map((day) => {
                                const isSelected = currentSelectedDay?.date === day.date;
                                return (
                                    <button
                                        key={day.date}
                                        type="button"
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`w-full p-3.5 sm:p-4 text-left flex items-center justify-between transition-colors ${
                                            isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${day.recoveryInfo.dot}`} />
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize truncate">
                                                    {day.dateLabelFull}
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                    {day.recoveryInfo.label} • {day.sleep ? `${day.sleep}h sueño` : 'Sin sueño registrado'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <span className={`text-sm sm:text-base font-black font-mono tabular-nums ${day.recoveryInfo.color}`}>
                                                    {day.readinessScore}%
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 tabular-nums">
                                                    {day.rhr > 0 && <span>{day.rhr} lpm</span>}
                                                    {day.hrv > 0 && <span>{day.hrv} ms</span>}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 dark:text-zinc-600" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};
