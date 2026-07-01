import React, { useState, useEffect } from 'react';
import { Save, Activity, Heart, Zap, Database, Loader2, RefreshCw, CheckCircle2, ArrowLeft, Lock, Key, Bike, Footprints, Weight, Link2, Timer, Gauge, Cloud, Wifi, Trash2, AlertTriangle, User, Camera, Mail } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { LTHR_ZONE_PCT, calcZonesFromLTHR } from '../../utils/tssEngine';
import { useIntervalsSync } from '../../hooks/useIntervalsSync';

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

const ModeSelector = ({ sport, data, onZonesMode }) => (
    <div className="flex gap-0.5 bg-slate-100 dark:bg-zinc-800/50 rounded-lg p-0.5">
        {[{ k: 'lthr', l: '% LTHR' }, { k: 'fcmax', l: '% FCmax' }, { k: 'custom', l: 'Manual' }].map(m => (
            <button key={m.k} onClick={() => onZonesMode(sport, m.k)}
                className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all ${data.zonesMode === m.k
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
const SportZonesSection = ({ sport, sportLabel, icon: Icon, color, showPace, showPower, data, onChange, onZoneChange, onZonesMode }) => {
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
                        <input type="number" value={data.lthr} onChange={(e) => onChange(e, sport, 'lthr')}
                            className={`w-full bg-white dark:bg-${color}-900/10 border border-slate-300 dark:border-${color}-500/30 rounded px-3 py-1.5 text-sm font-mono text-${color}-700 dark:text-${color}-400 focus:border-${color}-500 shadow-sm outline-none transition-colors`} />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC máx.</label>
                        <input type="number" value={data.max} onChange={(e) => onChange(e, sport, 'max')}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-blue-500 shadow-sm outline-none transition-colors" />
                    </div>
                    {showPace && (
                        <div>
                            <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><Timer size={10} /> Ritmo umbral</label>
                            <input type="text" value={data.thresholdPace} onChange={(e) => onChange(e, sport, 'thresholdPace')} placeholder="4:30"
                                className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-orange-500 shadow-sm outline-none transition-colors" />
                            <span className="text-[8px] text-slate-400 mt-0.5 block">per km</span>
                        </div>
                    )}
                    {showPower && (
                        <div>
                            <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block mb-1 flex items-center gap-1"><Gauge size={10} /> FTP</label>
                            <input type="number" value={data.ftp} onChange={(e) => onChange(e, sport, 'ftp')}
                                className="w-full bg-white dark:bg-emerald-900/10 border border-slate-300 dark:border-emerald-500/30 rounded px-3 py-1.5 text-sm font-mono text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 shadow-sm outline-none transition-colors" />
                            <span className="text-[8px] text-slate-400 mt-0.5 block">vatios</span>
                        </div>
                    )}
                </div>

                {/* ❤️ HR Zones table */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Heart size={10} className="text-rose-500" /> Zonas de frecuencia cardíaca</label>
                        <ModeSelector sport={sport} data={data} onZonesMode={onZonesMode} />
                    </div>
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-x-auto hide-scrollbar">
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
                                                    <span className="font-mono font-bold text-slate-500 dark:text-zinc-500">{zone.min} - {zone.max}</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input type="number" value={zone.min} onChange={(e) => onZoneChange(e, sport, i, 'min')} className="w-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
                                                        <span className="text-slate-400">-</span>
                                                        <input type="number" value={zone.max} onChange={(e) => onZoneChange(e, sport, i, 'max')} className="w-12 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
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
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-x-auto hide-scrollbar">
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
                                            <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-500 dark:text-zinc-500">
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
                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-x-auto hide-scrollbar">
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
                                            <td className="px-3 py-1.5 text-center font-mono font-bold text-slate-500 dark:text-zinc-500">
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
                                        <td className="px-3 py-1.5 text-center font-mono font-bold text-amber-500/80 dark:text-amber-500/80">
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

export const ProfilePage = ({ currentSettings, currentMetrics, onUpdate, activities, isDeepSyncing, deepSyncProgress, onDeepSync, onBack }) => {
    const [formData, setFormData] = useState(null);
    const [targetCtl, setTargetCtl] = useState(null); // Managed separately for calibration logic
    const [activeTab, setActiveTab] = useState('run');
    const [activeSection, setActiveSection] = useState('general');

    const [isScanning, setIsScanning] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [syncPreview, setSyncPreview] = useState(null); // {weight, rhr, ftp} before confirming

    const { syncing: isSyncingIntervals, syncProgress: intervalsSyncProgress, syncAll: syncIntervals } = useIntervalsSync();

    const handleSyncIntervals = async () => {
        if (!formData?.intervalsId || !formData?.intervalsKey) {
            toast.error('Introduce tu Athlete ID y API Key de Intervals.icu primero');
            return;
        }
        const result = await syncIntervals(formData);
        if (!result) return;

        // Show preview of profile updates
        const { profileUpdates } = result;
        if (profileUpdates && Object.keys(profileUpdates).length > 0) {
            setSyncPreview(profileUpdates);
        }
    };

    const handleApplySyncedProfile = () => {
        if (!syncPreview) return;
        setFormData(prev => ({
            ...prev,
            ...(syncPreview.weight != null ? { weight: syncPreview.weight } : {}),
            ...(syncPreview.fc_reposo != null ? { fcReposo: syncPreview.fc_reposo } : {}),
            bike: syncPreview.ftp != null
                ? { ...prev.bike, ftp: syncPreview.ftp }
                : prev.bike,
        }));
        setSyncPreview(null);
        toast.success('✅ Perfil actualizado con datos de Intervals.icu');
    };

    useEffect(() => {
        if (currentSettings) {
            setFormData({
                ...currentSettings,
                intervalsId: currentSettings.intervalsId || '',
                intervalsKey: currentSettings.intervalsKey || '',
                offsetCtl: currentSettings.offsetCtl || 0,
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
            // Initialize targetCtl from the current adjusted value
            if (currentMetrics?.ctl != null) {
                setTargetCtl(Math.round(currentMetrics.ctl));
            }
        }
    }, [currentSettings, currentMetrics]);

    if (!formData) return null;

    const stravaActs = activities?.filter(a => a.strava_id) || [];
    const pureActs = stravaActs.filter(a => a.streams_data);
    const syncPct = stravaActs.length > 0 ? Math.round((pureActs.length / stravaActs.length) * 100) : 0;

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.");
        setIsUpdatingPwd(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setIsUpdatingPwd(false);
        if (error) toast.error("Error al actualizar: " + error.message);
        else { toast.success("¡Contraseña actualizada!"); setNewPassword(''); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y borrará todos tus datos para siempre.")) return;
        
        setIsDeletingAccount(true);
        try {
            // Attempt to call a custom RPC to delete the user
            const { error } = await supabase.rpc('delete_user');
            
            if (error) {
                console.error("Error al eliminar la cuenta:", error);
                toast.error("Para eliminar tu cuenta por completo, contacta con soporte o añade la función delete_user a la base de datos.");
            } else {
                await supabase.auth.signOut();
                toast.success("Tu cuenta ha sido eliminada.");
                window.location.href = '/';
            }
        } catch (err) {
            toast.error("Ocurrió un error al intentar eliminar la cuenta.");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleAvatarUpload = async (event) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            const file = event.target.files[0];
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen es demasiado grande. Máximo 2MB.");
                return;
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            
            setIsUploadingAvatar(true);
            
            // Subir a storage
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            
            // Obtener URL pública
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            // Actualizar formData (el usuario debe guardar para que persista en BD)
            setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
            toast.success("Foto subida. ¡No olvides darle a Guardar Cambios!");
        } catch (error) {
            console.error("Error avatar:", error);
            toast.error("Error al subir la foto: " + error.message);
        } finally {
            setIsUploadingAvatar(false);
        }
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
                toast.success(`¡Escáner completado!\n🚴 Bici LTHR: ${bLthr} ppm\n🏃 Run LTHR: ${rLthr} ppm`);
            } else toast.error("No hay suficientes datos para calcular.");
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

    const renderMenuButton = (id, label, IconComponent) => (
        <button
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeSection === id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
        >
            <IconComponent size={18} className={activeSection === id ? 'text-white' : 'text-slate-400 dark:text-zinc-500'} />
            <span className="text-sm font-semibold">{label}</span>
        </button>
    );

    return (
        <div className="animate-in fade-in duration-300 pb-12 max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shadow-sm">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">Ajustes</h1>
                    </div>
                </div>
                <button 
                  onClick={() => {
                    const raw = currentMetrics?.rawCtl || 0;
                    const newOffset = targetCtl !== null ? (targetCtl - raw) : formData.offsetCtl;
                    onUpdate({ ...formData, offsetCtl: newOffset });
                  }} 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                    <Save size={16} /> Guardar Cambios
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* SIDEBAR (Apple Settings Style) */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                    {renderMenuButton('general', 'General', Activity)}
                    {renderMenuButton('zones', 'Zonas y Umbrales', Heart)}
                    {renderMenuButton('integrations', 'Integraciones', Link2)}
                    {renderMenuButton('security', 'Seguridad y Datos', Lock)}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 min-w-0">
                    {activeSection === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4">Mi Perfil</h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-6">
                                    <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                        {/* Avatar */}
                                        <div className="relative group shrink-0">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center relative">
                                                {formData.avatarUrl ? (
                                                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={40} className="text-slate-400" />
                                                )}
                                                {isUploadingAvatar && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <Loader2 size={24} className="text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                                                <Camera size={24} />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                            </label>
                                        </div>
                                        {/* Inputs */}
                                        <div className="flex-1 w-full space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre Completo</label>
                                                <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} placeholder="Tu nombre..." className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium dark:text-zinc-200 focus:border-blue-500 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</label>
                                                <div className="relative mt-1.5">
                                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="email" name="email" value={formData.email || ''} disabled className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-500 cursor-not-allowed outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4 mt-8">Ajustes Fisiológicos</h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 dark:bg-zinc-800 p-2.5 rounded-xl text-slate-500"><Weight size={20}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Peso Corporal</p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500">Para cálculos de potencia relativa (W/kg)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-20 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-right outline-none focus:border-blue-500 transition-all" />
                                            <span className="text-sm text-slate-500 font-medium">kg</span>
                                        </div>
                                    </div>

                                    <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-xl text-rose-500"><Heart size={20}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">FC Reposo</p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500">Mínima frecuencia cardíaca registrada</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" name="fcReposo" value={formData.fcReposo} onChange={handleChange} className="w-20 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-right outline-none focus:border-blue-500 transition-all" />
                                            <span className="text-sm text-slate-500 font-medium">bpm</span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl text-blue-500"><Activity size={20}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Calibrar Fitness (CTL)</p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500">Introduce tu Fitness actual para calibrar todo el historial</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" step="1" value={targetCtl ?? ''} onChange={(e) => setTargetCtl(e.target.value ? parseInt(e.target.value) : null)} placeholder="Auto"
                                                className="w-24 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-right outline-none focus:border-blue-500 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'zones' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4">Zonas y Umbrales</h2>
                                
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-xl text-orange-500"><RefreshCw size={20}/></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Auto-Detect LTHR</p>
                                            <p className="text-xs text-slate-500 dark:text-zinc-500">Calcula tu umbral basado en el historial de actividades</p>
                                        </div>
                                    </div>
                                    <button onClick={handleAutoDetectLTHR} disabled={isScanning || pureActs.length === 0} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isScanning ? <><Loader2 size={16} className="animate-spin" /> Analizando...</> : 'Escanear Historial'}
                                    </button>
                                </div>

                                <div className="bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-xl flex mb-6">
                                    <button onClick={() => setActiveTab('run')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'run' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'}`}>
                                        <Footprints size={16} /> Correr
                                    </button>
                                    <button onClick={() => setActiveTab('bike')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'bike' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'}`}>
                                        <Bike size={16} /> Ciclismo
                                    </button>
                                </div>

                                {activeTab === 'run' && <SportZonesSection sport="run" sportLabel="Zonas de Carrera" icon={Footprints} color="orange" showPace showPower={false} data={formData.run} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                                {activeTab === 'bike' && <SportZonesSection sport="bike" sportLabel="Zonas de Ciclismo" icon={Bike} color="blue" showPace={false} showPower data={formData.bike} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                            </div>
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4">Integraciones</h2>
                                
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-indigo-600 dark:text-indigo-400"><Link2 size={24}/></div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Intervals.icu</h3>
                                                <p className="text-sm text-slate-500 dark:text-zinc-500">Sincroniza métricas fisiológicas (Garmin, Oura, Whoop)</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-2 uppercase tracking-wider">Athlete ID</label>
                                                <input type="text" name="intervalsId" value={formData.intervalsId} onChange={handleChange} placeholder="i12345" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono dark:text-zinc-200 focus:border-indigo-500 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-2 uppercase tracking-wider">API Key</label>
                                                <input type="password" name="intervalsKey" value={formData.intervalsKey} onChange={handleChange} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono dark:text-zinc-200 focus:border-indigo-500 outline-none transition-all" />
                                            </div>
                                            
                                            <button
                                                onClick={handleSyncIntervals}
                                                disabled={isSyncingIntervals || !formData.intervalsId || !formData.intervalsKey}
                                                className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors shadow-md"
                                            >
                                                {isSyncingIntervals
                                                    ? <><Loader2 size={16} className="animate-spin" />{intervalsSyncProgress || 'Sincronizando...'}</>
                                                    : <><Cloud size={16} /> Sincronizar Ahora</>}
                                            </button>
                                        </div>

                                        {syncPreview && (
                                            <div className="mt-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-4">Nuevos datos disponibles desde Intervals:</p>
                                                <div className="space-y-3 mb-5">
                                                    {syncPreview.weight != null && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600 dark:text-zinc-400">Peso</span>
                                                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{formData.weight} → {syncPreview.weight} kg</span>
                                                        </div>
                                                    )}
                                                    {syncPreview.fc_reposo != null && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600 dark:text-zinc-400">FC Reposo</span>
                                                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{formData.fcReposo} → {syncPreview.fc_reposo} bpm</span>
                                                        </div>
                                                    )}
                                                    {syncPreview.ftp != null && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600 dark:text-zinc-400">FTP</span>
                                                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{formData.bike?.ftp} → {syncPreview.ftp} W</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={handleApplySyncedProfile} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Aplicar Cambios</button>
                                                    <button onClick={() => setSyncPreview(null)} className="flex-1 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">Ignorar</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4">Seguridad y Datos</h2>
                                
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-6">
                                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl text-slate-600 dark:text-zinc-400"><Key size={24}/></div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Contraseña de Acceso</h3>
                                                <p className="text-sm text-slate-500 dark:text-zinc-500">Actualiza tu contraseña para entrar en FormaLab</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleUpdatePassword} className="flex flex-col sm:flex-row gap-3">
                                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña..." className="flex-1 px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-all" />
                                            <button type="submit" disabled={isUpdatingPwd || !newPassword} className="px-8 py-3 bg-slate-800 dark:bg-zinc-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                                                {isUpdatingPwd ? <Loader2 size={16} className="animate-spin" /> : 'Actualizar'}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600"><Database size={24}/></div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Descarga de Streams (Deep Sync)</h3>
                                                <p className="text-sm text-slate-500 dark:text-zinc-500">{pureActs.length} de {stravaActs.length} actividades con datos en crudo</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-5">
                                            <div className={`h-full transition-all duration-500 ${syncPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${syncPct}%` }} />
                                        </div>
                                        
                                        <button onClick={onDeepSync} disabled={isDeepSyncing || syncPct === 100} className={`w-full py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-sm ${syncPct === 100 ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800/50' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'}`}>
                                            {isDeepSyncing ? <><Loader2 size={16} className="animate-spin" /> Descargando...</> : syncPct === 100 ? <><CheckCircle2 size={16} /> Base de datos sincronizada</> : 'Iniciar Descarga Completa'}
                                        </button>
                                        <p className="text-xs text-slate-500 mt-4 text-center">
                                            Esta acción descargará en segundo plano todos los vatios, pulso y coordenadas GPS de tus actividades históricas de Strava para permitir cálculos de TSS más precisos.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Danger Zone */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/30 overflow-hidden shadow-sm mt-6">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-600"><AlertTriangle size={24}/></div>
                                            <div>
                                                <h3 className="text-base font-bold text-red-600 dark:text-red-400">Zona de Peligro</h3>
                                                <p className="text-sm text-slate-500 dark:text-zinc-500">Acciones destructivas para tu cuenta</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Eliminar cuenta definitivamente</p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                                                    Se borrarán todas tus actividades, zonas, umbrales y planes de entrenamiento. No se puede deshacer.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={handleDeleteAccount}
                                                disabled={isDeletingAccount}
                                                className="flex-shrink-0 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                {isDeletingAccount ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Eliminar Cuenta</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};