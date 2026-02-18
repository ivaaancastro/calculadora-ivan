import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Activity, Heart, Info, RefreshCw, Zap, Flame, Wind } from 'lucide-react';
import { supabase } from '../../supabase';

// Nombres y colores para las 5 zonas fisiológicas
const ZONE_LABELS = [
    { name: 'Recuperación', desc: 'Regeneración', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { name: 'Base Aeróbica', desc: 'Fondo / Quema grasa', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { name: 'Tempo', desc: 'Ritmo Medio / Zona Gris', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
    { name: 'Umbral', desc: 'Threshold / FTP', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
    { name: 'VO2 Max', desc: 'Capacidad Anaeróbica', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' }
];

export const ProfilePage = ({ currentSettings, onUpdate, onAnalyze, onBack }) => {
  const [formData, setFormData] = useState(currentSettings);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) setFormData(currentSettings);
  }, [currentSettings]);

  if (!formData) return null;

  const handleChange = (section, field, value) => {
    if (section) {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleZoneChange = (sport, index, field, value) => {
      const newZones = [...formData[sport].zones];
      newZones[index] = { ...newZones[index], [field]: Number(value) };
      setFormData(prev => ({ ...prev, [sport]: { ...prev[sport], zones: newZones } }));
  };

  const handleAnalyze = (sport) => {
      const result = onAnalyze(sport);
      if (result) {
          if (window.confirm(`Detectado LTHR: ${result.lthr} ppm.\n\n${result.msg}\n\n¿Quieres aplicar este umbral?`)) {
              handleChange(sport, 'lthr', result.lthr);
          }
      } else {
          alert("No tienes configurada la FC Máxima ni historial de entrenos para calcularlo.");
      }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.from('profiles').update({
            gender: formData.gender,
            weight: formData.weight,
            fc_rest: formData.fcReposo,
            zones_mode: formData.zonesMode,
            run_fc_max: formData.run.max,
            run_lthr: formData.run.lthr,
            run_zones: formData.run.zones,
            bike_fc_max: formData.bike.max,
            bike_lthr: formData.bike.lthr,
            bike_zones: formData.bike.zones
        }).eq('id', 1);

        if (error) throw error;
        await onUpdate();
        
        // Efecto visual de guardado con éxito
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
        alert("Error guardando perfil: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
      
      {/* NAVEGACIÓN SUPERIOR FIJA */}
      <div className="sticky top-[60px] md:top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md py-4 mb-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition font-bold text-sm bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
          >
              <ArrowLeft size={16} /> Volver
          </button>
          
          <button 
              onClick={handleSave} 
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all shadow-md ${
                  saveSuccess 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
          >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16}/>}
              {saveSuccess ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
      </div>

      {/* CABECERA */}
      <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <User size={24} />
              </div>
              Fisiología del Atleta
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Estos datos configuran el motor matemático de la aplicación. Tus métricas de carga (TSS), estrés y forma dependen directamente de la precisión de tus umbrales (LTHR) y zonas.
          </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: DATOS BÁSICOS (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                      <Activity size={14}/> Datos Base
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Género</label>
                          <select 
                              value={formData.gender} onChange={(e) => handleChange(null, 'gender', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          >
                              <option value="male">Hombre</option>
                              <option value="female">Mujer</option>
                          </select>
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Peso Corporal (kg)</label>
                          <input type="number" value={formData.weight} onChange={(e) => handleChange(null, 'weight', e.target.value)}
                               className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex justify-between">
                              <span>FC Reposo</span>
                              <span className="text-slate-400 lowercase font-normal">ppm</span>
                          </label>
                          <div className="relative">
                              <Heart size={16} className="absolute left-3.5 top-3.5 text-rose-500/50"/>
                              <input type="number" value={formData.fcReposo} onChange={(e) => handleChange(null, 'fcReposo', e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex gap-3">
                      <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-300/80 leading-relaxed">
                          La Frecuencia Cardíaca de reposo se utiliza para calcular el nivel de estrés basal y afinar las métricas de recuperación.
                      </p>
                  </div>
              </div>

          </div>

          {/* COLUMNA DERECHA: ZONAS POR DEPORTE (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
              
              {/* Iteramos sobre Carrera y Bici */}
              {[
                  { id: 'run', title: 'Zonas de Carrera', icon: Wind, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20' },
                  { id: 'bike', title: 'Zonas de Ciclismo', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' }
              ].map((sport) => (
                  <div key={sport.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      
                      {/* Cabecera Tarjeta Deporte */}
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${sport.bg} ${sport.color}`}><sport.icon size={16}/></div>
                              {sport.title}
                          </h3>
                          <button 
                              onClick={() => handleAnalyze(sport.id)}
                              className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm px-3 py-1.5 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1.5"
                          >
                              <RefreshCw size={12}/> Calcular Umbral Láctico Auto
                          </button>
                      </div>

                      <div className="p-5 md:p-6">
                          {/* FC Max y LTHR */}
                          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Frecuencia Máxima (ppm)</label>
                                   <input type="number" value={formData[sport.id].max} onChange={(e) => handleChange(sport.id, 'max', e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-black text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                  />
                              </div>
                              <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex gap-1 items-center">
                                      Umbral (LTHR) <Flame size={12} className="text-orange-500"/>
                                   </label>
                                   <input type="number" value={formData[sport.id].lthr} onChange={(e) => handleChange(sport.id, 'lthr', e.target.value)}
                                      className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 text-sm font-black text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                                  />
                              </div>
                          </div>

                          {/* Las 5 Zonas Desglosadas */}
                          <div className="space-y-2">
                              <div className="flex px-2 pb-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                  <div className="w-10">Zona</div>
                                  <div className="flex-1">Propósito Fisiológico</div>
                                  <div className="w-32 text-center">Rango (ppm)</div>
                              </div>
                              
                              {formData[sport.id].zones.map((zone, i) => (
                                  <div key={i} className="flex items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group">
                                      
                                      {/* Badge Z1-Z5 */}
                                      <div className="w-10">
                                          <span className={`text-[10px] font-black px-2 py-1 rounded-md ${ZONE_LABELS[i].color}`}>
                                              Z{i+1}
                                          </span>
                                      </div>
                                      
                                      {/* Nombre de la zona */}
                                      <div className="flex-1 flex flex-col justify-center">
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{ZONE_LABELS[i].name}</span>
                                          <span className="text-[9px] font-medium text-slate-400 mt-0.5">{ZONE_LABELS[i].desc}</span>
                                      </div>
                                      
                                      {/* Inputs Min/Max */}
                                      <div className="w-32 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                          <input type="number" value={zone.min} onChange={(e) => handleZoneChange(sport.id, i, 'min', e.target.value)}
                                              className="w-12 bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 rounded-md p-1.5 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 outline-none text-center"
                                          />
                                          <span className="text-slate-300 dark:text-slate-600">-</span>
                                          <input type="number" value={zone.max} onChange={(e) => handleZoneChange(sport.id, i, 'max', e.target.value)}
                                              className="w-12 bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 rounded-md p-1.5 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 outline-none text-center"
                                          />
                                      </div>
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