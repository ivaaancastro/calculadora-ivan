import React, { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { useChartTheme } from '../charts/useChartTheme';
import { useActivityStreams } from '../activity/detail/useActivityStreams';
import { computePeaks, getActivePeakType, getSpeedOrPace, getSportTheme } from '../activity/detail/detailUtils';
import { DetailHeader } from '../activity/detail/DetailHeader';
import { DetailMobileHero } from '../activity/detail/DetailMobileHero';
import { TelemetryPanel } from '../activity/detail/TelemetryPanel';
import { ActivityCharts } from '../activity/detail/ActivityCharts';
import { AnalysisSidebar } from '../activity/detail/AnalysisSidebar';
import { MapTab } from '../activity/detail/MapTab';
import { LapsTab } from '../activity/detail/LapsTab';
import { DataTab } from '../activity/detail/DataTab';

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const ct = useChartTheme();
    const { streams, loadingStreams } = useActivityStreams(activity, fetchStreams);
    const [activePayload, setActivePayload] = useState(null);
    const [activeTab, setActiveTab] = useState('analyze');
    const [zoneType, _setZoneType] = useState('hr'); // 'hr' or 'power'

    const {
        isPaceBased,
        exactZoneAnalysis,
        exactPacePowerZoneAnalysis,
        proMetrics,
        trainingEffect,
        chartData,
        maxHr,
        fitnessAnalysis
    } = useActivityMetrics(activity, streams, settings);

    const peaks = useMemo(() => computePeaks(chartData), [chartData]);
    const activePeakType = useMemo(() => getActivePeakType(activePayload, peaks, isPaceBased), [activePayload, peaks, isPaceBased]);

    if (!activity) return null;

    const dateStr = new Date(activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const speedMetric = getSpeedOrPace(activity, isPaceBased);
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
        <div data-skin="detail" className={`animate-in fade-in duration-500 bg-sunken-2 ${activeTab === 'analyze' ? 'min-h-[calc(100dvh-var(--nav-h-total))] sm:min-h-[calc(100dvh-var(--nav-h-total)-1rem)] lg:h-[calc(100dvh-var(--nav-h-total)-1rem)]' : 'h-[calc(100dvh-var(--nav-h-total))] sm:h-[calc(100dvh-var(--nav-h-total)-1rem)]'} flex flex-col font-sans pb-safe`}>
            <DetailHeader
                activity={activity}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onBack={onBack}
                onDelete={onDelete}
                dateStr={dateStr}
                speedMetric={speedMetric}
                proMetrics={proMetrics}
                isPaceBased={isPaceBased}
            />

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
                {loadingStreams ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-9 z-20">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Procesando telemetría técnica...</span>
                    </div>
                ) : null}

                {/* --- pestaña: ANÁLISIS --- */}
                {activeTab === 'analyze' && (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar touch-scroll min-h-0 pb-24 lg:pb-0">
                        {/* Charts Panel */}
                        <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-2.5 sm:p-5 bg-surface-6 min-w-0">
                            <div className="max-w-5xl mx-auto space-y-3">
                                <DetailMobileHero
                                    activity={activity}
                                    streams={streams}
                                    themeColor={themeColor}
                                    activePayload={activePayload}
                                    speedMetric={speedMetric}
                                    proMetrics={proMetrics}
                                    isPaceBased={isPaceBased}
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
                                />
                            </div>
                        </div>

                        <AnalysisSidebar
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
                {activeTab === 'map' && (
                    <MapTab activity={activity} streams={streams} themeColor={themeColor} activePayload={activePayload} />
                )}

                {/* --- pestaña: LAPS --- */}
                {activeTab === 'laps' && <LapsTab proMetrics={proMetrics} isPaceBased={isPaceBased} />}

                {/* --- pestaña: DETALLE (Deep Analysis) --- */}
                {activeTab === 'data' && (
                    <DataTab
                        zoneType={zoneType}
                        exactZoneAnalysis={exactZoneAnalysis}
                        exactPacePowerZoneAnalysis={exactPacePowerZoneAnalysis}
                        proMetrics={proMetrics}
                        activity={activity}
                        maxHr={maxHr}
                    />
                )}
            </div>
        </div>
    );
};
