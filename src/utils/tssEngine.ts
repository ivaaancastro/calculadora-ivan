/**
 * tssEngine.ts — Fuente única de verdad para todos los cálculos de TSS / HRSS.
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

import { ZONE_PACE } from './zones';
import { activityDayKey, addDays, planDayKey, todayKey } from './dates';
import { acwr, fitnessTrend, monotonyStrain, rampAt, rollingLoad } from './load';

// ── Tipos compartidos ────────────────────────────────────────────────────────

export type SportCategory =
  | 'ride'
  | 'run'
  | 'swim'
  | 'walk'
  | 'yoga'
  | 'strength'
  | 'other';

export interface SportLoadEntry {
  fitness: number;
  fatigue: number;
}

export interface SportLoadConfig {
  ride: SportLoadEntry;
  run: SportLoadEntry;
  swim: SportLoadEntry;
  strength: SportLoadEntry;
  walk: SportLoadEntry;
  yoga: SportLoadEntry;
  other: SportLoadEntry;
}

export interface Activity {
  id?: string | number;
  strava_id?: string | number;
  date: string;
  type: string;
  name?: string;
  description?: string;
  duration?: number;
  hr_avg?: number;
  calories?: number;
  distance?: number;
  elevation_gain?: number;
  watts_avg?: number;
  speed_avg?: number;
  map_polyline?: string;
  tss?: number;
  sportCategory?: SportCategory;
  streams_data?: {
    watts?: { data: number[] };
    time?: { data: number[] };
    heartrate?: { data: number[] };
    [key: string]: unknown;
  };
}

export interface UserSettings {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  fcReposo?: number;
  weight?: number;
  run?: {
    max?: number;
    lthr?: number;
    zones?: { min: number; max: number }[];
    zonesMode?: 'lthr' | 'manual';
    thresholdPace?: string;
    paceZones?: unknown;
  };
  bike?: {
    max?: number;
    lthr?: number;
    zones?: { min: number; max: number }[];
    zonesMode?: 'lthr' | 'manual';
    ftp?: number;
  };
  swim?: {
    max?: number;
    lthr?: number;
    zones?: { min: number; max: number }[];
    zonesMode?: 'lthr' | 'manual';
  };
  ta?: number;
  tf?: number;
  intervalsId?: string;
  intervalsKey?: string;
  offsetCtl?: number;
}

export interface TssResult {
  tss: number;
  np?: number;
  intensity_factor?: number;
  method: string;
}

export interface PmcSeriesPoint {
  date: string;
  projected: boolean;
  ctl: number;
  atl: number;
  tsb: number;
  ctlRaw: number;
  atlRaw: number;
  ramp: number | null;
  dailyTss: number;
  dailyTssEffective: number;
}

export interface PmcMetrics {
  ctl: number;
  atl: number;
  tsb: number;
  ctlRaw: number;
  atlRaw: number;
  /** CTL sin ajuste manual ni redondeo: base de la calibración del Perfil. */
  rawCtl: number;
  rampRate: number;
  load7: number;
  acwr: number;
  loadTrend: number;
  monotony: number;
  strain: number;
}

interface DayLoad {
  tss: number;
  fitness: number;
  fatigue: number;
}

export interface PmcResult {
  fullSeries: PmcSeriesPoint[];
  metrics: PmcMetrics | null;
  loadHistory: number[];
}

export interface ZoneTssPerHour {
  [key: string]: number;
}

export interface WorkoutBlock {
  type?: 'segment' | 'repeat';
  duration?: number;
  unit?: 'min' | 'dist';
  zone?: string;
  targetType?: 'hr' | 'power';
  targetValue?: number;
  repeats?: number;
  steps?: WorkoutBlock[];
}

export interface PlannedWorkout {
  id?: string | number;
  user_id?: string;
  date: string;
  type?: string;
  description?: string;
  duration?: number;
  tss?: number;
  blocks?: WorkoutBlock[];
}

/**
 * Configuración de la contribución al PMC por tipo de deporte.
 * - fitness:           % de contribución al CTL (forma crónica)
 * - fatigue:           % de contribución al ATL (fatiga aguda)
 */
