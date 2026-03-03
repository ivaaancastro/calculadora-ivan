import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart, ScatterChart, Scatter, ReferenceLine, ReferenceArea
} from 'recharts';
import { Activity, Heart, CalendarDays, BarChart2, Target, MousePointer2, TrendingUp, Trophy, AlertTriangle, Battery, Brain, Moon, Info, Activity as ActivityPulse, Loader2, Sparkles, Coffee, AlertOctagon } from 'lucide-react';

const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200];
const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };
const formatPace = (decimalMinutes) => { if (!decimalMinutes || decimalMinutes >= 20) return '>20:00'; const mins = Math.floor(decimalMinutes); const secs = Math.round((decimalMinutes - mins) * 60); return `${mins}:${secs.toString().padStart(2, '0')}`; };
const getMonday = (d) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Aeróbico', 'Z3 Tempo', 'Z4 SubUmbral', 'Z5 SupraUmbral', 'Z6 VO2Max', 'Z7 Anaeróbico'];

export const AdvancedAnalytics = ({ activities, settings, onSelectActivity }) => {
    const [curveType, setCurveType] = useState('speed');
    const [curveSport, setCurveSport] = useState('run');
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
        const peaks = { all: { hr: initPeaks(), spd: initPeaks() }, bike: { hr: initPeaks(), spd: initPeaks() }, run: { hr: initPeaks(), spd: initPeaks() } };
        const scatterData = { bike: [], run: [] };
        const updatePeak = (sport, metric, window, value, act) => { if (value > peaks[sport][metric][window].value) peaks[sport][metric][window] = { value, actId: act.id, actName: act.name, actDate: act.date }; };

        let bestRunVo2 = 0; let bestBikeVo2 = 0; let hasPowerMeter = false;
        const dailyTSS = new Map();

        sortedActivities.forEach(act => {
            const actDate = new Date(act.date);
            const actTss = act.tss || 0;
            const dateKey = actDate.toISOString().split('T')[0];
            dailyTSS.set(dateKey, (dailyTSS.get(dateKey) || 0) + actTss);

            if (actDate >= date90DaysAgo) {
                const weekStart = getMonday(act.date);
                if (!weeklyMap.has(weekStart)) weeklyMap.set(weekStart, { week: weekStart, tss: 0, hours: 0 });
                const wData = weeklyMap.get(weekStart);
                wData.tss += actTss; wData.hours += (act.duration || 0) / 60;
            }

            const typeLower = String(act.type).toLowerCase();
            const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo');
            const isRun = typeLower.includes('run') || typeLower.includes('carrera');

            if (actDate >= date90DaysAgo && (isBike || isRun) && act.hr_avg > 80 && act.speed_avg > 0 && act.duration >= 20) {
                const speedKmH = Number((act.speed_avg * 3.6).toFixed(1));
                const paceMinKm = Number((16.6666667 / act.speed_avg).toFixed(2));
                if (isBike) scatterData.bike.push({ hr: Math.round(act.hr_avg), speed: speedKmH, name: act.name, date: act.date, id: act.id });
                if (isRun && paceMinKm < 15) scatterData.run.push({ hr: Math.round(act.hr_avg), pace: paceMinKm, name: act.name, date: act.date, id: act.id });
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
                    });
                }
                if (i < 7) loadHistory.push(tss);
            }
        }
        const tsb = currentCTL - currentATL;

        // Calcular Ramp Rate (tendencia a 7 días)
        let pastCTL = 0;
        if (pmcHistory.length >= 8) {
            pastCTL = pmcHistory[pmcHistory.length - 8].ctl;
        } else if (pmcHistory.length > 0) {
            pastCTL = pmcHistory[0].ctl;
        }
        const rampRate = currentCTL - pastCTL;

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

        const curves = { all: { spd: [], hr: [] }, bike: { spd: [], hr: [] }, run: { spd: [], hr: [] } };
        ['all', 'bike', 'run'].forEach(sport => {
            curves[sport].spd = TIME_INTERVALS.map(i => {
                const pk = peaks[sport].spd[i];
                if (sport === 'run' && pk.value > 0.1) return { name: formatInterval(i), value: Number((16.6666667 / pk.value).toFixed(2)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
                return { name: formatInterval(i), value: Number((pk.value * 3.6).toFixed(1)), rawSpeed: pk.value, actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => sport === 'run' ? (d.value > 0 && d.value < 20) : d.value > 0);
            curves[sport].hr = TIME_INTERVALS.map(i => {
                const pk = peaks[sport].hr[i]; return { name: formatInterval(i), value: Math.round(pk.value), actId: pk.actId, actName: pk.actName, actDate: pk.actDate };
            }).filter(d => d.value > 0);
        });

        return {
            zonesChart, focusChart, weeklyChart, curves, scatterData, dailyTSS, pmcHistory,
            vo2Max: { run: Number(bestRunVo2.toFixed(1)), bike: Number(bestBikeVo2.toFixed(1)), bikeEstimated: bikeVo2IsEstimated },
            model: { ctl: currentCTL, atl: currentATL, tsb, rampRate, monotony, strain, load7d: sum7 }
        };
    }, [activities, settings, mmpTimeframe, intensityTimeframe]);

    if (!activities || activities.length === 0) return null;

    const currentCurve = analytics.curves[curveSport][curveType === 'speed' ? 'spd' : 'hr'];
    const isPace = curveSport === 'run' && curveType === 'speed';
    const curveColor = curveType === 'hr' ? '#ef4444' : (isPace ? '#ea580c' : '#2563eb');
    const curveUnit = isPace ? '/km' : (curveType === 'speed' ? 'km/h' : 'ppm');

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

    const CustomScatterTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isRun = scatterSport === 'run';
            return (
                <div style={tooltipStyle} className="shadow-xl min-w-[150px]">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Punto de Eficiencia</p>
                    <div className="flex justify-between gap-3 mb-2">
                        <p className="text-xs font-black text-rose-500">{data.hr} <span className="text-[8px]">ppm</span></p>
                        <p className="text-xs font-black text-blue-400">{isRun ? formatPace(data.pace) : data.speed} <span className="text-[8px]">{isRun ? '/km' : 'km/h'}</span></p>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 mt-1">
                        <p className="text-[10px] text-zinc-200 truncate font-bold">{data.name}</p>
                        <p className="text-[9px] text-zinc-500">{new Date(data.date).toLocaleDateString()}</p>
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
        <div className="space-y-8 pt-6 mt-6 border-t border-slate-200 dark:border-zinc-800 font-sans">

            {/* -----------------------------------------------------------------------------------------
          SECCIÓN 1: ESTADO DE ENTRENAMIENTO Y CARGA 
      ----------------------------------------------------------------------------------------- */}
            <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">Performance Management</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 mb-4 rounded-sm relative z-10">


                    <div className="bg-white dark:bg-zinc-950 p-5 flex flex-col items-center justify-center group relative cursor-help min-h-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Carga 7 Días (ATL)</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-zinc-100">{Math.round(analytics.model.load7d)}</span>
                            <span className="text-xs text-slate-400 font-sans font-medium">TSS</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 dark:bg-black text-slate-100 p-3 rounded-lg top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-64 text-center pointer-events-none z-[100] shadow-2xl border border-slate-700 dark:border-zinc-800">
                            <strong>Fatiga a Corto Plazo (ATL)</strong><br /><br /><span className="text-slate-300">Promedio de carga de los últimos 7 días. Refleja tu fatiga reciente.</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-5 flex flex-col items-center justify-center group relative cursor-help min-h-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Monotonía</span>
                        <span className={`text-2xl font-mono font-black ${analytics.model.monotony > 2.0 ? 'text-red-500' : (analytics.model.monotony > 1.5 ? 'text-orange-500' : 'text-emerald-500')}`}>
                            {analytics.model.monotony.toFixed(2)}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 dark:bg-black text-slate-100 p-3 rounded-lg top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-64 text-center pointer-events-none z-[100] shadow-2xl border border-slate-700 dark:border-zinc-800">
                            <strong>Variación Diaria</strong><br /><br />
                            <span className="text-slate-300">¿Alternas días duros y suaves?</span><br />
                            <span className="text-emerald-400 font-semibold">&lt; 1.5: Bien</span> (Entreno variado).<br />
                            <span className="text-red-400 font-semibold">&gt; 2.0: Mal</span> (Siempre haces lo mismo).
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-5 flex flex-col items-center justify-center group relative cursor-help min-h-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Impacto (Strain)</span>
                        <span className={`text-2xl font-mono font-black ${analytics.model.strain > 2000 ? 'text-rose-500' : 'text-indigo-500'}`}>
                            {Math.round(analytics.model.strain)}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 dark:bg-black text-slate-100 p-3 rounded-lg top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-64 text-center pointer-events-none z-[100] shadow-2xl border border-slate-700 dark:border-zinc-800">
                            <strong>Desgaste Global Semanal</strong><br /><br />
                            <span className="text-slate-300">Calculado multiplicando la Carga por la Monotonía. Un Impacto superior a 2000 continuadamente es garantía de lesión o enfermedad, cuidado.</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-5 flex flex-col items-center justify-center group relative cursor-help min-h-[100px]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Rampa (Fitness)</span>
                        <div className="flex items-baseline gap-1 text-slate-600 dark:text-zinc-300">
                            <span className={`text-2xl font-mono font-black ${analytics.model.rampRate > 5 ? 'text-orange-500' : (analytics.model.rampRate > 1 ? 'text-emerald-500' : '')}`}>
                                {analytics.model.rampRate > 0 ? '+' : ''}{analytics.model.rampRate.toFixed(1)}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">CTL / sem</span>
                        </div>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 dark:bg-black text-slate-100 p-4 rounded-lg top-[calc(100%+10px)] right-0 md:left-1/2 md:-translate-x-1/2 w-72 text-center pointer-events-none z-[100] shadow-2xl border border-slate-700 dark:border-zinc-800">
                            <strong>Ritmo de Ganancia de Forma</strong><br /><br />
                            <span className="text-slate-300">Compara tu Fitness (CTL media 42d) de hoy, respecto al que tenías hace 7 días. Te dice a qué ritmo estás mejorando tu base aeróbica.</span><br /><br />
                            <span className="text-emerald-400 font-bold">+2 a +5 puntos:</span> Progresión ideal.<br />
                            <span className="text-red-400 font-bold">+6 o más:</span> Subiendo demasiado rápido, riesgo.
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className={`p-6 rounded-lg border flex flex-col justify-center lg:col-span-1 ${status.bg}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full bg-white dark:bg-zinc-950 shadow-sm ${status.color}`}><status.icon size={24} strokeWidth={2.5} /></div>
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${status.color}`}>{status.phase}</h2>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed">{status.desc}</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 h-[300px] rounded-lg lg:col-span-3 flex flex-col">
                        <div className="flex items-center mb-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarDays size={12} /> Carga Semanal (TSS)</h4>
                            <Subtitle text="Últ. 3 Meses" />
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analytics.weeklyChart} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#71717a' }} minTickGap={15} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#8b5cf6' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" hide />
                                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} isAnimationActive={false} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} iconType="plainline" />
                                    <Bar yAxisId="left" dataKey="tss" name="Carga (TSS)" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={30} />
                                    <Line yAxisId="right" type="step" dataKey="hours" name="Volumen (Horas)" stroke="#10b981" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* -----------------------------------------------------------------------------------------
          SECCIÓN 2: DISTRIBUCIÓN E INTENSIDAD
      ----------------------------------------------------------------------------------------- */}
            <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">Distribución de Intensidad</h3>
                    <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner">
                        <button onClick={() => setIntensityTimeframe('28d')} className={`px-2 py-1 text-[8px] sm:px-3 sm:py-1 sm:text-[9px] font-bold uppercase rounded-full transition-all ${intensityTimeframe === '28d' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>28D</button>
                        <button onClick={() => setIntensityTimeframe('90d')} className={`px-2 py-1 text-[8px] sm:px-3 sm:py-1 sm:text-[9px] font-bold uppercase rounded-full transition-all ${intensityTimeframe === '90d' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>90D</button>
                        <button onClick={() => setIntensityTimeframe('1y')} className={`px-2 py-1 text-[8px] sm:px-3 sm:py-1 sm:text-[9px] font-bold uppercase rounded-full transition-all ${intensityTimeframe === '1y' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>1 Año</button>
                        <button onClick={() => setIntensityTimeframe('all')} className={`px-2 py-1 text-[8px] sm:px-3 sm:py-1 sm:text-[9px] font-bold uppercase rounded-full transition-all ${intensityTimeframe === 'all' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Todo</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col h-[220px]">
                        <div className="flex items-center justify-center mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12} /> Foco Aeróbico</h4>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-4">
                            <div className="w-[100px] h-[100px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={analytics.focusChart} innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                                            {analytics.focusChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} cursor={{ fill: 'transparent' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {analytics.focusChart.map((focus, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: focus.color }}></div>
                                        <span>{focus.name} <span style={{ color: focus.color }}>{focus.value}%</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col md:col-span-2 h-[220px]">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><BarChart2 size={12} /> Tiempo en Zonas (Hr)</h4>
                        </div>
                        <div className="flex-1 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={analytics.zonesChart} margin={{ top: 0, right: 20, left: 10, bottom: -5 }}>
                                    <XAxis type="number" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#71717a', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} interval={0} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} formatter={(value) => [`${value} h`, 'Tiempo Total']} />
                                    <Bar dataKey="hours" radius={[0, 2, 2, 0]} barSize={14}>{analytics.zonesChart.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* -----------------------------------------------------------------------------------------
          SECCIÓN 3: RENDIMIENTO FISIOLÓGICO
      ----------------------------------------------------------------------------------------- */}
            <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-300 dark:border-zinc-800">
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">Rendimiento Fisiológico</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Fila Superior: VO2 Max y Eficiencia */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-lg flex flex-col justify-center relative min-h-[220px]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center">
                                <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} className={vo2Info.color} /> VO2 Max</h4>
                                <Subtitle text="Últ. 45D" />
                            </div>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner">
                                <button onClick={() => setVo2Sport('bike')} className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${vo2Sport === 'bike' ? 'bg-white dark:bg-zinc-600 text-slate-800 dark:text-zinc-100 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Bici</button>
                                <button onClick={() => setVo2Sport('run')} className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${vo2Sport === 'run' ? 'bg-white dark:bg-zinc-600 text-slate-800 dark:text-zinc-100 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Run</button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-4">
                            <div className="flex items-baseline gap-2 justify-center">
                                <span className="text-5xl font-mono font-black leading-none text-slate-800 dark:text-zinc-100 tracking-tighter">{currentVo2Value > 0 ? currentVo2Value : '--'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ml/kg/min</span>
                            </div>
                            <div className="text-center mt-2">
                                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 dark:bg-zinc-950 rounded-full border border-slate-100 dark:border-zinc-800 shadow-sm ${vo2Info.color}`}>{vo2Info.label}</span>
                            </div>
                        </div>

                        <div className="relative w-full h-2 mt-auto">
                            {currentVo2Value > 0 && (
                                <div className="absolute -top-3 -translate-x-1/2 transition-all duration-1000 ease-out z-10" style={{ left: vo2Info.width }}>
                                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-zinc-200 drop-shadow-md"></div>
                                </div>
                            )}
                            <div className="w-full h-full flex rounded-full overflow-hidden opacity-90 shadow-inner bg-slate-100 dark:bg-zinc-800">
                                <div className="h-full w-[20%] bg-red-400 dark:bg-red-500"></div>
                                <div className="h-full w-[20%] bg-orange-400 dark:bg-orange-500"></div>
                                <div className="h-full w-[20%] bg-emerald-400 dark:bg-emerald-500"></div>
                                <div className="h-full w-[20%] bg-blue-400 dark:bg-blue-500"></div>
                                <div className="h-full w-[20%] bg-purple-400 dark:bg-purple-500"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-lg flex flex-col min-h-[220px] lg:col-span-2">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                                <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> Correlación de Eficiencia</h4>
                                <Subtitle text="Últ. 90D" />
                            </div>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner">
                                <button onClick={() => setScatterSport('bike')} className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${scatterSport === 'bike' ? 'bg-white dark:bg-zinc-600 text-slate-800 dark:text-zinc-100 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Bici</button>
                                <button onClick={() => setScatterSport('run')} className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${scatterSport === 'run' ? 'bg-white dark:bg-zinc-600 text-slate-800 dark:text-zinc-100 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Run</button>
                            </div>
                        </div>
                        <div className="flex-1 w-full cursor-pointer mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -25 }} onClick={handleChartBackgroundClick}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} />
                                    <XAxis type="number" dataKey="hr" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 9, fill: '#71717a' }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                    <YAxis type="number" dataKey={scatterSport === 'run' ? 'pace' : 'speed'} domain={['dataMin', 'dataMax']} tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} reversed={scatterSport === 'run'} tickFormatter={scatterSport === 'run' ? formatPace : undefined} />
                                    <RechartsTooltip content={<CustomScatterTooltip />} isAnimationActive={false} cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter data={analytics.scatterData[scatterSport]} fill={scatterSport === 'run' ? '#ea580c' : '#2563eb'} fillOpacity={0.6} r={4} onClick={(e) => handleDirectClick(e.payload)} cursor="pointer" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Fila Inferior: Mean Maximal Curve (Ancho completo) */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-lg lg:col-span-3 h-[300px] flex flex-col mt-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
                            <div className="flex items-center">
                                <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Trophy size={12} className="text-amber-500" /> Curva de Mejores Marcas (MMP)</h4>

                                <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner ml-4">
                                    <button onClick={() => setMmpTimeframe('90d')} className={`px-3 py-1 text-[8px] font-bold uppercase rounded-full transition-all ${mmpTimeframe === '90d' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>90D</button>
                                    <button onClick={() => setMmpTimeframe('1y')} className={`px-3 py-1 text-[8px] font-bold uppercase rounded-full transition-all ${mmpTimeframe === '1y' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>1 Año</button>
                                    <button onClick={() => setMmpTimeframe('all')} className={`px-3 py-1 text-[8px] font-bold uppercase rounded-full transition-all ${mmpTimeframe === 'all' ? 'bg-white dark:bg-zinc-600 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Histo</button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner">
                                    <button onClick={() => setCurveSport('bike')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${curveSport === 'bike' ? 'bg-slate-800 dark:bg-zinc-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Bicicleta</button>
                                    <button onClick={() => setCurveSport('run')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${curveSport === 'run' ? 'bg-slate-800 dark:bg-zinc-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Carrera</button>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full shadow-inner">
                                    <button onClick={() => setCurveType('speed')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${curveType === 'speed' ? 'bg-slate-800 dark:bg-zinc-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>{curveSport === 'run' ? 'Ritmo' : 'Veloc.'}</button>
                                    <button onClick={() => setCurveType('hr')} className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full transition-all ${curveType === 'hr' ? 'bg-slate-800 dark:bg-zinc-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}>Pulso</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full px-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={currentCurve} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a', fontWeight: 600 }} minTickGap={10} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: curveColor, fontWeight: 700 }} domain={isPace ? ['dataMin - 0.5', 'dataMax + 1'] : [curveType === 'speed' ? 0 : 'dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} reversed={isPace} tickFormatter={isPace ? formatPace : undefined} />
                                    <RechartsTooltip content={<CustomCurveTooltip />} isAnimationActive={false} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="value" stroke={curveColor} strokeWidth={2.5} fillOpacity={0.15} fill={curveColor} activeDot={{ onClick: (e, payload) => handleDirectClick(payload.payload), r: 6, stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }} dot={false} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </section>



        </div>
    );
};