/**
 * tssEngine.js — Fuente única de verdad para todos los cálculos de TSS / HRSS.
 *
 * Implementa el modelo TRIMP de Banister, idéntico al HRSS de Intervals.icu:
 *   TRIMP = Σ(dt_min × d × y × e^(b×d))
 *   d     = (HR − HRreposo) / (HRmax − HRreposo)  → fracción de la Reserva Cardíaca
 *
 * Constantes de género (Banister):
 *   Masculino: y = 0.64, b = 1.92
 *   Femenino:  y = 0.86, b = 1.67
 *
 * HRSS = (TRIMP / TRIMP_1h@LTHR) × 100
 */

// ── Porcentajes de zona (Joe Friel 7 zonas, % de LTHR) ──────────────────────
export const LTHR_ZONE_PCT = [
    { pMin: 0.00, pMax: 0.81 },  // Z1 — Recuperación
    { pMin: 0.81, pMax: 0.89 },  // Z2 — Aeróbico
    { pMin: 0.90, pMax: 0.93 },  // Z3 — Tempo
    { pMin: 0.94, pMax: 0.99 },  // Z4 — Subumbral
    { pMin: 1.00, pMax: 1.02 },  // Z5 — Superumbral
    { pMin: 1.03, pMax: 1.06 },  // Z6 — Capacidad aeróbica
    { pMin: 1.06, pMax: 1.15 },  // Z7 — Anaeróbico
];

/**
 * Configuración de la contribución al PMC por tipo de deporte.
 * - fitness:           % de contribución al CTL (forma crónica)
 * - fatigue:           % de contribución al ATL (fatiga aguda)
 * - countsForWeekly:   si se incluye en el sumario TSS semanal (estilo intervals.icu)
 */
export const SPORT_LOAD_CONFIG = {
    ride:     { fitness: 1.0, fatigue: 1.0, countsForWeekly: true  },
    run:      { fitness: 1.0, fatigue: 1.0, countsForWeekly: true  },
    swim:     { fitness: 1.0, fatigue: 1.0, countsForWeekly: true  },
    strength: { fitness: 0.0, fatigue: 1.0, countsForWeekly: false }, // No construye CTL aeróbico
    walk:     { fitness: 0.0, fatigue: 0.5, countsForWeekly: false },
    yoga:     { fitness: 0.0, fatigue: 0.2, countsForWeekly: false },
    other:    { fitness: 1.0, fatigue: 1.0, countsForWeekly: true  },
};

// ── Clasificación de deporte ──────────────────────────────────────────────────
/**
 * Devuelve la categoría canónica de deporte a partir de un string de tipo.
 * Las categorías posibles son: 'ride' | 'run' | 'swim' | 'walk' | 'yoga' | 'strength' | 'other'
 *
 * @param {string} typeStr  - Tipo de actividad tal y como viene de Strava o la BD
 * @returns {'ride'|'run'|'swim'|'walk'|'yoga'|'strength'|'other'}
 */
