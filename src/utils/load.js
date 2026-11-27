// Carga de entrenamiento (spec-b1, RF-10 a RF-14). Sin React.
// Los totales (semana, 7 d, mes, periodo) suman el TSS de TODOS los deportes: coinciden con la
// suma de las sesiones que se ven (D3). Los pesos por deporte solo actúan en CTL/ATL (tssEngine).
import { activityDayKey, addDays, startOfWeekKey } from './dates';

const tssOf = (a) => (a.tss > 0 ? a.tss : 0);
const sum = (values) => values.reduce((s, v) => s + v, 0);
const mean = (values) => (values.length ? sum(values) / values.length : 0);

/** TSS total de una lista de sesiones, redondeado una sola vez. */
export const totalTss = (activities) => Math.round(sum((activities || []).map(tssOf)));

/** TSS por día (clave local de la actividad), sin redondear. */
export const loadByDay = (activities) => {
    const days = new Map();
    (activities || []).forEach((a) => {
        const key = activityDayKey(a.date);
        if (key) days.set(key, (days.get(key) || 0) + tssOf(a));
    });
    return days;
};

/** Carga de los `days` días que acaban en `endKey`, incluido. */
export const rollingLoad = (activities, endKey, days = 7) => {
    const from = addDays(endKey, 1 - days);
    return totalTss((activities || []).filter((a) => {
        const key = activityDayKey(a.date);
        return key >= from && key <= endKey;
    }));
};

/** Carga y horas por semana (lunes a domingo), en orden cronológico. `week` es la clave del lunes. */
export const weeklyLoads = (activities) => {
    const weeks = new Map();
    (activities || []).forEach((a) => {
        const week = startOfWeekKey(activityDayKey(a.date));
        if (!week) return;
        const w = weeks.get(week) || { week, tss: 0, minutes: 0 };
        w.tss += tssOf(a);
        w.minutes += a.duration || 0;
        weeks.set(week, w);
    });
    return [...weeks.values()]
        .sort((a, b) => a.week.localeCompare(b.week))
        .map((w) => ({ week: w.week, tss: Math.round(w.tss), hours: Number((w.minutes / 60).toFixed(1)) }));
};

/** Días de historia que pide el ratio de carga aguda:crónica. */
const CHRONIC_DAYS = 28;

/**
 * Ratio de carga aguda:crónica: media diaria de 7 días entre la de 28. `dailyLoads` es la carga
 * ponderada por fatiga de cada día, la última la de hoy. Sin 28 días o sin carga, null.
 */
export const acwr = (dailyLoads) => {
    if (!dailyLoads || dailyLoads.length < CHRONIC_DAYS) return null;
    const chronic = mean(dailyLoads.slice(-CHRONIC_DAYS));
    return chronic > 0 ? Number((mean(dailyLoads.slice(-7)) / chronic).toFixed(2)) : null;
};

/** Única escala del ACWR: óptimo 0,8–1,3; vigilar hasta 1,5; riesgo por encima. */
export const acwrZone = (value) => {
    if (!(value > 0)) return { key: 'none', label: 'Sin datos', tone: 'neutral' };
    if (value < 0.8) return { key: 'low', label: 'Carga baja', tone: 'neutral' };
    if (value <= 1.3) return { key: 'optimal', label: 'Zona óptima', tone: 'peak' };
    if (value <= 1.5) return { key: 'watch', label: 'Vigilar', tone: 'overload' };
    return { key: 'risk', label: 'Riesgo', tone: 'critical' };
};

/** Rampa: CTL del día `i` menos el de 7 días antes; null si no hay tanta historia. */
export const rampAt = (ctlValues, i) =>
    (i >= 7 && i < ctlValues.length ? Number((ctlValues[i] - ctlValues[i - 7]).toFixed(1)) : null);

/** Variación porcentual del fitness frente a hace 28 días (o al inicio de la serie). */
export const fitnessTrend = (ctlValues, i, lag = 28) => {
    const past = ctlValues[Math.max(0, i - lag)];
    return past > 0 ? ((ctlValues[i] - past) / past) * 100 : 0;
};

/** Monotonía y strain (Foster, 1998) de los últimos 7 días de carga diaria; sin 7 días, null. */
export const monotonyStrain = (dailyLoads) => {
    const week = (dailyLoads || []).slice(-7);
    if (week.length < 7) return { monotony: null, strain: null };
    const avg = mean(week);
    const deviation = Math.sqrt(mean(week.map((v) => (v - avg) ** 2)));
    // Semana idéntica todos los días: la monotonía sería infinita; se topa en 4.
    const monotony = deviation > 0 ? avg / deviation : (avg > 0 ? 4 : 0);
    return { monotony: Number(monotony.toFixed(2)), strain: Math.round(sum(week) * monotony) };
};

/** Solo en esta ventana el TSS se calcula con streams (D2): es la que la app carga siempre. */
export const STREAMS_WINDOW_DAYS = 95;
export const streamsWindowStart = (todayKey) => addDays(todayKey, -STREAMS_WINDOW_DAYS);
