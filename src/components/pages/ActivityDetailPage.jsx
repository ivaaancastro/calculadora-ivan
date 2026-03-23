import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
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
    <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className={`text-lg font-semibold tracking-tight ${accent || 'text-slate-900 dark:text-zinc-100'}`}>{value}</span>
            {unit && <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{unit}</span>}
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

const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-700 p-2 rounded shadow-xl text-[10px] font-bold text-zinc-100 min-w-[80px]">
                <p className="mb-1 uppercase text-zinc-500 tracking-tighter text-[8px]">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-indigo-400 text-xs">{payload[0].value}</span>
                    <span className="text-[9px] text-zinc-500">{unit}</span>
                </div>
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

        // --- Power Duration Curve & Advanced Power Metrics ---
        let powerCurve = [];
        let vi = 0;
        let ifFactor = 0;
        let workKj = 0;

        if (streams.watts?.data?.length > 30) {
            const wData = streams.watts.data;
            const ftp = settings.bike?.ftp || 200;
            
            // Variability Index (VI)
            if (avgWatts > 0) vi = Number((npWatts / avgWatts).toFixed(2));
            
            // Intensity Factor (IF)
            ifFactor = Number((npWatts / ftp).toFixed(2));
            
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

        return { cadenceAvg, maxSpeedObj, decouplingObj, efObj, autoLaps, avgWatts, maxWatts, npWatts, vi, ifFactor, workKj, powerCurve };
    }, [streams, isPaceBased]);

    // 🔥 TRAINING EFFECT ALGORITHM (Estilo Garmin) 🔥
    const trainingEffect = useMemo(() => {
        if (!exactZoneAnalysis) return null;

        const z1m = exactZoneAnalysis[0].minutes;
        const z2m = exactZoneAnalysis[1].minutes;
        const z3m = exactZoneAnalysis[2].minutes;
        const z4m = exactZoneAnalysis[3].minutes;
        const z5m = exactZoneAnalysis[4].minutes;

        // Puntos base Aeróbicos (Garmin TE aproximado por tiempo)
        // Incrementamos el peso de Z3 y Z4 para que sesiones de Umbral puntúen correctamente alto (~4.6)
        const aPoints = (z1m * 0.02) + (z2m * 0.045) + (z3m * 0.08) + (z4m * 0.14) + (z5m * 0.16);
        // Función exponencial (denominador ajustado a 2.5 para escalar mejor a 5.0)
        let aScore = 5.0 * (1 - Math.exp(-aPoints / 2.5));
        let aerobicScore = aScore.toFixed(1);

        // Puntos base Anaeróbicos
        // Un ritmo sostenido en Z4 da 0 anaeróbico en Garmin. Solo Z5 (sprints/picos) lo genera.
        const anPoints = z5m * 0.15;
        let anScore = 5.0 * (1 - Math.exp(-anPoints / 2.0));
        if (anScore < 0.6) anScore = 0.0; // Si el estímulo es ínfimo, Garmin da 0 de beneficio
        let anaerobicScore = anScore.toFixed(1);

        let primaryBenefit = "Recuperación";
        let benefitColor = "text-slate-500 dark:text-zinc-400";

        if (aScore < 2.0 && anScore < 2.0) {
            primaryBenefit = "Recuperación";
            benefitColor = "text-slate-500 dark:text-zinc-400";
        } else if (anScore >= 2.5 && anScore >= aScore - 0.5) {
            primaryBenefit = "Capacidad Anaeróbica";
            benefitColor = "text-purple-600 dark:text-purple-400";
        } else {
            // Predominio Aeróbico: Evaluamos la estructura para clasificar el beneficio aeróbico
            if (z5m > 8 && z5m >= z4m * 0.3) {
                primaryBenefit = "VO2 Max";
                benefitColor = "text-rose-600 dark:text-rose-500";
            } else if (z4m > 15 && (z4m > (z2m + z3m) * 0.4 || z4m > 30)) {
                primaryBenefit = "Umbral";
                benefitColor = "text-amber-600 dark:text-amber-500";
            } else if (z3m > 15 || z4m > 10 || (z2m > 30 && (z3m > 10 || z4m > 5))) {
                primaryBenefit = "Tempo";
                benefitColor = "text-emerald-600 dark:text-emerald-500";
            } else if (z2m > 15) {
                primaryBenefit = "Base Aeróbica";
                benefitColor = "text-blue-600 dark:text-blue-400";
            } else {
                primaryBenefit = "Recuperación";
                benefitColor = "text-slate-500 dark:text-zinc-400";
            }
        }

        const getLabel = (score) => {
            if (score <= 1.0) return "Ninguno";
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

            // Si no hay latlng stream, intentamos interpolar de la polilínea (más complejo)
            // Por ahora, solo si existe el stream de latlng
            data.push({
                time: Math.floor(timeData[i] / 60),
                hr: streams.heartrate ? streams.heartrate.data[i] : null,
                speed: speed,
                pace: pace,
                alt: streams.altitude ? Math.round(streams.altitude.data[i]) : null,
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
        let title = "";
        let description = "";
        let conclusion = "";
        let score = 0;

        if (trainingEffect.aerobic >= 3.0 || trainingEffect.anaerobic >= 2.5) score += 40;
        else if (trainingEffect.aerobic >= 2.0 || trainingEffect.anaerobic >= 2.0) score += 20;

        if (proMetrics.decouplingObj) {
            const dec = parseFloat(proMetrics.decouplingObj.value);
            if (dec <= 5 && dec >= -5) score += 30;
            else if (dec <= 8) score += 15;
            else score -= 10;
        } else {
            score += 15; // default si no hay datos de desacople porque fue corto
        }

        if ((activity.tss || 0) > 50) score += 20;
        else if ((activity.tss || 0) > 20) score += 10;

        if (score >= 70) {
            title = "Entrenamiento Altamente Productivo";
            description = "Has realizado una sesión excelente que aporta directamente a tu mejora física. El estímulo logrado es notable.";
            if (trainingEffect.primaryBenefit !== "Recuperación") {
                conclusion = `El enfoque principal en ${trainingEffect.primaryBenefit} ha sido un éxito. Has asimilado bien la carga sin un desfase excesivo. Definitivamente no has perdido el tiempo, este entreno suma a tu forma.`;
            } else {
                conclusion = "Un entrenamiento de recuperación ejecutado a la perfección. Es crucial para asimilar la carga de otros días intensos.";
            }
        } else if (score >= 40) {
            title = "Entrenamiento Útil (Mantenimiento / Base)";
            description = "Una sesión que suma volumen y ayuda a mantener tu estado de forma o construir base aeróbica, aunque sin picos extraordinarios de mejora aguda.";
            conclusion = "Ha servido para sumar y cumplir el objetivo. No es una sesión de ganancia máxima (a menos que ese fuera el fin), pero es el cimiento necesario para estar en forma. Buen trabajo constante.";
        } else {
            title = "Sesión Ligera / Recuperación Activa";
            description = "El estímulo fisiológico de esta sesión ha sido muy bajo. Puede interpretarse como un esfuerzo de recuperación o un paseo ligero.";
            conclusion = "Si tu plan era descansar activamente, está perfecto. Si pretendías un entrenamiento duro o mejorar capacidades, lamentablemente hoy no se ha logrado el estímulo suficiente y podría considerarse una sesión vacía o 'tiempo perdido' deportivamente hablando.";
        }

        return { title, description, conclusion, score };
    }, [trainingEffect, proMetrics, activity]);

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
        if (state && typeof state.activeTooltipIndex !== 'undefined' && state.activeTooltipIndex !== null) {
            const dataPoint = chartData[state.activeTooltipIndex];
            if (dataPoint) setActivePayload(dataPoint);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 bg-slate-50 dark:bg-zinc-950 h-screen overflow-hidden flex flex-col font-sans">
            {/* Sport-colored accent bar */}
            <div className="h-1 shrink-0" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)` }} />

            {/* Premium Header */}
            <header className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 px-6 py-4 shrink-0 z-50">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                        <button onClick={onBack} className="mt-1 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-slate-400 dark:text-zinc-500">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
                                {activity.name || `${activity.type}`}
                            </h1>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 capitalize">{dateStr}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {activity.strava_id && (
                            <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" 
                               className="px-3 py-1.5 text-[10px] font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg transition-colors uppercase tracking-wider">
                                Strava ↗
                            </a>
                        )}
                        <button onClick={() => onDelete && onDelete(activity.id)} className="p-2 text-slate-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-3 py-2">
                    <MetricCard label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                    <MetricCard label="Tiempo" value={formatTimeStr(activity.duration)} />
                    <MetricCard label="Elevación" value={activity.elevation_gain || 0} unit="m" />
                    {activity.tss > 0 && <MetricCard label="Carga" value={Math.round(activity.tss)} unit="TSS" accent="text-indigo-600 dark:text-indigo-400" />}
                    {activity.hr_avg > 0 && <MetricCard label="FC Media" value={activity.hr_avg} unit="bpm" accent="text-rose-500" />}
                    {maxHr > 0 && <MetricCard label="FC Máx" value={maxHr} unit="bpm" />}
                    {speedMetric && <MetricCard label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} accent="text-blue-600 dark:text-blue-400" />}
                    {proMetrics.avgWatts > 0 && <MetricCard label="Pot. Media" value={proMetrics.avgWatts} unit="w" accent="text-amber-500" />}
                    {proMetrics.npWatts > 0 && <MetricCard label="NP" value={proMetrics.npWatts} unit="w" accent="text-amber-600 dark:text-amber-400" />}
                    {proMetrics.maxWatts > 0 && <MetricCard label="Pot. Máx" value={proMetrics.maxWatts} unit="w" />}
                    {proMetrics.cadenceAvg > 0 && <MetricCard label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'ppm' : 'rpm'} />}
                    {activity.calories > 0 && <MetricCard label="Calorías" value={activity.calories} unit="kcal" />}
                </div>
            </header>

            {/* Pill Tab Navigation */}
            <div className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 flex items-center px-6 py-2 shrink-0">
                <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-full gap-0.5">
                    <PillTab active={activeTab === 'analyze'} label="Análisis" onClick={() => setActiveTab('analyze')} />
                    <PillTab active={activeTab === 'map'} label="Mapa" onClick={() => setActiveTab('map')} />
                    <PillTab active={activeTab === 'laps'} label="Intervalos" onClick={() => setActiveTab('laps')} />
                    <PillTab active={activeTab === 'data'} label="Detalle" onClick={() => setActiveTab('data')} />
                </div>
            </div>

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
                                    <>
                                        {/* Velocity/Pace */}
                                        <div className="h-[140px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/60 p-4 pl-5 border-l-[3px]" style={{ borderLeftColor: '#6366f1' }}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{isPaceBased ? 'Ritmo' : 'Velocidad'}</h4>
                                                {activePayload && <span className="text-sm font-semibold tabular-nums text-indigo-500">{isPaceBased ? formatPace(activePayload.pace) : activePayload.speed + ' km/h'}</span>}
                                            </div>
                                            <ResponsiveContainer width="100%" height="85%">
                                                <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis reversed={isPaceBased} hide domain={['dataMin', 'dataMax']} />
                                                    <Area type="monotone" dataKey={isPaceBased ? "pace" : "speed"} stroke="#6366f1" fill="#6366f1" fillOpacity={0.04} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#6366f1' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Heart Rate */}
                                        {chartData.some(d => d.hr > 0) && (
                                            <div className="h-[140px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/60 p-4 pl-5 border-l-[3px]" style={{ borderLeftColor: '#f43f5e' }}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">FC</h4>
                                                    {activePayload && <span className="text-sm font-semibold tabular-nums text-rose-500">{activePayload.hr} bpm</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height="85%">
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                        <Area type="monotone" dataKey="hr" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.04} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f43f5e' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Power */}
                                        {chartData.some(d => d.watts > 0) && (
                                            <div className="h-[140px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/60 p-4 pl-5 border-l-[3px]" style={{ borderLeftColor: '#f59e0b' }}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Potencia</h4>
                                                    {activePayload && <span className="text-sm font-semibold tabular-nums text-amber-500">{activePayload.watts} w</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height="85%">
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin', 'dataMax']} />
                                                        <Area type="monotone" dataKey="watts" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.04} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f59e0b' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Altitude */}
                                        {chartData.some(d => d.alt !== null) && (
                                            <div className="h-[140px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/60 p-4 pl-5 border-l-[3px] border-l-slate-300 dark:border-l-zinc-600">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Altitud</h4>
                                                    {activePayload && <span className="text-sm font-semibold tabular-nums text-slate-500">{activePayload.alt} m</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height="85%">
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                        <Area type="monotone" dataKey="alt" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.04} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#94a3b8' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Cadence */}
                                        {chartData.some(d => d.cadence > 0) && (
                                            <div className="h-[120px] bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/60 p-4 pl-5 border-l-[3px] border-l-emerald-400">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cadencia</h4>
                                                    {activePayload && <span className="text-sm font-semibold tabular-nums text-emerald-500">{activePayload.cadence} {isPaceBased ? 'ppm' : 'rpm'}</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height="85%">
                                                    <AreaChart data={chartData} syncId="st" onMouseMove={handleMouseMove}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                        <Area type="monotone" dataKey="cadence" stroke="#10b981" fill="#10b981" fillOpacity={0.04} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#10b981' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </>
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

                            {/* Impact Analysis */}
                            {trainingEffect && (
                                <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Impacto</h3>
                                        <span className={`text-xs font-semibold ${trainingEffect.benefitColor}`}>{trainingEffect.primaryBenefit}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1.5">
                                                <span className="text-slate-500 dark:text-zinc-400 font-medium">Aeróbico</span>
                                                <span className="font-semibold text-slate-700 dark:text-zinc-300">{trainingEffect.aerobic.toFixed(1)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1.5">
                                                <span className="text-slate-500 dark:text-zinc-400 font-medium">Anaeróbico</span>
                                                <span className="font-semibold text-slate-700 dark:text-zinc-300">{trainingEffect.anaerobic.toFixed(1)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Zones */}
                            {(exactZoneAnalysis || exactPacePowerZoneAnalysis) && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                            Zonas {zoneType === 'hr' ? 'FC' : (isPaceBased ? 'Pace' : 'Potencia')}
                                        </h3>
                                        <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-full text-[9px] font-semibold">
                                            <button 
                                                onClick={() => setZoneType('hr')}
                                                className={`px-2.5 py-0.5 rounded-full transition-colors ${zoneType === 'hr' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                FC
                                            </button>
                                            {(streams?.watts || streams?.velocity_smooth) && (
                                                <button 
                                                    onClick={() => setZoneType('power')}
                                                    className={`px-2.5 py-0.5 rounded-full transition-colors ${zoneType === 'power' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}
                                                >
                                                    {isPaceBased ? 'Pace' : 'W'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis)?.map((z, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-[9px] font-medium text-slate-400 dark:text-zinc-500 mb-0.5 px-0.5">
                                                    <span>{z.label}</span>
                                                    <span>{z.range}</span>
                                                </div>
                                                <div className="h-5 bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden relative">
                                                    <div 
                                                        className="h-full transition-all duration-700 rounded-md" 
                                                        style={{ 
                                                            width: `${Math.max(z.pct, 2)}%`, 
                                                            backgroundColor: zoneType === 'hr' 
                                                                ? ZONE_COLORS[i] 
                                                                : ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#7c3aed'][i % 7],
                                                            opacity: 0.7
                                                        }} 
                                                    />
                                                    <span className="absolute inset-0 flex items-center px-2 text-[9px] font-semibold text-slate-700 dark:text-zinc-300">
                                                        {Math.round(z.minutes)}m · {Math.round(z.pct)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Splits */}
                            {proMetrics.autoLaps.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Parciales</h3>
                                    <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase border-b border-slate-100 dark:border-zinc-800">
                                                    <th className="px-3 py-2">#</th>
                                                    <th className="px-3 py-2 text-right">{isPaceBased ? 'Ritmo' : 'Vel.'}</th>
                                                    <th className="px-3 py-2 text-right">FC</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs tabular-nums">
                                                {proMetrics.autoLaps.slice(0, 10).map(l => (
                                                    <tr key={l.index} className="hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                                                        <td className="px-3 py-2 text-slate-400 font-semibold">{l.index}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-zinc-300">{l.speedVal}</td>
                                                        <td className="px-3 py-2 text-right text-slate-500 dark:text-zinc-400">{l.hrAvg}</td>
                                                    </tr>
                                                ))}
                                                {proMetrics.autoLaps.length > 10 && (
                                                    <tr>
                                                        <td colSpan="3" className="py-2 text-center text-[10px] font-semibold text-indigo-500 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors" onClick={() => setActiveTab('laps')}>
                                                            Ver todas →
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Fitness Conclusion */}
                            {fitnessAnalysis && (
                                <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-4 space-y-2">
                                    <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Conclusión</h4>
                                    <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 leading-snug">{fitnessAnalysis.title}</p>
                                    <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">{fitnessAnalysis.description}</p>
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
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-3">Tabla Técnica de Intervalos</h2>
                            <table className="w-full text-left border-collapse border border-slate-100 dark:border-zinc-800 rounded">
                                <thead className="bg-slate-50 dark:bg-zinc-900">
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">
                                        <th className="p-4">Intervalo</th>
                                        <th className="p-4 text-right">Tiempo</th>
                                        <th className="p-4 text-right">Distancia</th>
                                        <th className="p-4 text-right">{isPaceBased ? 'Ritmo Medio' : 'Velocidad'}</th>
                                        <th className="p-4 text-right">HR Media</th>
                                        <th className="p-4 text-right">Ganancia Altitud</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-medium tabular-nums text-slate-600 dark:text-zinc-300 divide-y divide-slate-50 dark:divide-zinc-900">
                                    {proMetrics.autoLaps.map(lap => (
                                        <tr key={lap.index} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                                            <td className="p-4 font-bold text-slate-400">Tramo #{lap.index}</td>
                                            <td className="p-4 text-right">{lap.timeStr}</td>
                                            <td className="p-4 text-right">{isPaceBased ? '1,000 m' : '5,000 m'}</td>
                                            <td className="p-4 text-right text-slate-900 dark:text-zinc-100">{lap.speedVal}</td>
                                            <td className="p-4 text-right">{lap.hrAvg} bpm</td>
                                            <td className="p-4 text-right text-emerald-500">+{lap.elev}m</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- pestaña: DETALLE (Deep Analysis) --- */}
                {activeTab === 'data' && (
                   <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-zinc-950">
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* Toggle & Title */}
                            <div className="flex items-center justify-between pb-4">
                                <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 tracking-tight">Análisis en Profundidad</h2>
                                <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-full text-xs font-semibold">
                                    <button 
                                        onClick={() => setZoneType('hr')}
                                        className={`px-4 py-1.5 rounded-full transition-all duration-200 ${zoneType === 'hr' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Frecuencia Cardíaca
                                    </button>
                                    {(streams?.watts || streams?.velocity_smooth) && (
                                        <button 
                                            onClick={() => setZoneType('power')}
                                            className={`px-4 py-1.5 rounded-full transition-all duration-200 ${zoneType === 'power' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            {isPaceBased ? 'Pace' : 'Potencia'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Histograms & Curves */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Zone Histogram */}
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Distribución de Tiempo en Zonas</h3>
                                        <div className="h-[260px] bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-5">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis}>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                                                    <YAxis hide />
                                                    <RechartsTooltip content={<CustomChartTooltip unit=" min" />} cursor={{ fill: 'transparent' }} />
                                                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                                                        {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis).map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={zoneType === 'hr' ? ZONE_COLORS[index] : ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#7c3aed'][index % 7]} 
                                                                fillOpacity={0.75}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Power Curve */}
                                    {!isPaceBased && proMetrics.powerCurve.length > 0 && zoneType === 'power' && (
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Curva de Potencia</h3>
                                            <div className="h-[260px] bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-5">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={proMetrics.powerCurve}>
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit="w" />
                                                        <RechartsTooltip content={<CustomChartTooltip unit=" w" />} />
                                                        <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Detailed Stats */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-5 space-y-5">
                                        <h3 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-zinc-800">Métricas Avanzadas</h3>
                                        
                                        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    VI
                                                    <MetricHelp title="VI" text="Relación entre NP y Potencia Media. Indica la 'suavidad' del esfuerzo." optimal="< 1.05 (Estable)" />
                                                </div>
                                                <div className="text-base font-semibold text-slate-800 dark:text-zinc-200">{proMetrics.vi || '-'}</div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center justify-end gap-1">
                                                    IF
                                                    <MetricHelp title="IF" text="Relación entre tu NP y tu FTP. Mide el esfuerzo relativo." optimal="0.85 - 0.95 (Tempo)" />
                                                </div>
                                                <div className="text-base font-semibold text-amber-500">{proMetrics.ifFactor || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    Trabajo
                                                    <MetricHelp title="kJ" text="Energía mecánica total gastada. Equivale aproximadamente a kCal." />
                                                </div>
                                                <div className="text-base font-semibold text-slate-800 dark:text-zinc-200">{proMetrics.workKj || '-'} <span className="text-xs text-slate-400 font-normal">kJ</span></div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center justify-end gap-1">
                                                    {isPaceBased ? 'EF (Ritmo/FC)' : 'EF (Pot/FC)'}
                                                    <MetricHelp title="EF" text={isPaceBased ? "Relación entre velocidad y pulso. Mide la economía de carrera." : "Relación entre potencia y pulso. Mide el motor aeróbico."} optimal="Más alto es mejor" />
                                                </div>
                                                <div className="text-base font-semibold text-slate-800 dark:text-zinc-200">{proMetrics.efObj?.value || '-'} <span className="text-xs text-slate-400 font-normal">{proMetrics.efObj?.unit}</span></div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                    Carga
                                                    <MetricHelp title="TSS" text="Carga técnica de la sesión basada en volumen e intensidad." optimal="100 TSS = 1h a tope" />
                                                </div>
                                                <div className="text-base font-semibold text-indigo-500">{Math.round(activity.tss)} <span className="text-xs text-slate-400 font-normal">TSS</span></div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 flex items-center justify-end gap-1">
                                                    Desacople
                                                    <MetricHelp title="Pw:Hr" text="Deriva cardíaca. Diferencia de eficiencia entre la 1ª y 2ª mitad." optimal="< 5% (Base sólida)" />
                                                </div>
                                                <div className={`text-base font-semibold ${proMetrics.decouplingObj?.color}`}>{proMetrics.decouplingObj?.value}%</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Training Effect</span>
                                                <span className={`font-semibold ${trainingEffect?.benefitColor}`}>{trainingEffect?.primaryBenefit}</span>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-medium mb-1">
                                                        <span className="text-slate-500 dark:text-zinc-400">Aeróbico</span>
                                                        <span className="font-semibold">{trainingEffect?.aerobic} / 5.0</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(trainingEffect?.aerobic / 5) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-medium mb-1">
                                                        <span className="text-slate-500 dark:text-zinc-400">Anaeróbico</span>
                                                        <span className="font-semibold">{trainingEffect?.anaerobic} / 5.0</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${(trainingEffect?.anaerobic / 5) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conclusion */}
                                    <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-5 space-y-2">
                                        <h4 className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Conclusión</h4>
                                        <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 leading-snug">{fitnessAnalysis?.title}</p>
                                        <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">{fitnessAnalysis?.conclusion}</p>
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
