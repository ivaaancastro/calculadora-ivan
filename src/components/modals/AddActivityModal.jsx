import React, { useState } from 'react';
import { X, Save, Activity, Flame, Clock, Heart, Calendar } from 'lucide-react';
import { supabase } from '../../supabase';

const AddActivityModal = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Hoy por defecto
    type: 'Carrera',
    duration: '',
    hr_avg: '',
    calories: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validación básica
    if (!formData.duration || formData.duration <= 0) {
      alert("La duración debe ser mayor a 0");
      setLoading(false);
      return;
    }

    // Preparar objeto para Supabase
    const newActivity = {
      date: new Date(formData.date).toISOString(),
      type: formData.type,
      duration: parseInt(formData.duration),
      hr_avg: formData.hr_avg ? parseInt(formData.hr_avg) : 0,
      calories: formData.calories ? parseInt(formData.calories) : 0
    };

    // Guardar en Base de Datos
    const { error } = await supabase.from('activities').insert([newActivity]);

    setLoading(false);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      onSave(); // Recargar datos en App
      onClose(); // Cerrar modal
      // Resetear form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Carrera',
        duration: '',
        hr_avg: '',
        calories: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Activity size={16}/></div>
            Registrar Actividad
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Fila 1: Fecha y Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Deporte</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              >
                <option>Carrera</option>
                <option>Ciclismo</option>
                <option>Fuerza</option>
                <option>Caminata</option>
                <option>Natación</option>
                <option>Ciclismo en sala</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Duración */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Duración (minutos)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 text-slate-400" size={16}/>
              <input 
                type="number" 
                placeholder="Ej: 45"
                required
                min="1"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Fila 3: FC y Calorías */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">FC Media (Opcional)</label>
              <div className="relative">
                <Heart className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                  type="number" 
                  placeholder="bpm"
                  value={formData.hr_avg}
                  onChange={e => setFormData({...formData, hr_avg: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Calorías (Opcional)</label>
              <div className="relative">
                <Flame className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                  type="number" 
                  placeholder="kcal"
                  value={formData.calories}
                  onChange={e => setFormData({...formData, calories: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <span className="animate-spin">⏳</span> : <Save size={18}/>}
            {loading ? 'Guardando...' : 'Guardar Entrenamiento'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddActivityModal;