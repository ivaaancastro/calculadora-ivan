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
