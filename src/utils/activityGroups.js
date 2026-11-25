/**
 * Agrupación y resumen del historial de actividades (Fase Premium D6, spec premium-actividades).
 * Funciones puras: las semanas salen de la fecha de cada dato, nunca de «hoy».
 */
import { sportOf } from './sport';
import { toDateKey, toLocalDate, parseDateKey } from './dates';

/** Lunes (fecha local) de la semana de `date`, como `YYYY-MM-DD`. 'YYYY-MM-DD' se lee en hora local (BUG-7). */
export const weekStartKey = (date) => {
    const d = toLocalDate(date);
    if (!d || Number.isNaN(d.getTime())) return null;
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const shift = (local.getDay() + 6) % 7; // lunes = 0
    local.setDate(local.getDate() - shift);
    return toDateKey(local);
};

/** Totales de un conjunto de actividades: sesiones, minutos, metros y TSS. */
export const summarizeActivities = (activities = []) =>
    activities.reduce(
        (acc, a) => ({
            count: acc.count + 1,
            minutes: acc.minutes + (Number(a.duration) || 0),
            meters: acc.meters + (Number(a.distance) || 0),
            tss: acc.tss + (Number(a.tss) || 0),
        }),
        { count: 0, minutes: 0, meters: 0, tss: 0 },
    );

/**
 * Agrupa por semana ISO (lunes), de la más reciente a la más antigua; dentro de cada semana
 * conserva el orden recibido. Las semanas sin actividades no aparecen.
 * @returns {{key: string, items: object[], totals: ReturnType<typeof summarizeActivities>}[]}
 */
export const groupByWeek = (activities = []) => {
    const map = new Map();
    for (const a of activities) {
        const key = weekStartKey(a.date);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(a);
    }
    return [...map.keys()]
        .sort((x, y) => (x < y ? 1 : -1))
        .map((key) => ({ key, items: map.get(key), totals: summarizeActivities(map.get(key)) }));
};

/**
 * TSS por semana (más antigua → más reciente), hasta `n` semanas consecutivas que acaban en la semana
 * más reciente con datos, para la sparkline del resumen. Las semanas sin actividad cuentan como 0 (BUG-12).
 */
export const weeklyTss = (activities = [], n = 12) => {
    const groups = groupByWeek(activities);
    if (groups.length === 0) return [];
    const byWeek = new Map(groups.map((g) => [g.key, g.totals.tss]));
    const last = parseDateKey(groups[0].key);
    const first = parseDateKey(groups[groups.length - 1].key);
    // Sin rellenar con ceros antes de la primera semana con datos.
    const span = Math.round((last - first) / (7 * 86400000)) + 1;
    const out = [];
    for (let i = Math.min(n, span) - 1; i >= 0; i--) {
        const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() - i * 7);
        out.push(Math.round(byWeek.get(toDateKey(d)) || 0));
    }
    return out;
};

/** Deporte normalizado (clasificación única de `utils/sport`). */
export { sportOf };

/** Reparto por deporte: minutos, sesiones y cuota (0–1) del tiempo total; de mayor a menor tiempo. */
export const breakdownBySport = (activities = []) => {
    const acc = new Map();
    let total = 0;
    for (const a of activities) {
        const k = sportOf(a.type);
        const m = Number(a.duration) || 0;
        const cur = acc.get(k) || { sport: k, minutes: 0, count: 0 };
        cur.minutes += m;
        cur.count += 1;
        acc.set(k, cur);
        total += m;
    }
    return [...acc.values()]
        .sort((x, y) => y.minutes - x.minutes)
        .map((r) => ({ ...r, share: total > 0 ? r.minutes / total : 0 }));
};
