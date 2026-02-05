import React, { useState, useEffect } from 'react';
import { X, Save, User, Heart, Zap, Bike, Footprints, Info, Calculator, Activity, Settings2 } from 'lucide-react';
import { supabase } from '../../supabase';

const ProfileModal = ({ isOpen, onClose, onUpdate, currentSettings, onAnalyze }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('run');
  const [calcMethod, setCalcMethod] = useState(null); // 'history' | 'formula' | null
  
  const [formData, setFormData] = useState({
    gender: 'male',
    fc_rest: 50,
    weight: 70,
    zones_mode: 'manual',
    run_fc_max: 200, run_lthr: 175,
    bike_fc_max: 190, bike_lthr: 165,
    run_zones: Array(5).fill({ min: 0, max: 0 }),
    bike_zones: Array(5).fill({ min: 0, max: 0 })
  });

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        gender: currentSettings.gender || 'male',
        fc_rest: currentSettings.fcReposo || 50,
        weight: currentSettings.weight || 70,
        zones_mode: currentSettings.zonesMode || 'manual',
        run_fc_max: currentSettings.run?.max || 200,
        run_lthr: currentSettings.run?.lthr || 175,
        bike_fc_max: currentSettings.bike?.max || 190,
        bike_lthr: currentSettings.bike?.lthr || 165,
        run_zones: currentSettings.run?.zones || [
            { min: 0, max: 135 }, { min: 136, max: 150 }, { min: 151, max: 165 }, { min: 166, max: 178 }, { min: 179, max: 200 }
        ],
        bike_zones: currentSettings.bike?.zones || [
            { min: 0, max: 130 }, { min: 131, max: 145 }, { min: 146, max: 160 }, { min: 161, max: 173 }, { min: 174, max: 190 }
        ],
      });
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  // --- MÉTODOS DE CÁLCULO ---

  // 1. Aplicar Zonas (Común para todos)
  const applyZones = (lthr, maxFc) => {
    // Zonas de Joe Friel basadas en LTHR
    const newZones = [
        { min: 0, max: Math.round(lthr * 0.85) },      // Z1 Recuperación
        { min: Math.round(lthr * 0.85) + 1, max: Math.round(lthr * 0.89) }, // Z2 Aeróbico
        { min: Math.round(lthr * 0.89) + 1, max: Math.round(lthr * 0.94) }, // Z3 Tempo
        { min: Math.round(lthr * 0.94) + 1, max: Math.round(lthr * 0.99) }, // Z4 Umbral
        { min: Math.round(lthr * 0.99) + 1, max: maxFc } // Z5 VO2 Max (Hasta FC Max)
    ];

    const keyLthr = activeTab === 'run' ? 'run_lthr' : 'bike_lthr';
    const keyZones = activeTab === 'run' ? 'run_zones' : 'bike_zones';
    
    setFormData(prev => ({ 
        ...prev, 
        [keyLthr]: lthr, 
        [keyZones]: newZones 
    }));
    setCalcMethod(null); // Limpiar selección
  };

  // 2. Cálculo por Historial (Detectado)
  const handleHistoryCalc = () => {
    const result = onAnalyze(activeTab);
    if (result) {
        if (window.confirm(`🔎 Análisis de Datos Reales:\n\nBasado en tu mejor esfuerzo de ${result.basedOnDuration}min a ${result.basedOnHr}ppm el día ${new Date(result.basedOnDate).toLocaleDateString()}.\n\nTu LTHR estimado es: ${result.lthr} bpm.\n\n¿Aplicar este umbral?`)) {
            const max = activeTab === 'run' ? formData.run_fc_max : formData.bike_fc_max;
            applyZones(result.lthr, max);
        }
    } else {
        alert("⚠️ No hemos encontrado actividades de alta intensidad (20-60min) suficientes en tu historial para calcular esto automáticamente.");
    }
  };

  // 3. Cálculo por Fórmula (Karvonen)
  const handleFormulaCalc = () => {
    const max = Number(activeTab === 'run' ? formData.run_fc_max : formData.bike_fc_max);
    const rest = Number(formData.fc_rest);

    if (!max || !rest) {
        alert("Para usar la fórmula científica necesitamos tu FC Máxima y FC Reposo.");
        return;
    }

    // Fórmula Karvonen: El Umbral Anaeróbico suele estar al ~90% de la Reserva Cardíaca
    // LTHR = ((Max - Reposo) * 0.90) + Reposo
    const reserve = max - rest;
    const estimatedLthr = Math.round((reserve * 0.90) + rest);

    if (window.confirm(`📐 Cálculo Teórico (Karvonen):\n\nUsando tu FC Max (${max}) y Reposo (${rest}).\nEstimamos que tu Umbral está al 90% de tu reserva cardíaca.\n\nLTHR Estimado: ${estimatedLthr} bpm.\n\n¿Aplicar?`)) {
        applyZones(estimatedLthr, max);
    }
  };

  const handleZoneChange = (i, f, v) => {
    const key = activeTab === 'run' ? 'run_zones' : 'bike_zones';
    const newZones = [...formData[key]];
    newZones[i] = { ...newZones[i], [f]: parseInt(v) || 0 };
    setFormData({ ...formData, [key]: newZones });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('profiles').upsert({
        id: 1, 
        gender: formData.gender, fc_rest: formData.fc_rest, weight: formData.weight, zones_mode: 'manual',
        run_fc_max: formData.run_fc_max, run_lthr: formData.run_lthr, run_zones: formData.run_zones,
        bike_fc_max: formData.bike_fc_max, bike_lthr: formData.bike_lthr, bike_zones: formData.bike_zones
    });
    setLoading(false); await onUpdate(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><User size={16}/></div>
            Configuración de Atleta
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* DATOS BIOMÉTRICOS */}
          <div className="grid grid-cols-3 gap-4">
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Género</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                </select>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">FC Reposo</label>
                <input type="number" required value={formData.fc_rest} onChange={e => setFormData({...formData, fc_rest: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"/>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Peso (kg)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"/>
             </div>
          </div>

          <hr className="border-slate-100"/>

          {/* SELECTOR DEPORTE */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setActiveTab('run')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'run' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Footprints size={16}/> Carrera
            </button>
            <button type="button" onClick={() => setActiveTab('bike')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'bike' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <Bike size={16}/> Ciclismo
            </button>
          </div>

          {/* ZONA DE CÁLCULO INTELIGENTE */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-4">
             <div className="flex justify-between items-start">
                 <div className="flex items-start gap-2">
                    <Settings2 size={16} className="text-blue-500 mt-0.5"/>
                    <div>
                        <h4 className="text-xs font-bold text-blue-800 uppercase">Calculadora de Umbral</h4>
                        <p className="text-[10px] text-blue-600 leading-tight">Elige cómo quieres establecer tus zonas.</p>
                    </div>
                 </div>
             </div>

             {/* Botonera de Métodos */}
             <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleHistoryCalc} className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition group">
                    <Activity size={18} className="text-blue-500 group-hover:scale-110 transition"/>
                    <span className="text-[10px] font-bold text-slate-600">Detectar (Historial)</span>
                </button>
                <button type="button" onClick={handleFormulaCalc} className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition group">
                    <Calculator size={18} className="text-purple-500 group-hover:scale-110 transition"/>
                    <span className="text-[10px] font-bold text-slate-600">Fórmula (Teórico)</span>
                </button>
             </div>

             {/* Inputs Críticos */}
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">FC Máxima (Obligatorio)</label>
                    <div className="relative mt-1">
                        <Heart className="absolute left-3 top-2.5 text-rose-500" size={16}/>
                        <input 
                            type="number" required
                            value={activeTab === 'run' ? formData.run_fc_max : formData.bike_fc_max} 
                            onChange={e => setFormData({...formData, [activeTab === 'run' ? 'run_fc_max' : 'bike_fc_max']: e.target.value})} 
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Umbral LTHR</label>
                    <div className="relative mt-1">
                        <Zap className="absolute left-3 top-2.5 text-amber-500" size={16}/>
                        <input 
                            type="number" required
                            value={activeTab === 'run' ? formData.run_lthr : formData.bike_lthr} 
                            onChange={e => setFormData({...formData, [activeTab === 'run' ? 'run_lthr' : 'bike_lthr']: e.target.value})} 
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </div>
             </div>
          </div>

          {/* RANGOS DE ZONAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rangos de Zonas (Personalizables)</p>
                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Manual</span>
            </div>
            {(activeTab === 'run' ? formData.run_zones : formData.bike_zones).map((zone, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className={`w-6 text-xs font-bold ${['text-slate-400','text-blue-500','text-emerald-500','text-amber-500','text-rose-500'][i]}`}>Z{i+1}</span>
                    <input type="number" value={zone.min} onChange={(e) => handleZoneChange(i, 'min', e.target.value)} className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center outline-none focus:bg-blue-50 focus:border-blue-300"/>
                    <span className="text-slate-300">-</span>
                    <input type="number" value={zone.max} onChange={(e) => handleZoneChange(i, 'max', e.target.value)} className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center outline-none focus:bg-blue-50 focus:border-blue-300"/>
                    <span className="text-[9px] text-slate-400 ml-auto uppercase tracking-wide hidden sm:inline">
                        {['Recuperación', 'Resistencia', 'Tempo', 'Umbral', 'VO2 Max'][i]}
                    </span>
                </div>
            ))}
          </div>

        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
                {loading ? 'Guardando...' : <><Save size={18}/> Guardar Configuración</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;