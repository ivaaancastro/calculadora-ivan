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
    <div className="flex gap-0.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full p-0.5">
        {[{ k: 'lthr', l: '% LTHR' }, { k: 'fcmax', l: '% FCmax' }, { k: 'custom', l: 'Manual' }].map(m => (
            <button key={m.k} onClick={() => onZonesMode(sport, m.k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all select-none touch-manipulation active:scale-95 ${data.zonesMode === m.k
                    ? 'bg-white dark:bg-[#2c2c2e] shadow-xs text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                    }`}>{m.l}</button>
        ))}
    </div>
);

// Reusable sport zones section — Apple Fitness Inset Style
const SportZonesSection = ({ sport, sportLabel, icon: Icon, color, showPace, showPower, data, onChange, onZoneChange, onZonesMode }) => {
    const isReadOnly = data.zonesMode !== 'custom';
    const lthrPcts = LTHR_ZONE_PCT;
    const fcmaxPcts = FCMAX_PCT;

    return (
        <div className="space-y-4">
            {/* Threshold values card */}
            <div className="ios-card p-3.5 sm:p-4">
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-7 h-7 rounded-[8px] bg-${color}-500/15 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0`}>
                        <Icon size={16} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">{sportLabel}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">Umbrales de referencia</p>
                    </div>
                </div>

                <div className={`grid ${showPace ? 'grid-cols-2 sm:grid-cols-3' : showPower ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
                    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-2.5 border border-black/[0.03] dark:border-white/[0.04]">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">FC Umbral</label>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                inputMode="numeric" 
                                value={data.lthr} 
                                onChange={(e) => onChange(e, sport, 'lthr')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white outline-none" 
                            />
                            <span className="text-[10px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-2.5 border border-black/[0.03] dark:border-white/[0.04]">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">FC Máx.</label>
                        <div className="flex items-baseline gap-1">
                            <input 
                                type="number" 
                                inputMode="numeric" 
                                value={data.max} 
                                onChange={(e) => onChange(e, sport, 'max')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white outline-none" 
                            />
                            <span className="text-[10px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    {showPace && (
                        <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-2.5 border border-black/[0.03] dark:border-white/[0.04] col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">Ritmo Umbral</label>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="text" 
                                    value={data.thresholdPace} 
                                    onChange={(e) => onChange(e, sport, 'thresholdPace')} 
                                    placeholder="4:30"
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-orange-600 dark:text-orange-400 outline-none" 
                                />
                                <span className="text-[10px] font-semibold text-slate-400">/km</span>
                            </div>
                        </div>
                    )}

                    {showPower && (
                        <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-2.5 border border-black/[0.03] dark:border-white/[0.04] col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">FTP</label>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="number" 
                                    inputMode="numeric" 
                                    value={data.ftp} 
                                    onChange={(e) => onChange(e, sport, 'ftp')}
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 outline-none" 
                                />
                                <span className="text-[10px] font-semibold text-slate-400">W</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HR Zones card */}
            <div className="ios-card overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Heart size={14} className="text-rose-500" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Zonas de Frecuencia Cardíaca</span>
                    </div>
                    <ModeSelector sport={sport} data={data} onZonesMode={onZonesMode} />
                </div>
                <div className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                    {(data?.zones || []).map((zone, i) => {
                        const pcts = data.zonesMode === 'lthr' ? lthrPcts[i] : data.zonesMode === 'fcmax' ? fcmaxPcts[i] : null;
                        const pctStr = pcts ? `${Math.round(pcts.pMin * 100)} - ${i === 6 ? Math.round(pcts.pMax * 100) + '%+' : Math.round(pcts.pMax * 100) + '%'}` : '';
                        return (
                            <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px]">{(pcts || lthrPcts[i]).label}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {pctStr && (
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">{pctStr}</span>
                                    )}
                                    {isReadOnly ? (
                                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-xs">
                                            {zone.min} - {zone.max} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <input type="number" value={zone.min} onChange={(e) => onZoneChange(e, sport, i, 'min')} className="w-12 bg-slate-100 dark:bg-zinc-800 rounded px-1 py-0.5 text-xs font-mono text-center outline-none focus:ring-1 focus:ring-blue-500" />
                                            <span className="text-slate-400">-</span>
                                            <input type="number" value={zone.max} onChange={(e) => onZoneChange(e, sport, i, 'max')} className="w-12 bg-slate-100 dark:bg-zinc-800 rounded px-1 py-0.5 text-xs font-mono text-center outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pace Zones (Carrera) */}
            {showPace && (
                <div className="ios-card overflow-hidden">
                    <div className="p-3.5 sm:p-4 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timer size={14} className="text-orange-500" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Zonas de Ritmo</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">por km</span>
                    </div>
                    <div className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                        {(data?.paceZones || calcPaceZones(data?.thresholdPace) || []).map((zone, i) => (
                            <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px]">{zone.label}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
                                        {zone.pctMin > 0 ? `${(zone.pctMin * 100).toFixed(0)}` : '0'}-{(zone.pctMax * 100).toFixed(0)}%
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-xs">
                                        {zone.min} - {zone.max}/km
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Power Zones (Ciclismo) */}
            {showPower && data.ftp > 0 && (
                <div className="ios-card overflow-hidden">
                    <div className="p-3.5 sm:p-4 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Zonas de Potencia ({data.ftp} W)</span>
                        </div>
                    </div>
                    <div className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                        {POWER_ZONES.map((pz, i) => {
                            const minW = Math.round(data.ftp * pz.pMin);
                            const maxW = Math.round(data.ftp * pz.pMax);
                            return (
                                <div key={i} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                        <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">Z{i + 1}</span>
                                        <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px]">{pz.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
                                            {Math.round(pz.pMin * 100)}-{Math.round(pz.pMax * 100)}%
                                        </span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-xs">
                                            {minW} - {i === 6 ? maxW + '+' : maxW} <span className="text-[10px] font-normal text-slate-400">W</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const SECTION_NAMES = {
    general: 'General',
    zones: 'Zonas y Umbrales',
    integrations: 'Cuentas Conectadas',
    security: 'Seguridad y Datos'
};

export const ProfilePage = ({ 
    currentSettings, 
    currentMetrics, 
    onUpdate, 
    activities, 
    isDeepSyncing,  
    onDeepSync, 
    onBack,
    section: propSection
}) => {
    const getInitialSection = () => {
        if (propSection && ['general', 'zones', 'integrations', 'security'].includes(propSection)) {
            return propSection;
        }
        if (typeof window !== 'undefined' && window.location) {
            try {
                const params = new URLSearchParams(window.location.search);
                const sec = params.get('section');
                if (sec && ['general', 'zones', 'integrations', 'security'].includes(sec)) {
                    return sec;
                }
            } catch {
                // Ignore URL parsing errors in non-browser test runners
            }
        }
        return 'general';
    };

    const [formData, setFormData] = useState(null);
    const [targetCtl, setTargetCtl] = useState(null); // Managed separately for calibration logic
    const [activeTab, setActiveTab] = useState('run');
    const [activeSection, setActiveSection] = useState(getInitialSection);

    useEffect(() => {
        if (propSection && ['general', 'zones', 'integrations', 'security'].includes(propSection)) {
            setActiveSection(propSection);
        }
    }, [propSection]);

    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        if (typeof window !== 'undefined' && window.location && window.history) {
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('section', sectionId);
                window.history.replaceState({}, '', url.toString());
            } catch {
                // Ignore history update errors in non-browser envs
            }
        }
    };

    const [isScanning, setIsScanning] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [syncPreview, setSyncPreview] = useState(null); // {weight, rhr, ftp} before confirming

    const { syncing: isSyncingIntervals, syncProgress: intervalsSyncProgress, syncAll: syncIntervals } = useIntervalsSync();

    const handleSyncIntervals = async () => {
        if (!formData?.intervalsId || !formData?.intervalsKey) {
            toast._or('Introduce tu Athlete ID y API Key de Intervals.icu primero');
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
            // 1. Deauthorize Strava
            const { data: profile } = await supabase.from('profiles').select('strava_access_token').single();
            if (profile && profile.strava_access_token) {
                try {
                    await fetch('https://www.strava.com/oauth/deauthorize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: profile.strava_access_token })
                    });
                    console.log("Strava deauthorized successfully");
                } catch (e) {
                    console.error("Failed to deauthorize Strava", e);
                }
            }

            // 2. Attempt to call a custom RPC to delete the user
            const { error } = await supabase.rpc('delete_user');
            
            if (error) {
                console.error("Error al eliminar la cuenta:", error);
                toast.error("Para eliminar tu cuenta por completo, contacta con soporte o añade la función delete_user a la base de datos.");
            } else {
                await supabase.auth.signOut();
                toast.success("Tu cuenta ha sido eliminada.");
                window.location.href = '/';
            }
        } catch {
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
            onClick={() => handleSectionChange(id)}
            className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all text-left whitespace-nowrap select-none touch-manipulation active:scale-95 ${activeSection === id
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 font-medium'
                }`}
        >
            <IconComponent size={17} className={activeSection === id ? 'text-white' : 'text-slate-400 dark:text-zinc-500'} />
            <span className="text-xs sm:text-sm">{label}</span>
        </button>
    );

    return (
        <div className="animate-in fade-in duration-300 pb-16 max-w-5xl mx-auto px-3.5 sm:px-6">
            {/* APPLE NAVIGATION HEADER */}
            <div className="flex items-center justify-between mb-4 sm:mb-8 border-b border-black/[0.05] dark:border-white/[0.06] pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={onBack} 
                        className="flex items-center gap-1 text-[#007AFF] dark:text-[#0A84FF] text-sm font-semibold hover:opacity-80 active:opacity-50 transition-opacity -ml-1 select-none touch-manipulation"
                        aria-label="Volver"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Atrás</span>
                    </button>
                    <h1 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight ml-1">
                        <span className="hidden sm:inline">Ajustes — </span>
                        <span>{SECTION_NAMES[activeSection] || 'Ajustes'}</span>
                    </h1>
                </div>
                <button 
                  onClick={() => {
                    const raw = currentMetrics?.rawCtl || 0;
                    const newOffset = targetCtl !== null ? (targetCtl - raw) : formData.offsetCtl;
                    onUpdate({ ...formData, offsetCtl: newOffset });
                  }} 
                  className="flex items-center gap-1.5 bg-[#007AFF] hover:bg-blue-600 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-95 select-none touch-manipulation"
                >
                    <Save size={14} strokeWidth={2.5} /> <span>Guardar</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* DESKTOP SIDEBAR */}
                <div className="hidden md:flex w-56 flex-shrink-0 flex-col gap-1">
                    {renderMenuButton('general', 'General', Activity)}
                    {renderMenuButton('zones', 'Zonas y Umbrales', Heart)}
                    {renderMenuButton('integrations', 'Integraciones', Link2)}
                    {renderMenuButton('security', 'Seguridad y Datos', Lock)}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 min-w-0">
                    {activeSection === 'general' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                            {/* AVATAR PROFILE BANNER — HORIZONTAL APPLE SETTINGS STYLE */}
                            <div className="ios-card p-4 sm:p-5 flex items-center gap-4 text-left mb-5">
                                <div className="relative shrink-0">
                                    <div 
                                        className="rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm flex items-center justify-center relative shrink-0"
                                        style={{ width: '76px', height: '76px', minWidth: '76px', minHeight: '76px' }}
                                    >
                                        {formData.avatarUrl ? (
                                            <img 
                                                src={formData.avatarUrl} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover rounded-full block pointer-events-none" 
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <User size={34} className="text-slate-400" />
                                        )}
                                        {isUploadingAvatar && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                <Loader2 size={18} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-1 -right-1 p-2 bg-[#007AFF] text-white rounded-full shadow-md cursor-pointer hover:bg-blue-600 active:scale-90 transition-transform">
                                        <Camera size={13} strokeWidth={2.5} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                    </label>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {formData.fullName || 'Atleta FormaLab'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{formData.email}</p>
                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/15">
                                        Atleta FormaLab
                                    </span>
                                </div>
                            </div>

                            {/* DATOS PERSONALES */}
                            <div>
                                <div className="ios-header">Datos Personales</div>
                                <div className="ios-card overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.06] mb-5">
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400">Nombre</span>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName || ''}
                                            onChange={handleChange}
                                            placeholder="Tu nombre"
                                            className="flex-1 text-right bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400">Correo</span>
                                        <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-zinc-500 truncate max-w-[220px]">{formData.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* AJUSTES FISIOLÓGICOS */}
                            <div>
                                <div className="ios-header">Fisiología y Métricas</div>
                                <div className="ios-card overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                                    {/* Peso */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-[8px] bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                                <Weight size={15} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Peso Corporal</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Para cálculos de W/kg</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                className="w-16 text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800/80 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">kg</span>
                                        </div>
                                    </div>

                                    {/* FC Reposo */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-[8px] bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                                <Heart size={15} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">FC Reposo</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Pulsaciones basales mínimas</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                name="fcReposo"
                                                value={formData.fcReposo}
                                                onChange={handleChange}
                                                className="w-16 text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800/80 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-rose-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">bpm</span>
                                        </div>
                                    </div>

                                    {/* Calibrar CTL */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-[8px] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                                <Activity size={15} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Calibrar Fitness (CTL)</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Ajuste de base histórica</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                step="1"
                                                value={targetCtl ?? ''}
                                                onChange={(e) => setTargetCtl(e.target.value ? parseInt(e.target.value) : null)}
                                                placeholder="Auto"
                                                className="w-16 text-right font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800/80 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">CTL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'zones' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
                            {/* AUTO-DETECT LTHR BANNER */}
                            <div className="ios-card p-3.5 sm:p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-[8px] bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                        <RefreshCw size={15} strokeWidth={2.3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Auto-Detectar LTHR</p>
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Calcula tu umbral desde el historial</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAutoDetectLTHR} 
                                    disabled={isScanning || pureActs.length === 0} 
                                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:scale-95"
                                >
                                    {isScanning ? <><Loader2 size={13} className="animate-spin" /> Analizando...</> : 'Escanear'}
                                </button>
                            </div>

                            {/* SPORT SELECTOR SEGMENTED */}
                            <div className="flex p-1 bg-slate-200/60 dark:bg-[#1c1c1e] rounded-full backdrop-blur-md gap-0.5 select-none">
                                <button 
                                    onClick={() => setActiveTab('run')} 
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
                                        activeTab === 'run' ? 'bg-white dark:bg-[#2c2c2e] text-orange-600 dark:text-orange-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <Footprints size={14} strokeWidth={2.3} /> Correr
                                </button>
                                <button 
                                    onClick={() => setActiveTab('bike')} 
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation active:scale-95 ${
                                        activeTab === 'bike' ? 'bg-white dark:bg-[#2c2c2e] text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <Bike size={14} strokeWidth={2.3} /> Ciclismo
                                </button>
                            </div>

                            {activeTab === 'run' && <SportZonesSection sport="run" sportLabel="Zonas de Carrera" icon={Footprints} color="orange" showPace showPower={false} data={formData.run} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                            {activeTab === 'bike' && <SportZonesSection sport="bike" sportLabel="Zonas de Ciclismo" icon={Bike} color="blue" showPace={false} showPower data={formData.bike} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                            <div className="ios-header">SERVICIOS CONECTADOS</div>
                            
                            <div className="ios-card overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[10px] bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                            <Link2 size={17} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Intervals.icu</h3>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Métricas de Garmin, Oura y Whoop</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        formData.intervalsId && formData.intervalsKey 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                    }`}>
                                        {formData.intervalsId && formData.intervalsKey ? 'Conectado' : 'No configurado'}
                                    </span>
                                </div>

                                <div className="p-3.5 sm:p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 shrink-0">Athlete ID</span>
                                        <input 
                                            type="text" 
                                            name="intervalsId" 
                                            value={formData.intervalsId || ''} 
                                            onChange={handleChange} 
                                            placeholder="i12345" 
                                            className="w-40 text-right bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500" 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 shrink-0">API Key</span>
                                        <input 
                                            type="password" 
                                            name="intervalsKey" 
                                            value={formData.intervalsKey || ''} 
                                            onChange={handleChange} 
                                            placeholder="••••••••" 
                                            className="w-40 text-right bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500" 
                                        />
                                    </div>

                                    <button
                                        onClick={handleSyncIntervals}
                                        disabled={isSyncingIntervals || !formData.intervalsId || !formData.intervalsKey}
                                        className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition-all shadow-xs active:scale-95"
                                    >
                                        {isSyncingIntervals
                                            ? <><Loader2 size={14} className="animate-spin" /> {intervalsSyncProgress || 'Sincronizando...'}</>
                                            : <><Cloud size={14} strokeWidth={2.3} /> Sincronizar Ahora</>}
                                    </button>
                                </div>

                                {syncPreview && (
                                    <div className="p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">Nuevos datos disponibles:</p>
                                        <div className="space-y-1.5 mb-3 text-xs">
                                            {syncPreview.weight != null && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Peso</span>
                                                    <span className="font-mono font-bold text-indigo-600">{formData.weight} → {syncPreview.weight} kg</span>
                                                </div>
                                            )}
                                            {syncPreview.fc_reposo != null && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">FC Reposo</span>
                                                    <span className="font-mono font-bold text-indigo-600">{formData.fcReposo} → {syncPreview.fc_reposo} bpm</span>
                                                </div>
                                            )}
                                            {syncPreview.ftp != null && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">FTP</span>
                                                    <span className="font-mono font-bold text-indigo-600">{formData.bike?.ftp} → {syncPreview.ftp} W</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleApplySyncedProfile} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">Aplicar</button>
                                            <button onClick={() => setSyncPreview(null)} className="flex-1 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">Ignorar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
                            {/* CONTRASEÑA */}
                            <div>
                                <div className="ios-header">SEGURIDAD</div>
                                <div className="ios-card p-3.5 sm:p-4 mb-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-7 h-7 rounded-[8px] bg-slate-500/15 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                                            <Key size={15} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Contraseña de Acceso</h3>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Actualiza tu clave de acceso</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleUpdatePassword} className="flex gap-2">
                                        <input 
                                            type="password" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            placeholder="Nueva contraseña..." 
                                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-mono dark:text-zinc-200 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isUpdatingPwd || !newPassword} 
                                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shrink-0 shadow-xs active:scale-95"
                                        >
                                            {isUpdatingPwd ? <Loader2 size={13} className="animate-spin" /> : 'Actualizar'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* DEEP SYNC */}
                            <div>
                                <div className="ios-header">GESTIÓN DE DATOS</div>
                                <div className="ios-card p-3.5 sm:p-4 mb-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-7 h-7 rounded-[8px] bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <Database size={15} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Deep Sync (Datos Crudos)</h3>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">{pureActs.length} de {stravaActs.length} actividades descargadas</p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full transition-all duration-500 ${syncPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${syncPct}%` }} />
                                    </div>
                                    
                                    <button 
                                        onClick={onDeepSync} 
                                        disabled={isDeepSyncing || syncPct === 100} 
                                        className={`w-full py-2.5 rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition-all shadow-xs ${syncPct === 100 ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 border border-emerald-500/20' : 'bg-[#007AFF] text-white hover:bg-blue-600 active:scale-95'}`}
                                    >
                                        {isDeepSyncing ? <><Loader2 size={14} className="animate-spin" /> Descargando...</> : syncPct === 100 ? <><CheckCircle2 size={14} /> Base de datos sincronizada</> : 'Iniciar Descarga Completa'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* DANGER ZONE */}
                            <div>
                                <div className="ios-header text-red-500 dark:text-red-400">ZONA DE PELIGRO</div>
                                <div className="ios-card border border-red-200 dark:border-red-900/30 p-3.5 sm:p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-7 h-7 rounded-[8px] bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                            <AlertTriangle size={15} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">Eliminar cuenta definitivamente</h3>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Se eliminarán todas tus actividades y métricas</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount}
                                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                                    >
                                        {isDeletingAccount ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Eliminar Cuenta</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};