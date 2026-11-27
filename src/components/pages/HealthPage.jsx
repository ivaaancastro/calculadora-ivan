import React, { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { EmptyState, Skeleton } from '../ui';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';
import { useChartTheme } from '../charts/useChartTheme';
import { computeDayReadiness } from '../health/readiness';
import { HealthHeader } from '../health/HealthHeader';
import { ReadinessRings } from '../health/ReadinessRings';
import { HealthHero } from '../health/HealthHero';
import { BiomarkersGrid } from '../health/BiomarkersGrid';
import { InsightsList } from '../health/InsightsList';
import { HistoryDayStrip } from '../health/HistoryDayStrip';
import { DaySpotlight } from '../health/DaySpotlight';
import { HistoryTrendChart } from '../health/HistoryTrendChart';
import { DailyLog } from '../health/DailyLog';

export const HealthPage = ({ activities, settings, currentMetrics }) => {
    const ct = useChartTheme();
    const { wellnessMetrics, loading: wellnessLoading, error: apiError } = useWellnessInfo(activities, settings, currentMetrics);

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
                badge: 'bg-surface-2 text-body-soft'
            };
        }
        const r = wellnessMetrics.todayReadiness;
        if (r >= 67) {
            return {
                color: 'text-positive',
                label: 'Óptima',
                msg: 'Tu cuerpo se encuentra en condiciones óptimas para asimilar entrenamientos de alta intensidad.',
                badge: 'bg-positive-tint-2 text-positive-ink border border-positive-edge-2'
            };
        }
        if (r >= 34) {
            return {
                color: 'text-warning',
                label: 'Adaptándose',
                msg: 'Adaptación fisiológica activa. Es recomendable mantener intensidad controlada y vigilar la fatiga.',
                badge: 'bg-warning-tint text-warning-ink border border-warning-edge'
            };
        }
        return {
            color: 'text-rose-500',
            label: 'Fatiga Alta',
            msg: 'El sistema nervioso autónomo refleja sobrecarga. Prioriza el descanso profundo o una sesión de descarga.',
            badge: 'bg-rose-50 text-hr-ink dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/40'
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
            <div className="animate-in fade-in duration-300 pb-20 w-full max-w-content mx-auto px-1 sm:px-0 py-24 flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex gap-3">
                    <Skeleton circle className="w-16 h-16" />
                    <Skeleton circle className="w-16 h-16" />
                    <Skeleton circle className="w-16 h-16" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-ink">Salud</h2>
                    <p className="text-xs text-ink-4 mt-1 max-w-xs mx-auto">
                        Sincronizando métricas fisiológicas...
                    </p>
                </div>
                <Skeleton className="w-full max-w-md h-24" />
            </div>
        );
    }

    if (!wellnessMetrics) {
        return (
            <div className="animate-in fade-in duration-300 pb-20 w-full max-w-content mx-auto px-1 sm:px-0 py-16">
                <EmptyState
                    icon={Activity}
                    title="Sin datos de salud"
                    description="No se han encontrado registros biométricos. Sincroniza tus datos o carga actividades para ver tus métricas de salud."
                />
            </div>
        );
    }

    return (
        <div data-health="root" className="animate-in fade-in duration-500 pb-20 w-full max-w-content mx-auto px-1 sm:px-0 flex flex-col gap-section md:gap-section-lg">
            <div className="flex flex-col gap-6 md:gap-8">
                <HealthHeader wellnessMetrics={wellnessMetrics} setActiveTab={setActiveTab} activeTab={activeTab} wellnessLoading={wellnessLoading} apiError={apiError} />
                {activeTab === 'today' && !wellnessLoading && (
                    <HealthHero wellnessMetrics={wellnessMetrics} readinessInfo={readinessInfo} energyBankAmount={energyBankAmount} />
                )}
            </div>

            {/* Hoy: carga y sueño, biomarcadores y aspectos destacados */}
            {activeTab === 'today' && (
                <>
                    <ReadinessRings wellnessMetrics={wellnessMetrics} strainInfo={strainInfo} sleepInfo={sleepInfo} ct={ct} />
                    <BiomarkersGrid wellnessMetrics={wellnessMetrics} />
                    <InsightsList wellnessMetrics={wellnessMetrics} />
                </>
            )}

            {/* Historial: tendencia del periodo (con su selector y la tira de días), detalle y registro */}
            {activeTab === 'history' && (
                <>
                    <HistoryTrendChart historySeries={historySeries} historyRange={historyRange} setHistoryRange={setHistoryRange} ct={ct}>
                        <HistoryDayStrip currentSelectedDay={currentSelectedDay} historySeries={historySeries} setSelectedDate={setSelectedDate} />
                    </HistoryTrendChart>
                    <DaySpotlight currentSelectedDay={currentSelectedDay} />
                    <DailyLog currentSelectedDay={currentSelectedDay} historyReversed={historyReversed} setSelectedDate={setSelectedDate} />
                </>
            )}
        </div>
    );
};
