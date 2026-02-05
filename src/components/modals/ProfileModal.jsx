import React, { useState, useEffect } from 'react';
import { X, Save, User, Activity, Heart } from 'lucide-react';
import { supabase } from '../../supabase';

const ProfileModal = ({ isOpen, onClose, onUpdate, currentSettings, onAnalyze }) => {
  const [formData, setFormData] = useState(currentSettings);
  const [loading, setLoading] = useState(false);

  // Sincronizar estado cuando se abre
  useEffect(() => {
    if (isOpen && currentSettings) {
        setFormData(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleChange = (section, field, value) => {
    if (section) {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    } else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleZoneChange = (sport, index, field, value) => {
      const newZones = [...formData[sport].zones];
      newZones[index] = { ...newZones[index], [field]: Number(value) };
      setFormData(prev => ({
          ...prev,
          [sport]: { ...prev[sport], zones: newZones }
      }));
  };

  const handleAnalyze = (sport) => {
      const result = onAnalyze(sport);
      if (result) {
          if (window.confirm(`Detectado LTHR: ${result.lthr} ppm basado en tu mejor esfuerzo de 20-60min. ¿Aplicar?`)) {
              handleChange(sport, 'lthr', result.lthr);
          }
      } else {
          alert("No hay suficientes datos recientes de máximo esfuerzo para calcular tu LTHR.");
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
        onClose();
    } catch (err) {
        alert("Error guardando perfil: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 flex flex-col transition-colors duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <User size={20}/>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Perfil de Atleta</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X size={24} />
            </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-8">
            
            {/* DATOS BÁSICOS */}
            <section className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                    Fisiología Básica
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Género</label>
                        <select 
                            value={formData.gender} onChange={(e) => handleChange(null, 'gender', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="male">Hombre</option>
                            <option value="female">Mujer</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Peso (kg)</label>
                        <input type="number" value={formData.weight} onChange={(e) => handleChange(null, 'weight', e.target.value)}
                             className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">FC Reposo</label>
                        <div className="relative">
                            <Heart size={14} className="absolute left-3 top-3 text-rose-500 animate-pulse"/>
                            <input type="number" value={formData.fcReposo} onChange={(e) => handleChange(null, 'fcReposo', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 pl-9 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CONFIG DE ZONAS (RUN & BIKE) */}
            {['run', 'bike'].map((sport) => (
                <section key={sport} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14}/> Zonas {sport === 'run' ? 'Carrera' : 'Ciclismo'}
                        </h4>
                        <button 
                            onClick={() => handleAnalyze(sport)}
                            className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                        >
                            🪄 Calcular LTHR Auto
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">FC Máxima</label>
                             <input type="number" value={formData[sport].max} onChange={(e) => handleChange(sport, 'max', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Umbral Láctico (LTHR)</label>
                             <input type="number" value={formData[sport].lthr} onChange={(e) => handleChange(sport, 'lthr', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-2.5 text-sm font-bold text-slate-700 dark:text-white border-l-4 border-l-emerald-500 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Configuración Manual de Zonas (ppm)</p>
                        {formData[sport].zones.map((zone, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-6">Z{i+1}</span>
                                <input type="number" value={zone.min} onChange={(e) => handleZoneChange(sport, i, 'min', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none text-center"
                                />
                                <span className="text-slate-300">-</span>
                                <input type="number" value={zone.max} onChange={(e) => handleZoneChange(sport, i, 'max', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none text-center"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            ))}

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition">
                Cancelar
            </button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-blue-900/20 hover:scale-105 active:scale-95 transition flex items-center gap-2"
            >
                {loading ? 'Guardando...' : <><Save size={18}/> Guardar Cambios</>}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;