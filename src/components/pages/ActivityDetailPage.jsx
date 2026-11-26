import React, { useState, useMemo, useEffect } from 'react';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { useChartTheme } from '../charts/useChartTheme';
import { useActivityStreams } from '../activity/detail/useActivityStreams';
import { getSpeedOrPace, getSportTheme } from '../activity/detail/detailUtils';
import { CursorContext, createCursorStore } from '../activity/detail/cursorStore';
import { InteractiveMap } from '../activity/ActivityMap';
import { useConfirmDeleteActivity } from '../../hooks/useConfirmDeleteActivity';
import { ConfirmDeleteActivityModal } from '../activity/ConfirmDeleteActivityModal';
import { DetailHeader } from '../activity/detail/DetailHeader';
import { DetailHero } from '../activity/detail/DetailHero';
import { Skeleton } from '../ui';
import { ChartSkeleton } from '../charts/ChartSkeleton';
import { ActivityCharts } from '../activity/detail/ActivityCharts';
import { AnalysisSidebar } from '../activity/detail/AnalysisSidebar';
import { MapTab } from '../activity/detail/MapTab';
import { LapsTab } from '../activity/detail/LapsTab';
import { DataTab } from '../activity/detail/DataTab';
import { getBlocksForSport, getTabsForSport, getZoneOptions, applyChartBlocks, getMetricsForSport } from '../../utils/activityMetricsBySport';

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const ct = useChartTheme();
    const del = useConfirmDeleteActivity(onDelete, onBack);
    const { streams, loadingStreams } = useActivityStreams(activity, fetchStreams);
    // Cursor de las gráficas fuera del estado de la página (RF-C5): moverlo no repinta la página.
    const [cursor] = useState(createCursorStore);
    useEffect(() => () => cursor.dispose(), [cursor]);
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

    if (!activity) return null;

    const dateStr = new Date(activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const speedMetric = getSpeedOrPace(activity, isPaceBased);
    const metrics = getMetricsForSport(sport, activity, proMetrics, speedMetric);
    const themeColor = getSportTheme(activity.type, ct);

    // El mapa es memo (RF-C5): con estas props estables, el cursor no lo vuelve a pintar.
    const heroMap = showMap
        ? <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} />
        : null;

    // Alto de la pantalla: la ventana menos la cabecera de la app y, desde `sm`, el relleno
    // vertical de `main`. En Análisis la página crece en móvil; en escritorio la caja queda fija
    // y se desplaza el contenido. Las demás pestañas tienen alto fijo (mapa a pantalla completa).
    const analyze = effectiveTab === 'analyze';
    return (
        <CursorContext.Provider value={cursor}>
        <div className={`animate-in fade-in duration-500 bg-sunken-2 ${analyze ? 'min-h-[calc(100dvh-var(--nav-h-total))] sm:min-h-[calc(100dvh-var(--nav-h-total)-1rem)] lg:h-[calc(100dvh-var(--nav-h-total)-1rem)]' : 'h-[calc(100dvh-var(--nav-h-total))] sm:h-[calc(100dvh-var(--nav-h-total)-1rem)]'} flex flex-col font-sans pb-safe`}>
            <DetailHeader
                activity={activity}
                activeTab={effectiveTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                onBack={onBack}
                onDelete={onDelete ? del.request : undefined}
            />

            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
                {loadingStreams ? (
                    <div data-detail="loading" role="status" aria-label="Procesando telemetría" className="absolute inset-0 z-20 bg-surface-9 overflow-hidden">
                        <div className="max-w-content mx-auto px-4 md:px-6 py-6 md:py-8 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                            <Skeleton className="h-[260px] lg:h-[440px]" />
                            <div className="space-y-4">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-8 w-2/3" />
                                <div className="grid grid-cols-3 gap-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
                                <ChartSkeleton className="h-48" label="Procesando telemetría" />
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* --- pestaña: ANÁLISIS --- héroe (mapa | cifras), impacto y Coach, gráficas */}
                {analyze && (
                    <div data-detail="analyze" className="flex-1 min-h-0 overflow-y-auto custom-scrollbar touch-scroll pb-24 lg:pb-0">
                        <div className="max-w-content mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-section md:gap-section-lg">
                            <DetailHero activity={activity} dateStr={dateStr} metrics={metrics} themeColor={themeColor} map={heroMap} />
                            <AnalysisSidebar trainingEffect={trainingEffect} fitnessAnalysis={fitnessAnalysis} />
                            <ActivityCharts chartData={chartData} isPaceBased={isPaceBased} blocks={blocks} />
                        </div>
                    </div>
                )}

                {effectiveTab === 'map' && <MapTab activity={activity} streams={streams} themeColor={themeColor} />}

                {effectiveTab === 'laps' && <LapsTab proMetrics={proMetrics} isPaceBased={isPaceBased} />}

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
        </CursorContext.Provider>
    );
};
