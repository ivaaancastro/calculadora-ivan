// Definiciones únicas de zonas (spec-b1, RF-3 a RF-5). Sin React.
// Los `min`/`max` son los rangos que se muestran; para clasificar solo cuentan los mínimos, así
// cada valor cae en una zona aunque entre dos rangos quede un hueco.
import { sportOf } from './sport';

/** 7 zonas de FC como % del LTHR (Joe Friel). */
export const LTHR_ZONE_PCT = [
    { pMin: 0.00, pMax: 0.81 }, // Z1 — Recuperación
    { pMin: 0.81, pMax: 0.89 }, // Z2 — Aeróbico
    { pMin: 0.90, pMax: 0.93 }, // Z3 — Tempo
    { pMin: 0.94, pMax: 0.99 }, // Z4 — Subumbral
    { pMin: 1.00, pMax: 1.02 }, // Z5 — Superumbral
    { pMin: 1.03, pMax: 1.06 }, // Z6 — Capacidad aeróbica
    { pMin: 1.06, pMax: 1.15 }, // Z7 — Anaeróbico
];

/** 7 zonas de FC como % de la FC máxima. */
export const FCMAX_PCT = [
    { pMin: 0, pMax: 0.59 },
    { pMin: 0.59, pMax: 0.74 },
    { pMin: 0.74, pMax: 0.84 },
    { pMin: 0.84, pMax: 0.90 },
    { pMin: 0.90, pMax: 0.94 },
    { pMin: 0.94, pMax: 0.97 },
    { pMin: 0.97, pMax: 1.00 },
];

/** 7 zonas de potencia como % del FTP (`short`: rótulo del planificador). */
export const POWER_ZONES = [
    { label: 'Recuperación activa', short: 'Rec', pMin: 0, pMax: 0.55 },
    { label: 'Resistencia', short: 'Endur', pMin: 0.56, pMax: 0.75 },
    { label: 'Tempo', short: 'Tempo', pMin: 0.76, pMax: 0.90 },
    { label: 'Umbral', short: 'Umbral', pMin: 0.91, pMax: 1.05 },
    { label: 'VO2 Max', short: 'VO2', pMin: 1.06, pMax: 1.20 },
    { label: 'Anaeróbico', short: 'AnC', pMin: 1.21, pMax: 1.50 },
    { label: 'Neuromuscular', short: 'Neu', pMin: 1.51, pMax: 2.00 },
];
export const SWEET_SPOT = { label: 'Sweet Spot', pMin: 0.84, pMax: 0.97 };

/** Rampas de potencia del planificador. */
export const POWER_RAMPS = {
    R23: { label: 'Rampa Z2→Z3', pMin: 0.65, pMax: 0.90 },
    R34: { label: 'Rampa Z3→Z4', pMin: 0.83, pMax: 1.05 },
};

/** 7 zonas de ritmo como % de la velocidad umbral (estilo intervals.icu). */
export const PACE_ZONES = [
    { label: 'Zone 1', sMin: 0, sMax: 0.775 },
    { label: 'Zone 2', sMin: 0.785, sMax: 0.877 },
    { label: 'Zone 3', sMin: 0.887, sMax: 0.943 },
    { label: 'Zone 4', sMin: 0.953, sMax: 1.00 },
    { label: 'Zone 5a', sMin: 1.01, sMax: 1.034 },
    { label: 'Zone 5b', sMin: 1.044, sMax: 1.115 },
    { label: 'Zone 5c', sMin: 1.125, sMax: 1.30 },
];

/** Ritmo estimado por zona para planificar (min/km en carrera, min/km en bici, min/100 m nadando). */
export const ZONE_PACE = {
    Run: { Z1: 7.0, R12: 6.5, Z2: 6.0, R23: 5.6, Z3: 5.2, R34: 4.85, Z4: 4.5, R45: 4.15, Z5: 3.8, Z6: 3.2 },
    Ride: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, R34: 2.1, Z4: 2.0, R45: 1.85, Z5: 1.7, Z6: 1.5 },
    Swim: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, R34: 2.1, Z4: 2.0, R45: 1.85, Z5: 1.7, Z6: 1.5 },
};

