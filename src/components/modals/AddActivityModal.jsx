import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

const AddActivityModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Carrera', duration: '', hr_avg: '', distance: '', elevation_gain: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const duration = Number(formData.duration);
            const distance = Number(formData.distance) || 0;
            const hrAvg = Number(formData.hr_avg) || 0;
            const elevationGain = Number(formData.elevation_gain) || 0;

            if (duration <= 0) throw new Error('La duración debe ser mayor que 0');
            if (distance < 0 || hrAvg < 0 || elevationGain < 0) throw new Error('No se permiten valores negativos');

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error('No hay sesión activa');

            const { error } = await supabase.from('activities').insert([{
                user_id: userId,
                date: formData.date,
                type: formData.type,
                duration: duration,
                hr_avg: hrAvg,
                distance: distance, // Metros
                elevation_gain: elevationGain,
                calories: 0 // Simplificado
            }]);
            if (error) throw error;
            onSave();
            onClose();
            toast.success("Actividad generada exitosamente.");
            setFormData({ date: new Date().toISOString().split('T')[0], type: 'Carrera', duration: '', hr_avg: '', distance: '', elevation_gain: '' });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 transform transition-all">

                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-500" size={20} /> Añadir Manual
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha</label>
                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Deporte</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option>Carrera</option><option>Ciclismo</option><option>Fuerza</option><option>Caminata</option><option>Natación</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="duration-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Duración (min)</label>
                            <input id="duration-input" type="number" min="0.1" step="any" required placeholder="0" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pulso Medio</label>
                            <input type="number" min="0" placeholder="Opcional" value={formData.hr_avg} onChange={e => setFormData({ ...formData, hr_avg: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Distancia (m)</label>
                            <input type="number" min="0" placeholder="Ej: 5000" value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Desnivel (m)</label>
                            <input type="number" min="0" placeholder="Ej: 100" value={formData.elevation_gain} onChange={e => setFormData({ ...formData, elevation_gain: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 mt-4">
                        {loading ? 'Guardando...' : <><Save size={18} /> Guardar Actividad</>}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AddActivityModal;