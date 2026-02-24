import React, { useState, useEffect } from 'react';
import { Save, Activity, Heart, Zap, User, Database, Loader2, RefreshCw, CheckCircle2, ArrowLeft, Calculator } from 'lucide-react';

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

  useEffect(() => {
    if (currentSettings) setFormData(currentSettings);
  }, [currentSettings]);

  if (!formData) return null;

  const stravaActs = activities?.filter(a => a.strava_id) || [];
  const pureActs = stravaActs.filter(a => a.streams_data);
  const syncPct = stravaActs.length > 0 ? Math.round((pureActs.length / stravaActs.length) * 100) : 0;

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
              alert(`¡Escáner completado!\n\nNuevos umbrales detectados:\n🚴 Bici: ${newBikeLthr} ppm\n🏃 Run: ${newRunLthr} ppm\n\nRecuerda pulsar "Auto-Calcular Zonas" en ambos deportes para actualizar los rangos.`);
          } else {
              alert("No hay suficientes datos de más de 10 minutos para hacer un cálculo fiable.");
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
    <div className="animate-in fade-in duration-300 pb-12 max-w-5xl mx-auto">
      
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div>
              <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition font-bold mb-4 px-3 py-1.5 text-[10px] uppercase tracking-wider rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-max">
                  <ArrowLeft size={14} /> Volver al Dashboard
              </button>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase flex items-center gap-2">
                  Perfil Fisiológico
              </h1>
          </div>
          <button onClick={() => onUpdate(formData)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-colors">
              <Save size={14} /> Guardar
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-4">
              
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4">
                  <PanelHeader icon={Heart} title="Datos Biométricos" subtitle="Base para cálculos calóricos" />
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Peso (kg)</label>
                          <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-3 py-1.5 mt-1 text-xs font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Pulso Reposo (ppm)</label>
                          <input type="number" name="fcReposo" value={formData.fcReposo} onChange={handleChange} className="w-full bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-3 py-1.5 mt-1 text-xs font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4">
                  <PanelHeader icon={Zap} title="Auto-Detectar Umbral" subtitle="Escaneo histórico de Streams (LTHR)" />
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">Busca bloques de esfuerzo máximo (10m a 60m) en todo tu historial y aplica los factores de Friel/Coggan.</p>
                  <button onClick={handleAutoDetectLTHR} disabled={isScanning || pureActs.length === 0} className="w-full py-2 rounded font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 text-slate-800 dark:text-zinc-200">
                      {isScanning ? <><Loader2 size={12} className="animate-spin"/> Analizando...</> : <><RefreshCw size={12}/> Ejecutar Escáner</>}
                  </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4">
                  <PanelHeader icon={Database} title="Integridad de Datos" subtitle="Estado de telemetría local" />
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Sincronización</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">{pureActs.length} / {stravaActs.length}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-none overflow-hidden mb-4">
                      <div className="h-full bg-blue-500" style={{ width: `${syncPct}%` }}></div>
                  </div>
                  <button onClick={onDeepSync} disabled={isDeepSyncing || syncPct === 100} className={`w-full py-2 rounded font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${syncPct === 100 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-slate-800 text-white dark:bg-zinc-800 dark:text-zinc-200 hover:bg-slate-700 dark:hover:bg-zinc-700'}`}>
                      {isDeepSyncing ? <><Loader2 size={12} className="animate-spin"/> Procesando...</> : syncPct === 100 ? <><CheckCircle2 size={12}/> 100% Sincronizado</> : 'Deep Sync'}
                  </button>
              </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
              {['bike', 'run'].map((sport) => (
                  <div key={sport} className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4">
                      <PanelHeader icon={Activity} title={`Fisiología - ${sport === 'bike' ? 'Ciclismo' : 'Carrera'}`} subtitle="Definición de rangos de intensidad y umbrales" />
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Pulso Máximo (FCMáx)</label>
                              <input type="number" value={formData[sport].max} onChange={(e) => handleChange(e, sport, 'max')} className="w-full bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-3 py-2 text-sm font-mono dark:text-zinc-200 focus:border-blue-500 outline-none transition-colors"/>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest block mb-1">Umbral Láctico (LTHR)</label>
                              <input type="number" value={formData[sport].lthr} onChange={(e) => handleChange(e, sport, 'lthr')} className="w-full bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded px-3 py-2 text-sm font-mono text-blue-700 dark:text-blue-400 focus:border-blue-500 outline-none transition-colors"/>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-3">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Zonas de Entrenamiento (ppm)</label>
                              <button onClick={() => calculateZonesBasedOnLTHR(sport)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                  <Calculator size={10}/> Auto-Calcular (Friel)
                              </button>
                          </div>
                          <div className="space-y-1.5">
                              {formData[sport].zones.map((zone, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                      <span className="w-32 text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">{ZONE_LABELS[i]}</span>
                                      <input type="number" value={zone.min} onChange={(e) => handleZoneChange(e, sport, i, 'min')} className="w-16 bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500 transition-colors" />
                                      <span className="text-slate-400 dark:text-zinc-600 font-bold">-</span>
                                      <input type="number" value={zone.max} onChange={(e) => handleZoneChange(e, sport, i, 'max')} className="w-16 bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-center dark:text-zinc-200 outline-none focus:border-blue-500 transition-colors" />
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};