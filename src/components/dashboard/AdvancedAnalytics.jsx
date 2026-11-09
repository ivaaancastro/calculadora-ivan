/* eslint-disable no-unused-vars */

import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart, ScatterChart, Scatter, ReferenceLine, ReferenceArea
} from 'recharts';
import {
    Activity, Heart, CalendarDays, BarChart2, Target, MousePointer2, TrendingUp, Trophy, AlertTriangle,
    Battery, Brain, Moon, Info, Activity as ActivityPulse, Loader2, Sparkles, Coffee, AlertOctagon,
    ArrowUpRight, ArrowDownRight, Zap, TrendingDown, Wifi
} from 'lucide-react';
import { 
    estimateFTP, estimateCyclingVO2max, estimateRunningVO2max, predictRaceTimes, 
    calculateTrainingEffect, analyzePowerProfile, calculateDanielsPaces 
} from '../../utils/fitnessStatsEngine';
import { SPORT_LOAD_CONFIG, getSportCategory } from '../../utils/tssEngine';
import { EvolutionChart } from './EvolutionChart';
import { InfoTooltip } from '../common/InfoTooltip';
import { supabase } from '../../supabase';
import { useTheme } from '../../hooks/useTheme';
import { Card, SectionHeader } from '../ui';

const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200];
// const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };
// const formatPace = (decimalMinutes) => { if (!decimalMinutes || decimalMinutes >= 20) return '>20:00'; const mins = Math.floor(decimalMinutes); const secs = Math.round((decimalMinutes - mins) * 60); return `${mins}:${secs.toString().padStart(2, '0')}`; };
// const getMonday = (d) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Aeróbico', 'Z3 Tempo', 'Z4 SubUmbral', 'Z5 SupraUmbral', 'Z6 VO2Max', 'Z7 Anaeróbico'];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: load the latest wellness row from Supabase (written by useIntervalsSync)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchLatestWellnessRow() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        const { data } = await supabase
            .from('wellness_data')
            .select('vo2max, ctl, atl, resting_hr, weight')
            .eq('user_id', session.user.id)
            .not('vo2max', 'is', null)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
        return data || null;
    } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// currentMetrics — comes from useActivities (single source of truth for CTL/ATL)