export function getSportCategory(typeStr) {
    const t = String(typeStr).toLowerCase();
    if (t.includes('weighttraining') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout') || t.includes('gym')) return 'strength';
    if (t.includes('yoga') || t.includes('stretch')) return 'yoga';
    if (t.includes('walk') || t.includes('hike') || t.includes('caminata') || t.includes('senderismo')) return 'walk';
    if (t.includes('swim') || t.includes('natación') || t.includes('natacion')) return 'swim';
    if (t.includes('run') || t.includes('correr') || t.includes('carrera') || t.includes('footing')) return 'run';
    if (t.includes('ride') || t.includes('ciclismo') || t.includes('bici') || t.includes('bike')) return 'ride';
    return 'other';
}

// ── Generación de zonas desde LTHR ────────────────────────────────────────────
/**
 * Genera un array de 7 zonas de FC a partir del LTHR configurado.
 * La Z1 empieza en 0 (reposo); la Z7 acaba en HRmax.
 *
 * @param {number} lthr   - Frecuencia cardíaca en el umbral láctico
 * @param {number} maxHr  - Frecuencia cardíaca máxima
 * @returns {{ min: number, max: number }[]}
 */
export function calcZonesFromLTHR(lthr, maxHr) {
    return LTHR_ZONE_PCT.map((z, i) => ({
        min: i === 0 ? 0 : Math.round(lthr * z.pMin),
        max: i === 6 ? (maxHr || Math.round(lthr * z.pMax)) : Math.round(lthr * z.pMax),
    }));
}

// ── Constantes de género Banister ─────────────────────────────────────────────
/**
 * @param {'male'|'female'} gender
 * @returns {{ kY: number, kB: number }}
 */
function genderConstants(gender) {
    const isMale = gender !== 'female';
    return { kY: isMale ? 0.64 : 0.86, kB: isMale ? 1.92 : 1.67 };
}

// ── Resolución de ajustes por deporte ────────────────────────────────────────
/**
 * Devuelve el bloque de settings (bike | run | swim) correspondiente al tipo
 * de actividad. Usa getSportCategory para no duplicar la lógica de detección.
 *
 * @param {string} sportType  - Tipo de actividad
 * @param {object} settings   - Settings del usuario (store)
 * @returns {object|null}     - Settings del deporte (bike | run | swim object)
 */
function resolveSportSettings(sportType, settings) {
    const category = getSportCategory(sportType);
    if (category === 'ride') return settings.bike;
    if (category === 'swim') return settings.swim || settings.run;
    return settings.run; // run, walk, strength, yoga, other → usa run como base
}

// ── Normalización TRIMP (1h @ LTHR) ──────────────────────────────────────────
/**
 * Calcula el TRIMP de referencia: el resultado de entrenar 1 hora exacta al LTHR.
 * Se usa para normalizar el TRIMP de cualquier actividad → HRSS.
 *
 * @param {number} lthr    - Umbral de FC láctico
 * @param {number} hrMax   - FC máxima
 * @param {number} hrRest  - FC de reposo
 * @param {number} kY      - Constante de género Y
 * @param {number} kB      - Constante de género B
 * @returns {number}
 */
function trimpNorm1h(lthr, hrMax, hrRest, kY, kB) {
    const hrRange = hrMax - hrRest;
    if (hrRange <= 0) return 1;
    const d = (lthr - hrRest) / hrRange;
    return 60 * d * kY * Math.exp(kB * d);
}

// ── Cálculo de Potencia Normalizada (NP) estilo Intervals.icu ─────────────────
/**
 * Calcula la Potencia Normalizada (NP) y la duración activa de una actividad
 * a partir de los streams de vatios y tiempo.
 *
 * Algoritmo:
 * 1. Reconstruye stream a 1Hz, colapsando pausas largas (>10s) a 1 segundo.
 * 2. Aplica media móvil de 30s exacta (estilo WKO / Intervals.icu).
 * 3. Eleva cada SMA a la 4ª potencia, promedia, y saca la raíz 4.
 *
 * @param {number[]} watts  - Array de vatios por muestra
 * @param {number[]} time   - Array de tiempos en segundos (correspondientes a watts)
 * @returns {{ np: number, duration: number }}
 */
function calculateNPAndDuration(watts, time) {
    if (!watts || !time || watts.length < 2) return { np: 0, duration: 0 };

    // Reconstruir stream a 1Hz asegurando potencia continua
    const activeWatts = [watts[0] || 0];
    for (let i = 1; i < time.length; i++) {
        // Pausas largas (>10s) se colapsan a 1 segundo para suspender el NP
        const gap = Math.min(time[i] - time[i - 1], 10);
        const w = watts[i] || 0;
        for (let j = 0; j < gap; j++) activeWatts.push(w);
    }

    // Media móvil de 30s y acumulación de la 4ª potencia
    let sumNp = 0;
    let validCount = 0;
    let windowSum = 0;

    for (let i = 0; i < activeWatts.length; i++) {
        windowSum += activeWatts[i];
        if (i >= 29) {
            if (i > 29) windowSum -= activeWatts[i - 30];
            const sma = windowSum / 30;
            sumNp += Math.pow(sma, 4);
            validCount++;
        }
    }

    const np = validCount > 0 ? Math.pow(sumNp / validCount, 0.25) : 0;
    return { np, duration: activeWatts.length };
}

// ── 1. Calcular TSS de una actividad REAL ────────────────────────────────────
/**
 * Calcula el TSS (Training Stress Score) de una actividad real aplicando,
 * en orden de prioridad:
 *   ① Power TSS  → stream de vatios disponible (ciclismo)
 *   ② hrTSS      → stream de FC disponible
 *   ③ hrTSS avg  → sólo FC media disponible
 *   ④ Estimación por duración → sin datos fisiológicos
 *
 * @param {object} act       - Objeto actividad de la BD
 * @param {object} settings  - Settings del usuario (store)
 * @returns {{ tss: number, np?: number, intensity_factor?: number, method: string }}
 */
export function calculateActivityTSS(act, settings) {
    const { kY, kB } = genderConstants(settings.gender);
    const hrRest    = Number(settings.fcReposo) || 50;
    const sportSetts = resolveSportSettings(act.type, settings);
    const hrMax     = Number(sportSetts?.max) || 200;
    const lthr      = Number(sportSetts?.lthr) || 170;
    const hrRange   = hrMax - hrRest;
    const durMin    = act.duration || 0;

    const isBike = getSportCategory(act.type) === 'ride';

    // ① Power TSS — sólo para ciclismo
    if (isBike) {
        const ftp = Number(settings.bike?.ftp) || 200;

        // Con stream de vatios — método más preciso
        if (act.streams_data?.watts?.data && act.streams_data?.time?.data) {
            const { np, duration } = calculateNPAndDuration(
                act.streams_data.watts.data,
                act.streams_data.time.data,
            );
            if (duration > 0 && ftp > 0 && np > 0) {
                const intensityFactor = np / ftp;
                const tss = (duration * np * intensityFactor) / (ftp * 36);
                return { tss: Math.round(tss), np: Math.round(np), intensity_factor: intensityFactor, method: 'power' };
            }
        }

        // Con vatios medios — método aproximado
        if (act.watts_avg > 0) {
            const avgWatts   = Number(act.watts_avg);
            const durationSecs = durMin * 60;
            if (durationSecs > 0 && ftp > 0) {
                const intensityFactor = avgWatts / ftp;
                const tss = (durationSecs * avgWatts * intensityFactor) / (ftp * 36);
                return { tss: Math.round(tss), np: Math.round(avgWatts), intensity_factor: intensityFactor, method: 'power_avg' };
            }
        }
    }

    // Sin rango de FC válido o sin duración → no es posible calcular
    if (hrRange <= 0 || durMin <= 0) return { tss: 0, method: 'none' };

    const norm = trimpNorm1h(lthr, hrMax, hrRest, kY, kB);

    // ② hrTSS — stream de FC (método exacto segundo a segundo)
    if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
        const hrData   = act.streams_data.heartrate.data;
        const timeData = act.streams_data.time.data;
        let trimp = 0;
        for (let i = 1; i < hrData.length; i++) {
            const dt = (timeData[i] - timeData[i - 1]) / 60;
            if (dt > 5) continue; // Ignorar huecos grandes (pausas de seguimiento)
            const d = Math.max(0, (hrData[i] - hrRest) / hrRange);
            trimp += dt * d * kY * Math.exp(kB * d);
        }
        return { tss: Math.round((trimp / norm) * 100), method: 'hr_stream' };
    }

    // ③ hrTSS avg — sólo FC media (método de estimación constante)
    const hrAvg = Number(act.hr_avg);
    if (hrAvg && hrAvg > hrRest) {
        const d = (hrAvg - hrRest) / hrRange;
        const trimp = durMin * d * kY * Math.exp(kB * d);
        return { tss: Math.round((trimp / norm) * 100), method: 'hr_avg' };
    }

    // ④ Sin datos fisiológicos → estimación genérica por duración
    const cat = getSportCategory(act.type);
    if (cat === 'strength') return { tss: Math.round((durMin / 60) * 40), method: 'duration' };
    return { tss: Math.round((durMin / 60) * 25), method: 'duration' };
}

