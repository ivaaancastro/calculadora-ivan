import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';
import { Input, Modal, Select } from '../ui';

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
        <Modal open={isOpen} onClose={onClose} variant="sheet" labelledBy="add-activity-title">

            {/* iOS drag handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

            <div className="flex justify-between items-center px-5 py-3 sm:p-5 border-b border-line-soft-2 shrink-0">
                <h3 id="add-activity-title" className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-action-bright" size={20} /> Añadir Manual
                </h3>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-surface-2 active:scale-95 transition-all touch-manipulation" title="Cerrar">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar touch-scroll flex-1">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                        <label htmlFor="activity-date" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Fecha</label>
                        <Input id="activity-date" type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                            variant="filled" className="w-full p-3"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="activity-type" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Deporte</label>
                        <Select id="activity-type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                            variant="filled" className="w-full p-3"
                        >
                            <option>Carrera</option><option>Ciclismo</option><option>Fuerza</option><option>Caminata</option><option>Natación</option>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                        <label htmlFor="duration-input" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Duración (min)</label>
                        <Input id="duration-input" type="number" inputMode="decimal" min="0.1" step="any" required placeholder="0" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            variant="filled" mono className="w-full p-3"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="activity-hr" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Pulso Medio</label>
                        <Input id="activity-hr" type="number" inputMode="numeric" min="0" placeholder="Opcional" value={formData.hr_avg} onChange={e => setFormData({ ...formData, hr_avg: e.target.value })}
                            variant="filled" mono className="w-full p-3"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                        <label htmlFor="activity-distance" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Distancia (m)</label>
                        <Input id="activity-distance" type="number" inputMode="decimal" min="0" placeholder="Ej: 5000" value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })}
                            variant="filled" mono className="w-full p-3"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="activity-elevation" className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">Desnivel (m)</label>
                        <Input id="activity-elevation" type="number" inputMode="decimal" min="0" placeholder="Ej: 100" value={formData.elevation_gain} onChange={e => setFormData({ ...formData, elevation_gain: e.target.value })}
                            variant="filled" mono className="w-full p-3"
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full min-h-[46px] bg-action-solid hover:bg-action-hover text-white font-bold py-3 px-4 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 shadow-md touch-manipulation select-none">
                    {loading ? 'Guardando...' : <><Save size={18} /> Guardar Actividad</>}
                </button>
            </form>
        </Modal>
    );
};
export default AddActivityModal;