export const HR_ZONE_LABELS = ['Z1 Recuperación', 'Z2 Aeróbico', 'Z3 Tempo', 'Z4 SubUmbral', 'Z5 SupraUmbral', 'Z6 VO2Max', 'Z7 Anaeróbico'];

/** Zonas de FC desde el LTHR: Z1 empieza en 0 y Z7 acaba en la FC máxima. */
export const calcZonesFromLTHR = (lthr, maxHr) =>
    LTHR_ZONE_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(lthr * z.pMin),
        max: i === 6 ? maxHr || Math.round(lthr * z.pMax) : Math.round(lthr * z.pMax),
    }));

export const calcZonesFromFCMax = (maxHr) =>
    FCMAX_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(maxHr * z.pMin),
        max: i === 6 ? maxHr : Math.round(maxHr * z.pMax),
    }));

/** 'm:ss' → segundos; sin ritmo configurado, 4:30. */
export const paceToSec = (p) => {
    if (!p) return 270;
    const [m, s] = p.split(':');
    return (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
};
export const secToPace = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export const calcPaceZones = (thresholdPace) => {
    const tp = paceToSec(thresholdPace);
    return PACE_ZONES.map((z) => ({
        label: z.label,
        pctMin: z.sMin,
        pctMax: z.sMax,
        // A más velocidad, menor ritmo: los extremos se invierten.
        min: z.sMax > 0 ? secToPace(tp / z.sMax) : '',
        max: z.sMin > 0 ? secToPace(tp / z.sMin) : '∞',
    }));
};

/**
 * Mínimos de FC. En zonas personalizadas, un mínimo que no supera al anterior (p. ej. un campo
 * vaciado, que se guarda como 0) no es válido: la zona empieza tras el máximo de la anterior y, si
 * tampoco sirve, queda sin uso.
 */
export const hrZoneMins = (zones) => {
    let last = -Infinity;
    return zones.map((zone, i) => {
        let min = Number(zone.min) || 0;
        if (i > 0 && !(min > last)) {
            const prevMax = Number(zones[i - 1].max) || 0;
            if (!(prevMax > last)) return Infinity;
            min = prevMax + 1;
        }
        last = min;
        return min;
    });
};
/** El mismo vatio mínimo que se muestra: redondeado (FTP 215 → Z2 desde 120 W). */
export const powerZoneMins = (ftp) => POWER_ZONES.map((z) => Math.round(ftp * z.pMin));
// Sin recortar los decimales, una velocidad justo en el límite puede caer en la zona anterior.
const exact = (n) => Number(n.toFixed(9));
export const paceZoneMins = (thresholdPace) => {
    const speed = 1000 / paceToSec(thresholdPace);
    return PACE_ZONES.map((z) => exact(speed * z.sMin));
};

/** Índice de zona: la última cuyo mínimo no supera `value`; por debajo de todas, la primera. */
export const zoneIndex = (value, mins) => {
    for (let i = mins.length - 1; i > 0; i--) {
        if (value >= mins[i]) return i;
    }
    return 0;
};

/**
 * Segundos en cada zona a partir de un stream. Cada muestra cuenta el intervalo que termina en
 * ella; `ignore` descarta muestras sin dato (sensor sin señal, parado).
 */
export const secondsInZones = (values, time, mins, { ignore } = {}) => {
    const seconds = mins.map(() => 0);
    for (let i = 1; i < values.length; i++) {
        const dt = time[i] - time[i - 1];
        if (!(dt > 0) || ignore?.(values[i])) continue;
        seconds[zoneIndex(values[i], mins)] += dt;
    }
    return seconds;
};

/** Ajustes de FC que corresponden a un tipo de actividad: bici para ciclismo, carrera para el resto. */
export const hrSettingsFor = (type, settings) => (sportOf(type) === 'bike' ? settings?.bike : settings?.run);
