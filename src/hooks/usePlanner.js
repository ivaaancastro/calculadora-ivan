/**
 * usePlanner.js — Hook para la gestión de eventos y simulación de carga futura.
 *
 * Responsabilidades:
 *  - Cargar, crear y borrar eventos de la tabla `events` de Supabase.
 *  - Simular la evolución de CTL/ATL/TSB para las próximas `WEEKS_TO_SIMULATE` semanas
 *    a partir de la carga semanal planificada por el usuario.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

/** Número de semanas hacia el futuro que simula el motor de proyección. */
const WEEKS_TO_SIMULATE = 12;

/** Constantes de Banister (idénticas a las usadas en useActivities). */
const TA = 42; // Constante de tiempo de CTL (días)
const TF = 7;  // Constante de tiempo de ATL (días)

/**
 * @param {{ ctl: number, atl: number, avgTss7d: number }|null} currentMetrics
 *   Métricas actuales del atleta (CTL, ATL, TSS medio diario de los últimos 7 días).
 */
export const usePlanner = (currentMetrics) => {
    const [events, setEvents]           = useState([]);
    const [plannedLoad, setPlannedLoad] = useState([]); // TSS semanal planificado
    const [simulation, setSimulation]   = useState([]);

    // ── 1. CARGAR EVENTOS ────────────────────────────────────────────────────
    const fetchEvents = useCallback(async () => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });
        if (data) setEvents(data);
    }, []);

    // ── 2. AÑADIR EVENTO ─────────────────────────────────────────────────────
    /** @returns {Error|null} Error de Supabase, o null si fue exitoso. */
    const addEvent = async (eventData) => {
        const { error } = await supabase.from('events').insert([eventData]);
        if (!error) fetchEvents();
        return error;
    };

    // ── 3. BORRAR EVENTO ─────────────────────────────────────────────────────
    const deleteEvent = async (id) => {
        await supabase.from('events').delete().eq('id', id);
        fetchEvents();
    };

    // ── 4. INICIALIZAR CARGA PLANIFICADA ─────────────────────────────────────
    // Cuando se obtienen las métricas actuales, se inicializa la carga futura
    // con el promedio de los últimos 7 días (mantener carga actual).
    useEffect(() => {
        if (currentMetrics?.avgTss7d) {
            const currentWeeklyLoad = currentMetrics.avgTss7d * 7;
            setPlannedLoad(Array(WEEKS_TO_SIMULATE).fill(Math.round(currentWeeklyLoad)));
        }
    }, [currentMetrics?.avgTss7d]);

    // ── 5. MOTOR DE SIMULACIÓN ────────────────────────────────────────────────
    // Proyecta CTL/ATL/TSB día a día para las próximas WEEKS_TO_SIMULATE semanas
    // distribuyendo la carga semanal de forma uniforme (un día ≈ semana/7).
    useEffect(() => {
        if (!currentMetrics || plannedLoad.length === 0) return;

        let simCtl    = currentMetrics.ctl;
        let simAtl    = currentMetrics.atl;
        const simData = [];
        const today   = new Date();

        plannedLoad.forEach((weeklyTss, weekIndex) => {
            const dailyTss = weeklyTss / 7;

            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() + weekIndex * 7 + d + 1);

                // Modelo EWMA lineal (aproximación exacta de Banister)
                simCtl = simCtl + (dailyTss - simCtl) / TA;
                simAtl = simAtl + (dailyTss - simAtl) / TF;
                const simTsb = simCtl - simAtl;

                simData.push({
                    date:     date.toISOString().split('T')[0],
                    ctl:      parseFloat(simCtl.toFixed(1)),
                    atl:      parseFloat(simAtl.toFixed(1)),
                    tsb:      parseFloat(simTsb.toFixed(1)),
                    isFuture: true,
                });
            }
        });

        setSimulation(simData);
    }, [plannedLoad, currentMetrics]);

    return { events, fetchEvents, addEvent, deleteEvent, plannedLoad, setPlannedLoad, simulation };
};