//   { ctl, atl, tcb (=TSB), rampRate, acwr, monotony, strain, avgTss7d, pastCtl }
// chartData — daily series from useActivities, already filtered by timeRange
// ─────────────────────────────────────────────────────────────────────────────
export const AdvancedAnalytics = React.memo(({ activities, settings,  timeRange, setTimeRange, chartData, currentMetrics }) => {
    const [garminVo2max, setGarminVo2max] = useState(null);
    const { theme } = useTheme();

    // Load Garmin VO2max from Supabase wellness_data (synced from Intervals.icu)
    useEffect(() => {
        fetchLatestWellnessRow().then(row => {
            if (row?.vo2max) setGarminVo2max(Number(Number(row.vo2max).toFixed(1)));
        });
    }, []);

    // ── ANALYTICS MEMO: MMP peaks, zones, EF, weekly volume, profile ─────────
    // NOTE: CTL/ATL/TSB are NOT calculated here — they come from currentMetrics
    //       (single source of truth via useActivities with Intervals.icu formula)
    const analytics = useMemo(() => {
        const today = new Date();
        const date30d = new Date(today); date30d.setDate(today.getDate() - 30);

        let totalVolume = 0; let totalActivities30d = 0;
        const sortedActivities = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedActivities.forEach(a => {
            if (new Date(a.date) >= date30d) { totalVolume += (a.duration || 0); totalActivities30d++; }
        });

        // VO2 Max — estimated from activity data, overridden by Garmin if available
        const runVo2Result = estimateRunningVO2max(sortedActivities, settings);
        const bikeVo2Result = estimateCyclingVO2max(sortedActivities, settings);

        return {
            vo2Max: {
                run: runVo2Result,
                bike: bikeVo2Result,
            },
            totalVolume,
            totalActivities30d,
        };
    }, [activities, settings]);

    // ── MODEL: read directly from currentMetrics (useActivities = single source of truth) ──
    // This guarantees that every place showing CTL/ATL/TSB shows the exact same value
    const model = useMemo(() => {
        if (!currentMetrics) return { ctl: 0, atl: 0, tsb: 0, acwr: 0, rampRate: 0, monotony: 0, strain: 0, loadTrend: 0, totalActivities: 0, totalVolume: 0 };
        const { ctl, atl, tcb: tsb, rampRate, acwr, monotony, strain, pastCtl } = currentMetrics;
        const loadTrend = pastCtl > 0 ? ((ctl - pastCtl) / pastCtl) * 100 : 0;
        return {
            ctl: ctl || 0,
            atl: atl || 0,
            tsb: tsb || 0,
            acwr: acwr || 0,
            rampRate: rampRate || 0,
            monotony: monotony || 0,
            strain: strain || 0,
            loadTrend,
            totalActivities: analytics.totalActivities30d || 0,
            totalVolume: analytics.totalVolume || 0,
        };
    }, [currentMetrics, analytics]);

    // Primary VO2max: Priority Bike > Garmin > Run
    const globalMaxVo2 = analytics.vo2Max.bike.vo2max 
        ? analytics.vo2Max.bike.vo2max
        : (garminVo2max || analytics.vo2Max.run.vo2max || 0);
    const vo2IsGarmin = !!garminVo2max;

    if (!activities || activities.length === 0) return null;

    const fitnessStatus = (() => {
        const tsb = model.tsb;
        if (tsb > 25) return { label: 'Transición', desc: 'Pérdida de forma por descanso', badge: 'text-body-soft bg-fill-3 border-line-muted-2' };
        if (tsb >= 5) return { label: 'Pico de Forma', desc: 'Fresco y listo para competir al máximo', badge: 'text-form-peak bg-form-peak-tint border-form-peak/25' };
        if (tsb >= -10) return { label: 'Zona Productiva', desc: 'Balance óptimo entre carga y adaptación', badge: 'text-form-productive bg-form-productive-tint border-form-productive/25' };
        if (tsb >= -30) return { label: 'Sobrecarga', desc: 'Fatiga alta, programa recuperación', badge: 'text-form-overload bg-form-overload-tint border-form-overload/25' };
        return { label: 'Fatiga Crítica', desc: 'Riesgo de sobreentrenamiento', badge: 'text-form-critical bg-form-critical-tint border-form-critical/25' };
    })();

    return (
        <div className="space-y-6 sm:space-y-8 pb-8">
            {/* HERO: ESTADO DE FORMA ESTILO APPLE FITNESS */}
            <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <ActivityPulse size={20} strokeWidth={2.3} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                                Estado de Forma
                            </h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fitnessStatus.badge} uppercase tracking-wider`}>
                                {fitnessStatus.label}
                            </span>
                        </div>
                        <p className="text-xs text-ink-3 mt-0.5">
                            {fitnessStatus.desc}
                        </p>
                    </div>
                </div>

                {/* Apple Segmented Control para Rango de Tiempo - En Desktop permanece en la cabecera */}
                <div className="hidden md:flex items-center self-end sm:self-center w-auto">
                    <div className="flex bg-fill-6 p-1 rounded-full backdrop-blur-md w-auto justify-start shadow-xs">
                        {[
                            { id: "7d", label: "7D" },
                            { id: "30d", label: "30D" },
                            { id: "90d", label: "3M" },
                            { id: "all", label: "Todo" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeRange(t.id)}
                                className={`px-3.5 py-1 min-h-[30px] text-xs font-semibold transition-all rounded-full select-none touch-manipulation active:scale-95 ${timeRange === t.id
                                    ? "bg-surface-4 text-ink shadow-xs font-bold"
                                    : "text-ink-3 hover:text-ink-2-soft"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* SECCIÓN 1: MÉTRICAS CLAVE (APPLE HEALTH CARDS) */}
            <div>
                <SectionHeader as="p">Fisiología y Carga</SectionHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Fitness (CTL) */}
                    <Card pressable className="p-3.5 sm:p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-ink-3">Fitness (CTL)</span>
                            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Activity size={15} strokeWidth={2.3} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
                                {Math.round(model.ctl)}
                            </div>
                            <span className="text-[10px] font-medium text-ink-4">
                                {model.loadTrend >= 0 ? '+' : ''}{model.loadTrend.toFixed(1)}% vs 28d
                            </span>
                        </div>
                    </Card>

                    {/* Fatiga (ATL) */}
                    <Card pressable className="p-3.5 sm:p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-ink-3">Fatiga (ATL)</span>
                            <div className="w-7 h-7 rounded-xl bg-[#FA114F]/10 text-[#FA114F] flex items-center justify-center">
                                <Battery size={15} strokeWidth={2.3} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
                                {Math.round(model.atl)}
                            </div>
                            <span className="text-[10px] font-medium text-ink-4">
                                Carga últ. 7 días
                            </span>
                        </div>
                    </Card>

                    {/* Forma (TSB) */}
                    <Card pressable className="p-3.5 sm:p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-ink-3">Forma (TSB)</span>
                            <div className="w-7 h-7 rounded-xl bg-[#30D158]/10 text-[#30D158] flex items-center justify-center">
                                <Zap size={15} strokeWidth={2.3} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
                                {(model.tsb > 0 ? '+' : '') + Math.round(model.tsb)}
                            </div>
                            <span className="text-[10px] font-medium text-ink-4">
                                Balance CTL / ATL
                            </span>
                        </div>
                    </Card>

                    {/* Ratio Carga (ACWR) */}
                    <Card pressable className="p-3.5 sm:p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-ink-3">Ratio Carga</span>
                            <div className="w-7 h-7 rounded-xl bg-[#FF9F0A]/10 text-[#FF9F0A] flex items-center justify-center">
                                <Target size={15} strokeWidth={2.3} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
                                {model.acwr.toFixed(2)}
                            </div>
                            <span className="text-[10px] font-medium text-ink-4">
                                Aguda vs Crónica
                            </span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN 2: MÉTRICAS SECUNDARIAS */}
            <div>
                <SectionHeader as="p">Tendencia y Capacidad</SectionHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {[
                        { label: 'Rampa Semanal', value: `${model.rampRate > 0 ? '+' : ''}${model.rampRate.toFixed(1)}`, icon: model.rampRate >= 0 ? ArrowUpRight : ArrowDownRight, color: 'text-indigo-500', bg: 'bg-indigo-500/10', sub: 'pts/sem' },
                        { label: 'Monotonía', value: model.monotony.toFixed(2), icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: 'Índice carga' },
                        { label: 'Volumen 30D', value: `${Math.round(model.totalVolume / 60)}h`, icon: CalendarDays, color: 'text-cyan-500', bg: 'bg-cyan-500/10', sub: `${model.totalActivities} sesiones` },
                        { label: 'VO2 Max', value: globalMaxVo2 || '--', icon: TrendingUp, color: 'text-vo2', bg: 'bg-vo2/10', sub: vo2IsGarmin ? 'Sincronizado' : 'Estimado' }
                    ].map((kpi, i) => (
                        <Card pressable key={i} className="p-3 sm:p-3.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-semibold text-ink-3">{kpi.label}</span>
                                <div className={`w-6 h-6 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                                    <kpi.icon size={13} strokeWidth={2.2} />
                                </div>
                            </div>
                            <div>
                                <span className="text-lg sm:text-xl font-bold tracking-tight text-ink tabular-nums">
                                    {kpi.value}
                                </span>
                                {kpi.sub && (
                                    <p className="text-[9px] font-medium text-ink-4 truncate">
                                        {kpi.sub}
                                    </p>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 3: GRÁFICA DE EVOLUCIÓN (PMC) */}
            <div>
                <SectionHeader as="p">Evolución de Rendimiento</SectionHeader>
                <Card className="p-3 sm:p-5">
                    <div className="h-[290px] sm:h-[330px]">
                        <EvolutionChart data={chartData} timeRange={timeRange} setTimeRange={setTimeRange} />
                    </div>
                </Card>
            </div>
        </div>
    );
});