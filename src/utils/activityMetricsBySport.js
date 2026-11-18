/**
 * Detalle de actividad por deporte (spec-detalle-por-deporte).
 *
 * Funciones puras y una única tabla de datos (`SPORT_BLOCKS`) que codifica la
 * matriz deporte × bloque de la spec. Cambiar una celda = cambiar una línea.
 * Sin React ni estilos.
 */

import { formatMinsToHMM } from './formatters';

/** Deportes reconocidos. La caminata se agrupa con el senderismo (`hike`). */
export const SPORTS = ['bike', 'run', 'hike', 'strength', 'generic'];

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hasAny = (t, words) => words.some((w) => t.includes(w));

/**
 * Detecta el deporte a partir de `activity.type` (texto libre: español de la
 * app o inglés de Strava sin traducir). Orden fijo: fuerza → bici → carrera →
 * senderismo/caminata → genérico.
 */
export function detectSportType(activityType) {
    const t = normalize(activityType);
    if (!t) return 'generic';
    if (hasAny(t, ['fuerza', 'gym', 'weighttraining', 'crossfit'])) return 'strength';
    if (hasAny(t, ['bici', 'bike', 'ciclismo', 'ride'])) return 'bike';
    if (hasAny(t, ['carrera', 'run', 'correr'])) return 'run';
    if (hasAny(t, ['senderismo', 'montana', 'trekking', 'hike', 'hiking', 'caminata', 'walk', 'andar'])) return 'hike';
    return 'generic';
}

/** ¿El deporte se muestra con ritmo (min/km) en vez de velocidad? */
export const isPaceSport = (sport) => sport === 'run' || sport === 'hike';

/**
 * Matriz deporte × bloque.
 *  - metrics:   ids del resumen superior, en orden ('speedPace' = ritmo o velocidad).
 *  - tabs:      pestañas opcionales ('map' requiere GPS; 'laps' en genérico requiere datos).
 *  - charts:    gráficas de Análisis y picos asociados.
 *  - detail:    bloques de la pestaña Detalle.
 *  - zones:     tipos de zonas ofrecidos (FC por defecto).
 *  - metabolic: base del perfil metabólico ('if' | 'hr' | null).
 */
export const SPORT_BLOCKS = {
    bike: {
        metrics: ['kcal', 'tss', 'if', 'np', 'work', 'wattsAvg', 'hrAvg', 'speedPace', 'cadence', 'distance', 'duration', 'elevation', 'ef', 'decoupling'],
        tabs: { map: true, laps: 'always' },
        charts: { speed: true, power: true, cadence: true, altitude: true },
        detail: { climbPro: true, efficiency: true, powerHitos: true },
        zones: ['hr', 'power'],
        metabolic: 'if',
    },
    run: {
        metrics: ['kcal', 'hrAvg', 'speedPace', 'cadence', 'distance', 'duration', 'elevation', 'tss', 'decoupling'],
        tabs: { map: true, laps: 'always' },
        charts: { speed: true, power: false, cadence: true, altitude: true },
        detail: { climbPro: false, efficiency: false, powerHitos: false },
        zones: ['hr', 'pace'],
        metabolic: 'hr',
    },
    hike: {
        metrics: ['kcal', 'hrAvg', 'speedPace', 'distance', 'duration', 'elevation', 'tss'],
        tabs: { map: true, laps: 'always' },
        charts: { speed: true, power: false, cadence: false, altitude: true },
        detail: { climbPro: false, efficiency: false, powerHitos: false },
        zones: ['hr'],
        metabolic: 'hr',
    },
    strength: {
        metrics: ['kcal', 'duration', 'hrAvg', 'tss'],
        tabs: { map: false, laps: 'never' },
        charts: { speed: false, power: false, cadence: false, altitude: false },
        detail: { climbPro: false, efficiency: false, powerHitos: false },
        zones: ['hr'],
        metabolic: null,
    },
    generic: {
        metrics: ['kcal', 'distance', 'duration', 'elevation', 'hrAvg', 'speedPace', 'tss'],
        tabs: { map: true, laps: 'ifData' },
        charts: { speed: true, power: false, cadence: false, altitude: true },
        detail: { climbPro: false, efficiency: false, powerHitos: false },
        zones: ['hr'],
        metabolic: null,
    },
};

export const getBlocksForSport = (sport) => SPORT_BLOCKS[sport] || SPORT_BLOCKS.generic;

const positive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

/**
 * Pestañas visibles. `hasGps`: hay polyline o latlng; `hasLaps`: hay intervalos.
 * Análisis y Detalle siempre; Mapa solo con GPS; Intervalos según deporte.
 */
export function getTabsForSport(sport, { hasGps = false, hasLaps = false } = {}) {
    const b = getBlocksForSport(sport);
    const tabs = [{ id: 'analyze', label: 'Análisis' }];
    if (b.tabs.map && hasGps) tabs.push({ id: 'map', label: 'Mapa' });
    if (b.tabs.laps === 'always' || (b.tabs.laps === 'ifData' && hasLaps)) tabs.push({ id: 'laps', label: 'Intervalos' });
    tabs.push({ id: 'data', label: 'Detalle' });
    return tabs;
}

