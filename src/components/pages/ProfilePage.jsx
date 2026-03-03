import React, { useState, useEffect } from 'react';
import { Save, Activity, Heart, Zap, Database, Loader2, RefreshCw, CheckCircle2, ArrowLeft, Lock, Key, Bike, Footprints, Weight, Link2, Timer, Gauge } from 'lucide-react';
import { supabase } from '../../supabase';
import { LTHR_ZONE_PCT, calcZonesFromLTHR } from '../../utils/tssEngine';

const getPeakByTime = (hrData, timeData, windowSeconds) => {
    if (!hrData || !timeData || hrData.length < 2) return 0;
    let maxAvg = 0; let currentSum = 0; let count = 0; let left = 0;
    for (let right = 0; right < timeData.length; right++) {
        currentSum += hrData[right]; count++;
        while (timeData[right] - timeData[left] > windowSeconds) {
            currentSum -= hrData[left]; count--; left++;
        }
        if (timeData[right] - timeData[left] >= windowSeconds * 0.9) {
            if (count > 0) { let avg = currentSum / count; if (avg > maxAvg) maxAvg = avg; }
        }
    }
    return maxAvg;
};

// Zone labels for profile display (matches LTHR_ZONE_PCT order)
const ZONE_LABELS = ['Recovery', 'Aerobic', 'Tempo', 'SubThreshold', 'SuperThreshold', 'Aerobic Capacity', 'Anaerobic'];

const FCMAX_PCT = [
    { label: 'Recovery', pMin: 0, pMax: 0.59 },
    { label: 'Aerobic', pMin: 0.59, pMax: 0.74 },
    { label: 'Tempo', pMin: 0.74, pMax: 0.84 },
    { label: 'SubThreshold', pMin: 0.84, pMax: 0.90 },
    { label: 'SuperThreshold', pMin: 0.90, pMax: 0.94 },
    { label: 'Aerobic Capacity', pMin: 0.94, pMax: 0.97 },
    { label: 'Anaerobic', pMin: 0.97, pMax: 1.00 },
];

const calcZonesFromFCMax = (maxHr) =>
    FCMAX_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(maxHr * z.pMin),
        max: i === 6 ? maxHr : Math.round(maxHr * z.pMax),
    }));

// --- Pace zones (intervals.icu style: % of threshold speed) ---
const paceToSec = (p) => { if (!p) return 270; const [m, s] = p.split(':'); return (parseInt(m) || 0) * 60 + (parseInt(s) || 0); };
const secToPace = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const PACE_ZONES = [
    { label: 'Zone 1', sMin: 0, sMax: 0.775 },
    { label: 'Zone 2', sMin: 0.785, sMax: 0.877 },
    { label: 'Zone 3', sMin: 0.887, sMax: 0.943 },
    { label: 'Zone 4', sMin: 0.953, sMax: 1.00 },
    { label: 'Zone 5a', sMin: 1.01, sMax: 1.034 },
    { label: 'Zone 5b', sMin: 1.044, sMax: 1.115 },
    { label: 'Zone 5c', sMin: 1.125, sMax: 1.30 },
];

const calcPaceZones = (thresholdPace) => {
    const tp = paceToSec(thresholdPace);
    return PACE_ZONES.map(z => ({
        label: z.label,
        pctMin: z.sMin, pctMax: z.sMax,
        // speed% → pace is inverse: higher speed% = lower pace
        min: z.sMax > 0 ? secToPace(tp / z.sMax) : '',
        max: z.sMin > 0 ? secToPace(tp / z.sMin) : '∞',
    }));
};

// --- Power zones (intervals.icu style: 7 zones + Sweet Spot) ---
const POWER_ZONES = [
    { label: 'Active Recovery', pMin: 0, pMax: 0.55 },
    { label: 'Endurance', pMin: 0.56, pMax: 0.75 },
    { label: 'Tempo', pMin: 0.76, pMax: 0.90 },
    { label: 'Threshold', pMin: 0.91, pMax: 1.05 },
    { label: 'VO2 Max', pMin: 1.06, pMax: 1.20 },
    { label: 'Anaerobic', pMin: 1.21, pMax: 1.50 },
    { label: 'Neuromuscular', pMin: 1.51, pMax: 2.00 },
];
const SWEET_SPOT = { label: 'Sweet Spot', pMin: 0.84, pMax: 0.97 };

const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
const HR_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7'];

