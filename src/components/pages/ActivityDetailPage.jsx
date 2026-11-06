import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap, Target, Info } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { InteractiveMap } from '../activity/ActivityMap';
import { MetricCard, PillTab, CustomChartTooltip, MetricHelp } from '../activity/ActivitySharedUI';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { formatPace, formatMinsToHMM, formatDuration } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';

/* ── Tokens del sistema de diseño (design-taste-frontend) ──
   Palette cool-grey-cobalt, accent azul #1f2de6, radius soft, grounds planos. */

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const [streams, setStreams] = useState(null);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const fetchedRef = useRef(null);
    const [activePayload, setActivePayload] = useState(null);
    const [activeTab, setActiveTab] = useState('analyze');
    const [zoneType, _setZoneType] = useState('hr'); // 'hr' or 'power'

    useEffect(() => {
        if (!activity) return;
        if (fetchedRef.current !== activity.id) {
            fetchedRef.current = activity.id;

            const hasEssentialStreams = activity.streams_data &&
                activity.streams_data.latlng &&
                (activity.type.toLowerCase().includes('bici') || activity.type.toLowerCase().includes('bike') ? activity.streams_data.watts : true) &&
                activity.streams_data.cadence;

            if (activity.streams_data && hasEssentialStreams) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setStreams(activity.streams_data);
                setLoadingStreams(false);
            } else if (activity.strava_id && fetchStreams) {
                setLoadingStreams(true);
                fetchStreams(activity.id, activity.strava_id).then(data => {
                    setStreams(data);
                    setLoadingStreams(false);
                });
            } else {
                setStreams(activity.streams_data || null);
                setLoadingStreams(false);
            }
        }
    }, [activity, fetchStreams]);

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

    const peaks = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        let maxSpeedPt = null;
        let bestPacePt = null;
        let maxHrPt = null;
        let maxWattsPt = null;
        let maxAltPt = null;

        chartData.forEach(pt => {
            if (pt.speed !== null && (!maxSpeedPt || pt.speed > maxSpeedPt.speed)) maxSpeedPt = pt;
            if (pt.pace !== null && pt.pace > 0 && (!bestPacePt || pt.pace < bestPacePt.pace)) bestPacePt = pt;
            if (pt.hr !== null && (!maxHrPt || pt.hr > maxHrPt.hr)) maxHrPt = pt;
            if (pt.watts !== null && (!maxWattsPt || pt.watts > maxWattsPt.watts)) maxWattsPt = pt;
            if (pt.alt !== null && (!maxAltPt || pt.alt > maxAltPt.alt)) maxAltPt = pt;
        });

        return { maxSpeedPt, bestPacePt, maxHrPt, maxWattsPt, maxAltPt };
    }, [chartData]);

    const activePeakType = useMemo(() => {
        if (!activePayload || !peaks) return null;
        if (peaks.maxHrPt && activePayload.hr && activePayload.hr >= peaks.maxHrPt.hr - 2) {
            return { label: 'Pico FC', value: `${peaks.maxHrPt.hr} bpm`, color: 'text-[#1f2de6]' };
        }
        if (peaks.maxWattsPt && activePayload.watts && activePayload.watts >= peaks.maxWattsPt.watts - 15) {
            return { label: 'Pico Potencia', value: `${peaks.maxWattsPt.watts} W`, color: 'text-[#1f2de6]' };
        }
        if (isPaceBased && peaks.bestPacePt && activePayload.pace && activePayload.pace <= peaks.bestPacePt.pace + 0.1) {
            return { label: 'Ritmo Máx', value: formatPace(peaks.bestPacePt.pace), color: 'text-[#1f2de6]' };
        }
        if (!isPaceBased && peaks.maxSpeedPt && activePayload.speed && activePayload.speed >= peaks.maxSpeedPt.speed - 1) {
            return { label: 'Velocidad Máx', value: `${peaks.maxSpeedPt.speed} km/h`, color: 'text-[#1f2de6]' };
        }
        if (peaks.maxAltPt && activePayload.alt && activePayload.alt >= peaks.maxAltPt.alt - 3) {
            return { label: 'Cima', value: `${peaks.maxAltPt.alt} m`, color: 'text-[#1f2de6]' };
        }
        return null;
    }, [activePayload, peaks, isPaceBased]);

    if (!activity) return null;

    const formatTimeStr = (mins) => formatMinsToHMM(mins);
    const dateStr = new Date(activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    const getSpeedOrPace = () => {
        const speedMs = activity.speed_avg || 0; if (speedMs === 0) return null;
        if (!isPaceBased) return { value: (speedMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Media' };
        const minPerKm = 16.666666666667 / speedMs;
        return { value: formatPace(minPerKm), unit: '/km', label: 'Ritmo Medio' };
    };
    const speedMetric = getSpeedOrPace();

    const getTheme = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('run') || t.includes('carrera')) return '#ea580c';
        if (t.includes('andar') || t.includes('walk') || t.includes('caminata')) return '#10b981';
        if (t.includes('bike') || t.includes('bici')) return '#2563eb';
        if (t.includes('gym') || t.includes('fuerza')) return '#7c3aed';
        return '#71717a';
    };
    const themeColor = getTheme(activity.type);

    const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2Max'];
    const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#eab308', '#ef4444'];

    const handleMouseMove = (state) => {
        if (state && typeof state.activeTooltipIndex !== 'undefined' && state.activeTooltipIndex !== null) {
            const dataPoint = chartData[state.activeTooltipIndex];
            if (dataPoint) setActivePayload(dataPoint);
        } else if (state && state.activePayload && state.activePayload.length > 0) {
            const dataPoint = state.activePayload[0].payload;
            if (dataPoint) setActivePayload(dataPoint);
        }
    };

    return (
        <div className={`pb-safe font-sans flex flex-col ${activeTab === 'analyze' ? 'min-h-[calc(100dvh-4rem)]' : 'h-[calc(100dvh-4rem)]'} lg:h-[calc(100vh-70px)]`}>
            {/* Premium Header */}
            <header className="px-4 py-3 sm:px-6 shrink-0 z-20 border-b border-slate-200 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
                {/* --- DESKTOP HEADER (lg:flex) --- */}
                <div className="hidden lg:flex items-center justify-between gap-2 mb-2 sm:mb-3 pb-2 border-b border-slate-200 dark:border-zinc-800/40 pb-3">
                    <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full gap-0.5 overflow-x-auto hide-scrollbar min-w-0">
                        <PillTab active={activeTab === 'analyze'} label="Análisis" onClick={() => setActiveTab('analyze')} />
                        <PillTab active={activeTab === 'map'} label="Mapa" onClick={() => setActiveTab('map')} />
                        <PillTab active={activeTab === 'laps'} label="Intervalos" onClick={() => setActiveTab('laps')} />
                        <PillTab active={activeTab === 'data'} label="Detalle" onClick={() => setActiveTab('data')} />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {activity.strava_id && (
                            <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-[#1f2de6] dark:text-[#4da6ff] hover:bg-[#1f2de6]/10 dark:hover:bg-[#1f2de6]/15 active:scale-95 rounded-full transition-all uppercase tracking-wider shrink-0">
                                Strava <ExternalLink size={12} strokeWidth={2} />
                            </a>
                        )}
                        <button onClick={() => onDelete && onDelete(activity.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-full active:scale-90 transition-all shrink-0" title="Eliminar actividad">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 mb-3">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 active:scale-95 rounded-full transition-all text-slate-500 dark:text-zinc-400 shrink-0" title="Volver">
                        <ArrowLeft size={17} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
                            {activity.name || `${activity.type}`}
                        </h1>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 capitalize">{dateStr}</p>
                    </div>
                </div>

                {/* --- MOBILE HEADER (lg:hidden) --- */}
                <div className="lg:hidden flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 active:scale-95 rounded-full transition-all text-slate-500 dark:text-zinc-400 shrink-0" title="Volver">
                            <ArrowLeft size={17} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
                                {activity.name || `${activity.type}`}
                            </h1>
                            <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 capitalize truncate">{dateStr}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {activity.strava_id && (
                            <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-[#1f2de6] dark:text-[#4da6ff] hover:bg-[#1f2de6]/10 dark:hover:bg-[#1f2de6]/15 active:scale-95 rounded-full transition-all uppercase tracking-wider shrink-0">
                                Strava <ExternalLink size={12} strokeWidth={2} />
                            </a>
                        )}
                        <button onClick={() => onDelete && onDelete(activity.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-full active:scale-90 transition-all shrink-0" title="Eliminar actividad">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Fila 2: Selector Segmentado iOS nativo a ancho completo */}
                <div className="lg:hidden grid grid-cols-4 w-full bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl gap-1 shadow-sm">
                    {[
                        { id: 'analyze', label: 'Análisis' },
                        { id: 'map', label: 'Mapa' },
                        { id: 'laps', label: 'Intervalos' },
                        { id: 'data', label: 'Detalle' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-1.5 text-[11px] font-bold rounded-lg text-center transition-all select-none touch-manipulation active:scale-[0.98] ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-[#1a1a1b] text-slate-900 dark:text-white shadow-sm font-bold'
                                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Compact Metric Grid - Desktop Solo */}
                <div className="hidden lg:flex items-center gap-2 overflow-x-auto hide-scrollbar touch-scroll overscroll-contain px-3 mt-2 sm:mt-3">
                    <MetricCard label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                    <MetricCard label="Tiempo" value={formatTimeStr(activity.duration)} />
                    <MetricCard label="Desnivel" value={activity.elevation_gain || 0} unit="m" />
                    <MetricCard label="Carga" value={Math.round(activity.tss || 0)} unit="TSS" accent="text-[#1f2de6]" />
                    {proMetrics.ifFactor > 0 && <MetricCard label="IF" value={proMetrics.ifFactor} accent="text-amber-500" />}
                    {proMetrics.workKj > 0 && <MetricCard label="Trabajo" value={proMetrics.workKj} unit="kJ" />}
                    {activity.hr_avg > 0 && <MetricCard label="FC Media" value={activity.hr_avg} unit="bpm" accent="text-rose-500" />}
                    {speedMetric && <MetricCard label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} accent="text-blue-500" />}
                    {proMetrics.avgWatts > 0 && <MetricCard label="W Media" value={proMetrics.avgWatts} unit="w" accent="text-amber-500" />}
                    {proMetrics.npWatts > 0 && <MetricCard label="NP" value={proMetrics.npWatts} unit="w" accent="text-amber-600" />}
                    {proMetrics.efObj && <MetricCard label="EF" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} />}
                    {proMetrics.decouplingObj && (
                        <MetricCard label="Drift" value={proMetrics.decouplingObj.value} unit="%" accent={proMetrics.decouplingObj.color} />
                    )}
                    {proMetrics.cadenceAvg > 0 && <MetricCard label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'ppm' : 'rpm'} />}
                </div>
            </header>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
                {loadingStreams ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-zinc-950/80 z-20">
                        <Loader2 size={24} className="animate-spin text-[#1f2de6]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Procesando telemetría…</span>
                    </div>
                ) : null}

                {/* --- pestaña: ANÁLISIS --- */}
                {activeTab === 'analyze' && (
                    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar touch-scroll min-h-0 pb-20 lg:pb-0">
                        {/* Charts Panel */}
                        <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-white dark:bg-zinc-950 min-w-0">
                            <div className="max-w-5xl mx-auto space-y-5">
                                {/* HERO MAP (MÓVIL SOLO - ESTILO STRAVA) */}
                                <div className="lg:hidden space-y-3">
                                    {(activity.map_polyline || streams?.latlng?.data) && (
                                        <div className="h-48 sm:h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-zinc-800/40">
                                            <InteractiveMap 
                                                polyline={activity.map_polyline} 
                                                highResCoords={streams?.latlng?.data} 
                                                color={themeColor} 
                                                currentPosition={activePayload?.latlng} 
                                            />
                                        </div>
                                    )}

                                    {/* Resumen de Métricas */}
                                    <div className="grid grid-cols-3 gap-3 py-1">
                                        <MetricCard label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                                        <MetricCard label="Tiempo" value={formatTimeStr(activity.duration)} />
                                        <MetricCard label="Desnivel" value={activity.elevation_gain || 0} unit="m" />
                                        {speedMetric && <MetricCard label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} accent="text-blue-500" />}
                                        {activity.hr_avg > 0 && <MetricCard label="FC Media" value={activity.hr_avg} unit="bpm" accent="text-rose-500" />}
                                        <MetricCard label="Carga" value={Math.round(activity.tss || 0)} unit="TSS" accent="text-[#1f2de6]" />
                                        {proMetrics.avgWatts > 0 && <MetricCard label="W Media" value={proMetrics.avgWatts} unit="w" accent="text-amber-500" />}
                                        {proMetrics.ifFactor > 0 && <MetricCard label="IF" value={proMetrics.ifFactor} accent="text-amber-500" />}
                                        {proMetrics.cadenceAvg > 0 && <MetricCard label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'ppm' : 'rpm'} />}
                                        {proMetrics.workKj > 0 && <MetricCard label="Trabajo" value={proMetrics.workKj} unit="kJ" />}
                                        {proMetrics.npWatts > 0 && <MetricCard label="NP" value={proMetrics.npWatts} unit="w" accent="text-amber-600" />}
                                        {proMetrics.efObj && <MetricCard label="EF" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} />}
                                        {proMetrics.decouplingObj && (
                                            <MetricCard label="Drift" value={proMetrics.decouplingObj.value} unit="%" accent={proMetrics.decouplingObj.color} />
                                        )}
                                    </div>
                                </div>

                                {/* PEAK SHORTCUT BUTTONS & LIVE TELEMETRY HUD */}
                                {chartData.length > 0 && (
                                    <div className="space-y-4">
                                        {/* Accesos rápidos a los Picos del entrenamiento */}
                                        {peaks && (
                                            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest shrink-0 mr-2">
                                                    Picos:
                                                </span>
                                                {peaks.maxHrPt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePayload(peaks.maxHrPt)}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-2 ${
                                                            activePayload?.rawTime === peaks.maxHrPt.rawTime
                                                                ? 'bg-[#1f2de6] text-white border-[#1f2de6] shadow-sm'
                                                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                                                        }`}
                                                    >
                                                        <span>Pico FC</span>
                                                        <span className="font-mono tabular-nums">{peaks.maxHrPt.hr} bpm</span>
                                                    </button>
                                                )}
                                                {peaks.maxWattsPt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePayload(peaks.maxWattsPt)}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-2 ${
                                                            activePayload?.rawTime === peaks.maxWattsPt.rawTime
                                                                ? 'bg-[#1f2de6] text-white border-[#1f2de6] shadow-sm'
                                                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                                                        }`}
                                                    >
                                                        <span>Pico W</span>
                                                        <span className="font-mono tabular-nums">{peaks.maxWattsPt.watts} W</span>
                                                    </button>
                                                )}
                                                {(!isPaceBased ? peaks.maxSpeedPt : peaks.bestPacePt) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePayload(isPaceBased ? peaks.bestPacePt : peaks.maxSpeedPt)}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-2 ${
                                                            activePayload?.rawTime === (isPaceBased ? peaks.bestPacePt?.rawTime : peaks.maxSpeedPt?.rawTime)
                                                                ? 'bg-[#1f2de6] text-white border-[#1f2de6] shadow-sm'
                                                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                                                        }`}
                                                    >
                                                        <span>{isPaceBased ? 'Mejor Ritmo' : 'Max Vel'}</span>
                                                        <span className="font-mono tabular-nums">
                                                            {isPaceBased ? formatPace(peaks.bestPacePt.pace) : `${peaks.maxSpeedPt.speed} km/h`}
                                                        </span>
                                                    </button>
                                                )}
                                                {peaks.maxAltPt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePayload(peaks.maxAltPt)}
                                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all active:scale-95 flex items-center gap-2 ${
                                                            activePayload?.rawTime === peaks.maxAltPt.rawTime
                                                                ? 'bg-[#1f2de6] text-white border-[#1f2de6] shadow-sm'
                                                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/40 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                                                        }`}
                                                    >
                                                        <span>Cima</span>
                                                        <span className="font-mono tabular-nums">{peaks.maxAltPt.alt} m</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* HUD de Telemetría Dinámico */}
                                        <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                            <div className="p-3 sm:p-4">
                                                {activePayload ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/40 pb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-50 dark:bg-zinc-900/40 font-mono text-[11px] font-bold tabular-nums text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800/40">
                                                                    <span>⏱ {formatDuration(activePayload.rawTime)}</span>
                                                                    <span className="text-slate-300 dark:text-zinc-700">|</span>
                                                                    <span>📍 {activePayload.distanceKm} km</span>
                                                                </div>
                                                                {activePeakType && (
                                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-tight border ${activePeakType.color} bg-[#1f2de6]/10 dark:bg-[#1f2de6]/20`}>
                                                                        {activePeakType.label}: {activePeakType.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePayload(null)}
                                                                className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                                            >
                                                                Resetear
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center">
                                                            {/* Ritmo / Velocidad */}
                                                            <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-xl p-2 border border-slate-200 dark:border-zinc-800/40">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                                                    {isPaceBased ? 'Ritmo' : 'Velocidad'}
                                                                </span>
                                                                <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#1f2de6]">
                                                                    {isPaceBased ? formatPace(activePayload.pace) : `${activePayload.speed} km/h`}
                                                                </span>
                                                            </div>

                                                            {/* FC */}
                                                            {activePayload.hr !== null && (
                                                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-xl p-2 border border-slate-200 dark:border-zinc-800/40">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                                                        FC
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-rose-500">
                                                                        {activePayload.hr} <span className="text-[10px] font-normal">bpm</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Potencia */}
                                                            {activePayload.watts !== null && (
                                                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-xl p-2 border border-slate-200 dark:border-zinc-800/40">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                                                        Potencia
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-amber-500">
                                                                        {activePayload.watts} <span className="text-[10px] font-normal">W</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Altitud y Pendiente */}
                                                            {activePayload.alt !== null && (
                                                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-xl p-2 border border-slate-200 dark:border-zinc-800/40">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                                                        Altitud
                                                                    </span>
                                                                    <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-black font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                                                                        <span>{activePayload.alt}m</span>
                                                                        {activePayload.grade !== undefined && (
                                                                            <span className={`text-[10px] font-bold ${activePayload.grade > 3 ? 'text-rose-500' : activePayload.grade < -3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                                {activePayload.grade > 0 ? '+' : ''}{activePayload.grade.toFixed(0)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Cadencia */}
                                                            {activePayload.cadence !== null && (
                                                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-xl p-2 border border-slate-200 dark:border-zinc-800/40">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                                                                        Cadencia
                                                                    </span>
                                                                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-500">
                                                                        {activePayload.cadence} <span className="text-[10px] font-normal">{isPaceBased ? 'ppm' : 'rpm'}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500 py-2 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-[#1f2de6] animate-ping" />
                                                            <span className="text-[11px] font-bold">
                                                                Desliza el dedo por los gráficos para explorar cada punto y pico
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-[#1f2de6] dark:text-[#4da6ff] uppercase tracking-wider hidden sm:inline">
                                                            Telemetría
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {chartData.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Velocity/Pace */}
                                        <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                            <div className="h-[130px] p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800/40">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{isPaceBased ? 'Ritmo' : 'Velocidad'}</h4>
                                                        {activePayload && (
                                                            <div className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-900/40 rounded-lg flex items-center gap-2 text-[11px] font-bold tabular-nums border border-slate-200 dark:border-zinc-800/40">
                                                                <span className="text-slate-500 dark:text-zinc-400">{formatDuration(activePayload.rawTime)}</span>
                                                                <span className="w-px h-2 bg-slate-300 dark:bg-zinc-700"></span>
                                                                <span className="text-[#1f2de6]">{activePayload.distanceKm} km</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {activePayload && <span className="text-sm font-black tabular-nums text-[#1f2de6]">{isPaceBased ? formatPace(activePayload.pace) : activePayload.speed + ' km/h'}</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={80}>
                                                    <AreaChart
                                                        data={chartData}
                                                        syncId="st"
                                                        onMouseMove={handleMouseMove}
                                                        onTouchMove={handleMouseMove}
                                                        onTouchStart={handleMouseMove}
                                                        onClick={handleMouseMove}
                                                        style={{ touchAction: 'pan-y' }}
                                                    >
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis reversed={isPaceBased} hide domain={['dataMin', 'dataMax']} />
                                                        <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: '#1f2de6', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                        <Area type="monotone" dataKey={isPaceBased ? "pace" : "speed"} stroke="#1f2de6" fill="#1f2de6" fillOpacity={0.08} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#1f2de6' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        {/* Heart Rate */}
                                        {chartData.some(d => d.hr > 0) && (
                                            <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                                <div className="h-[130px] p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800/40">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">FC</h4>
                                                        {activePayload && <span className="text-sm font-black tabular-nums text-rose-500">{activePayload.hr} bpm</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart
                                                            data={chartData}
                                                            syncId="st"
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: '#f43f5e', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="hr" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.08} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f43f5e' }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        )}

                                        {/* Power */}
                                        {chartData.some(d => d.watts > 0) && (
                                            <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                                <div className="h-[130px] p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800/40">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Potencia</h4>
                                                        {activePayload && <span className="text-sm font-black tabular-nums text-amber-500">{activePayload.watts} w</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart
                                                            data={chartData}
                                                            syncId="st"
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin', 'dataMax']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="watts" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f59e0b' }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        )}

                                        {/* Altitude */}
                                        {chartData.some(d => d.alt !== null) && (
                                            <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                                <div className="h-[130px] p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800/40">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Altitud</h4>
                                                            {activePayload?.grade !== undefined && (
                                                                <span className={`text-[11px] font-bold ${activePayload.grade > 3 ? 'text-rose-500' : activePayload.grade < -3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                    {activePayload.grade > 0 ? '+' : ''}{activePayload.grade.toFixed(1)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        {activePayload && <span className="text-sm font-black tabular-nums text-slate-500">{activePayload.alt} m</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart
                                                            data={chartData}
                                                            syncId="st"
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="alt" stroke="#64748b" fill="#64748b" fillOpacity={0.08} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#64748b' }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        )}

                                        {/* Cadence */}
                                        {chartData.some(d => d.cadence > 0) && (
                                            <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                                <div className="h-[130px] p-3 sm:p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cadencia</h4>
                                                        {activePayload && <span className="text-sm font-black tabular-nums text-emerald-500">{activePayload.cadence} {isPaceBased ? 'ppm' : 'rpm'}</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart
                                                            data={chartData}
                                                            syncId="st"
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="cadence" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#10b981' }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-sm font-bold">Sin datos de análisis</div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 shrink-0">
                            {/* Map - Desktop Solo */}
                            <div className="hidden lg:block h-60 rounded-2xl border border-slate-200 dark:border-zinc-800/40 overflow-hidden shadow-sm">
                                <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} currentPosition={activePayload?.latlng} />
                            </div>

                            {/* Impact Analysis & Coach Summary */}
                            {trainingEffect && (
                                <div className="space-y-4">
                                    <Card className="p-5 overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Impacto del Entrenamiento</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Análisis fisiológico</p>
                                                    {trainingEffect.peakEpoc > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 tabular-nums">Peak EPOC: {trainingEffect.peakEpoc}ml</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight bg-[#1f2de6]/10 dark:bg-[#1f2de6]/15 border border-[#1f2de6]/20 text-[#1f2de6] dark:text-[#4da6ff]`}>
                                                {trainingEffect.primaryBenefit}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Aeróbico</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{trainingEffect.aerobic}</span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={"h-full transition-all duration-1000 " + (trainingEffect.aerobic >= 3 ? "bg-[#1f2de6]" : "bg-[#1f2de6]/60") + ""} style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.aerobicLabel}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Anaeróbico</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{trainingEffect.anaerobic}</span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={"h-full transition-all duration-1000 " + (trainingEffect.anaerobic >= 3 ? "bg-[#1f2de6]" : "bg-[#1f2de6]/60")} style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }} />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.anaerobicLabel}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/40">
                                            <div className="flex gap-2">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-[#1f2de6] shrink-0" />
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                                                    {trainingEffect.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Detailed Insights */}
                                    {fitnessAnalysis && (
                                        <Card className="p-4 overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                            <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <div className="w-1 h-3 bg-[#1f2de6] rounded-full" />
                                                Coach Insights
                                            </h4>
                                            <div className="space-y-3">
                                                {fitnessAnalysis.insights.slice(0, 3).map((insight, idx) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="text-[10px] font-black text-slate-300 dark:text-zinc-700 mt-0.5 shrink-0">0{idx + 1}</div>
                                                        <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 leading-snug">
                                                            {insight}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                )}

                {/* --- pestaña: MAPA --- */}
                {activeTab === 'map' && (
                    <div className="flex-1 min-h-[480px] h-[calc(100dvh-130px)] lg:h-full w-full relative">
                        <InteractiveMap
                            polyline={activity.map_polyline}
                            highResCoords={streams?.latlng?.data}
                            color={themeColor || "#1f2de6"}
                            currentPosition={activePayload?.latlng}
                        />
                        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-md space-y-1 pointer-events-none max-w-[220px]">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Ruta Detallada</h3>
                            <div className="text-[11px] text-slate-600 dark:text-zinc-400 leading-tight">
                                {activity.distance ? `${(activity.distance / 1000).toFixed(2)} km` : ''}
                                {activity.elevation_gain ? ` • +${activity.elevation_gain}m` : ''}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- pestaña: LAPS --- */}
                {activeTab === 'laps' && (
                    <div className="h-full overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-white dark:bg-zinc-950">
                        <div className="max-w-6xl mx-auto space-y-6 pb-12">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/40 pb-3 sm:pb-4">
                                <div className="space-y-1">
                                    <h2 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Análisis Técnico por Intervalos</h2>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium tracking-wide uppercase">Segmentación automática ({isPaceBased ? '1km' : '5km'})</p>
                                </div>
                            </div>

                            <Card className="overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-zinc-900/40">
                                            <tr className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800/40">
                                                <th className="p-3 sm:p-4">#</th>
                                                <th className="p-3 sm:p-4">Tiempo</th>
                                                <th className="p-3 sm:p-4 text-right">Dist (km)</th>
                                                <th className="p-3 sm:p-4 text-right">{isPaceBased ? 'RITMO' : 'VEL'}</th>
                                                {proMetrics.autoLaps.some(l => l.pwrAvg) && <th className="p-3 sm:p-4 text-right">POT (w)</th>}
                                                <th className="p-3 sm:p-4 text-right">FC (bpm)</th>
                                                {proMetrics.autoLaps.some(l => l.cadAvg) && <th className="p-3 sm:p-4 text-right">CAD</th>}
                                                <th className="p-3 sm:p-4 text-right">ELEV</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-zinc-300 divide-y divide-slate-200 dark:divide-zinc-800/40">
                                            {proMetrics.autoLaps.map(lap => {
                                                const isFastest = !isPaceBased
                                                    ? lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed))
                                                    : lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed));

                                                return (
                                                    <tr key={lap.index} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group ${isFastest ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-l-2 border-emerald-400' : ''}`}>
                                                        <td className="p-3 sm:p-4 font-black text-slate-400 dark:text-zinc-600 group-hover:text-[#1f2de6] transition-colors">{lap.index}</td>
                                                        <td className="p-3 sm:p-4 text-slate-900 dark:text-zinc-100">{lap.timeStr}</td>
                                                        <td className="p-3 sm:p-4 text-right opacity-70 font-medium">{lap.distanceKm}</td>
                                                        <td className={`p-3 sm:p-4 text-right font-black ${isFastest ? 'text-emerald-500' : 'text-slate-900 dark:text-zinc-100'}`}>{lap.speedVal}</td>
                                                        {lap.pwrAvg !== null && (
                                                            <td className="p-3 sm:p-4 text-right">
                                                                <span className="text-amber-500 font-black">{lap.pwrAvg}</span>
                                                                <span className="ml-1 text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">w</span>
                                                            </td>
                                                        )}
                                                        <td className="p-3 sm:p-4 text-right">
                                                            <span className="text-rose-500 font-black">{lap.hrAvg}</span>
                                                        </td>
                                                        {lap.cadAvg !== null && <td className="p-3 sm:p-4 text-right text-slate-500 dark:text-zinc-500">{lap.cadAvg}</td>}
                                                        <td className="p-3 sm:p-4 text-right text-slate-500 dark:text-zinc-500 font-medium">+{lap.elev}m</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* --- pestaña: DETALLE (Deep Analysis) --- */}
                {activeTab === 'data' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-8 bg-white dark:bg-zinc-950">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pb-24">

                            {/* --- COLUMNA PRINCIPAL --- */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* Distribución Volumétrica (Zonas) */}
                                {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis) && (
                                    <div className="space-y-3">
                                        <SectionHeader title="Distribución Volumétrica (Zonas)" />
                                        <Card className="p-4 sm:p-6 overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                            <div className="h-[280px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis} margin={{ bottom: 20 }}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.4} />
                                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                        <YAxis hide />
                                                        <RechartsTooltip content={<CustomChartTooltip unit=" min" />} cursor={{ fill: '#f8fafc' }} />
                                                        <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                                            {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis).map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={ZONE_COLORS[index % 5]}
                                                                    fillOpacity={0.9}
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* ClimbPro Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <SectionHeader title="Análisis de Ascensiones (ClimbPro)" />
                                        <span className="text-[11px] font-bold text-[#1f2de6] px-2.5 py-0.5 bg-[#1f2de6]/10 dark:bg-[#1f2de6]/15 rounded-full uppercase tracking-tighter">
                                            {proMetrics.climbPro?.length || 0} Subidas
                                        </span>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-200 dark:border-zinc-800/40 overflow-hidden shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {proMetrics.climbPro?.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-zinc-900/30">
                                                    <tr className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800/40">
                                                        <th className="p-3 sm:p-4">CAT</th>
                                                        <th className="p-3 sm:p-4">Subida</th>
                                                        <th className="p-3 sm:p-4 text-right">DIST (km)</th>
                                                        <th className="p-3 sm:p-4 text-right">GANANCIA</th>
                                                        <th className="p-3 sm:p-4 text-right">GRADO %</th>
                                                        <th className="p-3 sm:p-4 text-right">VAM (m/h)</th>
                                                        <th className="p-3 sm:p-4 text-right">TIEMPO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-zinc-300 divide-y divide-slate-200 dark:divide-zinc-800/40">
                                                    {proMetrics.climbPro.map((climb) => (
                                                        <tr key={climb.index} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group">
                                                            <td className="p-3 sm:p-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                                                    climb.category === 'HC' ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg shadow-black/10' :
                                                                    climb.category === '1' ? 'bg-rose-500 text-white' :
                                                                    climb.category === '2' ? 'bg-orange-500 text-white' :
                                                                    climb.category === '3' ? 'bg-amber-500 text-white' :
                                                                    'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                                }`}>
                                                                    {climb.category}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 sm:p-4 group-hover:text-[#1f2de6] transition-colors">Ascensión {climb.index}</td>
                                                            <td className="p-3 sm:p-4 text-right text-slate-500 dark:text-zinc-500">{climb.distance}</td>
                                                            <td className="p-3 sm:p-4 text-right">+{climb.gain}m</td>
                                                            <td className="p-3 sm:p-4 text-right text-rose-500">{climb.avgGrade}%</td>
                                                            <td className="p-3 sm:p-4 text-right font-black text-slate-900 dark:text-zinc-100">{climb.vam}</td>
                                                            <td className="p-3 sm:p-4 text-right text-slate-500 dark:text-zinc-500 font-medium">{climb.timeStr}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-700" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">Sin ascensiones notables</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metabolic Profile */}
                                <Card className="p-5 overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Perfil Metabólico Estimado</h3>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">Sustratos energéticos basados en intensidad</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-black text-slate-900 dark:text-zinc-100">{proMetrics.workKj}</span>
                                            <span className="ml-1 text-[11px] font-bold text-slate-400 uppercase">kJ Totales</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                                                <span className="text-emerald-500">Grasas ({Math.max(0, 100 - (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                                <span className="text-orange-500">Carbos ({Math.min(100, (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.max(5, 100 - (proMetrics.ifFactor * 100))}%` }} />
                                                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(95, (proMetrics.ifFactor * 100))}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5 pt-2">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enfoque Técnico</span>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                                                    {proMetrics.ifFactor < 0.75
                                                        ? "Optimización de oxidación de grasas y base aeróbica."
                                                        : "Consumo glucolítico alto. Énfasis en potencia táctica."}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recuperación Hist.</span>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                                                    {activity.tss > 100 ? "36-48 horas para supercompensación." : "12-24 horas para estar al 100%."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* --- BARRA LATERAL --- */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* Efficiency Gauges */}
                                <Card className="p-5 overflow-hidden border border-slate-200 dark:border-zinc-800/40 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight mb-4">Métricas de Eficiencia</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                <span>Intensidad (IF)</span>
                                                <span className="text-amber-500 font-black">{proMetrics.ifFactor}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(proMetrics.ifFactor / 1.1) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                <span>Variabilidad (VI)</span>
                                                <span className="text-[#1f2de6] font-black">{proMetrics.vi}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#1f2de6] rounded-full" style={{ width: `${((proMetrics.vi - 1) / 0.3) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                <span>Eficiencia (EF)</span>
                                                <span className="text-rose-500 font-black">{proMetrics.efObj?.value}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `70%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/40">
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed font-bold uppercase italic">
                                            Entrenamiento {parseFloat(proMetrics.vi) > 1.1 ? "Variable (MTB/Crit)" : "Constante (TT/Ritmo)"}
                                        </p>
                                    </div>
                                </Card>

                                {/* Session Highlights */}
                                <div className="space-y-3">
                                    <SectionHeader title="Hitos de la Sesión" />
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-200 dark:border-zinc-800/40 overflow-hidden shadow-sm max-h-[450px] overflow-y-auto custom-scrollbar">
                                        <div className="divide-y divide-slate-200 dark:divide-zinc-800/40">
                                            {proMetrics.powerCurve?.map((peak, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-black text-slate-400">
                                                            {peak.label}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Pico {peak.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-slate-900 dark:text-zinc-100">{peak.value}<span className="text-[11px] ml-1 opacity-50">w</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-50/30 dark:bg-zinc-900/10">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">FC Máxima</span>
                                                <span className="text-sm font-black text-rose-500">{maxHr} <span className="text-[11px] ml-1 font-bold text-slate-400">bpm</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recovery Status */}
                                <Card className="p-5 text-white rounded-2xl shadow-lg shadow-[#1f2de6]/20 border border-[#1f2de6]/30 bg-gradient-to-br from-[#1f2de6] to-[#2e49ff]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">Estado de Recuperación</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-2xl font-black italic">~24H</div>
                                        <div className="text-[11px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded backdrop-blur">Supercompensación OK</div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
