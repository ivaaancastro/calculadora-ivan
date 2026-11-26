// Formateo de cifras y tiempos (spec-capa6-v2-premium, RF-C6 / DUP-1 y COP-1).
// Una sola implementación por unidad: `formatDuration` recibe SEGUNDOS y `formatMinutes`, MINUTOS.

const pad2 = (n) => String(n).padStart(2, '0');

export const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Tiempo de reloj a partir de SEGUNDOS: «1:05:03» con horas, «5:03» sin ellas.
 * Sin valor (null, NaN o negativo) devuelve «--:--».
 */
export const formatDuration = (totalSeconds) => {
    const n = Number(totalSeconds);
    if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(n) || n < 0) return '--:--';
    const secs = Math.round(n);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
};

/**
 * Duración a partir de MINUTOS, sin segundos: «1h 16m», «45m», «2h», «0m».
 * `compact` quita el espacio («1h16m») para celdas estrechas del calendario.
 */
export const formatMinutes = (minutes, { compact = false } = {}) => {
    const total = Math.round(Number(minutes) || 0);
    if (total <= 0) return '0m';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${compact ? '' : ' '}${m}m`;
};

/**
 * Duración de un bloque o paso de entreno en minutos fraccionarios, con segundos:
 * 0.333 → «20s», 1.5 → «1m 30s», 15 → «15m».
 */
export const formatBlockDuration = (minutes) => {
    const totalSecs = Math.round((Number(minutes) || 0) * 60);
    if (totalSecs <= 0) return '0s';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
};

const NUMBER_FORMATS = new Map();
const numberFormat = (decimals) => {
    if (!NUMBER_FORMATS.has(decimals)) {
        NUMBER_FORMATS.set(decimals, new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }));
    }
    return NUMBER_FORMATS.get(decimals);
};

/**
 * Número en es-ES con `decimals` decimales fijos (coma decimal): 19.1 → «19,1», 0.38 → «0,38».
 * Sin valor numérico devuelve `fallback` («--» por defecto).
 */
export const formatNumber = (value, decimals = 0, fallback = '--') => {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const out = numberFormat(decimals).format(n);
    return out === '-0' || /^-0,0*$/.test(out) ? out.slice(1) : out;
};
