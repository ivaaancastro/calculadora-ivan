import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';

const decodePolyline = (str, precision = 5) => {
    let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change; lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
};

const MapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] }); }, [map, bounds]);
    return null;
};

const InteractiveMap = ({ polyline, highResCoords, color, currentPosition }) => {
    const [mapType, setMapType] = useState('dark');

    const coords = useMemo(() => {
        if (highResCoords && highResCoords.length > 0) return highResCoords;
        if (polyline) return decodePolyline(polyline);
        return null;
    }, [polyline, highResCoords]);

    if (!coords || coords.length === 0) return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <MapPin size={24} className="text-slate-400 dark:text-zinc-600 mb-2" />
            <span className="text-slate-500 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">Sin datos GPS</span>
        </div>
    );

    const mapSources = {
        light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri' }
    };

    return (
        <div className="w-full h-full rounded-lg overflow-hidden relative border border-slate-200 dark:border-zinc-800 z-0 bg-slate-100 dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="absolute top-3 right-3 z-[400] flex border border-slate-200 dark:border-zinc-700/80 rounded bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-sm overflow-hidden p-0.5">
                {['light', 'dark', 'satellite'].map((type) => (
                    <button
                        key={type} onClick={(e) => { e.stopPropagation(); setMapType(type); }}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase transition-colors rounded-sm ${mapType === type ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                    >
                        {type === 'satellite' ? 'Sat' : type}
                    </button>
                ))}
            </div>

            <MapContainer center={coords[0]} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer key={mapType} url={mapSources[mapType].url} attribution={mapSources[mapType].attribution} />
                <Polyline positions={coords} pathOptions={{ color: mapType === 'light' ? "#ffffff" : "#000000", weight: 6, opacity: 0.3 }} />
                <Polyline positions={coords} pathOptions={{ color: color || "#2563eb", weight: 3, opacity: 1 }} />
                <CircleMarker center={coords[0]} radius={5} pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }} />
                <CircleMarker center={coords[coords.length - 1]} radius={5} pathOptions={{ color: '#ffffff', fillColor: '#18181b', fillOpacity: 1, weight: 2 }} />
                {currentPosition && (
                    <CircleMarker center={currentPosition} radius={7} pathOptions={{ color: '#ffffff', fillColor: color || '#2563eb', fillOpacity: 1, weight: 3 }} />
                )}
                <MapBounds bounds={coords} />
            </MapContainer>
        </div>
    );
};

