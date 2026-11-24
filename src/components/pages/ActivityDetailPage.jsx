import React, { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { useChartTheme } from '../charts/useChartTheme';
import { useActivityStreams } from '../activity/detail/useActivityStreams';
import { computePeaks, getActivePeakType, getSpeedOrPace, getSportTheme } from '../activity/detail/detailUtils';
import { useConfirmDeleteActivity } from '../../hooks/useConfirmDeleteActivity';
import { ConfirmDeleteActivityModal } from '../activity/ConfirmDeleteActivityModal';
import { DetailHeader } from '../activity/detail/DetailHeader';
import { DetailHero } from '../activity/detail/DetailHero';
import { Skeleton } from '../ui';
import { ChartSkeleton } from '../charts/ChartSkeleton';
import { DetailMobileHero } from '../activity/detail/DetailMobileHero';
import { TelemetryPanel } from '../activity/detail/TelemetryPanel';
import { ActivityCharts } from '../activity/detail/ActivityCharts';
import { AnalysisSidebar } from '../activity/detail/AnalysisSidebar';
import { MapTab } from '../activity/detail/MapTab';
import { LapsTab } from '../activity/detail/LapsTab';
import { DataTab } from '../activity/detail/DataTab';
import { getBlocksForSport, getTabsForSport, getZoneOptions, applyChartBlocks, getMetricsForSport } from '../../utils/activityMetricsBySport';

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const ct = useChartTheme();
    const isV2 = true; // v2 por defecto (Capa 6); las ramas v1 se retiran en los PR 5a–c
    const del = useConfirmDeleteActivity(onDelete, onBack);
    const { streams, loadingStreams } = useActivityStreams(activity, fetchStreams);
    const [activePayload, setActivePayload] = useState(null);
    const [activeTab, setActiveTab] = useState('analyze');
    const [zoneType, setZoneType] = useState('hr'); // 'hr' | 'pace' | 'power'

    const {
        sport,
        isPaceBased,
        exactZoneAnalysis,
        exactPaceZoneAnalysis,
        exactPowerZoneAnalysis,
        paceThresholdIsDefault,
        proMetrics,
        trainingEffect,
        chartData: rawChartData,
        maxHr,
        fitnessAnalysis
    } = useActivityMetrics(activity, streams, settings);

    const blocks = getBlocksForSport(sport);
    const chartData = useMemo(() => applyChartBlocks(rawChartData, sport), [rawChartData, sport]);
    const hasGps = !!(activity?.map_polyline || streams?.latlng?.data?.length);
    const showMap = blocks.tabs.map && hasGps;
    const tabs = getTabsForSport(sport, { hasGps, hasLaps: proMetrics.autoLaps?.length > 0 });
    const zoneOptions = getZoneOptions(sport, { hasHr: !!exactZoneAnalysis, hasPace: !!exactPaceZoneAnalysis, hasPower: !!exactPowerZoneAnalysis });
    const effectiveTab = tabs.some(t => t.id === activeTab) ? activeTab : 'analyze';
    const effectiveZone = zoneOptions.some(z => z.value === zoneType) ? zoneType : (zoneOptions[0]?.value || 'hr');

    const peaks = useMemo(() => computePeaks(chartData), [chartData]);
    const activePeakType = useMemo(() => getActivePeakType(activePayload, peaks, isPaceBased), [activePayload, peaks, isPaceBased]);

    if (!activity) return null;

    const dateStr = new Date(activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const speedMetric = getSpeedOrPace(activity, isPaceBased);
    const metrics = getMetricsForSport(sport, activity, proMetrics, speedMetric);
    const themeColor = getSportTheme(activity.type, ct);

    const handleMouseMove = (state) => {
        if (state && typeof state.activeTooltipIndex !== 'undefined' && state.activeTooltipIndex !== null) {
            const dataPoint = chartData[state.activeTooltipIndex];
            if (dataPoint) setActivePayload(dataPoint);
        } else if (state && state.activePayload && state.activePayload.length > 0) {
            const dataPoint = state.activePayload[0].payload;
            if (dataPoint) setActivePayload(dataPoint);
        }
    };

    // Alto de la pantalla: la ventana menos la cabecera de la app y, desde `sm`, el relleno
    // vertical de `main`. En Análisis la página puede crecer en móvil; en escritorio la caja
    // queda fija y se desplazan los paneles, como antes. Sin números sueltos (RF2).
    return (
        <div data-skin="detail" className={`animate-in fade-in duration-500 bg-sunken-2 ${effectiveTab === 'analyze' ? 'min-h-[calc(100dvh-var(--nav-h-total))] sm:min-h-[calc(100dvh-var(--nav-h-total)-1rem)] lg:h-[calc(100dvh-var(--nav-h-total)-1rem)]' : 'h-[calc(100dvh-var(--nav-h-total))] sm:h-[calc(100dvh-var(--nav-h-total)-1rem)]'} flex flex-col font-sans pb-safe`}>
            <DetailHeader
                activity={activity}
                activeTab={effectiveTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                onBack={onBack}
                onDelete={onDelete ? () => del.request(activity) : undefined}
                dateStr={dateStr}
                metrics={metrics}
            />

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
                {loadingStreams ? (
                    isV2 ? (
                        <div data-detail="loading" role="status" aria-label="Procesando telemetría" className="absolute inset-0 z-20 bg-surface-9 p-2.5 sm:p-5 space-y-4 overflow-hidden">
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-8 w-2/3" />
                            <div className="grid grid-cols-3 gap-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
                            <ChartSkeleton className="h-48" label="Procesando telemetría" />
                        </div>
                    ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-9 z-20">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Procesando telemetría técnica...</span>
                    </div>
                    )
                ) : null}

                {/* --- pestaña: ANÁLISIS --- */}
                {effectiveTab === 'analyze' && (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar touch-scroll min-h-0 pb-24 lg:pb-0">
                        {/* Charts Panel */}
                        <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-2.5 sm:p-5 bg-surface-6 min-w-0">
                            <div className="max-w-5xl mx-auto space-y-3">
                                {isV2 && <DetailHero activity={activity} dateStr={dateStr} metrics={metrics} themeColor={themeColor} />}
                                <DetailMobileHero
                                    showMap={showMap}
                                    activity={activity}
                                    streams={streams}
                                    themeColor={themeColor}
                                    activePayload={activePayload}
                                    metrics={metrics}
                                />
                                <TelemetryPanel
                                    chartData={chartData}
                                    peaks={peaks}
                                    activePayload={activePayload}
                                    setActivePayload={setActivePayload}
                                    activePeakType={activePeakType}
                                    isPaceBased={isPaceBased}
                                />
                                <ActivityCharts
                                    chartData={chartData}
                                    activePayload={activePayload}
                                    handleMouseMove={handleMouseMove}
                                    isPaceBased={isPaceBased}
                                    blocks={blocks}
                                />
                            </div>
                        </div>

                        <AnalysisSidebar
                            showMap={showMap}
                            activity={activity}
                            streams={streams}
                            themeColor={themeColor}
                            activePayload={activePayload}
                            trainingEffect={trainingEffect}
                            fitnessAnalysis={fitnessAnalysis}
                        />
                    </div>
                )}

                {/* --- pestaña: MAPA --- */}
                {effectiveTab === 'map' && (
                    <MapTab activity={activity} streams={streams} themeColor={themeColor} activePayload={activePayload} />
                )}

                {/* --- pestaña: LAPS --- */}
                {effectiveTab === 'laps' && <LapsTab proMetrics={proMetrics} isPaceBased={isPaceBased} />}

                {/* --- pestaña: DETALLE (Deep Analysis) --- */}
                {effectiveTab === 'data' && (
                    <DataTab
                        sport={sport}
                        zoneType={effectiveZone}
                        zoneOptions={zoneOptions}
                        onZoneTypeChange={setZoneType}
                        exactZoneAnalysis={exactZoneAnalysis}
                        exactPaceZoneAnalysis={exactPaceZoneAnalysis}
                        exactPowerZoneAnalysis={exactPowerZoneAnalysis}
                        paceThresholdIsDefault={paceThresholdIsDefault}
                        proMetrics={proMetrics}
                        activity={activity}
                        maxHr={maxHr}
                    />
                )}
            </div>
            <ConfirmDeleteActivityModal activity={del.pending} busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel} />
        </div>
    );
};
