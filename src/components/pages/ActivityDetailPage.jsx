import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap, Target, Info } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { InteractiveMap } from '../activity/ActivityMap';
import { MetricCard, PillTab, CustomChartTooltip, MetricHelp } from '../activity/ActivitySharedUI';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import { formatPace, formatMinsToHMM, formatDuration } from '../../utils/formatters';
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
                setStreams(activity.streams_data);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setLoadingStreams(false);
            } else if (activity.strava_id && fetchStreams) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontSize: '11px', fontWeight: '500', padding: '8px 12px' };

    const handleMouseMove = (state) => {
        if (state && typeof state.activeTooltipIndex !== 'undefined' && state.activeTooltipIndex !== null) {
            const dataPoint = chartData[state.activeTooltipIndex];
            if (dataPoint) setActivePayload(dataPoint);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 bg-slate-50 dark:bg-zinc-950 h-screen overflow-hidden flex flex-col font-sans">
            {/* Premium Header */}
            <header className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 px-6 py-3 shrink-0 z-50">
                {/* Navigation Tabs at the Top */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-zinc-900 pb-2">
                    <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg gap-0.5">
                        <PillTab active={activeTab === 'analyze'} label="Análisis" onClick={() => setActiveTab('analyze')} />
                        <PillTab active={activeTab === 'map'} label="Mapa" onClick={() => setActiveTab('map')} />
                        <PillTab active={activeTab === 'laps'} label="Intervalos" onClick={() => setActiveTab('laps')} />
                        <PillTab active={activeTab === 'data'} label="Detalle" onClick={() => setActiveTab('data')} />
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {activity.strava_id && (
                            <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" 
                               className="px-2 py-1 text-[9px] font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-md transition-colors uppercase tracking-widest">
                                Strava
                            </a>
                        )}
                        <button onClick={() => onDelete && onDelete(activity.id)} className="p-1.5 text-slate-300 dark:text-zinc-600 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <button onClick={onBack} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-slate-400 dark:text-zinc-500">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
                            {activity.name || `${activity.type}`}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 capitalize">{dateStr}</p>
                    </div>
                </div>

                {/* Expanded Compact Metric Grid */}
                <div className="flex flex-wrap gap-2 py-1">
                    <MetricCard label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                    <MetricCard label="Tiempo" value={formatTimeStr(activity.duration)} />
                    <MetricCard label="Desnivel" value={activity.elevation_gain || 0} unit="m" />
                    <MetricCard label="Carga" value={Math.round(activity.tss || 0)} unit="TSS" accent="text-indigo-500" />
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

            {/* 4. Tab Content */}
            <div className="flex-1 overflow-hidden relative">
                {loadingStreams ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-zinc-950/80 z-20">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Procesando telemetría técnica...</span>
                    </div>
                ) : null}

                {/* --- pestaña: ANÁLISIS --- */}
                {activeTab === 'analyze' && (
                    <div className="h-full flex overflow-hidden">
                        {/* Charts Panel */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-white dark:bg-zinc-950">
                            <div className="max-w-5xl mx-auto space-y-3" onMouseLeave={() => setActivePayload(null)}>
                                {chartData.length > 0 ? (
                                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
                                        {/* Velocity/Pace */}
                                        <div className="h-[105px] pt-4 px-6 border-b border-slate-100 dark:border-zinc-800/60">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isPaceBased ? 'Ritmo' : 'Velocidad'}</h4>
                                                        {activePayload && (
                                                            <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded flex items-center gap-2 text-[9px] font-bold tabular-nums">
                                                                <span className="text-slate-600 dark:text-zinc-400">{formatDuration(activePayload.rawTime)}</span>
                                                                <span className="w-px h-2 bg-slate-300 dark:bg-zinc-700"></span>
                                                                <span className="text-indigo-500">{activePayload.distanceKm} km</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-indigo-500">{isPaceBased ? formatPace(activePayload.pace) : activePayload.speed + ' km/h'}</span>}
                                                </div>
                                            <ResponsiveContainer width="100%" height={70}>
                                                <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis reversed={isPaceBased} hide domain={['dataMin', 'dataMax']} />
                                                    <RechartsTooltip content={() => null} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                    <Area type="monotone" dataKey={isPaceBased ? "pace" : "speed"} stroke="#6366f1" fill="#6366f1" fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#6366f1' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Heart Rate */}
                                        {chartData.some(d => d.hr > 0) && (
                                            <div className="h-[105px] pt-4 px-6 border-b border-slate-100 dark:border-zinc-800/60">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FC</h4>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-rose-500">{activePayload.hr} bpm</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={70}>
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                        <RechartsTooltip content={() => null} cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                        <Area type="monotone" dataKey="hr" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f43f5e' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Power */}
                                        {chartData.some(d => d.watts > 0) && (
                                            <div className="h-[105px] pt-4 px-6 border-b border-slate-100 dark:border-zinc-800/60">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Potencia</h4>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-amber-500">{activePayload.watts} w</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={70}>
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin', 'dataMax']} />
                                                        <RechartsTooltip content={() => null} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                        <Area type="monotone" dataKey="watts" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f59e0b' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Altitude */}
                                        {chartData.some(d => d.alt !== null) && (
                                            <div className="h-[105px] pt-4 px-6 border-b border-slate-100 dark:border-zinc-800/60">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Altitud</h4>
                                                        {activePayload?.grade !== undefined && (
                                                            <span className={`text-[9px] font-black ${activePayload.grade > 3 ? 'text-rose-500' : activePayload.grade < -3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {activePayload.grade > 0 ? '+' : ''}{activePayload.grade.toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-slate-500">{activePayload.alt} m</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={70}>
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                        <RechartsTooltip content={() => null} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                        <Area type="monotone" dataKey="alt" stroke="#64748b" fill="#64748b" fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#64748b' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Cadence */}
                                        {chartData.some(d => d.cadence > 0) && (
                                            <div className="h-[105px] pt-4 px-6">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cadencia</h4>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-emerald-500">{activePayload.cadence} {isPaceBased ? 'ppm' : 'rpm'}</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={70}>
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                        <RechartsTooltip content={() => null} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                        <Area type="monotone" dataKey="cadence" stroke="#10b981" fill="#10b981" fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#10b981' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-300 dark:text-zinc-600 text-sm">Sin datos de análisis</div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="w-[380px] border-l border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar p-5 space-y-6 shrink-0">
                            {/* Map */}
                            <div className="h-56 rounded-xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                                <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} currentPosition={activePayload?.latlng} />
                            </div>

                            {/* Impact Analysis & Coach Summary (Unified Premium Section) */}
                            {trainingEffect && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Impacto del Entrenamiento</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Análisis fisiológico</p>
                                                    {trainingEffect.peakEpoc > 0 && (
                                                        <span className="text-[9px] font-bold text-slate-300 dark:text-zinc-700 tabular-nums">Peak EPOC: {trainingEffect.peakEpoc}ml</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 dark:bg-zinc-800 border ${trainingEffect.benefitColor.replace('text-', 'border-').replace('dark:', '')} ${trainingEffect.benefitColor}`}>
                                                {trainingEffect.primaryBenefit}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aeróbico</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{trainingEffect.aerobic}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${trainingEffect.aerobic >= 3 ? 'bg-indigo-500' : 'bg-indigo-400'}`} style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }} />
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.aerobicLabel}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Anaeróbico</span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{trainingEffect.anaerobic}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${trainingEffect.anaerobic >= 3 ? 'bg-purple-600' : 'bg-purple-400'}`} style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }} />
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{trainingEffect.anaerobicLabel}</p>
                                            </div>
                                        </div>

                                        <div className="pt-5 border-t border-slate-50 dark:border-zinc-800/60">
                                            <div className="flex gap-3">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                                                    {trainingEffect.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Insights Slider-like cards */}
                                    {fitnessAnalysis && (
                                        <div className="bg-slate-50/50 dark:bg-zinc-900/40 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/40">
                                            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                Coach Insights
                                            </h4>
                                            <div className="space-y-3">
                                                {fitnessAnalysis.insights.slice(0, 3).map((insight, idx) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="text-[8px] font-black text-slate-300 dark:text-zinc-700 mt-0.5">0{idx + 1}</div>
                                                        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 leading-snug">
                                                            {insight}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                )}

                {/* --- pestaña: MAPA --- */}
                {activeTab === 'map' && (
                    <div className="h-full w-full relative">
                        <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color="#6366f1" />
                        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-4 rounded border border-slate-100 dark:border-zinc-800 shadow-lg space-y-2 pointer-events-none max-w-[200px]">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ruta Detallada</h3>
                            <div className="text-[9px] text-slate-500 leading-tight">Vista técnica a pantalla completa del track GPS.</div>
                        </div>
                    </div>
                )}

                {/* --- pestaña: LAPS --- */}
                {activeTab === 'laps' && (
                    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-zinc-950">
                        <div className="max-w-6xl mx-auto space-y-8 pb-12">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-4">
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Análisis Técnico por Intervalos</h2>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide uppercase">Segmentación automática ({isPaceBased ? '1km' : '5km'})</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-zinc-900/20 rounded-2xl border border-slate-100 dark:border-zinc-800/60 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-zinc-900/40">
                                        <tr className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">
                                            <th className="p-4">#</th>
                                            <th className="p-4">Tiempo</th>
                                            <th className="p-4 text-right">Dist (km)</th>
                                            <th className="p-4 text-right">{isPaceBased ? 'RITMO' : 'V EL'}</th>
                                            {proMetrics.autoLaps.some(l => l.pwrAvg) && <th className="p-4 text-right">POT (w)</th>}
                                            <th className="p-4 text-right">FC (bpm)</th>
                                            {proMetrics.autoLaps.some(l => l.cadAvg) && <th className="p-4 text-right">CAD</th>}
                                            <th className="p-4 text-right">ELEV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-zinc-800/40">
                                        {proMetrics.autoLaps.map(lap => {
                                            // Lógica para resaltar el más rápido
                                            const isFastest = !isPaceBased 
                                                ? lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed))
                                                : lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed));

                                            return (
                                                <tr key={lap.index} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors group ${isFastest ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}>
                                                    <td className="p-4 font-black text-slate-300 dark:text-zinc-700 group-hover:text-indigo-500 transition-colors">{lap.index}</td>
                                                    <td className="p-4 text-slate-900 dark:text-zinc-100">{lap.timeStr}</td>
                                                    <td className="p-4 text-right opacity-60 font-medium">{lap.distanceKm}</td>
                                                    <td className={`p-4 text-right font-black ${isFastest ? 'text-emerald-500' : 'text-slate-900 dark:text-zinc-100'}`}>{lap.speedVal}</td>
                                                    {lap.pwrAvg !== null && (
                                                        <td className="p-4 text-right">
                                                            <span className="text-amber-500 font-black">{lap.pwrAvg}</span>
                                                            <span className="ml-1 text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">w</span>
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-right">
                                                        <span className="text-rose-500 font-black">{lap.hrAvg}</span>
                                                    </td>
                                                    {lap.cadAvg !== null && <td className="p-4 text-right text-slate-400">{lap.cadAvg}</td>}
                                                    <td className="p-4 text-right text-slate-400 font-medium">+{lap.elev}m</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- pestaña: DETALLE (Deep Analysis) --- */}
                {activeTab === 'data' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-zinc-950">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                            
                            {/* --- COLUMNA PRINCIPAL (ANÁLISIS TÉCNICO) --- */}
                            <div className="lg:col-span-8 space-y-8">
                                
                                {/* Distribución Volumétrica (Zones - Top Priority) */}
                                {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis) && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Distribución Volumétrica (Zonas)</h3>
                                    <div className="h-[280px] bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50 p-6 shadow-sm">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis} margin={{ bottom: 20 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                                <YAxis hide />
                                                <RechartsTooltip content={<CustomChartTooltip unit=" min" />} cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                                    {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis).map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={zoneType === 'hr' ? ZONE_COLORS[index] : ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#7c3aed'][index % 7]} 
                                                            fillOpacity={0.85}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                )}

                                {/* ClimbPro Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Análisis de Ascensiones (ClimbPro)</h3>
                                        <span className="text-[9px] font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full uppercase tracking-tighter">
                                            {proMetrics.climbPro?.length || 0} Subidas
                                        </span>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/50 overflow-hidden shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {proMetrics.climbPro?.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-zinc-900/30">
                                                    <tr className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/50">
                                                        <th className="p-4">CAT</th>
                                                        <th className="p-4">Subida</th>
                                                        <th className="p-4 text-right">DIST (km)</th>
                                                        <th className="p-4 text-right">GANANCIA</th>
                                                        <th className="p-4 text-right">GRADO %</th>
                                                        <th className="p-4 text-right">VAM (m/h)</th>
                                                        <th className="p-4 text-right">TIEMPO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-[10px] font-bold tabular-nums text-slate-600 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-zinc-800/30">
                                                    {proMetrics.climbPro.map((climb) => (
                                                        <tr key={climb.index} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group">
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                                                    climb.category === 'HC' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg shadow-black/10' :
                                                                    climb.category === '1' ? 'bg-rose-500 text-white' :
                                                                    climb.category === '2' ? 'bg-orange-500 text-white' :
                                                                    climb.category === '3' ? 'bg-amber-500 text-white' :
                                                                    'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                                }`}>
                                                                    {climb.category}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 group-hover:text-indigo-500 transition-colors">Ascensión {climb.index}</td>
                                                            <td className="p-4 text-right text-slate-400">{climb.distance}</td>
                                                            <td className="p-4 text-right">+{climb.gain}m</td>
                                                            <td className="p-4 text-right text-rose-500">{climb.avgGrade}%</td>
                                                            <td className="p-4 text-right font-black text-slate-900 dark:text-zinc-100">{climb.vam}</td>
                                                            <td className="p-4 text-right text-slate-400 font-medium">{climb.timeStr}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-2 opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-700" />
                                                <p className="text-[9px] font-bold uppercase tracking-widest">Sin ascensiones notables</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metabolic Profile (Bottom) */}
                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Perfil Metabólico Estimado</h3>
                                            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">Sustratos energéticos basados en intensidad</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-black text-slate-900 dark:text-zinc-100">{proMetrics.workKj}</span>
                                            <span className="ml-1 text-[9px] font-bold text-slate-400 uppercase">kJ Totales</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                                                <span className="text-emerald-500">Grasas ({Math.max(0, 100 - (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                                <span className="text-orange-500">Carbos ({Math.min(100, (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.max(5, 100 - (proMetrics.ifFactor * 100))}%` }} />
                                                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(95, (proMetrics.ifFactor * 100))}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-1">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enfoque Técnico</span>
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                                                    {proMetrics.ifFactor < 0.75 
                                                        ? "Optimización de oxidación de grasas y base aeróbica." 
                                                        : "Consumo glucolítico alto. Énfasis en potencia táctica."}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Recuperación Hist.</span>
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 leading-tight">
                                                    {activity.tss > 100 ? "36-48 horas para supercompensación." : "12-24 horas para estar al 100%."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- BARRA LATERAL (MÉTRICAS SECUNDARIAS) --- */}
                            <div className="lg:col-span-4 space-y-6">
                                
                                {/* Efficiency Gauges */}
                                <div className="bg-slate-50 dark:bg-zinc-900/40 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800/50 space-y-6">
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight">Métricas de Eficiencia</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Intensidad (IF)</span>
                                                <span className="text-amber-500 font-black">{proMetrics.ifFactor}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(proMetrics.ifFactor / 1.1) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Variabilidad (VI)</span>
                                                <span className="text-indigo-500 font-black">{proMetrics.vi}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((proMetrics.vi - 1) / 0.3) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Eficiencia (EF)</span>
                                                <span className="text-rose-500 font-black">{proMetrics.efObj?.value}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `70%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/40">
                                        <p className="text-[9px] text-slate-500 dark:text-zinc-400 leading-relaxed font-bold uppercase italic">
                                            Entrenamiento {parseFloat(proMetrics.vi) > 1.1 ? "Variable (MTB/Crit)" : "Constante (TT/Ritmo)"}
                                        </p>
                                    </div>
                                </div>

                                {/* Session Highlights */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Hitos de la Sesión</h3>
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/50 overflow-hidden shadow-sm max-h-[450px] overflow-y-auto custom-scrollbar">
                                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                            {proMetrics.powerCurve?.map((peak, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                            {peak.label}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Pico {peak.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-slate-900 dark:text-zinc-100">{peak.value}<span className="text-[9px] ml-0.5 opacity-50">w</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center p-3.5 bg-slate-50/30 dark:bg-zinc-900/10">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FC Máxima</span>
                                                <span className="text-xs font-black text-rose-500">{maxHr} <span className="text-[9px] font-bold text-slate-400">bpm</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recovery Status (Raised up) */}
                                <div className="bg-emerald-500 dark:bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">Estado de Recuperación</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xl font-black italic">~24H</div>
                                        <div className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded">Supercompensación OK</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
