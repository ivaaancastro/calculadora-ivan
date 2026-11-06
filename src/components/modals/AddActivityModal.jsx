import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';
import { Input } from '../ui/Input';

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overscroll-contain animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md border sm:border border-slate-200/80 dark:border-zinc-800 transform transition-all max-h-[92dvh] flex flex-col overflow-hidden pb-safe">

                {/* iOS drag handle */}
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

                <div className="flex justify-between items-center px-5 py-3 sm:p-5 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#1f2de6]/10 text-[#1f2de6] flex items-center justify-center shadow-sm">
                            <Activity size={18} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">Añadir actividad</h3>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation" title="Cerrar">
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar touch-scroll flex-1">
                    <SectionHeader title="Registro de actividad" subtitle="Completa los datos de tu sesión de entrenamiento" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Fecha</label>
                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Deporte</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none"
                            >
                                <option>Carrera</option><option>Ciclismo</option><option>Fuerza</option><option>Caminata</option><option>Natación</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Duración (min)</label>
                            <input id="duration-input" type="number" inputMode="decimal" min="0.1" step="any" required placeholder="0" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Pulso Medio</label>
                            <input type="number" inputMode="numeric" min="0" placeholder="Opcional" value={formData.hr_avg} onChange={e => setFormData({ ...formData, hr_avg: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Distancia (m)</label>
                            <input type="number" inputMode="decimal" min="0" placeholder="Ej: 5000" value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Desnivel (m)</label>
                            <input type="number" inputMode="decimal" min="0" placeholder="Ej: 100" value={formData.elevation_gain} onChange={e => setFormData({ ...formData, elevation_gain: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#1f2de6] outline-none font-mono"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                        full
                        className="mt-1"
                    >
                        {loading ? <><Save size={17} className="mr-2" /> Guardando...</> : <><Save size={17} className="mr-2" /> Guardar actividad</>}
                    </Button>
                </form>
            </div>
        </div>
    );
};
export default AddActivityModal;
