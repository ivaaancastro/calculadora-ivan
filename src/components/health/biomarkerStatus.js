/**
 * Estado de cada biomarcador de Salud (v2, spec §3.1.4): 'ok' | 'attention' | 'none'.
 * `delta` = variación frente a la referencia (null si no aplica) y `goodDir` el sentido favorable.
 */
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Rejilla de biomarcadores. El sueño no está: es el anillo de Sueño (RF-D1, un dato, un sitio);
 * la forma (TSB) tampoco: es carga de entrenamiento y vive en el Dashboard.
 */
export const BIOMARKER_KEYS = ['rhr', 'hrv', 'spo2', 'steps', 'vo2', 'weight'];

export function biomarkerStatus(wm) {
    const out = {};
    const none = { status: 'none', delta: null, goodDir: null };

    const rhr = num(wm?.latestRhr);
    const base = num(wm?.baselineRhr);
    out.rhr = rhr === null ? none : {
        status: base !== null && rhr - base >= 5 ? 'attention' : 'ok',
        delta: base !== null ? Math.round(rhr - base) : null,
        goodDir: 'down',
    };

    const hrv = num(wm?.latestHrv);
    const avg = num(wm?.avgHrv7d);
    out.hrv = hrv === null ? none : {
        status: wm?.hrvStatus === 'unbalanced' ? 'attention' : 'ok',
        delta: avg !== null ? Math.round(hrv - avg) : null,
        goodDir: 'up',
    };

    const sleep = num(parseFloat(wm?.latestSleep));
    out.sleep = sleep === null ? none : { status: sleep < 6 ? 'attention' : 'ok', delta: null, goodDir: 'up' };

    const tsb = num(wm?.currentTsb);
    out.tsb = tsb === null ? none : { status: tsb < -10 ? 'attention' : 'ok', delta: null, goodDir: 'up' };

    out.steps = num(wm?.latestSteps) === null ? none : { status: 'ok', delta: null, goodDir: 'up' };

    const spo2 = num(wm?.latestSpo2);
    out.spo2 = spo2 === null ? none : { status: spo2 < 95 ? 'attention' : 'ok', delta: null, goodDir: 'up' };

    out.vo2 = num(wm?.latestVo2max) === null ? none : { status: 'ok', delta: null, goodDir: 'up' };

    const weight = num(parseFloat(wm?.latestWeight));
    out.weight = weight === null ? none : { status: 'ok', delta: num(wm?.weightTrend), goodDir: 'down' };

    return out;
}

/** Orden de la rejilla: primero los que requieren atención; el resto conserva su orden. */
export const orderByAttention = (keys, statuses) => [
    ...keys.filter((k) => statuses[k]?.status === 'attention'),
    ...keys.filter((k) => statuses[k]?.status !== 'attention'),
];

/** Serie de los últimos `n` días de un campo de `chartData` (solo números > 0). */
export const lastSeries = (chartData, field, n = 7) =>
    (chartData || []).slice(-n).map((d) => d?.[field]).filter((v) => typeof v === 'number' && v > 0);
