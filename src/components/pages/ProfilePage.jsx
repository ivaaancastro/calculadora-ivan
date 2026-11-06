import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Activity, Heart, Zap, Database, Loader2, RefreshCw, CheckCircle2,
  Lock, Key, Bike, Footprints, Weight, Link2, Timer, Gauge, Cloud, Wifi, Trash2,
  AlertTriangle, User, Camera, Mail, Save, ShieldCheck, ShieldAlert, Scale
} from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { LTHR_ZONE_PCT, calcZonesFromLTHR } from '../../utils/tssEngine';
import { useIntervalsSync } from '../../hooks/useIntervalsSync';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';
import { Input } from '../ui/Input';

/* ── Tokens del sistema de diseño (design-taste-frontend) ──
   Palette cool-grey-cobalt, accent azul #1f2de6, radius soft, grounds planos. */

const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
const HR_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7'];

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
        min: z.sMax > 0 ? secToPace(tp / z.sMax) : '',
        max: z.sMin > 0 ? secToPace(tp / z.sMin) : '∞',
    }));
};

const POWER_ZONES = [
    { label: 'Active Recovery', pMin: 0, pMax: 0.55 },
    { label: 'Endurance', pMin: 0.56, pMax: 0.75 },
    { label: 'Tempo', pMin: 0.76, pMax: 0.90 },
    { label: 'Threshold', pMin: 0.91, pMax: 1.05 },
    { label: 'VO2 Max', pMin: 1.06, pMax: 1.20 },
    { label: 'Anaerobic', pMin: 1.21, pMax: 1.50 },
    { label: 'Neuromuscular', pMin: 1.51, pMax: 2.00 },
];

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

