/* eslint-disable no-unused-vars */

import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart, ScatterChart, Scatter, ReferenceLine, ReferenceArea
} from 'recharts';
import {
    Activity, Heart, CalendarDays, BarChart2, Target, MousePointer2, TrendingUp, Trophy, AlertTriangle,
    Battery, Brain, Moon, Info, Activity as ActivityPulse, Loader2, Sparkles, Coffee, AlertOctagon,
    ArrowUpRight, ArrowDownRight, Zap, TrendingDown, Wifi, ChevronDown
} from 'lucide-react';
import { 
    estimateFTP, estimateCyclingVO2max, estimateRunningVO2max, predictRaceTimes, 
    calculateTrainingEffect, analyzePowerProfile, calculateDanielsPaces 
} from '../../utils/fitnessStatsEngine';
import { SPORT_LOAD_CONFIG, getSportCategory } from '../../utils/tssEngine';
import { EvolutionChart } from './EvolutionChart';
import { FormHero } from './FormHero';
import { KpiCard } from './KpiCard';
import { useChartTheme } from '../charts/useChartTheme';
import { seriesValues, deltaOver, acwrZone } from '../../utils/kpiTrend';
import { buildFormSummary } from '../../utils/formSummary';
import { supabase } from '../../supabase';
import { useTheme } from '../../hooks/useTheme';
import { ChartSkinProvider } from '../charts/ChartSkin';
import { getChartTheme } from '../charts/chartTheme';
import { Card, SectionHeader, StatTile } from '../ui';

