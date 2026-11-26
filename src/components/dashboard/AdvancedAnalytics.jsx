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
import { getChartTheme } from '../charts/chartTheme';
import { Card, SectionHeader, Segmented, Stat } from '../ui';
import { pmcTodayKey } from '../../utils/pmcPoints';
import { formatNumber } from '../../utils/formatters';
import { pickPrimaryVo2, VO2_SOURCES } from '../../utils/vo2Source';

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
export const AdvancedAnalytics = React.memo(({ activities, settings, timeRange, setTimeRange, chartData, pmcSeries, periodSummary, currentMetrics }) => {
    const [garminVo2max, setGarminVo2max] = useState(null);
    // En móvil, las métricas secundarias van plegadas bajo el primer vistazo.
    const [showMore, setShowMore] = useState(false);
    const { theme } = useTheme();
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

    // VO₂max principal con su origen (COP-2): ciclismo estimado > dispositivo > carrera estimada.
    const primaryVo2 = pickPrimaryVo2({ bike: analytics.vo2Max.bike.vo2max, device: garminVo2max, run: analytics.vo2Max.run.vo2max });

    if (!activities || activities.length === 0) return null;

    // Los KPI son valores de hoy: su sparkline y su variación salen de la serie completa hasta
    // hoy, no del rango de la gráfica ni de los días proyectados (RF-D3).
    const todayKey = pmcTodayKey();
    const pastSeries = (pmcSeries || chartData || []).filter((d) => String(d.date) <= todayKey);
    const atlVals = seriesValues(pastSeries, 'atl');
    const tsbVals = seriesValues(pastSeries, 'tsb');
    const fmtDelta = (d, digits = 0) => `${d > 0 ? '+' : ''}${formatNumber(d, digits)}`;
    const mkDelta = (vals, upTone, downTone) => {
        const d = deltaOver(vals, 7);
        if (d === null) return null;
        const r = Math.round(d);
        return { value: r, text: fmtDelta(r), label: 'en 7 días', tone: r > 0 ? upTone : r < 0 ? downTone : 'flat' };
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

    // Tendencia y capacidad: sin dato no hay fila (RF-D6).
    const ledger = [
        { label: 'Rampa', metric: 'ramp', value: `${model.rampRate > 0 ? '+' : ''}${formatNumber(model.rampRate, 1)}`, sub: 'pts/sem' },
        model.monotony > 0 && { label: 'Monotonía', value: formatNumber(model.monotony, 2), sub: 'índice de carga' },
        primaryVo2.value && { label: primaryVo2.source ? VO2_SOURCES[primaryVo2.source].label : 'VO₂max', metric: 'vo2max', value: formatNumber(primaryVo2.value, 1), sub: primaryVo2.source ? VO2_SOURCES[primaryVo2.source].source : '' },
    ].filter(Boolean);

    return (
        <div data-dash="root" className="max-w-content mx-auto max-sm:px-4 pb-8 flex flex-col gap-section md:gap-section-lg lg:grid lg:grid-cols-12 lg:gap-x-12 lg:[&>*]:min-w-0">
            {/* 1. La pregunta principal: ¿cómo estoy? El CTL, protagonista (RF-D2). */}
            <FormHero
                className="pt-6 lg:col-span-7 lg:row-start-1"
                summary={buildFormSummary(model)}
                ctl={model.ctl}
                loadTrend={model.loadTrend}
            />

            {/* 2. Tendencia y capacidad: a la derecha del héroe en escritorio; plegada y al final en móvil. */}
            <section data-dash="secondary" aria-labelledby="dash-secondary-title" className="max-lg:order-last lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:pt-6">
                <div className="max-md:sr-only">
                    <SectionHeader as="h2" id="dash-secondary-title" data-dash="secondary-title">Tendencia y capacidad</SectionHeader>
                </div>
                <button
                    type="button"
                    data-dash="more-toggle"
                    aria-expanded={showMore}
                    aria-controls="dash-secondary-grid"
                    onClick={() => setShowMore((v) => !v)}
                    className="md:hidden w-full min-h-14 px-4 flex items-center justify-between gap-3 rounded-2xl border border-hairline-3 bg-surface-card active:scale-press transition-transform duration-fast ease-forma text-sm font-semibold text-ink touch-manipulation"
                >
                    <span className="whitespace-nowrap">Tendencia y capacidad</span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-4 whitespace-nowrap">
                        {showMore ? 'Ocultar' : 'Mostrar'}
                        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-base ease-forma ${showMore ? 'rotate-180' : ''}`} />
                    </span>
                </button>
                <dl id="dash-secondary-grid" data-dash="secondary-grid" data-open={showMore ? 'true' : 'false'} className="divide-y divide-hairline max-md:mt-2 max-md:data-[open=false]:hidden">
                    {ledger.map((kpi) => (
                        <div key={kpi.label} data-dash="ledger-row" className="flex items-center justify-between gap-3 min-h-14 min-w-0">
                            <dt className="text-sm text-ink-2-soft truncate">{kpi.label}<span className="ml-2 text-xs text-ink-4">{kpi.sub}</span></dt>
                            <dd data-metric={kpi.metric} className="text-lg font-semibold tabular-nums text-ink shrink-0">{kpi.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* 3. Métricas clave de hoy (sin repetir el CTL del héroe). */}
            <section data-dash="primary" className="lg:col-span-12 lg:row-start-2">
                <SectionHeader as="h2">Fisiología y carga</SectionHeader>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <KpiCard
                        className="motion-safe:[animation-delay:0.18s]"
                        label="Fatiga (ATL)" metric="atl" icon={Battery} color={ct.series.atl}
                        value={Math.round(model.atl)} format={(n) => String(Math.round(n))}
                        delta={atlDelta} spark={atlVals} sub="Cambio en 7 días"
                    />
                    <KpiCard
                        className="motion-safe:[animation-delay:0.24s]"
                        label="Forma (TSB)" metric="tsb" icon={Zap} color={ct.series.tsb}
                        value={Math.round(model.tsb)} format={(n) => (Math.round(n) > 0 ? '+' : '') + Math.round(n)}
                        delta={tsbDelta} spark={tsbVals} sub="Cambio en 7 días"
                    />
                    <KpiCard
                        className="col-span-2 md:col-span-1 motion-safe:[animation-delay:0.3s]"
                        label="Ratio de carga" metric="acwr" icon={Target} color={ct.series.tsb}
                        value={model.acwr > 0 ? model.acwr : null} format={(n) => formatNumber(n, 2)}
                        sub="Aguda / crónica · óptimo 0,8–1,3"
                        chip={<span className={`text-2xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.05em] ${ACWR_CHIP[acwrInfo.tone]}`}>{acwrInfo.label}</span>}
                    />
                </div>
            </section>

            {/* 4. Evolución: el selector de rango en su cabecera y los totales del periodo al pie (RF-D3). */}
            <Card as="section" data-dash="chart" aria-labelledby="dash-chart-title" className="p-card md:p-card-lg lg:col-span-12 lg:row-start-3">
                <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 id="dash-chart-title" className="text-base font-semibold text-ink">Evolución</h2>
                    <Segmented
                        role="group"
                        aria-label="Rango de la gráfica"
                        data-dash="range"
                        options={RANGES}
                        value={timeRange}
                        onChange={setTimeRange}
                        optionClassName="min-w-[44px] min-h-[44px] md:min-h-[36px] touch-manipulation"
                    />
                </header>
                <div data-dash="chart-body" className="h-[280px] sm:h-[320px] lg:h-[360px]">
                    <EvolutionChart data={chartData} />
                </div>
                <PeriodTotals summary={periodSummary} range={timeRange} />
            </Card>
        </div>
    );
});

const RANGES = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '3M' },
    { value: 'all', label: 'Todo' },
];

const RANGE_CAPTION = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 3 meses', all: 'Desde el inicio' };

/** Totales del periodo de la gráfica: lo único, además de la gráfica, que cambia con el rango. */
const PeriodTotals = ({ summary, range }) => {
    if (!summary) return null;
    const caption = RANGE_CAPTION[range] || 'Periodo';
    return (
        <footer data-dash="period-totals" className="mt-5 pt-4 border-t border-hairline flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <p className="text-xs text-ink-3">{caption}</p>
            {summary.count > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 md:gap-x-10">
                    {[
                        { label: 'Sesiones', value: formatNumber(summary.count, 0) },
                        { label: 'Tiempo', value: formatNumber(summary.duration, 0), unit: 'h' },
                        { label: 'Distancia', value: formatNumber(summary.distance, 0), unit: 'km' },
                        { label: 'Carga', value: formatNumber(summary.tss, 0), unit: 'TSS' },
                    ].map((t) => (
                        <Stat key={t.label} as="div" size="sm" mono label={t.label} value={t.value} unit={t.unit} className="min-w-0" />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-ink-3">Sin sesiones en este periodo.</p>
            )}
        </footer>
    );
};