const MetricBox = ({ label, value, unit, colorClass = "border-slate-300 dark:border-zinc-700", valueColor = "text-slate-800 dark:text-zinc-100", tooltip }) => (
    <div className={`flex flex-col pl-3 border-l-2 py-1 ${colorClass} group relative`}>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
            {label}
            {tooltip && (
                <div className="relative flex items-center cursor-help">
                    <Info size={11} className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-800 dark:bg-zinc-800 text-white text-[10px] leading-relaxed rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 normal-case tracking-normal text-center pointer-events-none">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-zinc-800"></div>
                    </div>
                </div>
            )}
        </span>
        <span className={`text-lg md:text-xl font-mono font-black leading-none ${valueColor}`}>
            {value} {unit && <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold ml-0.5">{unit}</span>}
        </span>
    </div>
);

const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const [streams, setStreams] = useState(null);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const fetchedRef = useRef(null);
    const [activePayload, setActivePayload] = useState(null);

    const isPaceBased = useMemo(() => {
        if (!activity) return false;
        const t = String(activity.type).toLowerCase();
        return t.includes('carrera') || t.includes('run') || t.includes('correr') || t.includes('andar') || t.includes('walk') || t.includes('caminata');
    }, [activity]);

    useEffect(() => {
        if (!activity) return;
        if (fetchedRef.current !== activity.id) {
            fetchedRef.current = activity.id;
            setLoadingStreams(true); setStreams(null);
            if (activity.streams_data) { setStreams(activity.streams_data); setLoadingStreams(false); }
            else if (activity.strava_id) { fetchStreams(activity.id, activity.strava_id).then(data => { setStreams(data); setLoadingStreams(false); }); }
            else { setLoadingStreams(false); }
        }
    }, [activity, fetchStreams]);

    const exactZoneAnalysis = useMemo(() => {
        if (!streams || !streams.heartrate || !streams.time) return null;
        const type = activity.type.toLowerCase();
        const isBike = type.includes('bici') || type.includes('ciclismo');
        const userZones = isBike ? settings.bike.zones : settings.run.zones;
        const hrData = streams.heartrate.data; const timeData = streams.time.data;
        let zoneSeconds = [0, 0, 0, 0, 0];

        for (let i = 1; i < hrData.length; i++) {
            const hr = hrData[i]; const dt = timeData[i] - timeData[i - 1];
            const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
            if (zIndex !== -1) zoneSeconds[zIndex] += dt; else if (hr > userZones[4].max) zoneSeconds[4] += dt;
        }
        const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
        return zoneSeconds.map((sec, i) => ({ zone: i + 1, minutes: sec / 60, pct: totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0 }));
    }, [streams, activity, settings]);

    const proMetrics = useMemo(() => {
        if (!streams || !streams.time) return { cadenceAvg: 0, maxSpeedObj: null, decoupling: null, ef: null, autoLaps: [] };

        let cadenceAvg = 0; let decouplingObj = null; let efObj = null; const autoLaps = [];

        // --- Cadencia Media ---
        if (streams.cadence?.data?.length > 0) {
            const validCadences = streams.cadence.data.filter(c => c > 0);
            if (validCadences.length > 0) {
                const sum = validCadences.reduce((a, b) => a + b, 0);
                cadenceAvg = Math.round(sum / validCadences.length);
                if (isPaceBased) cadenceAvg *= 2;
            }
        }

        // --- Velocidad Máxima ---
        let maxSpeedObj = null;
        if (streams.velocity_smooth?.data?.length > 0) {
            const maxMs = Math.max(...streams.velocity_smooth.data);
            if (isPaceBased) {
                if (maxMs > 0.1) maxSpeedObj = { value: formatPace(16.6666667 / maxMs), unit: '/km', label: 'Ritmo Máx' };
            } else { maxSpeedObj = { value: (maxMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Máxima' }; }
        }

        // --- Efficiency Factor (EF) y Desacople Aeróbico (Pw:Hr / Pa:Hr) ---
        if (streams.heartrate?.data && streams.time.data.length > 1200) { // Mínimo 20 min (1200s) para Decoupling
            const hrData = streams.heartrate.data;
            const timeData = streams.time.data;
            const isPowerBased = !isPaceBased && streams.watts?.data;
            const workData = isPowerBased ? streams.watts.data : streams.velocity_smooth?.data; // Usamos Vatios o Velocidad(m/s)

            if (workData) {
                // Descartar primeros 10 min (600s) de calentamiento
                let startIndex = 0;
                while (startIndex < timeData.length && timeData[startIndex] < 600) { startIndex++; }

                if (startIndex < timeData.length - 600) {
                    const validLength = timeData.length - startIndex;
                    const midLength = Math.floor(validLength / 2);
                    const midIndex = startIndex + midLength;

                    let hrTotal = 0, workTotal = 0, countTotal = 0;
                    let hr1 = 0, work1 = 0, count1 = 0;
                    let hr2 = 0, work2 = 0, count2 = 0;

                    for (let i = startIndex; i < timeData.length; i++) {
                        if (hrData[i] > 80 && workData[i] > (isPowerBased ? 20 : 1)) { // Filtro de ceros/bajadas
                            hrTotal += hrData[i]; workTotal += workData[i]; countTotal++;
                            if (i < midIndex) { hr1 += hrData[i]; work1 += workData[i]; count1++; }
                            else { hr2 += hrData[i]; work2 += workData[i]; count2++; }
                        }
                    }

                    if (countTotal > 300) {
                        const efTotal = (workTotal / countTotal) / (hrTotal / countTotal);

                        // EF Format: Si es potencia mostrar directo (ej 1.45). Si es pace, multiplicar * 60 para hacerlo más legible (ej 0.85).
                        const efVal = isPowerBased ? efTotal : (efTotal * 60);
                        efObj = { value: efVal.toFixed(2), unit: isPowerBased ? 'w/hr' : 'sp/hr' };

                        if (count1 > 150 && count2 > 150) {
                            const ef1 = (work1 / count1) / (hr1 / count1);
                            const ef2 = (work2 / count2) / (hr2 / count2);
                            const decVal = (((ef1 - ef2) / ef1) * 100);

                            // Categorizar Decoupling
                            let color = 'text-green-500'; let label = 'Excelente';
                            if (decVal > 5) { color = 'text-yellow-500'; label = 'Aceptable'; }
                            if (decVal > 8) { color = 'text-red-500'; label = 'Alto'; }
                            if (decVal < -5) { color = 'text-slate-400'; label = 'Negativo'; }

                            decouplingObj = { value: decVal.toFixed(1), color, label };
                        }
                    }
                }
            }
        }

        // --- Auto-Laps ---
        if (streams.distance?.data && streams.time.data && streams.heartrate?.data && streams.velocity_smooth?.data) {
            const distData = streams.distance.data; // en metros
            const hrData = streams.heartrate.data;
            const spdData = streams.velocity_smooth.data; // m/s
            const timeData = streams.time.data;
            const altData = streams.altitude?.data;

            const lapDistance = isPaceBased ? 1000 : 5000; // 1km run, 5km bike
            let currentLapTarget = lapDistance;
            let lapStartIndex = 0;

            for (let i = 0; i < distData.length; i++) {
                if (distData[i] >= currentLapTarget || i === distData.length - 1) {
                    if (i > lapStartIndex) {
                        // Calcular promedios del Lap
                        let hrSum = 0, spdSum = 0, count = 0;
                        for (let j = lapStartIndex; j <= i; j++) {
                            hrSum += hrData[j]; spdSum += spdData[j]; count++;
                        }

                        const lapTimeSecs = timeData[i] - timeData[lapStartIndex];
                        const lapDistMeters = distData[i] - distData[lapStartIndex];
                        const elevGain = altData ? Math.max(0, altData[i] - altData[lapStartIndex]) : 0;
                        const avgSpdMs = spdSum / count;

                        if (lapDistMeters > lapDistance * 0.5) { // Rechazar micro-laps finales
                            autoLaps.push({
                                index: autoLaps.length + 1,
                                timeStr: formatPace(lapTimeSecs / 60),
                                speedVal: isPaceBased ? formatPace(16.6666667 / avgSpdMs) : (avgSpdMs * 3.6).toFixed(1),
                                hrAvg: Math.round(hrSum / count),
                                elev: Math.round(elevGain)
                            });
                        }
                    }
                    lapStartIndex = i;
                    currentLapTarget += lapDistance;
                }
            }
        }

        return { cadenceAvg, maxSpeedObj, decouplingObj, efObj, autoLaps };
    }, [streams, isPaceBased]);

    // 🔥 TRAINING EFFECT ALGORITHM (Estilo Garmin) 🔥
    const trainingEffect = useMemo(() => {
        if (!exactZoneAnalysis) return null;

        const z1m = exactZoneAnalysis[0].minutes;
        const z2m = exactZoneAnalysis[1].minutes;
        const z3m = exactZoneAnalysis[2].minutes;
        const z4m = exactZoneAnalysis[3].minutes;
        const z5m = exactZoneAnalysis[4].minutes;

        // Puntos base Aeróbicos (Z2 y Z3 dan base, Z4 da umbral)
        let aerobicPoints = (z1m * 0.03) + (z2m * 0.08) + (z3m * 0.15) + (z4m * 0.25) + (z5m * 0.10);
        let aerobicScore = Math.min(5.0, aerobicPoints / 1.8).toFixed(1); // Normalizado a max 5.0

        // Puntos base Anaeróbicos (Z5 puro y algo de Z4)
        let anaerobicPoints = (z4m * 0.05) + (z5m * 0.35);
        let anaerobicScore = Math.min(5.0, anaerobicPoints / 1.2).toFixed(1); // Normalizado a max 5.0

        let primaryBenefit = "Recuperación";
        let benefitColor = "text-slate-500 dark:text-zinc-400";

        if (parseFloat(aerobicScore) < 1.5 && parseFloat(anaerobicScore) < 1.0) {
            primaryBenefit = "Recuperación Activa";
            benefitColor = "text-slate-500 dark:text-zinc-400";
        } else if (parseFloat(anaerobicScore) >= 3.0 && parseFloat(anaerobicScore) > parseFloat(aerobicScore) - 1.0) {
            primaryBenefit = "Capacidad Anaeróbica";
            benefitColor = "text-purple-600 dark:text-purple-400";
        } else if (z5m > 6) {
            primaryBenefit = "VO2 Max";
            benefitColor = "text-rose-600 dark:text-rose-500";
        } else if (z4m > 15) {
            primaryBenefit = "Umbral de Lactato";
            benefitColor = "text-amber-600 dark:text-amber-500";
        } else if (z3m > 20) {
            primaryBenefit = "Tempo";
            benefitColor = "text-emerald-600 dark:text-emerald-500";
        } else {
            primaryBenefit = "Base Aeróbica";
            benefitColor = "text-blue-600 dark:text-blue-400";
        }

        const getLabel = (score) => {
            if (score < 1.0) return "Ninguno";
            if (score < 2.0) return "Menor";
            if (score < 3.0) return "Mantenimiento";
            if (score < 4.0) return "Mejora";
            if (score < 5.0) return "Mejora alta";
            return "Sobreesfuerzo";
        };

        return {
            aerobic: parseFloat(aerobicScore),
            anaerobic: parseFloat(anaerobicScore),
            aerobicLabel: getLabel(parseFloat(aerobicScore)),
            anaerobicLabel: getLabel(parseFloat(anaerobicScore)),
            primaryBenefit,
            benefitColor
        };
    }, [exactZoneAnalysis]);

    const chartData = useMemo(() => {
        if (!streams || !streams.time) return [];
        const timeData = streams.time.data; const latlngStream = streams.latlng?.data;
        const step = Math.max(1, Math.floor(timeData.length / 600));
        const data = [];

        for (let i = 0; i < timeData.length; i += step) {
            const ms = streams.velocity_smooth ? streams.velocity_smooth.data[i] : null;
            let speed = null; let pace = null;
            if (ms !== null) {
                speed = Number((ms * 3.6).toFixed(1));
                if (ms > 0.1) { pace = Number((16.666666666667 / ms).toFixed(2)); if (pace > 20) pace = 20; }
                else { pace = 20; }
            }
            data.push({
                time: Math.floor(timeData[i] / 60), hr: streams.heartrate ? streams.heartrate.data[i] : null,
                speed: speed, pace: pace, alt: streams.altitude ? Math.round(streams.altitude.data[i]) : null,
                latlng: latlngStream ? latlngStream[i] : null
            });
        }
        return data;
    }, [streams]);

    const maxHr = useMemo(() => streams?.heartrate?.data?.length > 0 ? Math.max(...streams.heartrate.data) : null, [streams]);

    if (!activity) return null;

    const formatTimeStr = (mins) => { const h = Math.floor(mins / 60); const m = Math.floor(mins % 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
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
    const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontSize: '11px', fontWeight: '500', padding: '8px 12px' };

    const handleMouseMove = (state) => {
        if (state && state.activePayload && state.activePayload.length > 0) setActivePayload(state.activePayload[0].payload);
    };

    return (
        <div className="animate-in fade-in duration-300 pb-12 max-w-[1600px] mx-auto">

            {/* BOTONERA SUPERIOR */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition font-bold px-3 py-1.5 text-[10px] uppercase rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <ArrowLeft size={14} /> Volver
                </button>
                <div className="flex gap-2">
                    {activity.strava_id && (
                        <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#FC4C02]/30 text-[#FC4C02] hover:bg-[#FC4C02]/10 rounded text-[10px] font-bold uppercase transition">
                            <ExternalLink size={12} /> Strava
                        </a>
                    )}
                    {onDelete && (
                        <button onClick={() => { if (window.confirm("¿Borrar actividad?")) { onDelete(activity.id); onBack(); } }} className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COLUMNA IZQUIERDA (KPIs + Training Effect) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* CABECERA (KPIs) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">
                            <Calendar size={12} /> {dateStr}
                            <span className="px-1.5 py-0.5 rounded text-[9px] text-white ml-1" style={{ backgroundColor: themeColor }}>{activity.type}</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-tight mb-6">
                            {activity.name || `${activity.type} Activity`}
                        </h1>

                        <div className="flex flex-col gap-6 border-t border-slate-200 dark:border-zinc-800 pt-5">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin size={12} /> Carga Externa</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricBox label="Tiempo" value={formatTimeStr(activity.duration)} />
                                    <MetricBox label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                                    <MetricBox label="Desnivel" value={activity.elevation_gain || 0} unit="m" />
                                    {activity.calories > 0 && <MetricBox label="Energía" value={activity.calories} unit="kcal" />}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Target size={12} /> Rendimiento</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {speedMetric && <MetricBox label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} />}
                                    {proMetrics.maxSpeedObj && <MetricBox label={proMetrics.maxSpeedObj.label} value={proMetrics.maxSpeedObj.value} unit={proMetrics.maxSpeedObj.unit} />}
                                    {proMetrics.cadenceAvg > 0 && <MetricBox label="Cadencia Med" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'spm' : 'rpm'} />}
                                    {activity.watts_avg > 0 && <MetricBox label="Potencia Med" value={Math.round(activity.watts_avg)} unit="W" colorClass="border-amber-500" />}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Heart size={12} /> Fisiología</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <MetricBox label="Carga" value={activity.tss} unit="TSS" colorClass="border-blue-500" valueColor="text-blue-600 dark:text-blue-400" />
                                    {activity.hr_avg > 0 && <MetricBox label="Pulso Medio" value={Math.round(activity.hr_avg)} unit="ppm" colorClass="border-rose-500" />}
                                    {maxHr > 0 && <MetricBox label="Pulso Máx" value={maxHr} unit="ppm" />}
                                    {proMetrics.efObj && <MetricBox label="Factor Eficiencia" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} colorClass="border-purple-500" valueColor="text-purple-600 dark:text-purple-400" tooltip="Relación entre tu potencia/velocidad y el pulso medio. A mayor valor, mejor eficiencia metabólica en esta zona de trabajo." />}
                                    {proMetrics.decouplingObj && (
                                        <MetricBox
                                            label="Desacople"
                                            value={`${proMetrics.decouplingObj.value > 0 ? '+' : ''}${proMetrics.decouplingObj.value}`} unit="%"
                                            colorClass={proMetrics.decouplingObj.color.includes('green') ? "border-emerald-500" : (proMetrics.decouplingObj.color.includes('yellow') ? "border-yellow-500" : "border-rose-500")}
                                            valueColor={proMetrics.decouplingObj.color}
                                            tooltip={`Estado: ${proMetrics.decouplingObj.label}. Compara la eficiencia (Velocidad / Pulso) de la 1ª mitad del entreno con la 2ª. Un valor menor al 5% indica una gran resistencia base para este esfuerzo.`}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🔥 TRAINING EFFECT (GARMIN STYLE) 🔥 */}
                    {trainingEffect && !loadingStreams && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
                            <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2">
                                <Target size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5} /> Beneficio del Entrenamiento (Training Effect)
                            </h3>

                            <div className="flex flex-col gap-5 justify-between flex-1">
                                {/* Etiqueta Principal */}
                                <div className="flex flex-col items-center justify-center py-5 px-4 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Impacto Principal</span>
                                    <span className={`text-xl font-black uppercase tracking-tight text-center ${trainingEffect.benefitColor}`}>
                                        {trainingEffect.primaryBenefit}
                                    </span>
                                </div>

                                {/* Barras */}
                                <div className="flex flex-col gap-4">
                                    {/* Barra Aeróbica */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Carga Aeróbica</span>
                                            <span className="text-base font-black text-blue-500 leading-none">{trainingEffect.aerobic.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase text-right tracking-widest">{trainingEffect.aerobicLabel}</span>
                                    </div>

                                    {/* Barra Anaeróbica */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Carga Anaeróbica</span>
                                            <span className="text-base font-black text-purple-500 leading-none">{trainingEffect.anaerobic.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase text-right tracking-widest">{trainingEffect.anaerobicLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMNA CENTRAL-DERECHA (Gráficas, Mapa, Zonas) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Mapa y Zonas (Mitad superior) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[350px]">
                        {/* Mapa */}
                        <div className="w-full h-[300px] lg:h-full relative z-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} currentPosition={activePayload?.latlng} />
                        </div>

                        {/* Zonas Cardíacas */}
                        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col h-full overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
                                <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Zonas Cardíacas</h3>
                                {loadingStreams && <Loader2 size={12} className="animate-spin text-slate-500" />}
                            </div>
                            {loadingStreams ? (
                                <div className="space-y-4 animate-pulse pt-2">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-full"></div>)}
                                </div>
                            ) : exactZoneAnalysis ? (
                                <div className="space-y-4 pt-1 flex-1 flex flex-col justify-center">
                                    {exactZoneAnalysis.map((data, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-24 shrink-0"><span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{ZONE_LABELS[i]}</span></div>
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div className="h-full" style={{ width: `${Math.max(1, data.pct)}%`, backgroundColor: ZONE_COLORS[i] }}></div>
                                            </div>
                                            <div className="w-20 shrink-0 flex justify-between items-center text-[10px] font-mono">
                                                <span className="text-slate-800 dark:text-zinc-200 font-black">{Math.round(data.minutes)}m</span>
                                                <span className="text-slate-500 dark:text-zinc-500">{Math.round(data.pct)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-[10px] text-slate-500 dark:text-zinc-500 text-center m-auto">Sin datos cardíacos.</p>}
                        </div>
                    </div>

                    {/* Telemetría (Mitad Inferior) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col flex-1 min-h-[500px] lg:min-h-0">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
                            <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Telemetría (Streams)</h3>
                        </div>

                        {loadingStreams ? (
                            <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-slate-500 dark:text-zinc-600" /></div>
                        ) : chartData.length > 0 ? (
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex-1 w-full min-h-[200px]">
                                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">
                                        {isPaceBased ? 'Ritmo y Altimetría' : 'Velocidad y Altimetría'}
                                    </h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: themeColor }} domain={isPaceBased ? ['dataMin - 0.5', 'dataMax + 1'] : [0, dataMax => Math.ceil(dataMax * 1.1)]} axisLine={false} tickLine={false} reversed={isPaceBased} tickFormatter={isPaceBased ? formatPace : undefined} />
                                            <YAxis yAxisId="right" orientation="right" hide domain={['dataMin', dataMax => Math.ceil(dataMax * 1.15)]} />
                                            <RechartsTooltip
                                                contentStyle={tooltipStyle}
                                                labelFormatter={(val) => `Minuto ${val}`}
                                                formatter={(value, name) => {
                                                    if (name === 'pace') return [`${formatPace(value)} /km`, 'Ritmo'];
                                                    if (name === 'speed') return [`${value} km/h`, 'Velocidad'];
                                                    if (name === 'alt') return [`${value} m`, 'Altitud'];
                                                    return [value, name];
                                                }}
                                                cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                isAnimationActive={false}
                                            />
                                            <Area yAxisId="right" type="monotone" dataKey="alt" name="alt" stroke="#71717a" fillOpacity={0.1} fill="#71717a" isAnimationActive={false} activeDot={false} dot={false} />
                                            <Area yAxisId="left" type="monotone" dataKey={isPaceBased ? "pace" : "speed"} name={isPaceBased ? "pace" : "speed"} stroke={themeColor} strokeWidth={2} fillOpacity={0.1} fill={themeColor} isAnimationActive={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: themeColor }} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="flex-1 w-full min-h-[200px]">
                                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">Pulsaciones</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#ef4444' }} domain={['dataMin - 5', dataMax => Math.ceil(dataMax * 1.1)]} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                contentStyle={tooltipStyle}
                                                labelFormatter={(val) => `Minuto ${val}`}
                                                formatter={(value, name) => name === 'hr' ? [`${value} ppm`, 'Pulso'] : [value, name]}
                                                cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                isAnimationActive={false}
                                            />
                                            <Area type="monotone" dataKey="hr" name="hr" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" isAnimationActive={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#ef4444' }} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-600">
                                <p className="text-[10px] uppercase tracking-widest font-bold">Sin datos de telemetría</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 🔥 AUTO-LAPS (SPLITS) 🔥 */}
            {proMetrics.autoLaps?.length > 0 && !loadingStreams && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 shadow-sm mt-6">
                    <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <Layers size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5} /> Vueltas / Splits ({isPaceBased ? '1 km' : '5 km'})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-800">
                                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Lap</th>
                                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Tiempo</th>
                                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{isPaceBased ? 'Ritmo' : 'Velocidad'}</th>
                                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Pulso</th>
                                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Desnivel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proMetrics.autoLaps.map((lap) => (
                                    <tr key={lap.index} className="border-b last:border-0 border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="py-2.5 px-3 text-[11px] font-bold text-slate-600 dark:text-zinc-400">{lap.index}</td>
                                        <td className="py-2.5 px-3 text-sm font-mono font-bold text-slate-700 dark:text-zinc-300">{lap.timeStr}</td>
                                        <td className="py-2.5 px-3 text-sm font-mono font-bold" style={{ color: themeColor }}>{lap.speedVal} <span className="text-[10px] opacity-70 font-sans">{isPaceBased ? '/km' : 'km/h'}</span></td>
                                        <td className="py-2.5 px-3 text-sm font-mono font-bold text-rose-500">{lap.hrAvg} <span className="text-[10px] opacity-70 font-sans">ppm</span></td>
                                        <td className="py-2.5 px-3 text-sm font-mono font-bold text-slate-500 dark:text-zinc-400">+{lap.elev} <span className="text-[10px] opacity-70 font-sans">m</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};