// ── 2. TSS/hora por zona (para estimación de planificación) ─────────────────
/**
 * Calcula el TSS estimado por hora de entrenamiento en cada zona de FC.
 * Se utiliza para estimar la carga de entrenamientos planificados.
 *
 * @param {string} sportType  - Tipo de deporte
 * @param {object} settings   - Settings del usuario
 * @returns {Record<string, number>}  - Mapa zona → TSS/hora (ej: { Z1: 20, Z2: 40, ... })
 */
export function computeZoneTssPerHour(sportType, settings) {
    const { kY, kB }     = genderConstants(settings.gender);
    const hrRest         = Number(settings.fcReposo) || 50;
    const sportSetts     = resolveSportSettings(sportType, settings);
    const lthr           = Number(sportSetts?.lthr) || 170;
    const hrMax          = Number(sportSetts?.max) || 200;
    const hrRange        = hrMax - hrRest;

    const fallback = { Z1: 20, Z2: 40, Z3: 60, Z4: 80, Z5: 100, Z6: 120, Z7: 140, R12: 30, R23: 50 };
    if (hrRange <= 0) return fallback;

    const dLthr             = (lthr - hrRest) / hrRange;
    const trimpPerMinAtLthr = dLthr * kY * Math.exp(kB * dLthr);

    const zones = sportSetts?.zones;
    const tph   = {};
    // Suelo mínimo: nadie entrena por debajo del ~65% del LTHR
    const minExerciseHR = lthr * 0.65;

    if (zones && zones.length > 0) {
        zones.forEach((z, i) => {
            const effectiveMin = Math.max(z.min, minExerciseHR);
            const typicalHR    = effectiveMin + (z.max - effectiveMin) * 0.6;
            const d            = Math.max(0, (typicalHR - hrRest) / hrRange);
            const trimpPerMin  = d * kY * Math.exp(kB * d);
            tph[`Z${i + 1}`]  = Math.round((trimpPerMin / trimpPerMinAtLthr) * 100);
        });
    }

    // Fallback por si faltan zonas
    for (let i = 1; i <= 7; i++) {
        if (!tph[`Z${i}`]) tph[`Z${i}`] = fallback[`Z${i}`];
    }
    tph.R12 = Math.round((tph.Z1 + tph.Z2) / 2);
    tph.R23 = Math.round((tph.Z2 + tph.Z3) / 2);
    tph.R34 = Math.round((tph.Z3 + tph.Z4) / 2);
    tph.R45 = Math.round((tph.Z4 + tph.Z5) / 2);
    return tph;
}