const ModeSelector = ({ sport, data, onZonesMode }) => (
    <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800/60 rounded-xl p-0.5">
        {[{ k: 'lthr', l: '% LTHR' }, { k: 'fcmax', l: '% FCmax' }, { k: 'custom', l: 'Manual' }].map(m => (
            <button key={m.k} onClick={() => onZonesMode(sport, m.k)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all select-none touch-manipulation active:scale-95 ${data.zonesMode === m.k
                    ? 'bg-white dark:bg-[#1a1a1b] shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                    }`}>{m.l}</button>
        ))}
    </div>
);

const SportZonesSection = ({ sport, sportLabel, icon: Icon, color, showPace, showPower, data, onChange, onZoneChange, onZonesMode }) => {
    const isReadOnly = data.zonesMode !== 'custom';
    const lthrPcts = LTHR_ZONE_PCT;
    const fcmaxPcts = FCMAX_PCT;

    return (
        <div className="space-y-4">
            {/* Threshold values card */}
            <Card className="p-4">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-[10px] bg-${color}-500/15 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0`}>
                        <Icon size={17} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{sportLabel}</h4>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Umbrales de referencia</p>
                    </div>
                </div>

                <div className="grid ${showPace ? 'grid-cols-2 sm:grid-cols-3' : showPower ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-3 sm:gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-800/40">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">FC Umbral</label>
                        <div className="flex items-baseline gap-1">
                            <input
                                type="number"
                                inputMode="numeric"
                                value={data.lthr}
                                onChange={(e) => onChange(e, sport, 'lthr')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white outline-none"
                            />
                            <span className="text-[11px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-800/40">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">FC Máx.</label>
                        <div className="flex items-baseline gap-1">
                            <input
                                type="number"
                                inputMode="numeric"
                                value={data.max}
                                onChange={(e) => onChange(e, sport, 'max')}
                                className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white outline-none"
                            />
                            <span className="text-[11px] font-semibold text-slate-400">bpm</span>
                        </div>
                    </div>

                    {showPace && (
                        <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-800/40 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">Ritmo Umbral</label>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="text"
                                    value={data.thresholdPace}
                                    onChange={(e) => onChange(e, sport, 'thresholdPace')}
                                    placeholder="4:30"
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-orange-600 dark:text-orange-400 outline-none"
                                />
                                <span className="text-[11px] font-semibold text-slate-400">/km</span>
                            </div>
                        </div>
                    )}

                    {showPower && (
                        <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-800/40 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">FTP</label>
                            <div className="flex items-baseline gap-1">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={data.ftp}
                                    onChange={(e) => onChange(e, sport, 'ftp')}
                                    className="w-full bg-transparent font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 outline-none"
                                />
                                <span className="text-[11px] font-semibold text-slate-400">W</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* HR Zones card */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <Heart size={15} className="text-rose-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Zonas de Frecuencia Cardíaca</span>
                    </div>
                    <ModeSelector sport={sport} data={data} onZonesMode={onZonesMode} />
                </div>
                <div className="divide-y divide-slate-200 dark:divide-zinc-800/40">
                    {(data?.zones || []).map((zone, i) => {
                        const pcts = data.zonesMode === 'lthr' ? lthrPcts[i] : data.zonesMode === 'fcmax' ? fcmaxPcts[i] : null;
                        const pctStr = pcts ? `${Math.round(pcts.pMin * 100)} - ${i === 6 ? Math.round(pcts.pMax * 100) + '%+' : Math.round(pcts.pMax * 100) + '%'}` : '';
                        return (
                            <div key={i} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px] ml-1">{ (pcts || lthrPcts[i]).label }</span>
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
                                            <input type="number" value={zone.min} onChange={(e) => onZoneChange(e, sport, i, 'min')} className="w-14 bg-slate-100 dark:bg-zinc-800 rounded-lg px-1.5 py-1 text-[11px] font-mono text-center outline-none focus:ring-1 focus:ring-[#1f2de6]" />
                                            <span className="text-slate-400 text-xs">-</span>
                                            <input type="number" value={zone.max} onChange={(e) => onZoneChange(e, sport, i, 'max')} className="w-14 bg-slate-100 dark:bg-zinc-800 rounded-lg px-1.5 py-1 text-[11px] font-mono text-center outline-none focus:ring-1 focus:ring-[#1f2de6]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Pace Zones (Carrera) */}
            {showPace && (
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Timer size={15} className="text-orange-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Zonas de Ritmo</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">por km</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-zinc-800/40">
                        {(data?.paceZones || calcPaceZones(data?.thresholdPace) || []).map((zone, i) => (
                            <div key={i} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                    <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">{HR_LABELS[i]}</span>
                                    <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px] ml-1">{zone.label}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
                                        {zone.pctMin > 0 ? `${(zone.pctMin * 100).toFixed(0)}` : '0'}-{(zone.pctMax * 100).toFixed(0)}%
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300 text-xs">
                                        {zone.min} - {zone.max}/km
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Power Zones (Ciclismo) */}
            {showPower && data.ftp > 0 && (
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-zinc-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Zap size={15} className="text-amber-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Zonas de Potencia ({data.ftp} W)</span>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-zinc-800/40">
                        {POWER_ZONES.map((pz, i) => {
                            const minW = Math.round(data.ftp * pz.pMin);
                            const maxW = Math.round(data.ftp * pz.pMax);
                            return (
                                <div key={i} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[i] }} />
                                        <span className="font-bold text-slate-800 dark:text-zinc-200 shrink-0">Z{i + 1}</span>
                                        <span className="text-slate-500 dark:text-zinc-400 truncate text-[11px] ml-1">{pz.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 hidden sm:inline">
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
                </Card>
            )}
        </div>
    );
};

const SECTION_NAMES = {
    general: 'Perfil',
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
    const [targetCtl, setTargetCtl] = useState(null);
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
    const [syncPreview, setSyncPreview] = useState(null);

    const { syncing: isSyncingIntervals, syncProgress: intervalsSyncProgress, syncAll: syncIntervals } = useIntervalsSync();

    const handleSyncIntervals = async () => {
        if (!formData?.intervalsId || !formData?.intervalsKey) {
            toast.error('Introduce tu Athlete ID y API Key de Intervals.icu primero');
            return;
        }
        const result = await syncIntervals(formData);
        if (!result) return;

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
        toast.success('Perfil actualizado con datos de Intervals.icu');
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
            const { data: profile } = await supabase.from('profiles').select('strava_access_token').single();
            if (profile && profile.strava_access_token) {
                try {
                    await fetch('https://www.strava.com/oauth/deauthorize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: profile.strava_access_token })
                    });
                } catch (e) {
                    console.error("Failed to deauthorize Strava", e);
                }
            }

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
            
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen es demasiado grande. Máximo 2MB.");
                return;
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            
            setIsUploadingAvatar(true);
            
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            
            setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
            toast.success("Foto subida. Guarda los cambios para que persista.");
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left select-none touch-manipulation active:scale-95 ${activeSection === id
                ? 'bg-[#1f2de6]/10 text-[#1f2de6] font-bold shadow-sm border border-[#1f2de6]/20'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 font-medium'
                }`}
        >
            <IconComponent size={18} className={activeSection === id ? 'text-[#1f2de6]' : 'text-slate-400 dark:text-zinc-500'} />
            <span className="text-sm">{label}</span>
        </button>
    );

    return (
        <div className="pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* NAVIGATION HEADER */}
            <div className="flex items-center justify-between mb-6 sm:mb-10 border-b border-slate-200 dark:border-zinc-800/40 pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-5">
                    <button 
                        onClick={onBack} 
                        className="flex items-center gap-1.5 text-[#1f2de6] dark:text-[#4da6ff] text-sm font-semibold hover:text-[#2e49ff] dark:hover:text-[#66b2ff] active:scale-95 transition-transform -ml-1 select-none touch-manipulation"
                        aria-label="Volver"
                    >
                        <ArrowLeft size={19} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Atrás</span>
                    </button>
                    <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight ml-2">
                        <span className="hidden sm:inline">Ajustes — </span>
                        <span>{SECTION_NAMES[activeSection] || 'Perfil'}</span>
                    </h1>
                </div>
                <button 
                  onClick={() => {
                    const raw = currentMetrics?.rawCtl || 0;
                    const newOffset = targetCtl !== null ? (targetCtl - raw) : formData.offsetCtl;
                    onUpdate({ ...formData, offsetCtl: newOffset });
                  }} 
                  className="flex items-center gap-2 bg-[#1f2de6] hover:bg-[#2e49ff] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold tracking-wide shadow-xs active:scale-95 select-none touch-manipulation"
                >
                    <Save size={15} strokeWidth={2.5} /> <span>Guardar cambios</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* DESKTOP SIDEBAR */}
                <div className="hidden md:flex w-60 flex-shrink-0 flex-col gap-1">
                    {renderMenuButton('general', 'Perfil', Activity)}
                    {renderMenuButton('zones', 'Zonas y Umbrales', Heart)}
                    {renderMenuButton('integrations', 'Integraciones', Link2)}
                    {renderMenuButton('security', 'Seguridad y Datos', Lock)}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 min-w-0">
                    {activeSection === 'general' && (
                        <div className="space-y-6">
                            {/* AVATAR PROFILE BANNER */}
                            <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="relative shrink-0">
                                    <div 
                                        className="rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 shadow-sm flex items-center justify-center relative shrink-0"
                                        style={{ width: '88px', height: '88px', minWidth: '88px', minHeight: '88px' }}
                                    >
                                        {formData.avatarUrl ? (
                                            <img 
                                                src={formData.avatarUrl} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover rounded-full block" 
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <User size={40} className="text-slate-400" />
                                        )}
                                        {isUploadingAvatar && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                                <Loader2 size={20} className="text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 p-2.5 bg-[#1f2de6] text-white rounded-full shadow-lg cursor-pointer hover:bg-[#2e49ff] active:scale-90 transition-all">
                                        <Camera size={15} strokeWidth={2.5} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                    </label>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight truncate">
                                        {formData.fullName || 'Atleta FormaLab'}
                                    </h3>
                                    <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-1 truncate">{formData.email}</p>
                                    <span className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-[#1f2de6] dark:text-[#66b2ff] bg-[#1f2de6]/10 dark:bg-[#1f2de6]/15 px-3 py-1 rounded-full border border-[#1f2de6]/20">
                                        Atleta FormaLab
                                    </span>
                                </div>
                            </Card>

                            {/* DATOS PERSONALES */}
                            <div>
                                <SectionHeader title="Datos Personales" subtitle="Nombre, correo y foto de perfil" />
                                <Card className="overflow-hidden divide-y divide-slate-200 dark:divide-zinc-800/40">
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Nombre</span>
                                        <Input
                                            id="fullName"
                                            label=""
                                            value={formData.fullName || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                            placeholder="Tu nombre"
                                            className="w-64 text-right text-sm font-semibold text-slate-900 dark:text-white outline-none"
                                        />
                                    </div>
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-zinc-800/40">
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Correo</span>
                                        <span className="text-sm text-slate-600 dark:text-zinc-400 truncate max-w-[260px]">{formData.email}</span>
                                    </div>
                                </Card>
                            </div>

                            {/* AJUSTES FISIOLÓGICOS */}
                            <div>
                                <SectionHeader title="Fisiología y Métricas" subtitle="Peso, FC reposo y calibración de fitness (CTL)" />
                                <Card className="overflow-hidden divide-y divide-slate-200 dark:divide-zinc-800/40">
                                    {/* Peso */}
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[10px] bg-[#1f2de6]/10 text-[#1f2de6] flex items-center justify-center shrink-0 shadow-sm">
                                                <Weight size={16} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Peso Corporal</p>
                                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Para cálculos de W/kg</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                                className="w-20 text-right font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/40 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#1f2de6]"
                                            />
                                            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500">kg</span>
                                        </div>
                                    </div>

                                    {/* FC Reposo */}
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/40">
                                        <div class="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                                                <Heart size={16} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">FC Reposo</p>
                                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Pulsaciones basales mínimas</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                name="fcReposo"
                                                value={formData.fcReposo}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fcReposo: e.target.value }))}
                                                className="w-20 text-right font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/40 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-rose-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500">bpm</span>
                                        </div>
                                    </div>

                                    {/* Calibrar CTL */}
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                                                <Activity size={16} strokeWidth={2.3} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Calibrar Fitness (CTL)</p>
                                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Ajuste de base histórica</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                step="1"
                                                value={targetCtl ?? ''}
                                                onChange={(e) => setTargetCtl(e.target.value ? parseInt(e.target.value) : null)}
                                                placeholder="Auto"
                                                className="w-20 text-right font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/40 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500">CTL</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeSection === 'zones' && (
                        <div className="space-y-6">
                            {/* AUTO-DETECT LTHR BANNER */}
                            <Card className="p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                                        <RefreshCw size={16} strokeWidth={2.3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Auto-Detectar LTHR</p>
                                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">Calcula tu umbral desde el historial de actividades</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAutoDetectLTHR} 
                                    disabled={isScanning || pureActs.length === 0} 
                                    className="px-4 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0 active:scale-95"
                                >
                                    {isScanning ? <><Loader2 size={14} className="animate-spin" /> Analizando...</> : 'Escanear historial'}
                                </button>
                            </Card>

                            {/* SPORT SELECTOR SEGMENTED */}
                            <div className="flex p-0.5 bg-slate-100 dark:bg-[#1a1a1b] rounded-xl gap-0.5 select-none">
                                <button 
                                    onClick={() => setActiveTab('run')} 
                                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 select-none touch-manipulation active:scale-95 ${
                                        activeTab === 'run' ? 'bg-white dark:bg-[#121213] text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <Footprints size={15} strokeWidth={2.3} /> Correr
                                </button>
                                <button 
                                    onClick={() => setActiveTab('bike')} 
                                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 select-none touch-manipulation active:scale-95 ${
                                        activeTab === 'bike' ? 'bg-white dark:bg-[#121213] text-[#1f2de6] dark:text-[#66b2ff] shadow-sm' : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <Bike size={15} strokeWidth={2.3} /> Ciclismo
                                </button>
                            </div>

                            {activeTab === 'run' && <SportZonesSection sport="run" sportLabel="Zonas de Carrera" icon={Footprints} color="orange" showPace showPower={false} data={formData.run} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                            {activeTab === 'bike' && <SportZonesSection sport="bike" sportLabel="Zonas de Ciclismo" icon={Bike} color="blue" showPace={false} showPower data={formData.bike} onChange={handleChange} onZoneChange={handleZoneChange} onZonesMode={handleZonesMode} />}
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="space-y-6">
                            <SectionHeader title="Cuentas Conectadas" subtitle="Intervals.icu para métricas de Garmin, Oura y Whoop" />
                            
                            <Card className="overflow-hidden divide-y divide-slate-200 dark:divide-zinc-800/40">
                                <div className="p-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-[12px] bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Link2 size={18} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Intervals.icu</h3>
                                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Métricas de Garmin, Oura y Whoop</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                        formData.intervalsId && formData.intervalsKey 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                    }`}>
                                        {formData.intervalsId && formData.intervalsKey ? 'Conectado' : 'No configurado'}
                                    </span>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">Athlete ID</span>
                                        <Input
                                            id="intervalsId"
                                            label=""
                                            type="text"
                                            value={formData.intervalsId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, intervalsId: e.target.value }))}
                                            placeholder="i12345"
                                            className="w-48 text-right text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">API Key</span>
                                        <Input
                                            id="intervalsKey"
                                            label=""
                                            type="password"
                                            value={formData.intervalsKey || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, intervalsKey: e.target.value }))}
                                            placeholder="••••••••"
                                            className="w-48 text-right text-xs font-mono text-slate-900 dark:text-zinc-200 outline-none"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSyncIntervals}
                                        disabled={isSyncingIntervals || !formData.intervalsId || !formData.intervalsKey}
                                        variant="primary"
                                        full
                                    >
                                        {isSyncingIntervals
                                            ? <><Loader2 size={15} className="animate-spin mr-2" /> {intervalsSyncProgress || 'Sincronizando...'}</>
                                            : <><Cloud size={15} strokeWidth={2.3} mr-2 /> Sincronizar Ahora</>}
                                    </Button>
                                </div>

                                {syncPreview && (
                                    <div className="p-5 bg-[#1f2de6]/5 dark:bg-[#1f2de6]/10 border border-[#1f2de6]/20 rounded-xl">
                                        <p className="text-[11px] font-bold text-[#1f2de6] dark:text-[#66b2ff] mb-3 uppercase tracking-wider">Nuevos datos disponibles</p>
                                        <div className="space-y-2 text-sm">
                                            {syncPreview.weight != null && (
                                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/40 pb-2">
                                                    <span className="text-slate-500">Peso</span>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.weight} → {syncPreview.weight} kg</span>
                                                </div>
                                            )}
                                            {syncPreview.fc_reposo != null && (
                                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/40 pb-2">
                                                    <span className="text-slate-500">FC Reposo</span>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.fcReposo} → {syncPreview.fc_reposo} bpm</span>
                                                </div>
                                            )}
                                            {syncPreview.ftp != null && (
                                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/40 pb-2">
                                                    <span className="text-slate-500">FTP</span>
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.bike?.ftp} → {syncPreview.ftp} W</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <Button onClick={handleApplySyncedProfile} variant="primary" full>
                                                Aplicar
                                            </Button>
                                            <Button onClick={() => setSyncPreview(null)} variant="secondary" full>
                                                Ignorar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            {/* CONTRASEÑA */}
                            <div>
                                <SectionHeader title="Seguridad" subtitle="Actualiza tu clave de acceso y gestiona tus datos" />
                                <Card className="p-5 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-[10px] bg-slate-500/15 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                                            <Key size={16} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contraseña de Acceso</h3>
                                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Mínimo 6 caracteres</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleUpdatePassword} className="flex gap-3">
                                        <Input
                                            id="newPassword"
                                            label=""
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Nueva contraseña..."
                                            className="flex-1 text-sm font-mono text-slate-900 dark:text-zinc-200 outline-none"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isUpdatingPwd || !newPassword}
                                            variant="primary"
                                        >
                                            {isUpdatingPwd ? <Loader2 size={14} className="animate-spin mr-2" /> : ''}Actualizar
                                        </Button>
                                    </form>
                                </Card>
                            </div>

                            {/* DEEP SYNC */}
                            <div>
                                <SectionHeader title="Gestión de Datos" subtitle={pureActs.length ? `${pureActs.length} de ${stravaActs.length} actividades descargadas` : 'Sin actividades sincronizadas'} />
                                <Card className="p-5 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-[10px] bg-[#1f2de6]/15 text-[#1f2de6] dark:text-[#66b2ff] flex items-center justify-center shrink-0">
                                            <Database size={16} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Deep Sync (Datos Crudos)</h3>
                                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Descarga el historial completo desde Strava</p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-5">
                                        <div className={`h-full transition-all duration-500 ${syncPct === 100 ? 'bg-emerald-500' : 'bg-[#1f2de6]'}`} style={{ width: `${syncPct}%` }} />
                                    </div>
                                    
                                    <Button
                                        onClick={onDeepSync}
                                        disabled={isDeepSyncing || syncPct === 100}
                                        variant="primary"
                                        full
                                    >
                                        {isDeepSyncing ? <><Loader2 size={15} className="animate-spin mr-2" /> Descargando...</> : syncPct === 100 ? <><CheckCircle2 size={15} /> Base de datos sincronizada</> : 'Iniciar Descarga Completa'}
                                    </Button>
                                </Card>
                            </div>
                            
                            {/* DANGER ZONE */}
                            <div>
                                <SectionHeader title="Zona de Peligro" subtitle="Acciones irreversibles. Elimina tu cuenta y todos tus datos." />
                                <Card className="p-5 border border-rose-200 dark:border-rose-900/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                            <AlertTriangle size={16} strokeWidth={2.3} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Eliminar cuenta definitivamente</h3>
                                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">Se eliminarán todas tus actividades y métricas de forma permanente</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount}
                                        variant="secondary"
                                        full
                                        className="text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                    >
                                        {isDeletingAccount ? <Loader2 size={14} className="animate-spin mr-2" /> : <><Trash2 size={14} /> Eliminar Cuenta</>}
                                    </Button>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
