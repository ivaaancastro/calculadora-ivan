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
    const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'graficas', 'vueltas'

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
                minutes: sec / 60,
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
                    minutes: sec / 60,
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
                    minutes: sec / 60,
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
        <div className="animate-in fade-in duration-300 max-w-[1600px] mx-auto h-[calc(100vh-80px)] overflow-hidden lg:pr-2">

            {/* GRID PRINCIPAL (VISTA FIJA SIN SCROLL GLOBAL) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

                {/* LEFT COLUMN: HEADER + MAP (Fixed Height) */}
                <div className="flex flex-col gap-4 h-full min-h-0">

                    {/* CABECERA INTEGRADA SOBRE EL MAPA */}
                    <div className="flex flex-col gap-4 w-full shrink-0">
                        {/* BOTONERA SUPERIOR */}
                        <div className="flex items-center justify-between">
                            <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition font-bold px-3 py-1.5 text-[10px] uppercase rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                <ArrowLeft size={14} /> Volver
                            </button>
                        </div>

                        {/* TÍTULO Y FECHA */}
                        <div className="flex flex-col gap-1 pr-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                <Calendar size={12} /> {dateStr}
                                <span className="px-1.5 py-0.5 rounded text-[9px] text-white ml-1 font-bold" style={{ backgroundColor: themeColor }}>{activity.type}</span>
                                {activity.strava_id && (
                                    <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#FC4C02] hover:underline font-black italic ml-2">
                                        STRAVA <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
                                {activity.name || `${activity.type} Activity`}
                            </h1>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative z-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <InteractiveMap polyline={activity.map_polyline} highResCoords={streams?.latlng?.data} color={themeColor} currentPosition={activePayload?.latlng} />
                    </div>
                </div>

                {/* RIGHT COLUMN (Tabs & Content - Internally Scrollable) */}
                <div className="flex flex-col h-full min-h-0 pt-[104px]">

                    {/* TAB NAVIGATION */}
                    <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shadow-sm mb-4 shrink-0 z-20">
                        <button
                            onClick={() => setActiveTab('resumen')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'resumen' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                        >
                            <MapPin size={14} /> Resumen
                        </button>
                        <button
                            onClick={() => setActiveTab('graficas')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'graficas' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                        >
                            <Activity size={14} /> Gráficas
                        </button>
                        <button
                            onClick={() => setActiveTab('vueltas')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'vueltas' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                        >
                            <Layers size={14} /> Vueltas
                        </button>
                        <button
                            onClick={() => setActiveTab('nivel')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'nivel' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                        >
                            <Zap size={14} /> Nivel
                        </button>
                    </div>

                    {/* TAB CONTENT (Scrollable Area) */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                        {/* TAB CONTENT: RESUMEN */}
                        {activeTab === 'resumen' && (
                            <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-8">
                                {/* PANEL DE DATOS (GRID) */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
                                    {/* MÉTRICAS BÁSICAS */}
                                    <MetricBox label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" colorClass="border-blue-500" />
                                    <MetricBox label="Tiempo" value={Math.floor(activity.duration)} unit="min" colorClass="border-slate-400" />
                                    <MetricBox label={isPaceBased ? "Ritmo" : "Velocidad"} value={isPaceBased ? formatPace(activity.duration / (activity.distance / 1000)) : (activity.speed_avg * 3.6).toFixed(1)} unit={isPaceBased ? "/km" : "km/h"} colorClass="border-orange-500" />
                                    <MetricBox label="Pulso Med" value={activity.hr_avg || '--'} unit="ppm" colorClass="border-rose-400" />
                                    <MetricBox label="Pulso Máx" value={maxHr || activity.hr_max || '--'} unit="ppm" colorClass="border-rose-600" />
                                    <MetricBox label="Elevación" value={activity.elevation_gain || 0} unit="m" colorClass="border-emerald-500" />
                                    <MetricBox label="Calorías" value={activity.calories || 0} unit="kcal" colorClass="border-amber-500" />

                                    {/* MÉTRICAS AVANZADAS (PRO) */}
                                    {proMetrics.cadenceAvg > 0 && (
                                        <MetricBox label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? "ppm" : "rpm"} colorClass="border-indigo-500" />
                                    )}
                                    {proMetrics.maxSpeedObj && (
                                        <MetricBox label={proMetrics.maxSpeedObj.label} value={proMetrics.maxSpeedObj.value} unit={proMetrics.maxSpeedObj.unit} colorClass="border-cyan-500" />
                                    )}
                                    {proMetrics.efObj && (
                                        <MetricBox label="Eficacia (EF)" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} colorClass="border-violet-500" tooltip="Efficiency Factor (EF): Mide la relación entre la potencia/velocidad y tus pulsaciones. Un valor MÁS ALTO indica que generas más fuerza/ritmo con menos latidos (mejor estado de forma). Útil para comparar con entrenamientos similares." />
                                    )}
                                    {proMetrics.decouplingObj && (
                                        <MetricBox label="Desacople" value={`${proMetrics.decouplingObj.value}%`} unit={proMetrics.decouplingObj.label} colorClass="border-fuchsia-500" valueColor={proMetrics.decouplingObj.color} tooltip="Aerobic Decoupling: Diferencia de eficiencia entre la primera y segunda mitad de la actividad." />
                                    )}
                                    {activity.tss > 0 && (
                                        <MetricBox label="Carga (TSS)" value={Math.round(activity.tss)} unit="pts" colorClass="border-yellow-600" />
                                    )}
                                    {activity.normalized_power > 0 && (
                                        <MetricBox label="Potencia Norm." value={Math.round(activity.normalized_power)} unit="w" colorClass="border-red-600" />
                                    )}
                                </div>
                                {/* TRAINING EFFECT (GARMIN STYLE) */}
                                {trainingEffect && !loadingStreams && (
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col shrink-0">
                                        <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2">
                                            <Target size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5} /> Beneficio del Entrenamiento
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div className="flex flex-col items-center justify-center py-4 px-4 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-800/50 h-full">
                                                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Impacto Principal</span>
                                                <span className={`text-xl lg:text-2xl font-black uppercase tracking-tight text-center leading-tight ${trainingEffect.benefitColor}`}>
                                                    {trainingEffect.primaryBenefit}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-end pb-1 relative group cursor-help">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">Carga Aeróbica <Info size={10} className="text-slate-400" /></span>
                                                        <span className="text-sm border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 rounded font-black text-blue-600 dark:text-blue-400 leading-none z-10">{trainingEffect.aerobic.toFixed(1)}</span>
                                                        <div className="absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-800 text-white text-[10px] leading-relaxed rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none normal-case">
                                                            0.0 - 0.9: Ninguno<br />1.0 - 1.9: Beneficio Menor<br />2.0 - 2.9: Mantenimiento<br />3.0 - 3.9: Mejora<br />4.0 - 4.9: Mejora Alta<br />5.0: Sobreesfuerzo
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${(trainingEffect.aerobic / 5) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-end pb-1 relative group cursor-help">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">Carga Anaeróbica <Info size={10} className="text-slate-400" /></span>
                                                        <span className="text-sm border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded font-black text-purple-600 dark:text-purple-400 leading-none z-10">{trainingEffect.anaerobic.toFixed(1)}</span>
                                                        <div className="absolute bottom-full mb-1 right-0 w-48 p-2 bg-slate-800 text-white text-[10px] leading-relaxed rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none normal-case">
                                                            0.0 - 0.9: Ninguno<br />1.0 - 1.9: Beneficio Menor<br />2.0 - 2.9: Mantenimiento<br />3.0 - 3.9: Mejora<br />4.0 - 4.9: Mejora Alta<br />5.0: Sobreesfuerzo
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${(trainingEffect.anaerobic / 5) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Zone Distribution Block */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Zonas Cardíacas */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col h-[280px]">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
                                            <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest"><Heart size={12} className="inline mr-1 text-rose-500" /> Zonas Cardíacas</h3>
                                        </div>
                                        {exactZoneAnalysis ? (
                                            <div className="flex-1 min-h-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={exactZoneAnalysis}
                                                        margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                                                        <XAxis
                                                            dataKey="label"
                                                            tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            interval={0}
                                                            tickFormatter={(val) => val.split(' ')[0]}
                                                        />
                                                        <YAxis type="number" domain={[0, 'dataMax + 10']} hide />
                                                        <RechartsTooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                                                                            <p className="text-[10px] font-bold text-white uppercase mb-1">{data.label}</p>
                                                                            <p className="text-[11px] font-mono text-rose-400">{Math.floor(data.minutes)}m {Math.round((data.minutes % 1) * 60)}s</p>
                                                                            <p className="text-[9px] text-slate-400">{data.range}</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                            cursor={{ fill: 'transparent' }}
                                                        />
                                                        <Bar dataKey="pct" radius={[4, 4, 0, 0]} barSize={35} minPointSize={3}>
                                                            {exactZoneAnalysis.map((entry, index) => {
                                                                const hrColors = ['#94a3b8', '#3b82f6', '#10b981', '#eab308', '#f97316', '#ef4444', '#be185d'];
                                                                return <Cell key={`cell-${index}`} fill={hrColors[index] || '#71717a'} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : <p className="text-[10px] text-slate-500 dark:text-zinc-500 text-center m-auto">Sin datos cardíacos.</p>}
                                    </div>

                                    {/* Zonas Ritmo/Potencia */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col h-[280px]">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
                                            <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">
                                                <Activity size={12} className={`inline mr-1 ${isPaceBased ? 'text-orange-500' : 'text-amber-500'}`} />
                                                {isPaceBased ? 'Zonas de Ritmo' : 'Zonas de Potencia'}
                                            </h3>
                                        </div>
                                        {exactPacePowerZoneAnalysis ? (
                                            <div className="flex-1 min-h-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={exactPacePowerZoneAnalysis}
                                                        margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                                                        <XAxis
                                                            dataKey="label"
                                                            tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            interval={0}
                                                        />
                                                        <YAxis type="number" domain={[0, 'dataMax + 10']} hide />
                                                        <RechartsTooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                                                                            <p className="text-[10px] font-bold text-white uppercase mb-1">{data.label}</p>
                                                                            <p className="text-[11px] font-mono text-blue-400">{Math.floor(data.minutes)}m {Math.round((data.minutes % 1) * 60)}s</p>
                                                                            <p className="text-[9px] text-slate-400">{data.range}</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                            cursor={{ fill: 'transparent' }}
                                                        />
                                                        <Bar dataKey="pct" radius={[4, 4, 0, 0]} barSize={25} minPointSize={4}>
                                                            {exactPacePowerZoneAnalysis.map((entry, index) => {
                                                                const colors = ['#94a3b8', '#3b82f6', '#10b981', '#eab308', '#f97316', '#ef4444', '#be185d'];
                                                                return <Cell key={`cell-${index}`} fill={colors[index] || '#71717a'} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : <p className="text-[10px] text-slate-500 dark:text-zinc-500 text-center m-auto">Sin datos suficientes.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: GRÁFICAS */}
                        {activeTab === 'graficas' && (
                            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                                {/* Telemetría (Mitad Inferior) */}
                                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col flex-1 min-h-[500px] lg:min-h-0">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
                                        <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Telemetría (Streams)</h3>
                                    </div>

                                    {loadingStreams ? (
                                        <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-slate-500 dark:text-zinc-600" /></div>
                                    ) : chartData.length > 0 ? (
                                        <div className="flex-1 min-h-0 flex flex-col gap-6" onMouseLeave={() => setActivePayload(null)}>

                                            {/* Pace/Speed Chart */}
                                            <div className="h-40 flex flex-col">
                                                <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">{isPaceBased ? 'Ritmo' : 'Velocidad'}</h4>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                                        {isPaceBased ? (
                                                            <YAxis reversed tick={{ fontSize: 9, fill: themeColor }} domain={['dataMin', 12]} ticks={[3, 4, 5, 6, 8, 10]} fill={themeColor} axisLine={false} tickLine={false} tickFormatter={(val) => { const m = Math.floor(val); const s = Math.round((val - m) * 60).toString().padStart(2, '0'); return `${m}:${s}`; }} />
                                                        ) : (
                                                            <YAxis tick={{ fontSize: 9, fill: themeColor }} fill={themeColor} axisLine={false} tickLine={false} />
                                                        )}
                                                        <RechartsTooltip
                                                            contentStyle={tooltipStyle}
                                                            labelFormatter={(val) => `Minuto ${val}`}
                                                            formatter={(value, name) => isPaceBased ? [`${Math.floor(value)}:${Math.round((value - Math.floor(value)) * 60).toString().padStart(2, '0')} /km`, 'Ritmo'] : [`${value} km/h`, 'Velocidad']}
                                                            cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                            isAnimationActive={false}
                                                            shared={true}
                                                            trigger="hover"
                                                        />
                                                        <Area type="monotone" dataKey={isPaceBased ? "pace" : "speed"} name={isPaceBased ? "pace" : "speed"} stroke={themeColor} strokeWidth={2} fillOpacity={0.1} fill={themeColor} isAnimationActive={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: themeColor }} dot={false} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* HR Chart */}
                                            <div className="h-40 flex flex-col">
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
                                                            shared={true}
                                                            trigger="hover"
                                                        />
                                                        <Area type="monotone" dataKey="hr" name="hr" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" isAnimationActive={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#ef4444' }} dot={false} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Power Chart (Bici) */}
                                            {!isPaceBased && chartData.some(d => d.watts > 0) && (
                                                <div className="h-40 flex flex-col">
                                                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">Potencia</h4>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                                            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                                            <YAxis tick={{ fontSize: 9, fill: '#eab308' }} axisLine={false} tickLine={false} />
                                                            <RechartsTooltip
                                                                contentStyle={tooltipStyle}
                                                                labelFormatter={(val) => `Minuto ${val}`}
                                                                formatter={(value, name) => [`${value} w`, 'Potencia']}
                                                                cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                                isAnimationActive={false}
                                                                shared={true}
                                                                trigger="hover"
                                                            />
                                                            <Area type="monotone" dataKey="watts" name="watts" stroke="#eab308" strokeWidth={2} fillOpacity={0.1} fill="#eab308" isAnimationActive={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#eab308' }} dot={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Cadence Chart */}
                                            {chartData.some(d => d.cadence > 0) && (
                                                <div className="h-40 flex flex-col">
                                                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">Cadencia</h4>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                                            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                                            <YAxis tick={{ fontSize: 9, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                                            <RechartsTooltip
                                                                contentStyle={tooltipStyle}
                                                                labelFormatter={(val) => `Minuto ${val}`}
                                                                formatter={(value, name) => [`${value} ${isPaceBased ? 'ppm' : 'rpm'}`, 'Cadencia']}
                                                                cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                                isAnimationActive={false}
                                                                shared={true}
                                                                trigger="hover"
                                                            />
                                                            <Area type="monotone" dataKey="cadence" name="cadence" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0.1} fill="#8b5cf6" isAnimationActive={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#8b5cf6' }} dot={false} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Altitude Chart */}
                                            <div className="h-40 flex flex-col">
                                                <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 tracking-wider">Altitud</h4>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} syncId="telemetry" onMouseMove={handleMouseMove} onMouseLeave={() => setActivePayload(null)}>
                                                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#71717a' }} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                                        <YAxis tick={{ fontSize: 9, fill: '#71717a' }} domain={['dataMin', dataMax => Math.ceil(dataMax * 1.15)]} axisLine={false} tickLine={false} />
                                                        <RechartsTooltip
                                                            contentStyle={tooltipStyle}
                                                            labelFormatter={(val) => `Minuto ${val}`}
                                                            formatter={(value, name) => name === 'alt' ? [`${value} m`, 'Altitud'] : [value, name]}
                                                            cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                            isAnimationActive={false}
                                                            shared={true}
                                                            trigger="hover"
                                                        />
                                                        <Area type="monotone" dataKey="alt" name="alt" stroke="#71717a" fillOpacity={0.1} fill="#71717a" isAnimationActive={false} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#71717a' }} dot={false} />
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
                        )}

                        {/* TAB CONTENT: VUELTAS */}
                        {activeTab === 'vueltas' && (
                            <div className="animate-in fade-in duration-300">
                                {proMetrics && proMetrics.autoLaps && proMetrics.autoLaps.length > 0 && !loadingStreams ? (
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 shadow-sm">
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
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-600 p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                                        <Layers size={24} className="mb-2 opacity-50" />
                                        <p className="text-[10px] uppercase tracking-widest font-bold">Sin vueltas registradas</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: NIVEL */}
                        {activeTab === 'nivel' && (
                            <div className="animate-in fade-in duration-300">
                                {fitnessAnalysis ? (
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">

                                        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl shadow-inner ${fitnessAnalysis.score >= 70 ? 'bg-green-500' : fitnessAnalysis.score >= 40 ? 'bg-blue-500' : 'bg-slate-400'}`}>
                                                {fitnessAnalysis.score}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-zinc-100 tracking-tight">{fitnessAnalysis.title}</h3>
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Puntuación de Eficacia Global</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-5">
                                            <div>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Activity size={12} /> Análisis de la sesión</h4>
                                                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                                                    {fitnessAnalysis.description}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-md border border-slate-100 dark:border-zinc-800">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Target size={12} /> Veredicto</h4>
                                                <p className="text-sm italic text-slate-800 dark:text-zinc-200 font-bold leading-relaxed">
                                                    "{fitnessAnalysis.conclusion}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="border border-slate-200 dark:border-zinc-800 p-3 rounded flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Carga Base</span>
                                                <span className="text-lg font-black text-slate-800 dark:text-zinc-100">{Math.round(activity.tss || 0)} pts</span>
                                            </div>
                                            <div className="border border-slate-200 dark:border-zinc-800 p-3 rounded flex flex-col items-center justify-center text-center">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado Forma</span>
                                                <span className={`text-lg font-black ${fitnessAnalysis.score >= 70 ? 'text-green-500' : fitnessAnalysis.score >= 40 ? 'text-blue-500' : 'text-slate-500'}`}>
                                                    {fitnessAnalysis.score >= 70 ? 'Positivo' : fitnessAnalysis.score >= 40 ? 'Mantenimiento' : 'Neutro'}
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-10 mt-2">
                                        <Zap size={24} className="mb-2 opacity-50 text-slate-500" />
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 text-center">No hay datos suficientes para generar un análisis completo.<br />(Se necesitan streams, pulso y datos de entrenamiento)</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};