// ── 3. Estimar TSS a partir de bloques de entreno planificado ──────────────
/**
 * Estima el TSS total de un entreno planificado a partir de sus bloques.
 * Soporta bloques de HR por zona y bloques de vatios (Power TSS).
 *
 * @param {object[]} blocks     - Array de bloques del entreno planificado
 * @param {string}   sportType  - Tipo de deporte ('Run' | 'Ride' | 'Swim')
 * @param {object}   settings   - Settings del usuario
 * @returns {number|null}       - TSS estimado, o null si no hay bloques
 */
export function estimateTssFromBlocks(blocks, sportType, settings) {
    if (!blocks || blocks.length === 0) return null;

    const tph      = computeZoneTssPerHour(sportType, settings);
    const category = getSportCategory(sportType);
    const ftp      = Number(settings?.bike?.ftp || settings?.ftp || 0);

    // Velocidades de referencia por zona para estimar duración a partir de distancia (min/km ó min/100m)
    const ZONE_PACE = {
        Run:  { Z1: 7.0, R12: 6.5, Z2: 6.0, R23: 5.6, Z3: 5.2, R34: 4.85, Z4: 4.5, R45: 4.15, Z5: 3.8, Z6: 3.2 },
        Ride: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, R34: 2.1, Z4: 2.0, R45: 1.85, Z5: 1.7, Z6: 1.5 },
        Swim: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, R34: 2.1, Z4: 2.0, R45: 1.85, Z5: 1.7, Z6: 1.5 },
    };
    const sportPace = ZONE_PACE[sportType] || ZONE_PACE.Run;

    let totalTSS = 0;

    /** Convierte un bloque a minutos efectivos. */
    const getMins = (item) => {
        const dur = Number(item.duration) || 0;
        return item.unit === 'dist' ? dur * (sportPace[item.zone] || 5) : dur;
    };

    /** Calcula el TSS de un segmento (con o sin repeticiones). */
    const calcSegment = (item, reps = 1) => {
        const mins = getMins(item) * reps;
        if (mins <= 0) return 0;

        // Power TSS — sólo ciclismo con FTP configurado y vatios objetivo
        if (item.targetType === 'power' && item.targetValue && ftp > 0 && category === 'ride') {
            const tgtWatts = Number(item.targetValue);
            if (!isNaN(tgtWatts) && tgtWatts > 0) {
                // TSS = (segundos × NP²) / (FTP² × 36)
                const activeTSS = (mins * 60 * tgtWatts * tgtWatts) / (ftp * ftp * 36);
                return activeTSS;
            }
        }

        // hrTSS predictivo por zona
        const tssTarget = tph[item.zone] ?? tph.Z2;
        return (mins / 60) * tssTarget;
    };

    blocks.forEach(block => {
        if (block.type === 'repeat') {
            const reps = block.repeats || 1;
            (block.steps || []).forEach(step => {
                totalTSS += calcSegment(step, reps);
            });
        } else {
            totalTSS += calcSegment(block, 1);
        }
    });

    return Math.round(totalTSS);
}

