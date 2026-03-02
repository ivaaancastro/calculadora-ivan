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

    const analytics = useMemo(() => {
        const today = new Date();
        const date28DaysAgo = new Date(today); date28DaysAgo.setDate(today.getDate() - 28);
        const date45DaysAgo = new Date(today); date45DaysAgo.setDate(today.getDate() - 45);
        const date90DaysAgo = new Date(today); date90DaysAgo.setDate(today.getDate() - 90);
        const dateMmp = new Date(today);
        if (mmpTimeframe === '90d') dateMmp.setDate(today.getDate() - 90);
        else if (mmpTimeframe === '1y') dateMmp.setDate(today.getDate() - 365);
        else dateMmp.setFullYear(2000);

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

            if (actDate >= date45DaysAgo) {
                if (isRun && act.hr_avg > 120 && act.speed_avg > 2.5 && settings.run.max > 140) {
                    const pctHrMax = act.hr_avg / settings.run.max;
                    if (pctHrMax >= 0.65 && pctHrMax <= 1.0) {
                        const vo2 = ((act.speed_avg / pctHrMax) * 60 * 0.2) + 3.5;
                        if (vo2 > bestRunVo2) bestRunVo2 = vo2;
                    }
                }
                if (isBike && act.watts_avg > 50 && act.hr_avg > 110 && settings.bike.max > 140) {
                    hasPowerMeter = true;
                    const pctHrMax = act.hr_avg / settings.bike.max;
                    if (pctHrMax >= 0.65 && pctHrMax <= 1.0) {
                        const vo2 = ((10.8 * (act.watts_avg / pctHrMax)) / settings.weight) + 7;
                        if (vo2 > bestBikeVo2) bestBikeVo2 = vo2;
                    }
                }
            }

            if (act.streams_data?.time) {
                const timeData = act.streams_data.time.data;
                if (act.streams_data.heartrate) {
                    const hrData = act.streams_data.heartrate.data;
                    if (actDate >= date28DaysAgo) {
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
                if (i <= 7 && i > 0) loadHistory.push(tss);
            }
        }
        const tsb = currentCTL - currentATL;

        // Calcular Ramp Rate (tendencia a 7 días)
        let pastCTL = 0;
        for (let i = 67; i >= 7; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            pastCTL = pastCTL + ((dailyTSS.get(d.toISOString().split('T')[0]) || 0) - pastCTL) / 42;
        }
        const rampRate = currentCTL - pastCTL;

        const sum7 = loadHistory.reduce((a, b) => a + b, 0);
        const mean7 = sum7 / 7;
        const variance = loadHistory.reduce((acc, val) => acc + Math.pow(val - mean7, 2), 0) / 7;
        const stdDev = Math.sqrt(variance);
        const monotony = stdDev > 0 ? (mean7 / stdDev) : 0;
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
    }, [activities, settings, mmpTimeframe]);

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
        if (ctl < 15) return { phase: 'Construyendo Base', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-800/50 dark:border-zinc-700', icon: Brain, desc: 'Tienes poco historial acumulado. Sigue entrenando para asentar el modelo.' };
        if (tsb < -25) return { phase: 'Sobrecarga / Riesgo', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30', icon: AlertTriangle, desc: 'Tu fatiga supera tu adaptación. Necesitas días de recuperación.' };
        if (tsb >= -25 && tsb <= -10 && rampRate > 0.5) return { phase: 'Productivo', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30', icon: TrendingUp, desc: 'Punto dulce. Carga perfecta generando mejora de rendimiento.' };
        if (tsb > -10 && tsb <= 5) return { phase: 'Mantenimiento', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30', icon: Activity, desc: 'Carga equilibrada. Mantienes nivel sin estresar en exceso el sistema.' };
        if (tsb > 5 && rampRate < -1) return { phase: 'Pérdida de Forma', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30', icon: TrendingUp, desc: 'Entrenando menos de lo habitual. Tu estado de forma base está cayendo.' };
        return { phase: 'Pico / Recuperación', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30', icon: Battery, desc: 'Estás muy fresco. Has limpiado la fatiga, estado ideal para competir.' };
    };

    const getVo2Assessment = (vo2Value) => {
        const v = parseFloat(vo2Value);
        if (v <= 0) return { label: '-', color: 'text-slate-500', width: '0%' };
        let posPercent = 0;
        if (v < 35) posPercent = ((v - 25) / 10) * 20;
        else if (v < 42) posPercent = 20 + ((v - 35) / 7) * 20;
        else if (v < 50) posPercent = 40 + ((v - 42) / 8) * 20;
        else if (v < 58) posPercent = 60 + ((v - 50) / 8) * 20;
        else posPercent = 80 + Math.min(((v - 58) / 10) * 20, 20);
        posPercent = Math.max(2, Math.min(posPercent, 98));

        if (v < 42) return { label: 'Regular', color: 'text-orange-500', width: `${posPercent}%` };
        if (v < 50) return { label: 'Bueno', color: 'text-emerald-500', width: `${posPercent}%` };
        if (v < 58) return { label: 'Excelente', color: 'text-blue-500', width: `${posPercent}%` };
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
                <SectionHeader title="Performance Management" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 mb-4 rounded-sm relative z-10">
                    <div className="bg-white dark:bg-zinc-950 p-3 flex flex-col items-center group relative cursor-help">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Carga 7 Días</span>
                        <span className="text-xl font-mono font-black text-slate-700 dark:text-zinc-200">{Math.round(analytics.model.load7d)} <span className="text-[10px] text-slate-400 font-sans">TSS</span></span>
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-100 text-[10px] p-2 rounded -bottom-10 left-1/2 -translate-x-1/2 w-48 text-center pointer-events-none z-10 shadow-xl">
                            Volumen de entrenamiento total neto acumulado en la última semana.
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-3 flex flex-col items-center group relative cursor-help">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Monotonía</span>
                        <span className={`text-xl font-mono font-black ${analytics.model.monotony > 2.0 ? 'text-red-500' : (analytics.model.monotony > 1.5 ? 'text-orange-500' : 'text-emerald-500')}`}>
                            {analytics.model.monotony.toFixed(2)}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-100 text-[10px] p-2 rounded -bottom-12 left-1/2 -translate-x-1/2 w-48 text-center pointer-events-none z-10 shadow-xl">
                            {analytics.model.monotony > 2.0 ? 'PELIGRO: Estás haciendo exactamente lo mismo todos los días. Altísimo riesgo de lesión.' : 'Bien: Hay variación en tus cargas diarias (días duros y suaves).'}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-3 flex flex-col items-center group relative cursor-help">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Impacto (Strain)</span>
                        <span className={`text-xl font-mono font-black ${analytics.model.strain > 2000 ? 'text-rose-500' : 'text-indigo-500'}`}>
                            {Math.round(analytics.model.strain)}
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-100 text-[10px] p-2 rounded -bottom-12 left-1/2 -translate-x-1/2 w-56 text-center pointer-events-none z-10 shadow-xl">
                            (Carga x Monotonía). Mide el estrés fisiológico real. Dispararlo causa sobreentrenamiento.
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 p-3 flex flex-col items-center group relative cursor-help">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Tendencia (Ramp)</span>
                        <span className={`text-xl font-mono font-black ${analytics.model.rampRate > 5 ? 'text-orange-500' : (analytics.model.rampRate > 1 ? 'text-emerald-500' : 'text-slate-500')}`}>
                            {analytics.model.rampRate > 0 ? '+' : ''}{analytics.model.rampRate.toFixed(1)} <span className="text-[10px] text-slate-400 font-sans">/sem</span>
                        </span>
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-100 text-[10px] p-2 rounded -bottom-12 left-1/2 -translate-x-1/2 w-52 text-center pointer-events-none z-10 shadow-xl">
                            Ritmo de ganancia de Fitness. Recomendado +2 a +5 por semana. Más es lesivo.
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
          SECCIÓN 2: RENDIMIENTO FISIOLÓGICO
      ----------------------------------------------------------------------------------------- */}
            <section>
                <SectionHeader title="Rendimiento Fisiológico" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg lg:col-span-2 h-[280px] flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                            <div className="flex items-center">
                                <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Trophy size={12} className="text-amber-500" /> Mean Maximal Curve</h4>

                                <div className="flex border border-slate-300 dark:border-zinc-700 rounded overflow-hidden shadow-sm ml-3">
                                    <button onClick={() => setMmpTimeframe('90d')} className={`px-2 py-0.5 text-[8px] font-bold uppercase transition-colors ${mmpTimeframe === '90d' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>90D</button>
                                    <button onClick={() => setMmpTimeframe('1y')} className={`px-2 py-0.5 text-[8px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${mmpTimeframe === '1y' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>1A</button>
                                    <button onClick={() => setMmpTimeframe('all')} className={`px-2 py-0.5 text-[8px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${mmpTimeframe === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>Todo</button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex border border-slate-300 dark:border-zinc-700 rounded overflow-hidden">
                                    <button onClick={() => setCurveSport('bike')} className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${curveSport === 'bike' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Bici</button>
                                    <button onClick={() => setCurveSport('run')} className={`px-2 py-0.5 text-[9px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${curveSport === 'run' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Run</button>
                                </div>
                                <div className="flex border border-slate-300 dark:border-zinc-700 rounded overflow-hidden">
                                    <button onClick={() => setCurveType('speed')} className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${curveType === 'speed' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>{curveSport === 'run' ? 'Pace' : 'Spd'}</button>
                                    <button onClick={() => setCurveType('hr')} className={`px-2 py-0.5 text-[9px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${curveType === 'hr' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>HR</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={currentCurve} margin={{ top: 5, right: 10, bottom: 0, left: -25 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} minTickGap={10} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: curveColor }} domain={isPace ? ['dataMin - 0.5', 'dataMax + 1'] : [curveType === 'speed' ? 0 : 'dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} reversed={isPace} tickFormatter={isPace ? formatPace : undefined} />
                                    <RechartsTooltip content={<CustomCurveTooltip />} isAnimationActive={false} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="value" stroke={curveColor} strokeWidth={2} fillOpacity={0.1} fill={curveColor} activeDot={{ onClick: (e, payload) => handleDirectClick(payload.payload), r: 5, stroke: '#fff', strokeWidth: 2, cursor: 'pointer' }} dot={false} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col justify-center relative h-[132px]">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                    <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} className={vo2Info.color} /> VO2 Max</h4>
                                    <Subtitle text="Últ. 45D" />
                                </div>
                                <div className="flex border border-slate-300 dark:border-zinc-700 rounded overflow-hidden">
                                    <button onClick={() => setVo2Sport('bike')} className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${vo2Sport === 'bike' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Bici</button>
                                    <button onClick={() => setVo2Sport('run')} className={`px-2 py-0.5 text-[9px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${vo2Sport === 'run' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Run</button>
                                </div>
                            </div>
                            <div className="flex items-end justify-between px-1 mb-2">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-mono font-black leading-none text-slate-800 dark:text-zinc-100">{currentVo2Value > 0 ? currentVo2Value : '--'}</span>
                                    <span className="text-[9px] font-bold text-slate-400">ml/kg/min</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase ${vo2Info.color}`}>{vo2Info.label}</span>
                            </div>
                            <div className="relative w-full h-1.5 mt-1">
                                {currentVo2Value > 0 && (
                                    <div className="absolute -top-2.5 -translate-x-1/2 transition-all duration-1000 ease-out z-10" style={{ left: vo2Info.width }}>
                                        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-zinc-200"></div>
                                    </div>
                                )}
                                <div className="w-full h-full flex rounded-full overflow-hidden opacity-90">
                                    <div className="h-full w-[20%] bg-red-500"></div><div className="h-full w-[20%] bg-orange-500"></div><div className="h-full w-[20%] bg-emerald-500"></div><div className="h-full w-[20%] bg-blue-500"></div><div className="h-full w-[20%] bg-purple-500"></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col h-[132px]">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center">
                                    <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> Eficiencia</h4>
                                    <Subtitle text="Últ. 90D" />
                                </div>
                                <div className="flex border border-slate-300 dark:border-zinc-700 rounded overflow-hidden">
                                    <button onClick={() => setScatterSport('bike')} className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${scatterSport === 'bike' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Bici</button>
                                    <button onClick={() => setScatterSport('run')} className={`px-2 py-0.5 text-[9px] font-bold uppercase border-l border-slate-300 dark:border-zinc-700 transition-colors ${scatterSport === 'run' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>Run</button>
                                </div>
                            </div>
                            <div className="flex-1 w-full cursor-pointer">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 5, right: 5, bottom: 0, left: -25 }} onClick={handleChartBackgroundClick}>
                                        <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} />
                                        <XAxis type="number" dataKey="hr" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 9, fill: '#71717a' }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                                        <YAxis type="number" dataKey={scatterSport === 'run' ? 'pace' : 'speed'} domain={['dataMin', 'dataMax']} tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} reversed={scatterSport === 'run'} tickFormatter={scatterSport === 'run' ? formatPace : undefined} />
                                        <RechartsTooltip content={<CustomScatterTooltip />} isAnimationActive={false} />
                                        <Scatter data={analytics.scatterData[scatterSport]} fill={scatterSport === 'run' ? '#ea580c' : '#2563eb'} fillOpacity={0.6} r={3} onClick={(e) => handleDirectClick(e.payload)} cursor="pointer" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* -----------------------------------------------------------------------------------------
          SECCIÓN 3: DISTRIBUCIÓN E INTENSIDAD
      ----------------------------------------------------------------------------------------- */}
            <section>
                <SectionHeader title="Distribución de Intensidad" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col h-[200px]">
                        <div className="flex items-center justify-center mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Target size={12} /> Foco Aeróbico</h4>
                            <Subtitle text="Últ. 28D" />
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

                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-lg flex flex-col md:col-span-2 h-[200px]">
                        <div className="flex items-center mb-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><BarChart2 size={12} /> Tiempo en Zonas (Hr)</h4>
                            <Subtitle text="Últ. 28D" />
                        </div>
                        <div className="flex-1 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.zonesChart} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} interval={0} />
                                    <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} formatter={(value) => [`${value} h`, 'Tiempo Total']} />
                                    <Bar dataKey="hours" radius={[2, 2, 0, 0]} maxBarSize={40}>{analytics.zonesChart.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};