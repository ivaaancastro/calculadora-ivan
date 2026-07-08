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

    return (
        <div className="space-y-12 pb-12">
            {/* ZONA 1: CARGA Y RENDIMIENTO (PMC) */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                            Carga y Rendimiento
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Evolución de fitness, fatiga y forma · Fórmula Intervals.icu
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-md p-1 rounded-lg">
                            {[
                                { id: "7d", label: "7D" },
                                { id: "30d", label: "30D" },
                                { id: "90d", label: "3M" },
                                { id: "all", label: "Todo" },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeRange(t.id)}
                                    className={`px-3 py-1 text-xs font-medium transition-all rounded-md ${timeRange === t.id
                                        ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow hover:shadow-md"
                                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Fitness (CTL)', value: Math.round(model.ctl), icon: Activity, color: 'text-slate-700 dark:text-zinc-300', sub: `${model.loadTrend >= 0 ? '+' : ''}${model.loadTrend.toFixed(1)}% vs 28d`, tip: "Nivel de condición física basado en los últimos 42 días." },
                        { label: 'Fatiga (ATL)', value: Math.round(model.atl), icon: Battery, color: 'text-slate-700 dark:text-zinc-300', sub: 'Carga últ. 7 días', tip: "Cansancio acumulado." },
                        { label: 'Forma (TSB)', value: (model.tsb > 0 ? '+' : '') + Math.round(model.tsb), icon: Zap, color: 'text-slate-700 dark:text-zinc-300', sub: 'Balance Nivel/Fatiga', tip: "Forma actual." },
                        { label: 'Ratio Carga (ACWR)', value: model.acwr.toFixed(2), icon: Target, color: 'text-slate-700 dark:text-zinc-300', sub: 'Aguda vs Crónica', tip: "Relación ATL/CTL." },
                        { label: 'Rampa Semanal', value: `${model.rampRate > 0 ? '+' : ''}${model.rampRate.toFixed(1)}`, icon: model.rampRate >= 0 ? ArrowUpRight : ArrowDownRight, color: 'text-slate-500 dark:text-zinc-400', sub: 'pts/sem', tip: "Cuánto sube tu CTL." },
                        { label: 'Monotonía', value: model.monotony.toFixed(2), icon: Brain, color: 'text-slate-500 dark:text-zinc-400', sub: 'Índice', tip: "Variedad de la carga." },
                        { label: 'Volumen 30D', value: `${Math.round(model.totalVolume / 60)}h`, icon: CalendarDays, color: 'text-slate-500 dark:text-zinc-400', sub: `${model.totalActivities} actos`, tip: "Horas totales." },
                        { label: 'VO2 Max (Top)', value: globalMaxVo2 || '--', icon: TrendingUp, color: 'text-slate-500 dark:text-zinc-400', sub: vo2IsGarmin ? 'Garmin Sync' : 'Estimado', tip: "Mejor valor de VO2max." }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-transparent border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between group transition-colors hover:border-slate-300 dark:hover:border-zinc-700">
                            <div className="flex items-center justify-between mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5">
                                    <kpi.icon size={12} className={kpi.color} strokeWidth={2} />
                                    <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{kpi.label}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-medium tracking-tight text-slate-800 dark:text-zinc-200">{kpi.value}</span>
                                {kpi.sub && <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500">{kpi.sub}</span>}
                            </div>
                        </div>
                    ))}
                </div>


                <div className="bg-[#f8fafc] dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-inner">
                    <div className="h-[300px]">
                        <EvolutionChart data={chartData} />
                    </div>
                </div>
            </div>
        </div>
    );
});