export const SPORT_LOAD_CONFIG: SportLoadConfig = {
  ride:     { fitness: 1.0, fatigue: 1.0 },
  run:      { fitness: 1.0, fatigue: 1.0 },
  swim:     { fitness: 1.0, fatigue: 1.0 },
  strength: { fitness: 0.0, fatigue: 1.0 }, // No construye CTL aeróbico
  walk:     { fitness: 0.0, fatigue: 0.5 },
  yoga:     { fitness: 0.0, fatigue: 0.2 },
  other:    { fitness: 1.0, fatigue: 1.0 },
};

// ── Clasificación de deporte ──────────────────────────────────────────────────
/**
 * Devuelve la categoría canónica de deporte a partir de un string de tipo.
 * Las categorías posibles son: 'ride' | 'run' | 'swim' | 'walk' | 'yoga' | 'strength' | 'other'
 */
export function getSportCategory(typeStr: string): SportCategory {
  const t = String(typeStr).toLowerCase();
  if (
    t.includes('weight') ||
    t.includes('fuerza') ||
    t.includes('crossfit') ||
    t.includes('workout') ||
    t.includes('gym')
  ) return 'strength';
  if (t.includes('yoga') || t.includes('stretch')) return 'yoga';
  if (
    t.includes('walk') ||
    t.includes('hike') ||
    t.includes('caminata') ||
    t.includes('senderismo') ||
    t.includes('trekking') ||
    t.includes('andar')
  ) return 'walk';
  if (
    t.includes('swim') ||
    t.includes('nadar') ||
    t.includes('natación') ||
    t.includes('natacion')
  ) return 'swim';
  if (
    t.includes('run') ||
    t.includes('correr') ||
    t.includes('carrera') ||
    t.includes('footing')
  ) return 'run';
  if (
    t.includes('ride') ||
    t.includes('ciclismo') ||
    t.includes('bici') ||
    t.includes('bike')
  ) return 'ride';
  return 'other';
}

// ── Constantes de género Banister ─────────────────────────────────────────────
type Gender = 'male' | 'female';

interface GenderConstants {
  kY: number;
  kB: number;
}

function genderConstants(gender: Gender): GenderConstants {
  const isMale = gender !== 'female';
  return { kY: isMale ? 0.64 : 0.86, kB: isMale ? 1.92 : 1.67 };
}

// ── Resolución de ajustes por deporte ────────────────────────────────────────
/**
 * Devuelve el bloque de settings (bike | run | swim) correspondiente al tipo
 * de actividad. Usa getSportCategory para no duplicar la lógica de detección.
 */
function resolveSportSettings(
  sportType: string,
  settings: UserSettings
): UserSettings['bike'] | UserSettings['run'] | UserSettings['swim'] | null {
  const category = getSportCategory(sportType);
  if (category === 'ride') return settings.bike ?? null;
  if (category === 'swim') return settings.swim ?? settings.run ?? null;
  return settings.run ?? null; // run, walk, strength, yoga, other → usa run como base
}

// ── Normalización TRIMP (1h @ LTHR) ──────────────────────────────────────────
/**
 * Calcula el TRIMP de referencia: el resultado de entrenar 1 hora exacta al LTHR.
 * Se usa para normalizar el TRIMP de cualquier actividad → HRSS.
 */
