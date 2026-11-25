// Carga por día y estado de las sesiones del Calendario (Fase Premium D5, PR 2). Sin React.
import { heatmapLevel } from './heatmapGrid';
import { toDateKey as key } from './dates';

/** TSS realizado por día (solo reales). */
const realTssByDate = (activitiesByDate) => {
    const out = {};
    Object.entries(activitiesByDate || {}).forEach(([k, acts]) => {
        const sum = (acts || []).reduce((s, a) => s + (!a.isPlanned && a.tss > 0 ? a.tss : 0), 0);
        if (sum > 0) out[k] = sum;
    });
    return out;
};

/**
 * Nivel de carga 1–4 por día de la cuadrícula visible, relativo al día más cargado del mes mostrado.
 * Los días sin carga no aparecen en el mapa.
 */
export const buildDayLoadLevels = (activitiesByDate, calendarGrid) => {
    const tss = realTssByDate(activitiesByDate);
    const keys = (calendarGrid || []).flat().map((d) => key(d.date));
    const max = keys.reduce((m, k) => Math.max(m, tss[k] || 0), 0);
    const levels = {};
    keys.forEach((k) => {
        const level = heatmapLevel(tss[k] || 0, max);
        if (level > 0) levels[k] = level;
    });
    return levels;
};

/**
 * Estado de una ficha: 'done' (realizada), 'fulfilled' (realizada que cumple un plan),
 * 'planned' (plan por venir u hoy) y 'omitted' (plan de un día pasado sin sesión que lo cubra).
 */
export const getSessionState = (act, { fulfilled = false, dateKey, todayKey = key(new Date()) }) => {
    if (!act.isPlanned) return fulfilled ? 'fulfilled' : 'done';
    return dateKey < todayKey ? 'omitted' : 'planned';
};
