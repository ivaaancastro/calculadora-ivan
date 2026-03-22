import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart, ScatterChart, Scatter, ReferenceLine, ReferenceArea
} from 'recharts';
import { 
    Activity, Heart, CalendarDays, BarChart2, Target, MousePointer2, TrendingUp, Trophy, AlertTriangle, 
    Battery, Brain, Moon, Info, Activity as ActivityPulse, Loader2, Sparkles, Coffee, AlertOctagon,
    ArrowUpRight, ArrowDownRight, Zap, TrendingDown
} from 'lucide-react';
import { EvolutionChart } from './EvolutionChart';
import { InfoTooltip } from '../common/InfoTooltip';

const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200];
const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };
const formatPace = (decimalMinutes) => { if (!decimalMinutes || decimalMinutes >= 20) return '>20:00'; const mins = Math.floor(decimalMinutes); const secs = Math.round((decimalMinutes - mins) * 60); return `${mins}:${secs.toString().padStart(2, '0')}`; };
const getMonday = (d) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Aeróbico', 'Z3 Tempo', 'Z4 SubUmbral', 'Z5 SupraUmbral', 'Z6 VO2Max', 'Z7 Anaeróbico'];

export const AdvancedAnalytics = ({ activities, settings, onSelectActivity, timeRange, setTimeRange, chartData }) => {
    const [curveType, setCurveType] = useState('power');
    const [curveSport, setCurveSport] = useState('bike');
    const [scatterSport, setScatterSport] = useState('run');
    const [vo2Sport, setVo2Sport] = useState('run');
    const [mmpTimeframe, setMmpTimeframe] = useState('90d');
    const [intensityTimeframe, setIntensityTimeframe] = useState('28d');

    const analytics = useMemo(() => {
        const today = new Date();
        const date28DaysAgo = new Date(today); date28DaysAgo.setDate(today.getDate() - 28);
        const date45DaysAgo = new Date(today); date45DaysAgo.setDate(today.getDate() - 45);
        const date90DaysAgo = new Date(today); date90DaysAgo.setDate(today.getDate() - 90);

        const dateMmp = new Date(today);
        if (mmpTimeframe === '90d') dateMmp.setDate(today.getDate() - 90);
        else if (mmpTimeframe === '1y') dateMmp.setDate(today.getDate() - 365);
        else dateMmp.setFullYear(2000);

        const dateIntensity = new Date(today);
        if (intensityTimeframe === '28d') dateIntensity.setDate(today.getDate() - 28);
        else if (intensityTimeframe === '90d') dateIntensity.setDate(today.getDate() - 90);
        else if (intensityTimeframe === '1y') dateIntensity.setDate(today.getDate() - 365);
        else dateIntensity.setFullYear(2000);

        const zonesData = [0, 0, 0, 0, 0, 0, 0];
        const sortedActivities = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
        const weeklyMap = new Map();

        const getPeakByTime = (data, timeData, windowSecs) => {
            if (!data || !timeData || data.length === 0) return 0;
            let maxAvg = 0; let startIdx = 0; let currentSum = 0; let currentCount = 0;
            for (let endIdx = 0; endIdx < timeData.length; endIdx++) {
                currentSum += data[endIdx]; currentCount++;
                while (timeData[endIdx] - timeData[startIdx] > windowSecs) { currentSum -= data[startIdx]; currentCount--; startIdx++; }
                if (timeData[endIdx] - timeData[startIdx] >= windowSecs * 0.95) { const avg = currentSum / currentCount; if (avg > maxAvg) maxAvg = avg; }
            }
            return maxAvg;
        };

        const initPeaks = () => { const p = {}; TIME_INTERVALS.forEach(i => { p[i] = { value: 0, actId: null, actName: '', actDate: '' }; }); return p; };
        const peaks = { all: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() }, bike: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() }, run: { hr: initPeaks(), spd: initPeaks(), pwr: initPeaks() } };
        const efData = { bike: [], run: [] };
        const updatePeak = (sport, metric, window, value, act) => { if (value > peaks[sport][metric][window].value) peaks[sport][metric][window] = { value, actId: act.id, actName: act.name, actDate: act.date }; };

        let bestRunVo2 = 0; let bestBikeVo2 = 0; let hasPowerMeter = false;
        const dailyTSS = new Map();

        let totalVolume = 0; let totalActivities = 0;
        sortedActivities.forEach(act => {
            const actDate = new Date(act.date);
            const actTss = act.tss || 0;
            const dateKey = actDate.toISOString().split('T')[0];
            dailyTSS.set(dateKey, (dailyTSS.get(dateKey) || 0) + actTss);
            
            if (actDate >= date90DaysAgo) {
                totalVolume += (act.duration || 0);
                totalActivities++;
            }

            if (actDate >= date90DaysAgo) {
                const weekStart = getMonday(act.date);
                if (!weeklyMap.has(weekStart)) weeklyMap.set(weekStart, { week: weekStart, tss: 0, hours: 0 });
                const wData = weeklyMap.get(weekStart);
                wData.tss += actTss; wData.hours += (act.duration || 0) / 60;
            }

            const typeLower = String(act.type).toLowerCase();
            const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo');
            const isRun = typeLower.includes('run') || typeLower.includes('carrera');

            if (actDate >= date90DaysAgo && (isBike || isRun) && act.hr_avg > 80 && act.duration >= 20) {
                const speedMs = act.speed_avg || 0;
                const baseDateLabel = actDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                if (isBike && act.watts_avg > 40) {
                    const efBike = act.watts_avg / act.hr_avg;
                    efData.bike.push({ date: act.date, dateLabel: baseDateLabel, ef: Number(efBike.toFixed(2)), name: act.name, id: act.id, hr: Math.round(act.hr_avg), watts: Math.round(act.watts_avg) });
                }
                if (isRun && speedMs > 2) {
                    const efRun = (speedMs * 60) / act.hr_avg; // Speed (m/min) per heartbeat
                    efData.run.push({ date: act.date, dateLabel: baseDateLabel, ef: Number(efRun.toFixed(2)), name: act.name, id: act.id, hr: Math.round(act.hr_avg), pace: formatPace((16.6666667 / speedMs)) });
                }
            }

            if (actDate >= date45DaysAgo && act.duration >= 20) {
                // Heart Rate Reserve (HRR) Extrapolation Model
                const restHr = Number(settings.fcReposo) || 60;

                if (isRun && act.speed_avg > 2.5 && act.hr_avg > restHr) {
                    const maxHr = Number(settings.run.max) || 180;
                    const pctHrr = (act.hr_avg - restHr) / (maxHr - restHr);

                    // Only calculate if the effort is significant enough to be linear (>70% max HR)
                    if (pctHrr > 0 && act.hr_avg >= (maxHr * 0.70)) {
                        // O2 Cost of running = speed(m/min) * 0.2 ml/kg/min + 3.5 ml/kg/min resting
                        const speedMetersPerMin = (act.speed_avg * 60);
                        const o2Cost = (speedMetersPerMin * 0.2) + 3.5;

                        // Extrapolate sub-maximal o2 cost to 100% HRR
                        const vo2 = o2Cost / pctHrr;
                        if (vo2 > bestRunVo2 && vo2 < 85) bestRunVo2 = vo2; // Cap at 85 to prevent anomalous data
                    }
                }

                if (isBike && act.watts_avg > 50 && act.hr_avg > restHr) {
                    hasPowerMeter = true;
                    const maxHr = Number(settings.bike.max) || 180;
                    const pctHrr = (act.hr_avg - restHr) / (maxHr - restHr);
                    const weight = Number(settings.weight) || 70;

                    // Only calculate if the effort is significant enough to be linear (>70% max HR)
                    if (pctHrr > 0 && act.hr_avg >= (maxHr * 0.70)) {
                        // ACSM O2 Cost of cycling = (Watts * 10.8) / weight + 7 ml/kg/min resting
                        const o2Cost = ((act.watts_avg * 10.8) / weight) + 7;

                        // Extrapolate sub-maximal o2 cost to 100% HRR
                        const vo2 = o2Cost / pctHrr;
                        if (vo2 > bestBikeVo2 && vo2 < 85) bestBikeVo2 = vo2; // Cap at 85 to prevent anomalous data
                    }
                }
            }

            if (act.streams_data?.time) {
                const timeData = act.streams_data.time.data;
                if (act.streams_data.heartrate) {
                    const hrData = act.streams_data.heartrate.data;
                    if (actDate >= dateIntensity) {
                        const userZones = isBike ? settings.bike.zones : settings.run.zones;
                        for (let i = 1; i < hrData.length; i++) {
                            const hr = hrData[i]; const dt = timeData[i] - timeData[i - 1];
                            const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
                            if (zIndex !== -1 && zIndex < 7) zonesData[zIndex] += dt; else if (hr > userZones[userZones.length - 1].max) zonesData[6] += dt;
                        }
                    }
                    if (actDate >= dateMmp) {
                        TIME_INTERVALS.forEach(w => {
                            const peak = getPeakByTime(hrData, timeData, w);
                            if (peak > 0) { updatePeak('all', 'hr', w, peak, act); if (isBike) updatePeak('bike', 'hr', w, peak, act); if (isRun) updatePeak('run', 'hr', w, peak, act); }
                        });
                    }
                }
                if (actDate >= dateMmp && act.streams_data.velocity_smooth) {
                    const spdData = act.streams_data.velocity_smooth.data;
                    TIME_INTERVALS.forEach(w => {
                        const peak = getPeakByTime(spdData, timeData, w);
                        if (peak > 0) { updatePeak('all', 'spd', w, peak, act); if (isBike) updatePeak('bike', 'spd', w, peak, act); if (isRun) updatePeak('run', 'spd', w, peak, act); }
                    });
                }
                if (actDate >= dateMmp && act.streams_data.watts) {
                    const pwrData = act.streams_data.watts.data;
                    TIME_INTERVALS.forEach(w => {
                        const peak = getPeakByTime(pwrData, timeData, w);
                        if (peak > 0) { updatePeak('all', 'pwr', w, peak, act); if (isBike) updatePeak('bike', 'pwr', w, peak, act); if (isRun) updatePeak('run', 'pwr', w, peak, act); }
                    });
                }
            }
        });

        let bikeVo2IsEstimated = false;
        if (bestBikeVo2 === 0 && !hasPowerMeter && settings.fcReposo > 30 && settings.bike.max > 120) {
            bestBikeVo2 = 15.3 * (settings.bike.max / settings.fcReposo) * 0.95;
            bikeVo2IsEstimated = true;
        }

        let currentCTL = 0; let currentATL = 0;
        const loadHistory = [];
        const pmcHistory = [];
        const allDates = Array.from(dailyTSS.keys()).sort();
        if (allDates.length > 0) {
            const firstDate = new Date(allDates[0]);
            const msPerDay = 24 * 60 * 60 * 1000;
            const totalDays = Math.floor((today - firstDate) / msPerDay);
            for (let i = totalDays; i >= 0; i--) {
                const d = new Date(today); d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const tss = dailyTSS.get(dateStr) || 0;
                currentCTL = currentCTL + (tss - currentCTL) / 42;
                currentATL = currentATL + (tss - currentATL) / 7;
                if (i <= 180) {
                    pmcHistory.push({
                        dateLabel: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                        ctl: Math.round(currentCTL * 10) / 10,
                        atl: Math.round(currentATL * 10) / 10,
                        tsb: Math.round((currentCTL - currentATL) * 10) / 10,
                        tss: Math.round(tss),
                        date: dateStr
                    });
                }
                if (i < 7) loadHistory.push(tss);
            }
        }
        const tsb = currentCTL - currentATL;
        const freshness = currentCTL > 0 ? (tsb / currentCTL) * 100 : 0;

        // Calcular Ramp Rate (tendencia a 7 días) y Carga de hace 28d
        let pastCTL = 0; let ctl28d = 0;
        if (pmcHistory.length >= 8) pastCTL = pmcHistory[pmcHistory.length - 8].ctl;
        if (pmcHistory.length >= 28) ctl28d = pmcHistory[pmcHistory.length - 28].ctl;
        
        const rampRate = currentCTL - (pastCTL || currentCTL);
        const loadTrend = ctl28d > 0 ? ((currentCTL - ctl28d) / ctl28d) * 100 : 0;

        const sum7 = loadHistory.reduce((a, b) => a + b, 0);
        const mean7 = sum7 / 7;
        const variance = loadHistory.reduce((acc, val) => acc + Math.pow(val - mean7, 2), 0) / 7;
        const stdDev = Math.sqrt(variance);
        const monotony = stdDev > 0 ? (mean7 / stdDev) : (mean7 > 0 ? 4 : 0);
        const strain = sum7 * monotony;

        const weeklyChart = Array.from(weeklyMap.values()).map(w => ({ dateLabel: new Date(w.week).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), tss: Math.round(w.tss), hours: Number(w.hours.toFixed(1)) }));
        const zonesChart = zonesData.map((secs, i) => ({ name: ZONE_LABELS[i], hours: Number((secs / 3600).toFixed(1)), fill: ZONE_COLORS[i] }));
        const totalFocus = zonesData.reduce((a, b) => a + b, 0);
        const focusChart = totalFocus > 0 ? [
            { name: 'Aeróbico', value: Math.round(((zonesData[0] + zonesData[1]) / totalFocus) * 100), color: '#3b82f6' },
            { name: 'Tempo/Umbral', value: Math.round(((zonesData[2] + zonesData[3]) / totalFocus) * 100), color: '#eab308' },
            { name: 'Anaeróbico', value: Math.round(((zonesData[4] + zonesData[5] + zonesData[6]) / totalFocus) * 100), color: '#ef4444' }
        ] : [];

        let trainingProfile = { title: "Sin Datos", desc: "No hay datos de zonas suficientes para determinar un perfil.", color: "text-slate-500", raw: 'none' };
        if (totalFocus > 0) {
            const zAerobic = (zonesData[0] + zonesData[1]) / totalFocus;
            const zTempo = (zonesData[2] + zonesData[3]) / totalFocus;
            const zAnaerobic = (zonesData[4] + zonesData[5] + zonesData[6]) / totalFocus;

            if (zAerobic >= 0.75 && zAnaerobic >= zTempo) {
                trainingProfile = { title: "Polarizado", desc: "Mucha base aeróbica y picos de alta intensidad, evitando zonas grises. Muy efectivo.", color: "text-emerald-500", raw: 'polarizado' };
            } else if (zAerobic >= 0.65 && zTempo > zAnaerobic) {
                trainingProfile = { title: "Piramidal", desc: "Base enorme, algo de umbral y poco anaeróbico. Gran progresión constante de forma.", color: "text-blue-500", raw: 'piramidal' };
            } else if (zTempo >= 0.35) {
                trainingProfile = { title: "Enfocado en Umbral", desc: "Excesivo tiempo en zonas de fatiga alta y media. Riesgo de estancamiento (mucho 'Sweet Spot').", color: "text-amber-500", raw: 'umbral' };
            } else if (zAerobic < 0.55 && zAnaerobic >= 0.20) {
                trainingProfile = { title: "Alta Intensidad (HIIT)", desc: "Entrenamiento de corta duración y altísimo impacto. Insostenible a medio plazo.", color: "text-rose-500", raw: 'hiit' };
            } else {
                trainingProfile = { title: "Mixto / Base", desc: "Distribución aeróbica general sin un pico polarizado muy claro hacia los extremos.", color: "text-indigo-500", raw: 'mixto' };
            }
        }

        const curves = { all: { spd: [], hr: [], pwr: [] }, bike: { spd: [], hr: [], pwr: [] }, run: { spd: [], hr: [], pwr: [] } };
        ['all', 'bike', 'run'].forEach(sport => {
            curves[sport].spd = TIME_INTERVALS.map(i => {
                const pk = peaks[sport].spd[i];
                if (sport === 'run' && pk.value > 0.1) return { name: formatInterval(i), value: Number((16.6666667 / pk.value).toFixed(2)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
                return { name: formatInterval(i), value: Number((pk.value * 3.6).toFixed(1)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => sport === 'run' ? (d.value > 0 && d.value < 20) : d.value > 0);
            curves[sport].hr = TIME_INTERVALS.map(i => {
                const pk = peaks[sport].hr[i]; return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);
            curves[sport].pwr = TIME_INTERVALS.map(i => {
                const pk = peaks[sport].pwr[i]; return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);
        });

        return {
            zonesChart, focusChart, weeklyChart, curves, efData, dailyTSS, pmcHistory,
            trainingProfile,
            vo2Max: { run: Number(bestRunVo2.toFixed(1)), bike: Number(bestBikeVo2.toFixed(1)), bikeEstimated: bikeVo2IsEstimated },
            model: { ctl: currentCTL, atl: currentATL, tsb, rampRate, monotony, strain, load7d: sum7, freshness, loadTrend, totalActivities, totalVolume },
            peaksRecord: peaks // Pass raw peaks for table display
        };
    }, [activities, settings, mmpTimeframe, intensityTimeframe]);

    if (!activities || activities.length === 0) return null;

    const currentCurve = useMemo(() => {
        if (curveType === 'power') return analytics.curves[curveSport].pwr;
        if (curveType === 'speed') return analytics.curves[curveSport].spd;
        return analytics.curves[curveSport].hr;
    }, [analytics.curves, curveSport, curveType]);

    const isPace = curveSport === 'run' && curveType === 'speed';
    const curveColor = curveType === 'hr' ? '#ef4444' : (curveType === 'power' ? '#fbbf24' : (isPace ? '#ea580c' : '#2563eb'));
    const curveUnit = curveType === 'power' ? 'w' : (isPace ? '/km' : (curveType === 'speed' ? 'km/h' : 'ppm'));

    const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '4px', color: '#f4f4f5', fontSize: '11px', fontWeight: '500', padding: '8px 10px', zIndex: 1000 };

    const handleDirectClick = (payload) => { if (!onSelectActivity) return; if (payload?.actId || payload?.id) onSelectActivity(activities.find(a => a.id === (payload.actId || payload.id))); };
    const handleChartBackgroundClick = (data) => { if (data && data.activePayload && data.activePayload.length > 0) handleDirectClick(data.activePayload[0].payload); };

    const CustomCurveTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={tooltipStyle} className="shadow-xl min-w-[150px]">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Pico de {label}</p>
                    <p className="text-sm font-black mb-2" style={{ color: curveColor }}>{isPace ? formatPace(data.value) : data.value} <span className="text-[9px] font-bold">{curveUnit}</span></p>
                    {data.actName && (
                        <div className="border-t border-zinc-700 pt-2 mt-1">
                            <p className="text-[10px] text-zinc-200 truncate font-bold">{data.actName}</p>
                            <p className="text-[9px] text-zinc-500">{new Date(data.actDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-1 text-[8px] text-blue-400 mt-1 font-bold uppercase tracking-wider"><MousePointer2 size={8} /> Clic para abrir</div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const CustomEfTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isRun = scatterSport === 'run';
            return (
                <div style={tooltipStyle} className="shadow-xl w-48 z-[200]">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1.5 border-b border-zinc-700 pb-1">Factor de Eficiencia</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xl font-black text-violet-400 leading-none">{data.ef}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{isRun ? 'v/hr' : 'w/hr'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2 bg-zinc-800 p-2 rounded">
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">{isRun ? 'Ritmo' : 'Potencia'}</p>
                            <p className="text-xs font-bold text-zinc-200">{isRun ? data.pace : `${data.watts}w`}</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">Pulso</p>
                            <p className="text-xs font-bold text-rose-400">{data.hr} ppm</p>
                        </div>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 mt-1">
                        <p className="text-[10px] text-zinc-200 truncate font-bold" title={data.name}>{data.name}</p>
                        <p className="text-[9px] text-zinc-500">{new Date(data.date).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 text-[8px] text-blue-400 mt-2 font-bold uppercase tracking-wider"><MousePointer2 size={8} /> Clic para abrir actividad</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const getTrainingStatus = () => {
        const { ctl, tsb, rampRate } = analytics.model;
        if (ctl < 15) return { phase: 'Construyendo Base', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700', icon: Brain, desc: 'Tienes poco historial acumulado (Fitness CTL). Sigue entrenando para asentar el modelo base de 42 días.' };
        if (tsb < -25) return { phase: 'Sobrecarga / Riesgo', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30', icon: AlertTriangle, desc: 'Tu Fatiga (7d) supera con creces tu Forma Base (42d). Riesgo alto de lesión. Necesitas descanso urgente.' };
        if (tsb >= -25 && tsb <= -10 && rampRate > 0.5) return { phase: 'Productivo', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30', icon: TrendingUp, desc: 'Punto dulce de estrés. Estás asimilando carga perfectamente (TSB entre -10 y -25) y ganando estado de forma.' };
        if (tsb > -10 && tsb <= 5) return { phase: 'Mantenimiento', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30', icon: Activity, desc: 'Balance Neutro (TSB cercano a 0). Mantienes tu nivel sin estresar en exceso el sistema. Ideal para asimilar.' };
        if (tsb > 5 && rampRate < -1) return { phase: 'Pérdida de Forma', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30', icon: TrendingDown, desc: 'Estás estrenando menos de lo habitual. Tu Fatiga ha desaparecido pero tu Forma Base está cayendo.' };
        return { phase: 'Pico / Recuperación', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30', icon: Battery, desc: 'Estás muy fresco positivamente (TSB Alto). Has limpiado la fatiga y estás en tu nivel óptimo para competir.' };
    };

    const getVo2Assessment = (vo2Value) => {
        const v = parseFloat(vo2Value);
        if (v <= 0) return { label: '-', color: 'text-slate-500', width: '0%' };
        let posPercent = 0;
        if (v < 35) posPercent = ((v - 25) / 10) * 20;
        else if (v < 42) posPercent = 20 + ((v - 35) / 7) * 20;
        else if (v < 50) posPercent = 40 + ((v - 42) / 8) * 20;
        else if (v < 60) posPercent = 60 + ((v - 50) / 10) * 20;
        else posPercent = 80 + Math.min(((v - 60) / 10) * 20, 20);
        posPercent = Math.max(2, Math.min(posPercent, 98));

        if (v < 35) return { label: 'Pobre', color: 'text-red-500', width: `${posPercent}%` };
        if (v < 42) return { label: 'Regular', color: 'text-orange-500', width: `${posPercent}%` };
        if (v < 50) return { label: 'Bueno', color: 'text-emerald-500', width: `${posPercent}%` };
        if (v < 60) return { label: 'Excelente', color: 'text-blue-500', width: `${posPercent}%` };
        return { label: 'Superior', color: 'text-purple-500', width: `${posPercent}%` };
    };

    const status = getTrainingStatus();
    const currentVo2Value = vo2Sport === 'run' ? analytics.vo2Max.run : analytics.vo2Max.bike;
    const vo2Info = getVo2Assessment(currentVo2Value);

    const SectionHeader = ({ title }) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">{title}</h3>
        </div>
    );
    const Subtitle = ({ text }) => <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-2 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{text}</span>;

    return (
        <div className="space-y-12 pb-12">
            {/* ZONA 1: CARGA Y RENDIMIENTO (PMC) */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                            Carga y Rendimiento
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Evolución de fitness, fatiga y forma a largo plazo
                        </p>
                    </div>

                    <div className="flex bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
                        {[
                            { id: "7d", label: "7D" },
                            { id: "30d", label: "30D" },
                            { id: "90d", label: "3M" },
                            { id: "all", label: "Todo" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeRange(t.id)}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase transition-all rounded-lg ${timeRange === t.id
                                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Fitness (CTL)', value: Math.round(analytics.model.ctl), icon: Activity, color: 'text-blue-500', sub: `${analytics.model.loadTrend >= 0 ? '+' : ''}${analytics.model.loadTrend.toFixed(1)}% vs 28d`, subColor: analytics.model.loadTrend >= 0 ? 'text-emerald-500' : 'text-red-500', tip: "Nivel de condición física basado en los últimos 42 días. A mayor CTL, mayor capacidad de asimilar carga." },
                        { label: 'Fatiga (ATL)', value: Math.round(analytics.model.atl), icon: Battery, color: 'text-purple-500', sub: 'Carga últ. 7 días', tip: "Cansancio acumulado en los últimos 7 días. Sube rápido tras entrenos duros y baja con descanso." },
                        { label: 'Forma (TSB)', value: Math.round(analytics.model.tsb), icon: Zap, color: analytics.model.tsb < -25 ? 'text-red-500' : (analytics.model.tsb > 0 ? 'text-emerald-500' : 'text-blue-500'), sub: `Frescura: ${Math.round(analytics.model.freshness)}%`, tip: "Balance entre Fitness y Fatiga. Óptimo para competir: +5 a +25. Óptimo para entrenar: -10 a -30." },
                        { label: 'Rampa Semanal', value: analytics.model.rampRate.toFixed(1), icon: analytics.model.rampRate >= 0 ? ArrowUpRight : ArrowDownRight, color: analytics.model.rampRate > 6 ? 'text-red-500' : (analytics.model.rampRate > 0 ? 'text-emerald-500' : 'text-slate-400'), sub: `${analytics.model.rampRate > 0 ? 'Subiendo' : 'Bajando'}`, tip: "Cuánto sube tu CTL cada semana. Ideal: 2-5 pts. >8 indica riesgo alto de sobreentrenamiento." },
                        { label: 'Monotonía', value: analytics.model.monotony.toFixed(2), icon: Brain, color: analytics.model.monotony > 2 ? 'text-orange-500' : 'text-slate-400', sub: 'Variedad de carga', tip: "Variedad de la carga diaria. >1.5 significa falta de variedad y mayor riesgo de lesión o estancamiento." },
                        { label: 'Carga Sem.', value: Math.round(analytics.model.strain), icon: ActivityPulse, color: analytics.model.strain > 2000 ? 'text-red-500' : 'text-slate-400', sub: 'Estrés acumulado', tip: "Estrés total de la semana (TSS x Monotonía). Refleja el impacto sistémico real en tu cuerpo." },
                        { label: 'Volumen 3M', value: `${Math.round(analytics.model.totalVolume / 60)}h`, icon: CalendarDays, color: 'text-slate-500', sub: `${analytics.model.totalActivities} actividades`, tip: "Horas totales y actividades acumuladas en los últimos 3 meses. Clave para entender tu consistencia." },
                        { label: 'VO2 Max', value: currentVo2Value || '--', icon: TrendingUp, color: vo2Info.color, sub: vo2Info.label, tip: "Estimación de tu capacidad aeróbica máxima (ml/kg/min). Sube con la intensidad y eficiencia." }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{kpi.label}</span>
                                    <InfoTooltip text={kpi.tip} />
                                </div>
                                <kpi.icon size={12} className={kpi.color} />
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-semibold text-slate-900 dark:text-zinc-100">{kpi.value}</span>
                            </div>
                            {kpi.sub && <p className={`text-[7px] font-bold uppercase mt-1 ${kpi.subColor || 'text-slate-400 dark:text-zinc-500'}`}>{kpi.sub}</p>}
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-900/30 p-4 rounded-2xl border border-transparent dark:border-zinc-900 shadow-inner">
                    <div className="h-[280px]">
                        <EvolutionChart data={chartData} />
                    </div>
                </div>
            </div>

            {/* ZONA 2: ESTADO FISIOLÓGICO */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                        Estado y Perfil Fisiológico
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Balance hídrico, fatiga acumulada y capacidad aeróbica
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border flex flex-col justify-center lg:col-span-1 ${status.bg} border-opacity-50 shadow-sm`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-1.5 rounded-lg bg-white dark:bg-zinc-900 shadow-sm ${status.color}`}>
                                <status.icon size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 opacity-60">Fase Actual</span>
                                <InfoTooltip text="Estado sistémico basado en tu balance de fatiga y fitness. Indica si estás en fase productiva, de riesgo o de recuperación." />
                            </div>
                            <h3 className={`text-sm font-bold uppercase tracking-tight ${status.color}`}>{status.phase}</h3>
                            </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 leading-tight">
                            {status.desc}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/50 lg:col-span-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">VO2 Max Estimado</span>
                                <InfoTooltip text="Consumo máximo de oxígeno. Es una métrica de tu potencia aeróbica total. Varía según el deporte seleccionado." />
                            </div>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full">
                                {['bike', 'run'].map(s => (
                                    <button key={s} onClick={() => setVo2Sport(s)} className={`px-2 py-0.5 text-[7px] font-bold uppercase rounded-full transition-all ${vo2Sport === s ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>{s === 'bike' ? 'Bici' : 'Run'}</button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-baseline gap-2 justify-center">
                                <span className="text-3xl font-semibold text-slate-800 dark:text-zinc-100 tracking-tighter">{currentVo2Value > 0 ? currentVo2Value : '--'}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ml/kg/min</span>
                            </div>
                            <div className="relative w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                                <div className="absolute top-0 left-0 h-full bg-red-500/30 w-[20%]"></div>
                                <div className="absolute top-0 left-[20%] h-full bg-orange-500/30 w-[20%]"></div>
                                <div className="absolute top-0 left-[40%] h-full bg-emerald-500/30 w-[20%]"></div>
                                <div className="absolute top-0 left-[60%] h-full bg-blue-500/30 w-[20%]"></div>
                                <div className="absolute top-0 left-[80%] h-full bg-purple-500/30 w-[20%]"></div>
                                {currentVo2Value > 0 && (
                                    <div className="absolute top-0 h-full w-1 bg-slate-800 dark:bg-white shadow-xl z-10 transition-all duration-1000" style={{ left: vo2Info.width }}></div>
                                )}
                            </div>
                            <div className="mt-1 text-center">
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${vo2Info.color}`}>{vo2Info.label}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/50 lg:col-span-1 flex flex-col justify-between">
                        <div className="flex items-center gap-1 mb-2">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Umbrales Actuales</span>
                             <InfoTooltip text="Tus valores de referencia (FTP en bici, Ritmo Umbral en carrera) configurados en tu perfil." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                                <p className="text-[7px] font-bold text-slate-400 uppercase">FTP (Bici)</p>
                                <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{settings.bike.ftp} <span className="text-[8px] font-bold">W</span></p>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                                <p className="text-[7px] font-bold text-slate-400 uppercase">TP (Carrera)</p>
                                <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{formatPace(settings.run.thresholdPace)} <span className="text-[8px] font-bold">/km</span></p>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                                <p className="text-[7px] font-bold text-slate-400 uppercase">W/Kg</p>
                                <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{(settings.bike.ftp / (settings.weight || 70)).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                                <p className="text-[7px] font-bold text-slate-400 uppercase">Peso</p>
                                <p className="text-sm font-black text-slate-800 dark:text-zinc-100">{settings.weight} <span className="text-[8px] font-bold">Kg</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FORMA (TSB) CARD */}
                <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 ${analytics.model.tsb < -25 ? 'text-red-500' : (analytics.model.tsb > 0 ? 'text-emerald-500' : 'text-blue-500')}`}>
                            <Activity size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Balance de Carga (TSB)</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Forma actual basada en el balance fatiga/fitness</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl font-semibold ${analytics.model.tsb < -25 ? 'text-red-500' : (analytics.model.tsb > 0 ? 'text-emerald-500' : 'text-blue-500')}`}>
                            {Math.round(analytics.model.tsb)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">pts</span>
                    </div>
                </div>
            </div>

            {/* ZONA 3: DISTRIBUCIÓN Y VOLUMEN */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                        Distribución y Volumen
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Carga semanal por zonas y tiempo total de entrenamiento
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900/30 p-4 rounded-2xl border border-transparent dark:border-zinc-900 flex flex-col lg:col-span-2 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Volumen Semanal (TSS/Horas)</span>
                                <InfoTooltip text="Carga de entrenamiento (TSS) y horas totales acumuladas cada semana. Las barras indican el estrés (TSS) y la línea el tiempo." />
                             </div>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analytics.weeklyChart}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 8, fill: '#71717a' }} minTickGap={15} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 8, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} isAnimationActive={false} cursor={{ stroke: '#71717a', strokeWidth: 1 }} />
                                    <Bar yAxisId="left" dataKey="tss" name="TSS" fill="#8b5cf6" opacity={0.6} radius={[2, 2, 0, 0]} barSize={12} />
                                    <Line yAxisId="left" type="monotone" dataKey="hours" name="Horas" stroke="#10b981" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/50 flex flex-col lg:col-span-1 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Distribución de Foco</span>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full">
                                {['28d', '90d'].map(t => (
                                    <button key={t} onClick={() => setIntensityTimeframe(t)} className={`px-2 py-0.5 text-[7px] font-bold uppercase rounded-full transition-all ${intensityTimeframe === t ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>{t.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                             {/* FOCUS BARS */}
                             <div className="space-y-3">
                                {analytics.focusChart.map((focus, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between text-[8px] font-bold uppercase text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <span>{focus.name}</span>
                                                <InfoTooltip text={focus.name === 'AERÓBICO' ? 'Zonas 1 y 2. Base de resistencia.' : (focus.name === 'TEMPO/UMBRAL' ? 'Zonas 3 y 4. Ritmos de carrera sostenidos.' : 'Zonas 5+. Potencia explosiva y series cortas.')} />
                                            </div>
                                            <span>{focus.value}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${focus.value}%`, backgroundColor: focus.color }}></div>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {/* TIME IN ZONES SMALL TABLE */}
                             <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Desglose por Zona</span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {analytics.zonesChart.filter(z => z.hours > 0).map((z, i) => (
                                        <div key={i} className="flex justify-between items-center text-[8px] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: z.fill }}></div>
                                                <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[60px]">{z.name.split(' ')[0]}</span>
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-zinc-200">{z.hours}h</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA 4: RENDIMIENTO Y RÉCORDS */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                        Potencial y Récords
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Análisis de eficiencia aeróbica y curvas de potencia máxima
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-800/50">
                            <button onClick={() => setCurveSport('bike')} className={`px-4 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${curveSport === 'bike' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}>Ciclismo</button>
                            <button onClick={() => setCurveSport('run')} className={`px-4 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${curveSport === 'run' ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500'}`}>Carrera</button>
                        </div>
                        <div className="flex gap-3">
                            {['power', 'speed', 'hr'].map(t => (
                                <button key={t} onClick={() => setCurveType(t)} className={`text-[9px] font-bold uppercase ${curveType === t ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400'}`}>
                                    {t === 'power' ? 'Potencia' : (t === 'speed' ? (curveSport === 'run' ? 'Ritmo' : 'Veloc.') : 'Pulso')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* EF TREND */}
                        <div className="flex flex-col lg:col-span-1">
                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Eficiencia Aeróbica (EF)</span>
                                <InfoTooltip text="Relación entre potencia/ritmo y pulso. Un EF al alza indica que eres más eficiente (generas más vatios a menos pulso)." />
                            </div>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.efData[curveSport]} onClick={handleChartBackgroundClick}>
                                        <defs>
                                            <linearGradient id="efGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.1} vertical={false} />
                                        <XAxis dataKey="dateLabel" hide />
                                        <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                                        <RechartsTooltip content={<CustomEfTooltip />} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="ef" stroke="#8b5cf6" strokeWidth={2} fill="url(#efGrad)" activeDot={{ r: 4, fill: '#8b5cf6' }} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* MMP CURVE */}
                        <div className="flex flex-col lg:col-span-1 border-x border-slate-100 dark:border-zinc-800 px-4">
                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Curva MMP</span>
                                <InfoTooltip text="Tu mejor potencia/ritmo para cada duración. Refleja tu perfil de capacidades y récords históricos." />
                            </div>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={currentCurve}>
                                        <CartesianGrid strokeDasharray="1 1" stroke="#3f3f46" opacity={0.05} />
                                        <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#71717a' }} />
                                        <YAxis hide reversed={isPace} domain={['auto', 'auto']} />
                                        <RechartsTooltip content={<CustomCurveTooltip />} isAnimationActive={false} />
                                        <Area type="stepAfter" dataKey="value" stroke={curveColor} strokeWidth={2} fill={curveColor} fillOpacity={0.03} dot={false} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* MMP PEAKS TABLE */}
                        <div className="flex flex-col lg:col-span-1">
                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Récords Históricos</span>
                                <InfoTooltip text="Tus mejores valores absolutos para las duraciones clave. Se actualizan automáticamente con cada actividad." />
                            </div>
                            <div className="space-y-2">
                                {[1, 60, 300, 1200].map(secs => {
                                    const pk = analytics.peaksRecord[curveSport][curveType === 'power' ? 'pwr' : (curveType === 'speed' ? 'spd' : 'hr')][secs];
                                    let displayVal = pk.value;
                                    if (curveType === 'speed') {
                                        if (curveSport === 'run') displayVal = formatPace(16.6666667 / pk.value);
                                        else displayVal = (pk.value * 3.6).toFixed(1);
                                    } else {
                                        displayVal = Math.round(pk.value);
                                    }
                                    
                                    return (
                                        <div key={secs} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{formatInterval(secs)}</span>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-800 dark:text-zinc-100">
                                                    {pk.value > 0 ? displayVal : '--'}
                                                    <span className="text-[8px] ml-0.5 font-bold text-slate-400">{curveUnit}</span>
                                                </p>
                                                {pk.actDate && <p className="text-[7px] text-slate-400 uppercase">{new Date(pk.actDate).toLocaleDateString()}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};