// ── 4. TSS efectivo ponderado por fatiga del deporte ─────────────────────────
/**
 * Devuelve el TSS efectivo de una actividad aplicando el factor de fatiga
 * específico de su deporte (de SPORT_LOAD_CONFIG).
 *
 * @param {object} act  - Actividad con campos tss, sportCategory y/o type
 * @returns {number}
 */
export function getEffectiveTSS(act) {
    const tss = act.tss || 0;
    const cat = act.sportCategory || getSportCategory(act.type || '');
    const cfg = SPORT_LOAD_CONFIG[cat] || SPORT_LOAD_CONFIG.other;
    return Math.round(tss * cfg.fatigue);
}

// ── 5. Recalcular TSS de un plan almacenado ───────────────────────────────────
/**
 * Recalcula el TSS de un workout planificado a partir de su campo `description`
 * (que almacena los bloques en JSON). Si no hay bloques válidos, devuelve el TSS
 * almacenado en la BD como fallback.
 *
 * @param {object} plan      - Workout planificado (fila de la tabla planned_workouts)
 * @param {object} settings  - Settings del usuario
 * @returns {number}
 */
export function recalcTssFromBlocks(plan, settings) {
    try {
        const desc   = typeof plan.description === 'string' ? JSON.parse(plan.description) : plan.description;
        const blocks = desc?.blocks;
        if (!blocks || blocks.length === 0) return plan.tss || 0;
        return estimateTssFromBlocks(blocks, plan.type || 'Run', settings);
    } catch {
        return plan.tss || 0;
    }
}
