// Distribución de la carga por intensidad (spec-b1, RF-15 a RF-18). Sin React.
// Aproximación propia inspirada en el «Enfoque de carga» de Garmin: el modelo de Firstbeat (EPOC)
// es propietario. El TSS de cada sesión se reparte entre aeróbico bajo (Z1–Z2), aeróbico alto
// (Z3–Z5) y anaeróbico (Z6–Z7) en proporción a `tiempo en zona × TSS/h de la zona`.
// Vive aparte de load.js porque usa tssEngine, que a su vez importa load.js.
import { activityDayKey, addDays, todayKey } from './dates';
import { computeZoneTssPerHour, getSportCategory } from './tssEngine';
import { POWER_ZONES, hrSettingsFor, hrZoneMins, powerZoneMins, secondsInZones, zoneIndex } from './zones';

export const CATEGORIES = ['low', 'high', 'anaerobic'];
/** Objetivos de cada categoría, en % de la carga clasificada. */
export const CATEGORY_TARGETS = {
    low: { pctMin: 60, pctMax: 80 },
    high: { pctMin: 10, pctMax: 25 },
    anaerobic: { pctMin: 5, pctMax: 15 },
};
const SPORTS = new Set(['run', 'ride', 'swim', 'other']);
/** Un hueco mayor es una pausa: no es tiempo en ninguna zona (igual que en el hrTSS). */
const MAX_GAP_SECS = 300;
/** Suelo de intensidad de la zona 1 de potencia, que en la definición empieza en 0. */
const MIN_POWER_IF = 0.4;

const categoryOf = (zone) => (zone < 2 ? 'low' : zone < 5 ? 'high' : 'anaerobic');

/** TSS/h de cada zona de potencia: IF² × 100 con la intensidad central de la zona. */
const POWER_TSS_PER_HOUR = POWER_ZONES.map((z) => (((Math.max(z.pMin, MIN_POWER_IF) + z.pMax) / 2) ** 2) * 100);

/** Reparte `tss` según el peso de cada zona; null si ninguna tiene tiempo. */
const split = (tss, seconds, tssPerHour, source) => {
    const weights = seconds.map((s, i) => s * (tssPerHour[i] || 0));
    const total = weights.reduce((a, b) => a + b, 0);
    if (!(total > 0)) return null;
    const result = { low: 0, high: 0, anaerobic: 0, source };
    weights.forEach((w, i) => { result[categoryOf(i)] += (tss * w) / total; });
    return result;
};

const seconds = (data, time, mins) =>
    secondsInZones(data, time, mins, { ignore: (v) => !(v > 0), maxGap: MAX_GAP_SECS });

/**
 * Reparto del TSS de una sesión. Fuente, por orden: potencia (bici con vatios), FC en streams y
 * FC media (toda la sesión a una zona; estimada). Sin TSS o sin ninguna fuente, null.
 */
export const sessionFocus = (activity, settings) => {
    const { tss, streams_data: streams } = activity;
    if (!(tss > 0)) return null;
    const time = streams?.time?.data;
    const isBike = getSportCategory(activity.type) === 'ride';

    const ftp = Number(settings?.bike?.ftp) || 0;
    if (isBike && ftp > 0 && time && streams.watts?.data) {
        const result = split(tss, seconds(streams.watts.data, time, powerZoneMins(ftp)), POWER_TSS_PER_HOUR, 'power');
        if (result) return result;
    }

    const zones = hrSettingsFor(activity.type, settings)?.zones;
    if (!zones?.length) return null;
    const mins = hrZoneMins(zones);
    const tph = computeZoneTssPerHour(isBike ? 'Ride' : 'Run', settings);
    const hrTssPerHour = zones.map((_, i) => tph[`Z${i + 1}`]);

    if (time && streams.heartrate?.data) {
        const result = split(tss, seconds(streams.heartrate.data, time, mins), hrTssPerHour, 'hr');
        if (result) return result;
    }

    if (!(activity.hr_avg > 0)) return null;
    return { low: 0, high: 0, anaerobic: 0, [categoryOf(zoneIndex(activity.hr_avg, mins))]: tss, source: 'hr_avg' };
};

/** Redondea a enteros que suman `total` (mayores restos). */
const roundToTotal = (values, total) => {
    const result = values.map(Math.floor);
    const missing = total - result.reduce((a, b) => a + b, 0);
    values
        .map((v, i) => [v - result[i], i])
        .sort((a, b) => b[0] - a[0])
        .slice(0, missing)
        .forEach(([, i]) => { result[i] += 1; });
    return result;
};
const byCategory = (values) => Object.fromEntries(CATEGORIES.map((c, i) => [c, values[i]]));

const verdictOf = (pcts) => {
    const short = (c) => pcts[c] < CATEGORY_TARGETS[c].pctMin;
    const over = (c) => pcts[c] > CATEGORY_TARGETS[c].pctMax;
    return CATEGORIES.map((c) => short(c) && `${c}Short`).find(Boolean)
        || ['anaerobic', 'high', 'low'].map((c) => over(c) && `${c}Over`).find(Boolean)
        || 'balanced';
};

/**
 * Distribución de la carga de los `days` días que acaban hoy. `unclassified` cuenta las sesiones
 * de los deportes incluidos que quedan fuera por no tener TSS, FC ni potencia.
 */
export const loadDistribution = (activities, settings, days = 28, today = todayKey()) => {
    const from = addDays(today, 1 - days);
    const sums = [0, 0, 0];
    let sessions = 0;
    let estimated = 0;
    let unclassified = 0;
    (activities || []).forEach((a) => {
        const key = activityDayKey(a.date);
        if (!(key >= from && key <= today) || !SPORTS.has(getSportCategory(a.type))) return;
        const focus = sessionFocus(a, settings);
        if (!focus) { unclassified += 1; return; }
        sessions += 1;
        if (focus.source === 'hr_avg') estimated += 1;
        CATEGORIES.forEach((c, i) => { sums[i] += focus[c]; });
    });

    const raw = sums.reduce((a, b) => a + b, 0);
    const total = Math.round(raw);
    const counts = { total, sessions, estimated, unclassified };
    if (!(total > 0)) return { ...counts, empty: true };

    const pcts = byCategory(roundToTotal(sums.map((s) => (s / raw) * 100), 100));
    const targets = Object.fromEntries(CATEGORIES.map((c) => {
        const t = CATEGORY_TARGETS[c];
        return [c, { ...t, min: Math.round((total * t.pctMin) / 100), max: Math.round((total * t.pctMax) / 100) }];
    }));
    return { ...counts, empty: false, values: byCategory(roundToTotal(sums, total)), pcts, targets, verdict: verdictOf(pcts) };
};
