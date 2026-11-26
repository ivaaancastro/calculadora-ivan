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

/**
 * Progreso semanal frente al plan (BUG-9). Sin TSS planificado no hay plan: `hasPlan` es false y
 * no se pinta barra (antes salía «195/0» con la barra llena).
 * @returns {{hasPlan: boolean, realized: number, planned: number, pct: number, level: 'high'|'mid'|'low'|null}}
 */
export const planProgress = (realizedTss, plannedTss) => {
    const realized = Math.round(Number(realizedTss) || 0);
    const planned = Math.round(Number(plannedTss) || 0);
    if (planned <= 0) return { hasPlan: false, realized, planned: 0, pct: 0, level: null };
    const pct = Math.min(Math.round((realized / planned) * 100), 100);
    return { hasPlan: true, realized, planned, pct, level: pct >= 90 ? 'high' : pct >= 70 ? 'mid' : 'low' };
};
