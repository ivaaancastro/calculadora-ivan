import React, { useState, useEffect, useRef } from 'react';
import { Save, Activity, Heart, ArrowLeft, Lock, Link2 } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { calcZonesFromLTHR } from '../../utils/tssEngine';
import { useIntervalsSync } from '../../hooks/useIntervalsSync';
import { Segmented } from '../ui';
import { getPeakByTime, calcZonesFromFCMax, calcPaceZones } from './profile/zonesCalc';
import { GeneralSection } from './profile/GeneralSection';
import { ZonesSection } from './profile/ZonesSection';
import { IntegrationsSection } from './profile/IntegrationsSection';
import { SecuritySection } from './profile/SecuritySection';
import { sportOf } from '../../utils/sport';

const SECTION_TABS = [
    { value: 'general', label: 'General' },
    { value: 'zones', label: 'Zonas' },
    { value: 'integrations', label: 'Cuentas' },
    { value: 'security', label: 'Seguridad' },
];

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
    onClearDb,
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

    // Estado inicial normalizado, para detectar «cambios sin guardar».
    const initialRef = useRef(null);
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
            const next = {
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
            };
            setFormData(next);
            // Initialize targetCtl from the current adjusted value
            const ctl0 = currentMetrics?.ctl != null ? Math.round(currentMetrics.ctl) : null;
            if (ctl0 != null) setTargetCtl(ctl0);
            initialRef.current = { form: JSON.stringify(next), ctl: ctl0 };
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
                const sport = sportOf(act.type);
                const isBike = sport === 'bike';
                const isRun = sport === 'run';
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

    const isDirty = !!initialRef.current && (
        JSON.stringify(formData) !== initialRef.current.form ||
        (initialRef.current.ctl != null && targetCtl !== initialRef.current.ctl)
    );

    const renderMenuButton = (id, label, IconComponent) => (
        <button
            data-profile="nav-item"
            data-active={activeSection === id}
            aria-current={activeSection === id ? 'page' : undefined}
            onClick={() => handleSectionChange(id)}
            className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all text-left whitespace-nowrap select-none touch-manipulation active:scale-95 ${activeSection === id
                ? 'bg-action-solid text-white shadow-xs font-bold'
                : 'text-body hover:bg-fill-5 font-medium'
                }`}
        >
            <IconComponent size={17} className={activeSection === id ? 'text-white' : 'text-ink-4'} />
            <span className="text-xs sm:text-sm">{label}</span>
        </button>
    );

    return (
        <div data-skin="profile" data-profile="root" className="animate-in fade-in duration-300 pb-16 max-w-5xl mx-auto px-3.5 sm:px-6">
            {/* APPLE NAVIGATION HEADER */}
            <div data-profile="header" className="flex items-center justify-between mb-4 sm:mb-8 border-b border-black/[0.05] dark:border-white/[0.06] pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={onBack} 
                        className="flex items-center gap-1 text-action-ios text-sm font-semibold hover:opacity-80 active:opacity-50 transition-opacity -ml-1 select-none touch-manipulation"
                        aria-label="Volver"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Atrás</span>
                    </button>
                    <div className="ml-1 min-w-0">
                        <h1 data-profile="title" className="text-lg sm:text-2xl font-semibold text-ink tracking-tight leading-tight">Ajustes</h1>
                        <p data-profile="subtitle" className="text-[11px] sm:text-xs text-ink-3 truncate">{SECTION_NAMES[activeSection] || 'Ajustes'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                <span data-profile="dirty" role="status" aria-live="polite" className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
                    {isDirty && (<><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-action-ios-solid" />Cambios sin guardar</>)}
                </span>
                <button 
                  onClick={() => {
                    const raw = currentMetrics?.rawCtl || 0;
                    const newOffset = targetCtl !== null ? (targetCtl - raw) : formData.offsetCtl;
                    onUpdate({ ...formData, offsetCtl: newOffset });
                  }} 
                  data-profile="save"
                  data-dirty={String(isDirty)}
                  className="flex items-center gap-1.5 bg-action-ios-solid hover:bg-action-solid text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-95 select-none touch-manipulation"
                >
                    <Save size={14} strokeWidth={2.5} /> <span>Guardar</span>
                </button>
                </div>
            </div>

            {/* Móvil: selector de sección en la página (antes solo estaba en el menú de la cabecera) */}
            <Segmented
                data-profile="section-tabs"
                aria-label="Secciones de Ajustes"
                className="md:hidden mb-4 overflow-x-auto"
                optionClassName="min-h-9"
                options={SECTION_TABS}
                value={activeSection}
                onChange={handleSectionChange}
            />

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* DESKTOP SIDEBAR */}
                <div data-profile="nav" className="hidden md:flex w-56 flex-shrink-0 flex-col gap-1">
                    {renderMenuButton('general', 'General', Activity)}
                    {renderMenuButton('zones', 'Zonas y Umbrales', Heart)}
                    {renderMenuButton('integrations', 'Integraciones', Link2)}
                    {renderMenuButton('security', 'Seguridad y Datos', Lock)}
                </div>

                {/* CONTENT AREA */}
                <div data-profile="content" className="flex-1 min-w-0">
                    {activeSection === 'general' && (
                        <GeneralSection formData={formData} isUploadingAvatar={isUploadingAvatar} handleAvatarUpload={handleAvatarUpload} handleChange={handleChange} targetCtl={targetCtl} setTargetCtl={setTargetCtl} />
                    )}

                    {activeSection === 'zones' && (
                        <ZonesSection formData={formData} activeTab={activeTab} setActiveTab={setActiveTab} isScanning={isScanning} pureActs={pureActs} handleAutoDetectLTHR={handleAutoDetectLTHR} handleChange={handleChange} handleZoneChange={handleZoneChange} handleZonesMode={handleZonesMode} />
                    )}

                    {activeSection === 'integrations' && (
                        <IntegrationsSection formData={formData} isSyncingIntervals={isSyncingIntervals} intervalsSyncProgress={intervalsSyncProgress} handleSyncIntervals={handleSyncIntervals} syncPreview={syncPreview} setSyncPreview={setSyncPreview} handleApplySyncedProfile={handleApplySyncedProfile} handleChange={handleChange} />
                    )}

                    {activeSection === 'security' && (
                        <SecuritySection newPassword={newPassword} setNewPassword={setNewPassword} isUpdatingPwd={isUpdatingPwd} handleUpdatePassword={handleUpdatePassword} pureActs={pureActs} stravaActs={stravaActs} syncPct={syncPct} onDeepSync={onDeepSync} isDeepSyncing={isDeepSyncing} onClearDb={onClearDb} handleDeleteAccount={handleDeleteAccount} isDeletingAccount={isDeletingAccount} />
                    )}
                </div>
            </div>
        </div>
    );
};