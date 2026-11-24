/**
 * Agrupación y resumen del historial de actividades (Fase Premium D6, spec premium-actividades).
 * Funciones puras: las semanas salen de la fecha de cada dato, nunca de «hoy».
 */

const pad = (n) => String(n).padStart(2, '0');

/** Lunes (fecha local) de la semana de `date`, como `YYYY-MM-DD`. */
export const weekStartKey = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const shift = (local.getDay() + 6) % 7; // lunes = 0
    local.setDate(local.getDate() - shift);
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
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

/** TSS por semana (más antigua → más reciente), últimas `n`, para la sparkline del resumen. */
export const weeklyTss = (activities = [], n = 12) =>
    groupByWeek(activities).slice(0, n).reverse().map((g) => Math.round(g.totals.tss));

/** Deporte normalizado de una actividad: run | bike | swim | gym | other (mismas reglas que el filtro). */
export const sportOf = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return 'run';
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) return 'bike';
    if (t.includes('swim') || t.includes('nadar') || t.includes('natación') || t.includes('natacion')) return 'swim';
    if (t.includes('gym') || t.includes('fuerza') || t.includes('weight') || t.includes('workout')) return 'gym';
    return 'other';
};

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