/** Tipos de zonas ofrecidos según deporte y datos disponibles (siempre FC primero). */
export function getZoneOptions(sport, { hasHr = false, hasPace = false, hasPower = false } = {}) {
    const opts = [];
    for (const z of getBlocksForSport(sport).zones) {
        if (z === 'hr' && hasHr) opts.push({ value: 'hr', label: 'FC' });
        if (z === 'pace' && hasPace) opts.push({ value: 'pace', label: 'Ritmo' });
        if (z === 'power' && hasPower) opts.push({ value: 'power', label: 'Potencia' });
    }
    return opts;
}

/**
 * Intensidad relativa (0-1) para el perfil metabólico: IF en bici, FC media / FC máx.
 * en carrera y senderismo. null si el deporte no lo muestra o falta el dato.
 */
export function getMetabolicIntensity(sport, activity, proMetrics, maxHr) {
    const mode = getBlocksForSport(sport).metabolic;
    if (mode === 'if') return positive(proMetrics?.ifFactor) ? Number(proMetrics.ifFactor) : null;
    if (mode === 'hr') {
        if (!positive(activity?.hr_avg) || !positive(maxHr)) return null;
        return Math.min(1, activity.hr_avg / maxHr);
    }
    return null;
}

/** Definiciones de todas las métricas posibles del resumen (show = tiene dato). */
export function buildMetricDefs(activity, proMetrics, sport, speedMetric) {
    const pm = proMetrics || {};
    const paceUnit = sport === 'run' ? 'ppm' : 'rpm';
    const isPace = speedMetric?.label === 'Ritmo Medio';
    return {
        kcal: { id: 'kcal', metricId: 'kcal', label: 'Kcal totales', value: Math.round(activity.calories || 0), unit: 'kcal', show: positive(activity.calories) },
        distance: { id: 'distance', metricId: 'distance', label: 'Distancia', value: ((activity.distance || 0) / 1000).toFixed(2), unit: 'km', show: positive(activity.distance) },
        duration: { id: 'duration', metricId: 'duration', label: 'Tiempo', value: formatMinsToHMM(activity.duration || 0), unit: null, show: positive(activity.duration) },
        elevation: { id: 'elevation', metricId: 'elevation', label: 'Desnivel', value: activity.elevation_gain || 0, unit: 'm', show: positive(activity.elevation_gain) },
        hrAvg: { id: 'hrAvg', metricId: 'hrAvg', label: 'FC Media', value: activity.hr_avg, unit: 'bpm', accent: 'text-hr', show: positive(activity.hr_avg) },
        speedPace: speedMetric
            ? { id: isPace ? 'pace' : 'speed', metricId: isPace ? 'pace' : 'speed', label: speedMetric.label, value: speedMetric.value, unit: speedMetric.unit, accent: 'text-speed', show: true }
            : { id: 'speedPace', show: false },
        tss: { id: 'tss', metricId: 'tss', label: 'Carga', value: Math.round(activity.tss || 0), unit: 'TSS', accent: 'text-load', show: positive(activity.tss) },
        if: { id: 'if', metricId: 'if', label: 'IF', value: pm.ifFactor, unit: null, accent: 'text-power', show: positive(pm.ifFactor) },
        work: { id: 'work', metricId: 'work', label: 'Trabajo', value: pm.workKj, unit: 'kJ', show: positive(pm.workKj) },
        wattsAvg: { id: 'wattsAvg', metricId: 'wattsAvg', label: 'W Media', value: pm.avgWatts, unit: 'w', accent: 'text-power', show: positive(pm.avgWatts) },
        np: { id: 'np', metricId: 'np', label: 'NP', value: pm.npWatts, unit: 'w', accent: 'text-power-strong', show: positive(pm.npWatts) },
        ef: { id: 'ef', metricId: 'ef', label: 'EF', value: pm.efObj?.value, unit: pm.efObj?.unit, show: !!pm.efObj },
        decoupling: { id: 'decoupling', metricId: 'decoupling', label: 'Drift', value: pm.decouplingObj?.value, unit: '%', accent: pm.decouplingObj?.color, show: !!pm.decouplingObj },
        cadence: { id: 'cadence', metricId: 'cadence', label: 'Cadencia', value: pm.cadenceAvg, unit: paceUnit, show: positive(pm.cadenceAvg) },
    };
}

/** Métricas del resumen a pintar para la actividad: por deporte y solo con dato. */
export function getMetricsForSport(sport, activity, proMetrics, speedMetric) {
    const defs = buildMetricDefs(activity, proMetrics, sport, speedMetric);
    return getBlocksForSport(sport).metrics.map((id) => defs[id]).filter((d) => d && d.show);
}

/**
 * Aplica la matriz a la serie de la gráfica: lo que el deporte no muestra se
 * anula (null), de modo que gráficas, picos y HUD lo omiten sin más cambios.
 */
export function applyChartBlocks(chartData, sport) {
    const { charts } = getBlocksForSport(sport);
    if (charts.speed && charts.power && charts.cadence && charts.altitude) return chartData;
    return chartData.map((pt) => ({
        ...pt,
        speed: charts.speed ? pt.speed : null,
        pace: charts.speed ? pt.pace : null,
        watts: charts.power ? pt.watts : null,
        cadence: charts.cadence ? pt.cadence : null,
        alt: charts.altitude ? pt.alt : null,
    }));
}