const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200];
// const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };
// const formatPace = (decimalMinutes) => { if (!decimalMinutes || decimalMinutes >= 20) return '>20:00'; const mins = Math.floor(decimalMinutes); const secs = Math.round((decimalMinutes - mins) * 60); return `${mins}:${secs.toString().padStart(2, '0')}`; };
// const getMonday = (d) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
const ZONE_COLORS = getChartTheme('light').zones.all;
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
    // Solo v2 en móvil: las métricas secundarias van plegadas bajo el primer vistazo.
    const [showMore, setShowMore] = useState(false);
    const { theme } = useTheme();
    const isV2 = true; // v2 por defecto (Capa 6); las ramas v1 se retiran en los PR 5a–c
    const ct = useChartTheme();

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

    const atlVals = seriesValues(chartData, 'atl');
    const tsbVals = seriesValues(chartData, 'tcb');
    const atlSpark = atlVals;
    const tsbSpark = tsbVals;
    const fmtDelta = (d, digits = 0) => `${d > 0 ? '+' : ''}${d.toFixed(digits)}`;
    const mkDelta = (vals, upTone, downTone) => {
        const d = deltaOver(vals, 7);
        if (d === null) return null;
        const r = Math.round(d);
        return { value: r, text: `${fmtDelta(r)} 7d`, tone: r > 0 ? upTone : r < 0 ? downTone : 'flat' };
    };
    const atlDelta = mkDelta(atlVals, 'warn', 'good');
    const tsbDelta = mkDelta(tsbVals, 'good', 'bad');
    const acwrInfo = acwrZone(model.acwr);
    const ACWR_CHIP = {
        neutral: 'text-body-soft bg-fill-3 border-line-muted-2',
        peak: 'text-form-peak bg-form-peak-tint border-form-peak/25',
        overload: 'text-form-overload bg-form-overload-tint border-form-overload/25',
        critical: 'text-form-critical bg-form-critical-tint border-form-critical/25',
    };

    return (
        <ChartSkinProvider skin={isV2 ? 'v2' : 'v1'}>
        <div data-skin="dashboard" data-dash="root" className="space-y-6 sm:space-y-8 pb-8">
            {/* HERO: ESTADO DE FORMA ESTILO APPLE FITNESS */}
            {isV2 ? (
                <FormHero
                    summary={buildFormSummary(model)}
                    ctl={model.ctl}
                    loadTrend={model.loadTrend}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                />
            ) : (
            <Card data-dash="hero" className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            )}

            {/* SECCIÓN 1: MÉTRICAS CLAVE (APPLE HEALTH CARDS) */}
            <div data-dash="primary">
                <SectionHeader as="p">Fisiología y Carga</SectionHeader>
                {isV2 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <KpiCard
                            label="Fatiga (ATL)" icon={Battery} color={ct.series.atl}
                            value={Math.round(model.atl)} format={(n) => String(Math.round(n))}
                            delta={atlDelta} spark={atlSpark} sub="Carga últ. 7 días"
                        />
                        <KpiCard
                            label="Forma (TSB)" icon={Zap} color={ct.series.tsb}
                            value={Math.round(model.tsb)} format={(n) => (Math.round(n) > 0 ? '+' : '') + Math.round(n)}
                            delta={tsbDelta} spark={tsbSpark} sub="Balance CTL / ATL"
                        />
                        <KpiCard
                            className="col-span-2 md:col-span-1"
                            label="Ratio Carga" icon={Target} color={ct.series.tsb}
                            value={model.acwr} format={(n) => n.toFixed(2)}
                            sub={`Aguda vs Crónica · óptimo 0,8–1,3`}
                            chip={<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${ACWR_CHIP[acwrInfo.tone]}`}>{acwrInfo.label}</span>}
                        />
                    </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Fitness (CTL) */}
                    <StatTile size="lg" label="Fitness (CTL)" icon={Activity} iconTone="ctl" value={Math.round(model.ctl)} sub={`${model.loadTrend >= 0 ? '+' : ''}${model.loadTrend.toFixed(1)}% vs 28d`} />

                    {/* Fatiga (ATL) */}
                    <StatTile size="lg" label="Fatiga (ATL)" icon={Battery} iconTone="atl" value={Math.round(model.atl)} sub="Carga últ. 7 días" />

                    {/* Forma (TSB) */}
                    <StatTile size="lg" label="Forma (TSB)" icon={Zap} iconTone="tsb" value={(model.tsb > 0 ? '+' : '') + Math.round(model.tsb)} sub="Balance CTL / ATL" />

                    {/* Ratio Carga (ACWR) */}
                    <StatTile size="lg" label="Ratio Carga" icon={Target} iconTone="acwr" value={model.acwr.toFixed(2)} sub="Aguda vs Crónica" />
                </div>
                )}
            </div>

            {/* SECCIÓN 2: MÉTRICAS SECUNDARIAS */}
            <div data-dash="secondary">
                <SectionHeader as="p" data-dash="secondary-title">Tendencia y Capacidad</SectionHeader>
                {isV2 && (
                    <button
                        type="button"
                        data-dash="more-toggle"
                        aria-expanded={showMore}
                        aria-controls="dash-secondary-grid"
                        onClick={() => setShowMore((v) => !v)}
                        className="md:hidden w-full min-h-[44px] px-4 flex items-center justify-between rounded-xl border border-line bg-surface text-xs font-semibold text-ink-3 touch-manipulation"
                    >
                        <span>Tendencia y capacidad</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-ink-4">
                            {showMore ? 'Ocultar' : 'Rampa, monotonía, volumen, VO2'}
                            <ChevronDown size={14} className={showMore ? 'rotate-180' : ''} />
                        </span>
                    </button>
                )}
                <div id="dash-secondary-grid" data-dash="secondary-grid" data-open={showMore ? 'true' : 'false'} className={isV2 ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8' : 'grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3'}>
                    {[
                        { label: 'Rampa Semanal', value: `${model.rampRate > 0 ? '+' : ''}${model.rampRate.toFixed(1)}`, icon: model.rampRate >= 0 ? ArrowUpRight : ArrowDownRight, tone: 'ramp', sub: 'pts/sem' },
                        { label: 'Monotonía', value: model.monotony.toFixed(2), icon: Brain, tone: 'monotony', sub: 'Índice carga' },
                        { label: 'Volumen 30D', value: `${Math.round(model.totalVolume / 60)}h`, icon: CalendarDays, tone: 'volume', sub: `${model.totalActivities} sesiones` },
                        { label: 'VO2 Max', value: globalMaxVo2 || '--', icon: TrendingUp, tone: 'vo2', sub: vo2IsGarmin ? 'Sincronizado' : 'Estimado' }
                    ].map((kpi, i) => (
                        isV2 ? (
                            <div key={i} data-dash="ledger-row" className="flex items-baseline justify-between gap-3 py-3 border-b border-hairline min-w-0">
                                <span className="text-[11px] font-medium text-ink-4 truncate">{kpi.label}<span className="ml-1.5 text-ink-4/70">{kpi.sub}</span></span>
                                <span className="text-[15px] font-semibold tabular-nums text-ink shrink-0">{kpi.value}</span>
                            </div>
                        ) : (
                            <StatTile key={i} size="sm" label={kpi.label} icon={kpi.icon} iconTone={kpi.tone} value={kpi.value} sub={kpi.sub} />
                        )
                    ))}
                </div>
            </div>

            {/* SECCIÓN 3: GRÁFICA DE EVOLUCIÓN (PMC) */}
            <div data-dash="chart">
                <SectionHeader as="p">Evolución de Rendimiento</SectionHeader>
                <Card className="p-3 sm:p-5">
                    <div data-dash="chart-body" className="h-[290px] sm:h-[330px]">
                        <EvolutionChart data={chartData} timeRange={timeRange} setTimeRange={setTimeRange} />
                    </div>
                </Card>
            </div>
        </div>
        </ChartSkinProvider>
    );
});