export const ProfilePage = ({ currentSettings, onUpdate, activities, isDeepSyncing, deepSyncProgress, onDeepSync, onBack }) => {
    const [formData, setFormData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

    useEffect(() => {
        if (currentSettings) {
            setFormData({
                ...currentSettings,
                intervalsId: currentSettings.intervalsId || '',
                intervalsKey: currentSettings.intervalsKey || '',
                run: {
                    ...currentSettings.run,
                    zonesMode: currentSettings.run?.zonesMode || 'lthr',
                    thresholdPace: currentSettings.run?.thresholdPace || '4:30',
                    paceZones: currentSettings.run?.paceZones || calcPaceZones('4:30'),
                    // Ensure 7 zones
                    zones: currentSettings.run?.zones?.length === 7 ? currentSettings.run.zones :
                        calcZonesFromLTHR(currentSettings.run?.lthr || 178, currentSettings.run?.max || 200),
                },
                bike: {
                    ...currentSettings.bike,
                    zonesMode: currentSettings.bike?.zonesMode || 'lthr',
                    ftp: currentSettings.bike?.ftp || 200,
                    zones: currentSettings.bike?.zones?.length === 7 ? currentSettings.bike.zones :
                        calcZonesFromLTHR(currentSettings.bike?.lthr || 168, currentSettings.bike?.max || 190),
                },
            });
        }
    }, [currentSettings]);

    if (!formData) return null;

    const stravaActs = activities?.filter(a => a.strava_id) || [];
    const pureActs = stravaActs.filter(a => a.streams_data);
    const syncPct = stravaActs.length > 0 ? Math.round((pureActs.length / stravaActs.length) * 100) : 0;

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
        setIsUpdatingPwd(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setIsUpdatingPwd(false);
        if (error) alert("Error al actualizar: " + error.message);
        else { alert("¡Contraseña actualizada!"); setNewPassword(''); }
    };

    const handleAutoDetectLTHR = () => {
        setIsScanning(true);
        setTimeout(() => {
            let maxBikeLthr = 0, maxRunLthr = 0;
            activities.forEach(act => {
                if (!act.streams_data?.heartrate?.data || !act.streams_data?.time?.data) return;
                const t = act.type.toLowerCase();
                const isBike = t.includes('bici') || t.includes('ciclismo');
                const isRun = t.includes('run') || t.includes('carrera');
                if (!isBike && !isRun) return;
                const hr = act.streams_data.heartrate.data, tm = act.streams_data.time.data;
                const p60 = getPeakByTime(hr, tm, 3600), p20 = getPeakByTime(hr, tm, 1200);
                const p15 = getPeakByTime(hr, tm, 900), p10 = getPeakByTime(hr, tm, 600);
                if (isBike) { const e = Math.max(p60, p20 * 0.95, p15 * 0.93, p10 * 0.90); if (e > maxBikeLthr) maxBikeLthr = e; }
                else { const e = Math.max(p60, p20 * 0.98, p15 * 0.96, p10 * 0.93); if (e > maxRunLthr) maxRunLthr = e; }
            });
            if (maxBikeLthr > 100 || maxRunLthr > 100) {
                const bLthr = maxBikeLthr > 100 ? Math.round(maxBikeLthr) : formData.bike.lthr;
                const rLthr = maxRunLthr > 100 ? Math.round(maxRunLthr) : formData.run.lthr;
                setFormData(prev => {
                    const u = { ...prev };
                    u.run = { ...u.run, lthr: rLthr };
                    u.bike = { ...u.bike, lthr: bLthr };
                    if (u.run.zonesMode === 'lthr') u.run.zones = calcZonesFromLTHR(rLthr, u.run.max);
                    if (u.bike.zonesMode === 'lthr') u.bike.zones = calcZonesFromLTHR(bLthr, u.bike.max);
                    return u;
                });
                alert(`¡Escáner completado!\n🚴 Bici LTHR: ${bLthr} ppm\n🏃 Run LTHR: ${rLthr} ppm`);
            } else alert("No hay suficientes datos para calcular.");
            setIsScanning(false);
        }, 500);
    };

    const handleChange = (e, sport = null, field = null) => {
        const value = e.target.value;
        if (sport && field) {
            setFormData(prev => {
                const u = { ...prev, [sport]: { ...prev[sport], [field]: value } };
                if (field === 'lthr' && u[sport].zonesMode === 'lthr') u[sport].zones = calcZonesFromLTHR(Number(value), u[sport].max);
                if (field === 'max' && u[sport].zonesMode === 'fcmax') u[sport].zones = calcZonesFromFCMax(Number(value));
                if (field === 'max' && u[sport].zonesMode === 'lthr') u[sport].zones = calcZonesFromLTHR(u[sport].lthr, Number(value));
                if (field === 'thresholdPace' && sport === 'run') u.run.paceZones = calcPaceZones(value);
                return u;
            });
        } else setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleZoneChange = (e, sport, index, field) => {
        const val = Number(e.target.value);
        setFormData(prev => {
            const nz = [...prev[sport].zones];
            nz[index] = { ...nz[index], [field]: val };
            return { ...prev, [sport]: { ...prev[sport], zones: nz } };
        });
    };

    const handleZonesMode = (sport, mode) => {
        setFormData(prev => {
            const u = { ...prev, [sport]: { ...prev[sport], zonesMode: mode } };
            if (mode === 'lthr') u[sport].zones = calcZonesFromLTHR(u[sport].lthr, u[sport].max);
            else if (mode === 'fcmax') u[sport].zones = calcZonesFromFCMax(u[sport].max);
            return u;
        });
    };

    const ModeSelector = ({ sport }) => (
        <div className="flex gap-0.5 bg-slate-100 dark:bg-zinc-800/50 rounded-lg p-0.5">
            {[{ k: 'lthr', l: '% LTHR' }, { k: 'fcmax', l: '% FCmax' }, { k: 'custom', l: 'Manual' }].map(m => (
                <button key={m.k} onClick={() => handleZonesMode(sport, m.k)}
                    className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all ${formData[sport].zonesMode === m.k
                        ? 'bg-white dark:bg-zinc-900 shadow-sm text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700'
                        }`}>{m.l}</button>
            ))}
        </div>
    );

    const PanelHeader = ({ icon: Icon, title, subtitle }) => (
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
            <div>
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Icon size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5} /> {title}
                </h4>
                {subtitle && <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );

    // Reusable sport zones section
    const SportZonesSection = ({ sport, sportLabel, icon: Icon, color, showPace, showPower }) => {
        const data = formData[sport];
        const isReadOnly = data.zonesMode !== 'custom';
        const lthrPcts = LTHR_ZONE_PCT;
        const fcmaxPcts = FCMAX_PCT;

        return (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className={`bg-${color}-50 dark:bg-${color}-900/10 px-5 py-3 border-b border-${color}-200/50 dark:border-${color}-800/30`}>
                    <h3 className={`text-[11px] font-black text-${color}-600 dark:text-${color}-500 uppercase tracking-widest flex items-center gap-1.5`}>
                        <Icon size={14} /> {sportLabel}
                    </h3>
                </div>
                <div className="p-5 space-y-5">

                    {/* Threshold values row */}
                    <div className={`grid ${showPace ? 'grid-cols-3' : showPower ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                        <div>
                            <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC umbral</label>
                            <input type="number" value={data.lthr} onChange={(e) => handleChange(e, sport, 'lthr')}
                                className={`w-full bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-200 dark:border-${color}-500/30 rounded px-3 py-1.5 text-sm font-mono text-${color}-700 dark:text-${color}-400 focus:border-${color}-500 outline-none transition-colors`} />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC máx.</label>
                            <input type="number" value={data.max} onChange={(e) => handleChange(e, sport, 'max')}
                                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors" />
                        </div>
                        {showPace && (
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><Timer size={10} /> Ritmo umbral</label>
                                <input type="text" value={data.thresholdPace} onChange={(e) => handleChange(e, sport, 'thresholdPace')} placeholder="4:30"
                                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-orange-500 outline-none transition-colors" />
                                <span className="text-[8px] text-slate-400 mt-0.5 block">per km</span>
                            </div>
                        )}
                        {showPower && (
                            <div>
                                <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block mb-1 flex items-center gap-1"><Gauge size={10} /> FTP</label>
                                <input type="number" value={data.ftp} onChange={(e) => handleChange(e, sport, 'ftp')}
                                    className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/30 rounded px-3 py-1.5 text-sm font-mono text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 outline-none transition-colors" />
                                <span className="text-[8px] text-slate-400 mt-0.5 block">vatios</span>
                            </div>
                        )}
                    </div>

                    {/* ❤️ HR Zones table */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Heart size={10} className="text-rose-500" /> Zonas de frecuencia cardíaca</label>
                            <ModeSelector sport={sport} />
                        </div>
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                            <table className="w-full text-[10px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-zinc-950/50 text-slate-500 dark:text-zinc-500">
                                        <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest w-8"></th>
                                        <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest">Zona</th>
                                        <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">
                                            {data.zonesMode === 'lthr' ? '% LTHR' : data.zonesMode === 'fcmax' ? '% FCmax' : ''}
                                        </th>
                                        <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">BPM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.zones.map((zone, i) => {
                                        const pcts = data.zonesMode === 'lthr' ? lthrPcts[i] : data.zonesMode === 'fcmax' ? fcmaxPcts[i] : null;
                                        return (
                                            <tr key={i} className="border-t border-slate-100 dark:border-zinc-800/50">
                                                <td className="px-3 py-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                                </td>
                                                <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-zinc-300">
                                                    <span className="font-black mr-1">{HR_LABELS[i]}</span>
                                                    <span className="text-slate-500 dark:text-zinc-500">{(pcts || lthrPcts[i]).label}</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-mono text-slate-500 dark:text-zinc-500">
                                                    {pcts ? `${Math.round(pcts.pMin * 100)} - ${i === 6 ? Math.round(pcts.pMax * 100) + '%+' : Math.round(pcts.pMax * 100) + '%'}` : ''}
                                                </td>
                                                <td className="px-3 py-1.5 text-center">
                                                    {isReadOnly ? (
                                                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">{zone.min} - {zone.max}</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input type="number" value={zone.min} onChange={(e) => handleZoneChange(e, sport, i, 'min')} className="w-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
                                                            <span className="text-slate-400">-</span>
                                                            <input type="number" value={zone.max} onChange={(e) => handleZoneChange(e, sport, i, 'max')} className="w-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 🏃 Pace Zones (Running only) */}
                    {showPace && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Timer size={10} /> Zonas de entrenamiento de ritmo</label>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-600">per km</span>
                            </div>
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-zinc-950/50 text-slate-500 dark:text-zinc-500">
                                            <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest w-8"></th>
                                            <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest">Zona</th>
                                            <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">% Velocidad</th>
                                            <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">Ritmo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.paceZones || calcPaceZones(data.thresholdPace)).map((zone, i) => (
                                            <tr key={i} className="border-t border-slate-100 dark:border-zinc-800/50">
                                                <td className="px-3 py-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                                </td>
                                                <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-zinc-300">
                                                    <span className="font-black mr-1">{HR_LABELS[i]}</span>
                                                    <span className="text-slate-500 dark:text-zinc-500">{zone.label}</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-mono text-slate-500 dark:text-zinc-500">
                                                    {zone.pctMin > 0 ? `${(zone.pctMin * 100).toFixed(1)}` : '0'} - {(zone.pctMax * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-700 dark:text-zinc-300">
                                                    {zone.min} - {zone.max}/km
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ⚡ Power Zones (Bike only) */}
                    {showPower && data.ftp > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Zap size={10} className="text-amber-500" /> Zonas de potencia para FTP de {data.ftp}w</label>
                            </div>
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-zinc-950/50 text-slate-500 dark:text-zinc-500">
                                            <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest w-8"></th>
                                            <th className="px-3 py-1.5 text-left font-bold uppercase tracking-widest">Zona</th>
                                            <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">% FTP</th>
                                            <th className="px-3 py-1.5 text-center font-bold uppercase tracking-widest">Vatios</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {POWER_ZONES.map((pz, i) => (
                                            <tr key={i} className="border-t border-slate-100 dark:border-zinc-800/50">
                                                <td className="px-3 py-1.5">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                                </td>
                                                <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-zinc-300">
                                                    <span className="font-black mr-1">{HR_LABELS[i]}</span>
                                                    <span className="text-slate-500 dark:text-zinc-500">{pz.label}</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-mono text-slate-500 dark:text-zinc-500">
                                                    {Math.round(pz.pMin * 100)}% - {i === 6 ? Math.round(pz.pMax * 100) + '%+' : Math.round(pz.pMax * 100) + '%'}
                                                </td>
                                                <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-700 dark:text-zinc-300">
                                                    {Math.round(data.ftp * pz.pMin)} - {i === 6 ? Math.round(data.ftp * pz.pMax) + 'w+' : Math.round(data.ftp * pz.pMax) + 'w'}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Sweet Spot */}
                                        <tr className="border-t-2 border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/5">
                                            <td className="px-3 py-1.5">
                                                <div className="w-3 h-3 rounded-sm bg-amber-400" />
                                            </td>
                                            <td className="px-3 py-1.5 font-bold text-amber-700 dark:text-amber-400">
                                                <span className="font-black mr-1">SS</span> {SWEET_SPOT.label}
                                            </td>
                                            <td className="px-3 py-1.5 text-center font-mono text-amber-600 dark:text-amber-500">
                                                {Math.round(SWEET_SPOT.pMin * 100)}% - {Math.round(SWEET_SPOT.pMax * 100)}%
                                            </td>
                                            <td className="px-3 py-1.5 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                                                {Math.round(data.ftp * SWEET_SPOT.pMin)} - {Math.round(data.ftp * SWEET_SPOT.pMax)}w
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shadow-sm">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase">Ajustes Deportivos</h1>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Zonas, umbrales y configuración</p>
                    </div>
                </div>
                <button onClick={() => onUpdate(formData)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                    <Save size={14} /> Guardar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN (3/12) */}
                <div className="lg:col-span-3 space-y-5">

                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                        <PanelHeader icon={Activity} title="Datos Base" />
                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Peso (kg)</label>
                                <div className="relative">
                                    <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC Reposo</label>
                                <div className="relative">
                                    <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
                                    <input type="number" name="fcReposo" value={formData.fcReposo} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                        <PanelHeader icon={RefreshCw} title="Auto-Detect" subtitle="Escanear actividades" />
                        <button onClick={handleAutoDetectLTHR} disabled={isScanning || pureActs.length === 0} className="w-full py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded text-[9px] font-bold uppercase transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50">
                            {isScanning ? <><Loader2 size={10} className="animate-spin" /> Analizando...</> : 'Detectar LTHR'}
                        </button>
                        <p className="text-[8px] text-slate-400 mt-2 leading-relaxed">Analiza tus actividades con datos HR detallados para detectar tu umbral láctico automáticamente.</p>
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-lg p-5 shadow-sm">
                        <PanelHeader icon={Link2} title="Intervals.icu" />
                        <div className="space-y-2">
                            <div>
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Athlete ID</label>
                                <input type="text" name="intervalsId" value={formData.intervalsId} onChange={handleChange} placeholder="i12345" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs font-mono dark:text-zinc-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">API Key</label>
                                <input type="password" name="intervalsKey" value={formData.intervalsKey} onChange={handleChange} placeholder="..." className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs font-mono dark:text-zinc-200 focus:border-indigo-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                        <PanelHeader icon={Lock} title="Seguridad" />
                        <form onSubmit={handleUpdatePassword} className="space-y-2">
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña..." className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-xs font-mono dark:text-zinc-200 focus:border-blue-500 outline-none" />
                            <button type="submit" disabled={isUpdatingPwd || !newPassword} className="w-full py-2 bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 text-white rounded text-[9px] font-bold uppercase disabled:opacity-50 flex justify-center items-center gap-2">
                                {isUpdatingPwd ? <Loader2 size={12} className="animate-spin" /> : 'Actualizar'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                        <PanelHeader icon={Database} title="Datos" subtitle={`${pureActs.length}/${stravaActs.length} con streams`} />
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                            <div className={`h-full ${syncPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${syncPct}%` }} />
                        </div>
                        <button onClick={onDeepSync} disabled={isDeepSyncing || syncPct === 100} className={`w-full py-2 rounded text-[9px] font-bold uppercase flex justify-center items-center gap-2 ${syncPct === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-800 dark:text-zinc-200'}`}>
                            {isDeepSyncing ? <><Loader2 size={12} className="animate-spin" /> Sync...</> : syncPct === 100 ? <><CheckCircle2 size={12} /> 100%</> : 'Deep Sync'}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: ZONES (9/12) */}
                <div className="lg:col-span-9 space-y-6">
                    <SportZonesSection sport="run" sportLabel="Correr" icon={Footprints} color="orange" showPace showPower={false} />
                    <SportZonesSection sport="bike" sportLabel="Ciclismo" icon={Bike} color="blue" showPace={false} showPower />
                </div>
            </div>
        </div>
    );
};