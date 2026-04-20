import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import { calculateTrainingEffect } from '../../utils/fitnessStatsEngine';

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
                    <>
                        {/* Efecto de resplandor */}
                        <CircleMarker
                            center={currentPosition}
                            radius={10}
                            pathOptions={{ color: 'transparent', fillColor: color || '#2563eb', fillOpacity: 0.3, weight: 0 }}
                        />
                        {/* Puntero central */}
                        <CircleMarker
                            center={currentPosition}
                            radius={5}
                            pathOptions={{ color: '#ffffff', fillColor: color || '#2563eb', fillOpacity: 1, weight: 2 }}
                        />
                    </>
                )}
                <MapBounds bounds={coords} />
            </MapContainer>
        </div>
    );
};

const MetricCard = ({ label, value, unit, accent }) => (
    <div className="flex flex-col min-w-0 py-1.5 px-3 bg-slate-50/50 dark:bg-zinc-900/40 rounded-xl border border-slate-100/50 dark:border-zinc-800/40">
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-tight truncate">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-sm font-bold tracking-tight ${accent || 'text-slate-900 dark:text-zinc-100'}`}>{value}</span>
            {unit && <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">{unit}</span>}
        </div>
    </div>
);

const PillTab = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${active 
            ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm' 
            : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
    >
        {label}
    </button>
);

const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return "--:--";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatMinsToHMM = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`;
};

const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;
        let displayValue = payload[0].value;
        let displayUnit = unit;

        if (unit.trim() === "min") {
            displayValue = formatMinsToHMM(payload[0].value);
            displayUnit = "";
        }
        
        return (
            <div className="bg-zinc-900/95 border border-zinc-700/80 p-2 rounded-lg shadow-2xl text-[10px] font-bold text-zinc-100 min-w-[90px] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 uppercase tracking-widest text-[8px]">{label || 'Métrica'}</span>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-white text-xs">{displayValue}</span>
                        <span className="text-[8px] text-zinc-500 font-medium">{displayUnit}</span>
                    </div>
                </div>
                {data?.range && (
                    <p className="mt-1 text-[8px] text-zinc-400 font-medium opacity-60 italic">{data.range}</p>
                )}
            </div>
        );
    }
    return null;
};

const MetricHelp = ({ title, text, optimal }) => (
    <div className="group relative inline-block ml-1 align-middle">
        <Info size={10} className="text-slate-300 dark:text-zinc-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
            <p className="text-[9px] font-bold text-zinc-100 mb-1 uppercase tracking-widest">{title}</p>
            <p className="text-[9px] leading-relaxed text-zinc-400 mb-1.5">{text}</p>
            {optimal && (
                <div className="pt-1 border-t border-zinc-800 flex items-center gap-1">
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Óptimo:</span>
                    <span className="text-[8px] text-zinc-300">{optimal}</span>
                </div>
            )}
        </div>
    </div>
);

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
    const [streams, setStreams] = useState(null);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const fetchedRef = useRef(null);
    const [activePayload, setActivePayload] = useState(null);
    const [activeTab, setActiveTab] = useState('analyze');
    const [zoneType, setZoneType] = useState('hr'); // 'hr' or 'power'

    const isPaceBased = useMemo(() => {
        if (!activity) return false;
        const t = String(activity.type).toLowerCase();
        return t.includes('carrera') || t.includes('run') || t.includes('correr') || t.includes('andar') || t.includes('walk') || t.includes('caminata');
    }, [activity]);


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

    const exactZoneAnalysis = useMemo(() => {
        if (!streams || !streams.heartrate || !streams.time) return null;
        const type = activity.type.toLowerCase();
        const isBike = type.includes('bici') || type.includes('ciclismo');
        const userZones = isBike ? settings.bike.zones : settings.run.zones;
        const hrData = streams.heartrate.data; const timeData = streams.time.data;
        let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 1; i < hrData.length; i++) {
            const hr = hrData[i]; const dt = timeData[i] - timeData[i - 1];
            const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
            if (zIndex !== -1) zoneSeconds[zIndex] += dt; else if (hr > userZones[userZones.length - 1].max) zoneSeconds[userZones.length - 1] += dt;
        }
        const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
        return zoneSeconds.map((sec, i) => {
            const zMin = userZones[i]?.min || 0;
            const zMax = userZones[i]?.max || '+';
            return {
                zone: i + 1,
                label: `Z${i + 1}`,
                minutes: Math.round(sec / 60),
                pct: totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0,
                range: i === userZones.length - 1 ? `> ${zMin}` : `${zMin} - ${zMax}`
            };
        });
    }, [streams, activity, settings]);

    const exactPacePowerZoneAnalysis = useMemo(() => {
        if (!streams || !streams.time) return null;
        const timeData = streams.time.data;

        if (isPaceBased && streams.velocity_smooth) {
            const velData = streams.velocity_smooth.data;
            const paceZones = settings.run?.paceZones;
            if (!paceZones || paceZones.length === 0) return null;

            // Pace zones are defined by speed ranges. 'min' in pace is max speed.
            // But paceZones has pctMin and pctMax of threshold speed.
            // Just map velocity_smooth (m/s) to the zones
            const tpPaceStr = settings.run.thresholdPace || '4:30';
            const [m, s] = tpPaceStr.split(':');
            const tpSecs = (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
            const tpSpeedMs = 1000 / tpSecs;

            // Recompute threshold ranges if paceZones doesn't explicitly have ms limits
            const pzMs = [
                { sMin: 0, sMax: 0.775 },
                { sMin: 0.785, sMax: 0.877 },
                { sMin: 0.887, sMax: 0.943 },
                { sMin: 0.953, sMax: 1.00 },
                { sMin: 1.01, sMax: 1.034 },
                { sMin: 1.044, sMax: 1.115 },
                { sMin: 1.125, sMax: 1.30 }
            ];

            let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 1; i < velData.length; i++) {
                const vel = velData[i]; const dt = timeData[i] - timeData[i - 1];
                if (vel < 0.2) continue; // Solo ignorar si está totalmente parado
                const pct = vel / tpSpeedMs;
                const zIndex = pzMs.findIndex(z => pct >= z.sMin && pct <= z.sMax);
                if (zIndex !== -1) zoneSeconds[zIndex] += dt;
                else if (pct > pzMs[6].sMax) zoneSeconds[6] += dt;
                else if (pct < pzMs[0].sMin) zoneSeconds[0] += dt; // fallback
            }
            const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
            if (totalSeconds === 0) return null;

            const formatSpeedToPace = (speed) => {
                if (!speed || speed <= 0) return '∞';
                const secsPerKm = 1000 / speed;
                const m = Math.floor(secsPerKm / 60);
                const s = Math.floor(secsPerKm % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };

            return zoneSeconds.map((sec, i) => {
                const zMinSpeed = pzMs[i].sMin * tpSpeedMs;
                const zMaxSpeed = pzMs[i].sMax * tpSpeedMs;
                const minPace = formatSpeedToPace(zMaxSpeed); // max speed is min pace
                const maxPace = formatSpeedToPace(zMinSpeed);

                let rangeStr = '';
                if (i === 0) rangeStr = `> ${minPace}`;
                else if (i === 6) rangeStr = `< ${maxPace}`;
                else rangeStr = `${minPace} - ${maxPace}`;

                return {
                    zone: i + 1,
                    minutes: Math.round(sec / 60),
                    pct: (sec / totalSeconds) * 100,
                    label: `Z${i + 1}`,
                    range: rangeStr
                };
            });
        }

        if (!isPaceBased && streams.watts) {
            const powerData = streams.watts.data;
            const ftp = settings.bike?.ftp || 200;
            const pz = [
                { pMin: 0, pMax: 0.55 },
                { pMin: 0.56, pMax: 0.75 },
                { pMin: 0.76, pMax: 0.90 },
                { pMin: 0.91, pMax: 1.05 },
                { pMin: 1.06, pMax: 1.20 },
                { pMin: 1.21, pMax: 1.50 },
                { pMin: 1.51, pMax: 2.00 },
            ];
            let zoneSeconds = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 1; i < powerData.length; i++) {
                const w = powerData[i]; const dt = timeData[i] - timeData[i - 1];
                const pct = w / ftp;
                const zIndex = pz.findIndex(z => pct >= z.pMin && pct <= z.pMax);
                if (zIndex !== -1) zoneSeconds[zIndex] += dt;
                else if (pct > pz[6].pMax) zoneSeconds[6] += dt;
            }
            const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
            if (totalSeconds === 0) return null;
            const labels = ['Z1 Recovery', 'Z2 Endurance', 'Z3 Tempo', 'Z4 Threshold', 'Z5 VO2 Max', 'Z6 Anaerobic', 'Z7 Neuromusc'];
            return zoneSeconds.map((sec, i) => {
                const zMin = Math.round(pz[i].pMin * ftp);
                const zMax = Math.round(pz[i].pMax * ftp);
                let rangeStr = `${zMin}-${zMax}w`;
                if (i === 6) rangeStr = `> ${zMin}w`;
                if (i === 0) rangeStr = `< ${zMax}w`;
                return {
                    zone: i + 1,
                    label: labels[i],
                    minutes: Math.round(sec / 60),
                    pct: (sec / totalSeconds) * 100,
                    range: rangeStr
                };
            });
        }

        return null;
    }, [streams, isPaceBased, settings]);

    const proMetrics = useMemo(() => {
        if (!streams || !streams.time) return { cadenceAvg: 0, maxSpeedObj: null, decoupling: null, ef: null, autoLaps: [] };

        let cadenceAvg = 0; let decouplingObj = null; let efObj = null; const autoLaps = [];
        let avgWatts = 0; let maxWatts = 0; let npWatts = 0;

        // --- Potencia (Watts) ---
        if (streams.watts?.data?.length > 0) {
            const wData = streams.watts.data;
            const validWatts = wData.filter(w => w >= 0);
            if (validWatts.length > 0) {
                avgWatts = Math.round(validWatts.reduce((a, b) => a + b, 0) / validWatts.length);
                maxWatts = Math.max(...validWatts);

                // --- Normalized Power (NP) ---
                // 30s rolling average, 4th power average, 4th root
                if (wData.length > 30) {
                    let rollingSum = 0;
                    const rollingAvg4th = [];
                    for (let i = 0; i < wData.length; i++) {
                        rollingSum += wData[i];
                        if (i >= 30) {
                            rollingSum -= wData[i - 30];
                            const avg = rollingSum / 30;
                            rollingAvg4th.push(Math.pow(avg, 4));
                        }
                    }
                    if (rollingAvg4th.length > 0) {
                        const avg4th = rollingAvg4th.reduce((a, b) => a + b, 0) / rollingAvg4th.length;
                        npWatts = Math.round(Math.pow(avg4th, 0.25));
                    }
                }
            }
        }

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
                        efObj = { value: efVal.toFixed(2), unit: isPowerBased ? 'w/bpm' : 'm/bpm' };

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

        // --- Real Laps (Garmin/Strava) with Auto-Lap Fallback ---
        if (streams.laps && streams.laps.length > 0) {
            // Priority: Use the official laps marked on the device
            streams.laps.forEach((lap, idx) => {
                const lapTimeMin = lap.moving_time / 60;
                const lapDistKm = lap.distance / 1000;
                const avgSpdMs = lap.average_speed || (lap.distance / (lap.moving_time || 1));

                autoLaps.push({
                    index: idx + 1,
                    name: lap.name,
                    timeStr: formatPace(lapTimeMin),
                    speedVal: isPaceBased ? formatPace(16.6666667 / avgSpdMs) : (avgSpdMs * 3.6).toFixed(1),
                    rawSpeed: avgSpdMs,
                    hrAvg: Math.round(lap.average_heartrate) || 0,
                    pwrAvg: lap.average_watts ? Math.round(lap.average_watts) : null,
                    cadAvg: lap.average_cadence ? Math.round(lap.average_cadence) : null,
                    elev: Math.round(lap.total_elevation_gain) || 0,
                    distanceKm: lapDistKm.toFixed(2)
                });
            });
        } else if (streams.distance?.data && streams.time.data && streams.heartrate?.data && streams.velocity_smooth?.data) {
            // Fallback: Generate synthetic 1km/5km laps
            const distData = streams.distance.data;
            const hrData = streams.heartrate.data;
            const spdData = streams.velocity_smooth.data;
            const timeData = streams.time.data;
            const altData = streams.altitude?.data;
            const wattData = streams.watts?.data;
            const cadData = streams.cadence?.data;

            const lapDistance = isPaceBased ? 1000 : 5000;
            let currentLapTarget = lapDistance;
            let lapStartIndex = 0;

            for (let i = 0; i < distData.length; i++) {
                if (distData[i] >= currentLapTarget || i === distData.length - 1) {
                    if (i > lapStartIndex) {
                        let hrSum = 0, spdSum = 0, pwrSum = 0, cadSum = 0, count = 0;
                        for (let j = lapStartIndex; j <= i; j++) {
                            hrSum += hrData[j]; 
                            spdSum += spdData[j]; 
                            if (wattData) pwrSum += wattData[j];
                            if (cadData) cadSum += cadData[j];
                            count++;
                        }

                        const lapTimeSecs = timeData[i] - timeData[lapStartIndex];
                        const lapDistMeters = distData[i] - distData[lapStartIndex];
                        const elevGain = altData ? Math.max(0, altData[i] - altData[lapStartIndex]) : 0;
                        const avgSpdMs = spdSum / count;

                        if (lapDistMeters > lapDistance * 0.3) { 
                            autoLaps.push({
                                index: autoLaps.length + 1,
                                timeStr: formatPace(lapTimeSecs / 60),
                                speedVal: isPaceBased ? formatPace(16.6666667 / avgSpdMs) : (avgSpdMs * 3.6).toFixed(1),
                                rawSpeed: avgSpdMs,
                                hrAvg: Math.round(hrSum / count),
                                pwrAvg: wattData ? Math.round(pwrSum / count) : null,
                                cadAvg: cadData ? Math.round(cadSum / count) : null,
                                elev: Math.round(elevGain),
                                distanceKm: (lapDistMeters / 1000).toFixed(2)
                            });
                        }
                    }
                    lapStartIndex = i;
                    currentLapTarget += lapDistance;
                }
            }
        }

        // --- Power Duration Curve & Advanced Power Metrics ---
        let powerCurve = [];
        let vi = 0;
        let ifFactor = 0;
        let workKj = 0;

        if (streams.watts?.data?.length > 30) {
            const wData = streams.watts.data;
            
            // Determinar umbral según tipo de actividad
            let thresholdPower = 200;
            if (!isPaceBased) {
                thresholdPower = settings.bike?.ftp || 200;
            } else {
                const paceStr = settings.run?.thresholdPace || '4:30';
                const [m, s] = paceStr.split(':');
                const paceSecs = (parseInt(m) || 4) * 60 + (parseInt(s) || 30);
                const weight = Number(settings.weight) || 75;
                thresholdPower = (1000 / paceSecs) * weight * 1.05;
            }
            
            // Variability Index (VI)
            if (avgWatts > 0) vi = Number((npWatts / avgWatts).toFixed(2));
            
            // Intensity Factor (IF)
            ifFactor = Number((npWatts / thresholdPower).toFixed(2));
            
            // Work (kJ)
            const durationSecs = streams.time.data[streams.time.data.length - 1];
            workKj = Math.round((avgWatts * durationSecs) / 1000);

            // Power Curve (Best X duration)
            const getBestPower = (seconds) => {
                if (wData.length < seconds) return 0;
                let maxAvg = 0;
                let currentSum = 0;
                for (let i = 0; i < wData.length; i++) {
                    currentSum += wData[i];
                    if (i >= seconds) {
                        currentSum -= wData[i - seconds];
                        const avg = currentSum / seconds;
                        if (avg > maxAvg) maxAvg = avg;
                    }
                }
                return Math.round(maxAvg);
            };

            powerCurve = [
                { label: '1s', value: getBestPower(1) },
                { label: '5s', value: getBestPower(5) },
                { label: '30s', value: getBestPower(30) },
                { label: '1m', value: getBestPower(60) },
                { label: '5m', value: getBestPower(300) },
                { label: '10m', value: getBestPower(600) },
                { label: '20m', value: getBestPower(1200) }
            ];
        }

        // --- ClimbPro: Automatic Climb Detection ---
        const climbPro = [];
        if (streams.altitude?.data && streams.distance?.data) {
            const altData = streams.altitude.data;
            const distData = streams.distance.data;
            const timeData = streams.time.data;
            
            let inClimb = false;
            let climbStartIdx = 0;
            
            for (let i = 10; i < distData.length; i += 5) {
                const dAlt = altData[i] - altData[i - 10];
                const dDist = distData[i] - distData[i - 10];
                const grade = dDist > 0 ? (dAlt / dDist) * 100 : 0;

                if (!inClimb && grade > 3.0) {
                    inClimb = true;
                    climbStartIdx = i - 10;
                } else if (inClimb && (grade < 0.5 || i === distData.length - 1)) {
                    const cDist = distData[i] - distData[climbStartIdx];
                    const cGain = altData[i] - altData[climbStartIdx];
                    const cTime = timeData[i] - timeData[climbStartIdx];
                    
                    if (cDist > 400 && cGain > 15) {
                        const avgGrade = (cGain / cDist) * 100;
                        const vam = Math.round((cGain / cTime) * 3600);
                        
                        // UCI Categorization
                        const difficulty = cDist * avgGrade; // Simplified Fiets Index
                        let category = "4";
                        if (difficulty > 64000) category = "HC";
                        else if (difficulty > 48000) category = "1";
                        else if (difficulty > 32000) category = "2";
                        else if (difficulty > 16000) category = "3";

                        climbPro.push({
                            index: climbPro.length + 1,
                            distance: (cDist / 1000).toFixed(2),
                            gain: Math.round(cGain),
                            avgGrade: avgGrade.toFixed(1),
                            vam: vam,
                            category: category,
                            timeStr: formatDuration(cTime)
                        });
                    }
                    inClimb = false;
                }
            }
        }

        return { cadenceAvg, maxSpeedObj, decouplingObj, efObj, autoLaps, avgWatts, maxWatts, npWatts, vi, ifFactor, workKj, powerCurve, climbPro };
    }, [streams, isPaceBased]);

    // 🔥 TRAINING EFFECT ALGORITHM (Powered by Garmin-style EPOC Engine) 🔥
    const trainingEffect = useMemo(() => {
        if (!activity || !settings) return null;
        // Delegamos el cálculo al motor central para consistencia máxima
        const result = calculateTrainingEffect({
            ...activity,
            streams_data: streams // Pasamos los streams actuales
        }, settings);

        if (!result) return null;

        // Mapeo retrocompatible para la UI existente
        return {
            aerobic: result.aerobic.score,
            anaerobic: result.anaerobic.score,
            description: result.benefitDesc,
            aerobicLabel: result.aerobic.label,
            anaerobicLabel: result.anaerobic.label,
            primaryBenefit: result.primaryBenefit,
            benefitColor: result.aerobic.color, // Color dinámico según intensidad
            peakEpoc: result.peakEpoc
        };
    }, [streams, activity, settings]);

    const chartData = useMemo(() => {
        if (!streams || !streams.time) return [];
        const timeData = streams.time.data; 
        const distData = streams.distance?.data;
        const altData = streams.altitude?.data;
        const latlngStream = streams.latlng?.data;
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

            // Cálculo de Pendiente (%)
            let slope = 0;
            if (i > 0 && distData && altData) {
                const prevIdx = Math.max(0, i - step);
                const dAlt = altData[i] - altData[prevIdx];
                const dDist = distData[i] - distData[prevIdx];
                if (dDist > 1) { // Evitar división por cero o ruido extremo
                    slope = (dAlt / dDist) * 100;
                    if (slope > 30) slope = 30; // Cap at 30% to avoid GPS spikes
                    if (slope < -30) slope = -30;
                }
            }

            data.push({
                time: Math.floor(timeData[i] / 60),
                rawTime: timeData[i],
                distanceKm: distData ? (distData[i] / 1000).toFixed(2) : null,
                grade: slope,
                hr: streams.heartrate ? streams.heartrate.data[i] : null,
                speed: speed,
                pace: pace,
                alt: altData ? Math.round(altData[i]) : null,
                watts: streams.watts ? streams.watts.data[i] : null,
                cadence: streams.cadence ? streams.cadence.data[i] : null,
                temp: streams.temp ? streams.temp.data[i] : null,
                latlng: latlngStream ? latlngStream[i] : null
            });
        }
        return data;
    }, [streams]);

    const maxHr = useMemo(() => streams?.heartrate?.data?.length > 0 ? Math.max(...streams.heartrate.data) : null, [streams]);

    const fitnessAnalysis = useMemo(() => {
        if (!trainingEffect || !proMetrics) return null;

        let title = "Análisis del Coach";
        let score = 50;
        let insights = [];
        let nextStep = "";

        const { ifFactor, decouplingObj, powerCurve, npWatts, workKj } = proMetrics;
        const { primaryBenefit, aerobic, anaerobic } = trainingEffect;

        // 1. Análisis de Intensidad (IF)
        if (ifFactor >= 0.95) {
            insights.push(`Has trabajado a una intensidad altísima (${ifFactor}), prácticamente a nivel de competición. Este estímulo es excelente para mejorar tu techo de rendimiento, pero requiere una recuperación profunda.`);
            score += 20;
        } else if (ifFactor >= 0.85) {
            insights.push(`Sesión de intensidad sólida (${ifFactor}). Has pasado gran parte del tiempo en zonas exigentes, lo que fortalecerá tu resistencia específica.`);
            score += 15;
        } else if (ifFactor <= 0.70 && ifFactor > 0) {
            insights.push(`Buen control de la intensidad (${ifFactor}). Te has mantenido en niveles de base o recuperación, permitiendo sumar volumen sin quemarte.`);
            score += 10;
        }

        // 2. Estabilidad Aeróbica (Drift/Decoupling)
        if (decouplingObj) {
            const drift = parseFloat(decouplingObj.value);
            if (drift > 10) {
                insights.push(`He detectado un desacople aeróbico alto (${drift}%). Tu pulso ha subido significativamente para mantener la misma potencia; esto sugiere fatiga acumulada, deshidratación o falta de adaptación al calor.`);
                score -= 15;
            } else if (drift > 5) {
                insights.push(`Desacople moderado (${drift}%). Hay algo de deriva cardiaca, normal en sesiones largas, pero indica que tu eficiencia aeróbica todavía tiene margen de mejora.`);
                score += 5;
            } else if (drift <= 5 && drift >= -5) {
                insights.push(`Eficiencia impecable. Tu pulso se ha mantenido estable respecto a la carga (${drift}%), lo que indica que tienes esta intensidad muy bien dominada.`);
                score += 25;
            }
        }

        // 3. Propósito Fisiológico (Training Effect)
        if (primaryBenefit === "Umbral") {
            insights.push("El trabajo de hoy se ha centrado en el Umbral, clave para elevar tu potencia sostenible en esfuerzos de larga duración.");
        } else if (primaryBenefit === "VO2 Max") {
            insights.push("Has tocado el techo metabólico. Estas sesiones expanden tu capacidad de transporte de oxígeno y son las que más 'te hacen crecer'.");
        } else if (primaryBenefit === "Capacidad Anaeróbica") {
            insights.push("Sesión explosiva. Has trabajado la resistencia al lactato y la potencia neuromuscular.");
        } else if (primaryBenefit === "Base Aeróbica") {
            insights.push("Construcción de cimientos. Estás mejorando la capilarización y la eficiencia de las grasas como combustible.");
        }

        // 4. Hitos de Potencia
        if (powerCurve && powerCurve.length > 0) {
            const best5m = powerCurve.find(p => p.label === '5m')?.value;
            if (best5m && best5m > npWatts * 1.1) {
                insights.push(`Destacable tu pico de 5 minutos (${best5m}w). Indica una buena capacidad de esfuerzo agudo por encima de tu media de hoy.`);
            }
        }

        // 5. Sugerencia de Recuperación
        const tss = activity.tss || 0;
        if (tss > 100) {
            nextStep = "Tras esta carga de +100 TSS, mañana es obligatorio un rodaje muy suave (Z1) o descanso total para no entrar en fatiga crónica.";
        } else if (tss > 50) {
            nextStep = "Carga moderada. Mañana puedes realizar un entrenamiento similar o de intensidad baja para seguir sumando.";
        } else {
            nextStep = "Sesión ligera. Estás listo para un bloque de intensidad mañana si el plan lo requiere.";
        }

        // Score based Title
        if (score >= 85) title = "Sesión de Máximo Rendimiento";
        else if (score >= 60) title = "Entrenamiento Productivo";
        else title = "Sesión de Rodaje / Mantenimiento";

        return { 
            title, 
            insights, // Restauramos el array para el mapa en la UI
            description: insights.slice(0, 2).join(' '),
            conclusion: insights.slice(2).join(' ') + (nextStep ? `\n\nPróximo paso: ${nextStep}` : ''),
            score: Math.min(100, Math.max(0, score))
        };
    }, [trainingEffect, proMetrics, activity]);

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
    const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontSize: '11px', fontWeight: '500', padding: '8px 12px' };

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
