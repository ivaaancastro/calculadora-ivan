// Fechas en hora local (spec-capa6-v2-premium, RF-C2 / BUG-7 y DUP-3).
// `new Date('2026-06-01')` se interpreta en UTC: en husos negativos cae el día anterior.
// Estas funciones tratan 'YYYY-MM-DD' siempre como fecha local.

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' → Date a las 00:00 locales. Devuelve null si el texto no es una clave válida. */
export const parseDateKey = (key) => {
    const m = DATE_KEY.exec(String(key ?? ''));
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
};

/** Date, timestamp o texto → Date local; las claves 'YYYY-MM-DD' no pasan por UTC. */
export const toLocalDate = (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && DATE_KEY.test(value)) return parseDateKey(value);
    return new Date(value);
};

/** Clave local 'YYYY-MM-DD' de una fecha (Date, timestamp o texto). Cadena vacía si no es válida. */
export const toDateKey = (value) => {
    const d = toLocalDate(value);
    if (!d || Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Día de una actividad. Su fecha ya es la hora local del deportista (Strava la manda con una `Z`
 * que no significa UTC), así que cuenta el día escrito. Para un `Date`, el día local.
 */
export const activityDayKey = (value) => {
    if (typeof value === 'string') {
        const day = value.slice(0, 10);
        return parseDateKey(day) ? day : '';
    }
    return value == null ? '' : toDateKey(value);
};

/** Día de un entreno planificado: se guarda como instante (medianoche local), cuenta el día local. */
export const planDayKey = (value) => (value == null ? '' : toDateKey(value));

/** Hoy, en el calendario local. */
export const todayKey = (now = new Date()) => toDateKey(now);

/** Clave desplazada `n` días de calendario (no suma horas: no le afectan los cambios de hora). */
export const addDays = (key, n) => {
    const d = parseDateKey(key);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return toDateKey(d);
};

/** Lunes de la semana de `key`. */
export const startOfWeekKey = (key) => {
    const d = parseDateKey(key);
    return d ? addDays(key, -((d.getDay() + 6) % 7)) : '';
};

const SHORT_WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * «lun 15 jun» (con `{ year: true }`, «lun 15 jun 2026»). Recibe un `Date`, una clave de día o la
 * fecha de una actividad; para un plan, pásale `planDayKey(plan.date)`.
 */
export const formatDayShort = (value, { year = false } = {}) => {
    const d = parseDateKey(activityDayKey(value));
    if (!d) return '';
    const text = `${SHORT_WEEKDAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
    return year ? `${text} ${d.getFullYear()}` : text;
};