function trimpNorm1h(
  lthr: number,
  hrMax: number,
  hrRest: number,
  kY: number,
  kB: number
): number {
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
 */
function calculateNPAndDuration(
  watts: number[],
  time: number[]
): { np: number; duration: number } {
  if (!watts || !time || watts.length < 2) return { np: 0, duration: 0 };

  // Reconstruir stream a 1Hz asegurando potencia continua
  const activeWatts: number[] = [watts[0] || 0];
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
 */
export function calculateActivityTSS(
  act: Activity,
  settings: UserSettings
): TssResult {
  const { kY, kB } = genderConstants(settings.gender ?? 'male');
  const hrRest = Number(settings.fcReposo) || 50;
  const sportSetts = resolveSportSettings(act.type, settings);
  const hrMax = Number(sportSetts?.max) || 200;
  const lthr = Number(sportSetts?.lthr) || 170;
  const hrRange = hrMax - hrRest;
  const durMin = act.duration || 0;

  const isBike = getSportCategory(act.type) === 'ride';

  // ① Power TSS — sólo para ciclismo
  if (isBike) {
    const ftp = Number(settings.bike?.ftp) || 200;

    // Con stream de vatios — método más preciso
    if (
      act.streams_data?.watts?.data &&
      act.streams_data?.time?.data
    ) {
      const { np, duration } = calculateNPAndDuration(
        act.streams_data.watts.data,
        act.streams_data.time.data,
      );
      if (duration > 0 && ftp > 0 && np > 0) {
        const intensityFactor = np / ftp;
        const tss = (duration * np * intensityFactor) / (ftp * 36);
        return {
          tss: Math.round(tss),
          np: Math.round(np),
          intensity_factor: intensityFactor,
          method: 'power',
        };
      }
    }

    // Con vatios medios — método aproximado
    if (act.watts_avg > 0) {
      const avgWatts = Number(act.watts_avg);
      const durationSecs = durMin * 60;
      if (durationSecs > 0 && ftp > 0) {
        const intensityFactor = avgWatts / ftp;
        const tss = (durationSecs * avgWatts * intensityFactor) / (ftp * 36);
        return {
          tss: Math.round(tss),
          np: Math.round(avgWatts),
          intensity_factor: intensityFactor,
          method: 'power_avg',
        };
      }
    }
  }

  // Sin rango de FC válido o sin duración → no es posible calcular
  if (hrRange <= 0 || durMin <= 0)
    return { tss: 0, method: 'none' };

  const norm = trimpNorm1h(lthr, hrMax, hrRest, kY, kB);

  // ② hrTSS — stream de FC (método exacto segundo a segundo)
  if (
    act.streams_data?.heartrate?.data &&
    act.streams_data?.time?.data
  ) {
    const hrData = act.streams_data.heartrate.data;
    const timeData = act.streams_data.time.data;
    let trimp = 0;
    for (let i = 1; i < hrData.length; i++) {
      const dt = (timeData[i] - timeData[i - 1]) / 60;
      if (dt > 5) continue;
      const d = Math.max(0, (hrData[i] - hrRest) / hrRange);
      trimp += dt * d * kY * Math.exp(kB * d);
    }
    const hrss = (trimp / norm) * 100;
    const durationHours =
      (timeData[timeData.length - 1] - timeData[0]) / 3600;
    const intensityFactor =
      durationHours > 0 ? Math.sqrt(hrss / (durationHours * 100)) : 0;

    return {
      tss: Math.round(hrss),
      intensity_factor: intensityFactor,
      method: 'hr_stream',
    };
  }

  // ③ hrTSS avg — sólo FC media (método de estimación constante)
  const hrAvg = Number(act.hr_avg);
  if (hrAvg && hrAvg > hrRest) {
    const d = (hrAvg - hrRest) / hrRange;
    const trimp = durMin * d * kY * Math.exp(kB * d);
    const hrss = (trimp / norm) * 100;
    const durationHours = durMin / 60;
    const intensityFactor =
      durationHours > 0 ? Math.sqrt(hrss / (durationHours * 100)) : 0;

    return {
      tss: Math.round(hrss),
      intensity_factor: intensityFactor,
      method: 'hr_avg',
    };
  }

  // ④ Sin datos fisiológicos → estimación genérica por duración
  const cat = getSportCategory(act.type);
  const estimatedTss =
    cat === 'strength' ? (durMin / 60) * 40 : (durMin / 60) * 25;
  const durationHours = durMin / 60;
  const intensityFactor =
    durationHours > 0 ? Math.sqrt(estimatedTss / (durationHours * 100)) : 0;

  return {
    tss: Math.round(estimatedTss),
    intensity_factor: intensityFactor,
    method: 'duration',
  };
}

// ── 2. TSS/hora por zona (para estimación de planificación) ─────────────────
/**
 * Calcula el TSS estimado por hora de entrenamiento en cada zona de FC.
 * Se utiliza para estimar la carga de entrenamientos planificados.
 */
export function computeZoneTssPerHour(
  sportType: string,
  settings: UserSettings
): ZoneTssPerHour {
  const { kY, kB } = genderConstants(settings.gender ?? 'male');
  const hrRest = Number(settings.fcReposo) || 50;
  const sportSetts = resolveSportSettings(sportType, settings);
  const lthr = Number(sportSetts?.lthr) || 170;
  const hrMax = Number(sportSetts?.max) || 200;
  const hrRange = hrMax - hrRest;

  const fallback: ZoneTssPerHour = {
    Z1: 20,
    Z2: 40,
    Z3: 60,
    Z4: 80,
    Z5: 100,
    Z6: 120,
    Z7: 140,
    R12: 30,
    R23: 50,
  };
  if (hrRange <= 0) return fallback;

  const dLthr = (lthr - hrRest) / hrRange;
  const trimpPerMinAtLthr = dLthr * kY * Math.exp(kB * dLthr);

  const zones = sportSetts?.zones;
  const tph: ZoneTssPerHour = {};
  // Suelo mínimo: nadie entrena por debajo del ~65% del LTHR
  const minExerciseHR = lthr * 0.65;

  if (zones && zones.length > 0) {
    zones.forEach((z, i) => {
      const effectiveMin = Math.max(z.min, minExerciseHR);
      const typicalHR = effectiveMin + (z.max - effectiveMin) * 0.6;
      const d = Math.max(0, (typicalHR - hrRest) / hrRange);
      const trimpPerMin = d * kY * Math.exp(kB * d);
      tph[`Z${i + 1}`] = Math.round(
        (trimpPerMin / trimpPerMinAtLthr) * 100
      );
    });
  }

  // Fallback por si faltan zonas
  for (let i = 1; i <= 7; i++) {
    if (!tph[`Z${i}`]) tph[`Z${i}`] = fallback[`Z${i}` as keyof typeof fallback];
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
 */
export function estimateTssFromBlocks(
  blocks: WorkoutBlock[],
  sportType: string,
  settings: UserSettings
): number | null {
  if (!blocks || blocks.length === 0) return null;

  const tph = computeZoneTssPerHour(sportType, settings);
  const category = getSportCategory(sportType);
  const ftp = Number(settings?.bike?.ftp || settings?.ftp || 0);

  const sportPace = ZONE_PACE[sportType as keyof typeof ZONE_PACE] || ZONE_PACE.Run;

  let totalTSS = 0;

  /** Convierte un bloque a minutos efectivos. */
  const getMins = (item: WorkoutBlock): number => {
    const dur = Number(item.duration) || 0;
    return item.unit === 'dist'
      ? dur * (sportPace[(item.zone ?? 'Z2') as keyof typeof sportPace] ?? 5)
      : dur;
  };

  /** Calcula el TSS de un segmento (con o sin repeticiones). */
  const calcSegment = (item: WorkoutBlock, reps = 1): number => {
    const mins = getMins(item) * reps;
    if (mins <= 0) return 0;

    // Power TSS — sólo ciclismo con FTP configurado y vatios objetivo
    if (
      item.targetType === 'power' &&
      item.targetValue &&
      ftp > 0 &&
      category === 'ride'
    ) {
      const tgtWatts = Number(item.targetValue);
      if (!isNaN(tgtWatts) && tgtWatts > 0) {
        // TSS = (segundos × NP²) / (FTP² × 36)
        const activeTSS = (mins * 60 * tgtWatts * tgtWatts) / (ftp * ftp * 36);
        return activeTSS;
      }
    }

    // hrTSS predictivo por zona
    const tssTarget = tph[item.zone ?? 'Z2'] ?? tph.Z2;
    return (mins / 60) * tssTarget;
  };

  blocks.forEach((block) => {
    if (block.type === 'repeat') {
      const reps = block.repeats || 1;
      (block.steps || []).forEach((step) => {
        totalTSS += calcSegment(step, reps);
      });
    } else {
      totalTSS += calcSegment(block, 1);
    }
  });

  return Math.round(totalTSS);
}

// ── 5. Recalcular TSS de un plan almacenado ───────────────────────────────────
/**
 * Recalcula el TSS de un workout planificado a partir de su campo `description`
 * (que almacena los bloques en JSON). Si no hay bloques válidos, devuelve el TSS
 * almacenado en la BD como fallback.
 */
export function recalcTssFromBlocks(
  plan: PlannedWorkout,
  settings: UserSettings
): number {
  try {
    const desc =
      typeof plan.description === 'string'
        ? JSON.parse(plan.description)
        : plan.description;
    const blocks = desc?.blocks;
    if (!blocks || blocks.length === 0) return plan.tss || 0;
    return estimateTssFromBlocks(
      blocks,
      plan.type || 'Run',
      settings
    );
  } catch {
    return plan.tss || 0;
  }
}

/** Días que se proyectan después de hoy con los entrenos planificados. */
export const PMC_PROJECTION_DAYS = 90;

/** Entero sin `-0`. */
const whole = (n: number): number => Math.round(n) || 0;

/**
 * Performance Management Chart: media móvil exponencial (`ta`/`tf` días) de la carga diaria, desde
 * la primera actividad hasta hoy + 90. Hasta hoy cuenta lo realizado; después, los planes.
 *
 * TSB, convención «hoy» (D1): CTL y ATL del mismo día, redondeados, y TSB = su resta, para que
 * siempre cuadre con lo que se ve. `ctlRaw`/`atlRaw` (sin redondear) son para dibujar y calcular.
 */
export function calculatePMC(
  activities: Activity[],
  settings: UserSettings = {},
  plannedWorkouts: PlannedWorkout[] = [],
  { today = todayKey() }: { today?: string } = {}
): PmcResult {
  const empty: PmcResult = { fullSeries: [], metrics: null, loadHistory: [] };
  if (!activities || activities.length === 0) return empty;

  // 1. Carga por día y su contribución a CTL y ATL
  const done = new Map<string, DayLoad>();
  const planned = new Map<string, DayLoad>();
  const addLoad = (days: Map<string, DayLoad>, key: string, item: Activity | PlannedWorkout) => {
    if (!key) return;
    const category = (item as Activity).sportCategory || getSportCategory(item.type ?? '');
    const cfg = SPORT_LOAD_CONFIG[category] ?? SPORT_LOAD_CONFIG.other;
    const tss = item.tss || 0;
    const day = days.get(key) ?? { tss: 0, fitness: 0, fatigue: 0 };
    day.tss += tss;
    day.fitness += tss * cfg.fitness;
    day.fatigue += tss * cfg.fatigue;
    days.set(key, day);
  };
  activities.forEach((act) => addLoad(done, activityDayKey(act.date), act));
  (plannedWorkouts || []).forEach((plan) => addLoad(planned, planDayKey(plan.date), plan));
  if (done.size === 0) return empty;

  // 2. Modelo
  const ta = settings.ta || 42;
  const tf = settings.tf || 7;
  const kCtl = Math.exp(-1 / ta);
  const kAtl = Math.exp(-1 / tf);
  const offsetCtl = parseFloat(String(settings.offsetCtl)) || 0;

  // 3. Día a día. El ajuste manual se suma al final: no entra en la media, así que no decae.
  const firstDone = [...done.keys()].sort()[0];
  const start = firstDone < today ? firstDone : today;
  const end = addDays(today, PMC_PROJECTION_DAYS);
  let ctl = 0;
  let atl = 0;
  const fullSeries: PmcSeriesPoint[] = [];
  const ctlValues: number[] = [];
  const loadHistory: number[] = [];

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const projected = date > today;
    const day = (projected ? planned : done).get(date) ?? { tss: 0, fitness: 0, fatigue: 0 };
    ctl = ctl * kCtl + day.fitness * (1 - kCtl);
    atl = atl * kAtl + day.fatigue * (1 - kAtl);
    if (!projected) loadHistory.push(day.fatigue);

    const ctlRaw = ctl + offsetCtl;
    ctlValues.push(ctlRaw);
    fullSeries.push({
      date,
      projected,
      ctl: whole(ctlRaw),
      atl: whole(atl),
      tsb: whole(ctlRaw) - whole(atl),
      ctlRaw,
      atlRaw: atl,
      ramp: rampAt(ctlValues, ctlValues.length - 1),
      dailyTss: Math.round(day.tss),
      dailyTssEffective: Math.round(day.fatigue),
    });
  }

  // 4. Métricas de hoy
  const todayIdx = loadHistory.length - 1;
  const point = fullSeries[todayIdx];
  const metrics: PmcMetrics = {
    ctl: point.ctl,
    atl: point.atl,
    tsb: point.tsb,
    ctlRaw: point.ctlRaw,
    atlRaw: point.atlRaw,
    rawCtl: point.ctlRaw - offsetCtl,
    rampRate: point.ramp ?? 0,
    load7: rollingLoad(activities, today),
    acwr: acwr(loadHistory) ?? 0,
    loadTrend: fitnessTrend(ctlValues, todayIdx),
    ...monotonyStrain(loadHistory),
  };

  return { fullSeries, metrics, loadHistory };
}
