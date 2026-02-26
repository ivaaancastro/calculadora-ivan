import React, { useState, useEffect } from 'react';
import { Save, Activity, Heart, Zap, Database, Loader2, RefreshCw, CheckCircle2, ArrowLeft, Calculator, Lock, Key, Bike, Footprints, Weight, Link2 } from 'lucide-react';
import { supabase } from '../../supabase'; 

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

export const ProfilePage = ({ currentSettings, onUpdate, activities, isDeepSyncing, deepSyncProgress, onDeepSync, onBack }) => {
  const [formData, setFormData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  useEffect(() => {
    if (currentSettings) {
        // Aseguramos que los campos de Intervals existan en el estado
        const settingsWithIntervals = {
            ...currentSettings,
            intervalsId: currentSettings.intervalsId || '',
            intervalsKey: currentSettings.intervalsKey || ''
        };
        setFormData(settingsWithIntervals);
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
    else { alert("¡Contraseña actualizada con éxito! Tu sesión sigue activa."); setNewPassword(''); }
  };

  const handleAutoDetectLTHR = () => {
      setIsScanning(true);
      setTimeout(() => {
          let maxBikeLthr = 0; let maxRunLthr = 0;
          activities.forEach(act => {
              if (!act.streams_data?.heartrate?.data || !act.streams_data?.time?.data) return;
              const typeLower = act.type.toLowerCase();
              const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo');
              const isRun = typeLower.includes('run') || typeLower.includes('carrera');
              if (!isBike && !isRun) return;

              const hrData = act.streams_data.heartrate.data;
              const timeData = act.streams_data.time.data;
              const peak60m = getPeakByTime(hrData, timeData, 3600);
              const peak20m = getPeakByTime(hrData, timeData, 1200);
              const peak15m = getPeakByTime(hrData, timeData, 900);
              const peak10m = getPeakByTime(hrData, timeData, 600);

              let estimatedLthr = 0;
              if (isBike) {
                  estimatedLthr = Math.max(peak60m * 1.00, peak20m * 0.95, peak15m * 0.93, peak10m * 0.90);
                  if (estimatedLthr > maxBikeLthr) maxBikeLthr = estimatedLthr;
              } else if (isRun) {
                  estimatedLthr = Math.max(peak60m * 1.00, peak20m * 0.98, peak15m * 0.96, peak10m * 0.93);
                  if (estimatedLthr > maxRunLthr) maxRunLthr = estimatedLthr;
              }
          });

          if (maxBikeLthr > 100 || maxRunLthr > 100) {
              const newBikeLthr = maxBikeLthr > 100 ? Math.round(maxBikeLthr) : formData.bike.lthr;
              const newRunLthr = maxRunLthr > 100 ? Math.round(maxRunLthr) : formData.run.lthr;
              setFormData(prev => ({ ...prev, bike: { ...prev.bike, lthr: newBikeLthr }, run: { ...prev.run, lthr: newRunLthr } }));
              alert(`¡Escáner completado!\n\nNuevos umbrales detectados:\n🚴 Bici: ${newBikeLthr} ppm\n🏃 Run: ${newRunLthr} ppm\n\nRecuerda pulsar "Auto-Calcular" para actualizar las zonas.`);
          } else {
              alert("No hay suficientes datos largos para hacer un cálculo fiable.");
          }
          setIsScanning(false);
      }, 500);
  };

  const handleChange = (e, sport = null, field = null) => {
    const value = e.target.value;
    if (sport && field) setFormData(prev => ({ ...prev, [sport]: { ...prev[sport], [field]: value } }));
    else setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleZoneChange = (e, sport, index, field) => {
      const val = Number(e.target.value);
      setFormData(prev => {
          const newZones = [...prev[sport].zones];
          newZones[index] = { ...newZones[index], [field]: val };
          return { ...prev, [sport]: { ...prev[sport], zones: newZones } };
      });
  };

  const calculateZonesBasedOnLTHR = (sport) => {
      const lthr = formData[sport].lthr;
      if (!lthr || lthr < 100) return alert("Configura un Umbral Láctico válido primero.");
      const maxHr = formData[sport].max || 200;
      const newZones = [
          { min: 0, max: Math.round(lthr * 0.81) - 1 },                    
          { min: Math.round(lthr * 0.81), max: Math.round(lthr * 0.89) - 1 }, 
          { min: Math.round(lthr * 0.89), max: Math.round(lthr * 0.93) - 1 }, 
          { min: Math.round(lthr * 0.93), max: Math.round(lthr * 0.99) - 1 }, 
          { min: Math.round(lthr * 0.99), max: maxHr }                        
      ];
      setFormData(prev => ({ ...prev, [sport]: { ...prev[sport], zones: newZones } }));
  };

  const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base Aeróbica', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2 Max'];
  
  const PanelHeader = ({ icon: Icon, title, subtitle }) => (
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
          <div>
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> {title}
              </h4>
              {subtitle && <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
      </div>
  );

  return (
    <div className="animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shadow-sm">
                  <ArrowLeft size={16} />
              </button>
              <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase">Laboratorio & Perfil</h1>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Ajustes Biométricos y Sistema</p>
              </div>
          </div>
          <button onClick={() => onUpdate(formData)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
              <Save size={14} /> Guardar
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: Sistema y Motor (4/12) */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* INTEGRACIONES (NUEVO) */}
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-lg p-5 shadow-sm">
                  <PanelHeader icon={Link2} title="Integraciones de Salud" subtitle="Intervals.icu (Sueño y VFC)" />
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                      Conecta la API de Intervals para extraer tus métricas de salud diarias de Garmin o Apple Watch y generar tu gráfico de Readiness.
                  </p>
                  <div className="space-y-3">
                      <div>
                          <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1 block">Athlete ID</label>
                          <input type="text" name="intervalsId" value={formData.intervalsId} onChange={handleChange} placeholder="Ej: i12345" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:border-indigo-500 outline-none transition-colors"/>
                      </div>
                      <div>
                          <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1 block">API Key</label>
                          <input type="password" name="intervalsKey" value={formData.intervalsKey} onChange={handleChange} placeholder="Tu API Key..." className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:border-indigo-500 outline-none transition-colors"/>
                      </div>
                  </div>
              </div>

              {/* SEGURIDAD */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                  <PanelHeader icon={Lock} title="Seguridad" subtitle="Gestión de credenciales" />
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                      <div className="relative">
                          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña..." className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-xs font-mono text-slate-800 dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors" />
                      </div>
                      <button type="submit" disabled={isUpdatingPwd || !newPassword} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                          {isUpdatingPwd ? <Loader2 size={12} className="animate-spin"/> : 'Actualizar Clave'}
                      </button>
                  </form>
              </div>

              {/* INTEGRIDAD DE DATOS (DEEP SYNC) */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                  <PanelHeader icon={Database} title="Integridad de Datos" subtitle="Estado de la base de datos local" />
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Nivel de Precisión</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">{pureActs.length} / {stravaActs.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                      <div className={`h-full transition-all duration-500 ${syncPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${syncPct}%` }}></div>
                  </div>
                  <button onClick={onDeepSync} disabled={isDeepSyncing || syncPct === 100} className={`w-full py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${syncPct === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200'}`}>
                      {isDeepSyncing ? <><Loader2 size={12} className="animate-spin"/> Procesando...</> : syncPct === 100 ? <><CheckCircle2 size={12}/> 100% Sincronizado</> : 'Forzar Sincronización'}
                  </button>
              </div>
          </div>

          {/* COLUMNA DERECHA: Fisiología (8/12) */}
          <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">Peso Corporal (kg)</label>
                          <div className="relative">
                              <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                              <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm font-mono text-slate-800 dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">Frecuencia Cardíaca Reposo</label>
                          <div className="relative">
                              <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 dark:text-rose-500" />
                              <input type="number" name="fcReposo" value={formData.fcReposo} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-sm font-mono text-slate-800 dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Zap size={14} className="text-amber-500"/> Zonas y Umbrales Lácticos</h3>
                      <button onClick={handleAutoDetectLTHR} disabled={isScanning || pureActs.length === 0} className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded text-[9px] font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          {isScanning ? <><Loader2 size={10} className="animate-spin"/> Analizando...</> : <><RefreshCw size={10}/> Auto-Detectar</>}
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* RUNNING */}
                      <div className="p-4 rounded-xl border border-orange-200/50 dark:border-orange-900/20 bg-orange-50/30 dark:bg-orange-900/5">
                          <h3 className="text-[11px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Footprints size={14}/> Running</h3>
                          <div className="grid grid-cols-2 gap-4 mb-5">
                              <div>
                                  <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC Máxima</label>
                                  <input type="number" value={formData.run.max} onChange={(e) => handleChange(e, 'run', 'max')} className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-orange-500 outline-none transition-colors"/>
                              </div>
                              <div>
                                  <label className="text-[9px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest block mb-1">Umbral (LTHR)</label>
                                  <input type="number" value={formData.run.lthr} onChange={(e) => handleChange(e, 'run', 'lthr')} className="w-full bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/30 rounded px-3 py-1.5 text-sm font-mono text-orange-700 dark:text-orange-400 focus:border-orange-500 outline-none transition-colors"/>
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Zonas Cardíacas</label>
                                  <button onClick={() => calculateZonesBasedOnLTHR('run')} className="text-[9px] font-bold uppercase text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 px-2 py-0.5 rounded transition-colors">
                                      Auto-Calcular
                                  </button>
                              </div>
                              <div className="space-y-1.5">
                                  {formData.run.zones.map((zone, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                          <span className="w-24 text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest">{ZONE_LABELS[i]}</span>
                                          <input type="number" value={zone.min} onChange={(e) => handleZoneChange(e, 'run', i, 'min')} className="w-14 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-orange-500" />
                                          <span className="text-slate-400 dark:text-zinc-600 font-bold">-</span>
                                          <input type="number" value={zone.max} onChange={(e) => handleZoneChange(e, 'run', i, 'max')} className="w-14 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-orange-500" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* CICLISMO */}
                      <div className="p-4 rounded-xl border border-blue-200/50 dark:border-blue-900/20 bg-blue-50/30 dark:bg-blue-900/5">
                          <h3 className="text-[11px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Bike size={14}/> Ciclismo</h3>
                          <div className="grid grid-cols-2 gap-4 mb-5">
                              <div>
                                  <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">FC Máxima</label>
                                  <input type="number" value={formData.bike.max} onChange={(e) => handleChange(e, 'bike', 'max')} className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                              </div>
                              <div>
                                  <label className="text-[9px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest block mb-1">Umbral (LTHR)</label>
                                  <input type="number" value={formData.bike.lthr} onChange={(e) => handleChange(e, 'bike', 'lthr')} className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/30 rounded px-3 py-1.5 text-sm font-mono text-blue-700 dark:text-blue-400 focus:border-blue-500 outline-none transition-colors"/>
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <label className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Zonas Cardíacas</label>
                                  <button onClick={() => calculateZonesBasedOnLTHR('bike')} className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2 py-0.5 rounded transition-colors">
                                      Auto-Calcular
                                  </button>
                              </div>
                              <div className="space-y-1.5">
                                  {formData.bike.zones.map((zone, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                          <span className="w-24 text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest">{ZONE_LABELS[i]}</span>
                                          <input type="number" value={zone.min} onChange={(e) => handleZoneChange(e, 'bike', i, 'min')} className="w-14 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
                                          <span className="text-slate-400 dark:text-zinc-600 font-bold">-</span>
                                          <input type="number" value={zone.max} onChange={(e) => handleZoneChange(e, 'bike', i, 'max')} className="w-14 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-1 text-[10px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};