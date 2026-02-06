import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export const usePlanner = (currentMetrics) => {
  const [events, setEvents] = useState([]);
  const [plannedLoad, setPlannedLoad] = useState([]); // Array de TSS semanal futuro
  const [simulation, setSimulation] = useState([]);

  // Configuración de simulación (12 semanas vista)
  const WEEKS_TO_SIMULATE = 12;

  // 1. CARGAR EVENTOS
  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (data) setEvents(data);
  }, []);

  // 2. AÑADIR EVENTO
  const addEvent = async (eventData) => {
    const { error } = await supabase.from('events').insert([eventData]);
    if (!error) fetchEvents();
    return error;
  };

  // 3. BORRAR EVENTO
  const deleteEvent = async (id) => {
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };

  // 4. INICIALIZAR CARGAS FUTURAS (Por defecto: Mantener carga actual)
  useEffect(() => {
    if (currentMetrics?.avgTss7d) {
        // Inicializamos con la carga actual para las próximas 12 semanas
        const currentWeeklyLoad = currentMetrics.avgTss7d * 7;
        setPlannedLoad(Array(WEEKS_TO_SIMULATE).fill(Math.round(currentWeeklyLoad)));
    }
  }, [currentMetrics?.avgTss7d]);

  // 5. MOTOR DE SIMULACIÓN (LA MATEMÁTICA) 🧮
  useEffect(() => {
    if (!currentMetrics || plannedLoad.length === 0) return;

    let simCtl = currentMetrics.ctl;
    let simAtl = currentMetrics.atl;
    const simData = [];
    const today = new Date();

    // Constantes de Banister (mismas que useActivities)
    const TA = 42;
    const TF = 7;

    plannedLoad.forEach((weeklyTss, weekIndex) => {
        const dailyTss = weeklyTss / 7; // Asumimos carga distribuida uniforme para la proyección
        
        // Simulamos día a día de esa semana
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() + (weekIndex * 7) + d + 1);
            
            simCtl = simCtl + (dailyTss - simCtl) / TA;
            simAtl = simAtl + (dailyTss - simAtl) / TF;
            const simTsb = simCtl - simAtl;

            // Solo guardamos puntos clave (ej: final de cada semana) para la gráfica, o día a día
            // Guardamos día a día para que coincida con eventos
            simData.push({
                date: date.toISOString().split('T')[0],
                ctl: parseFloat(simCtl.toFixed(1)),
                atl: parseFloat(simAtl.toFixed(1)),
                tsb: parseFloat(simTsb.toFixed(1)),
                isFuture: true
            });
        }
    });

    setSimulation(simData);
  }, [plannedLoad, currentMetrics]);

  return { events, fetchEvents, addEvent, deleteEvent, plannedLoad, setPlannedLoad, simulation };
};