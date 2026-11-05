/**
 * fitnessStatsEngine.ts — Motor de Estadísticas de Rendimiento
 *
 * Funciones exportadas:
 *  1.  estimateFTP               — eFTP mediante tabla de ratios (estilo intervals.icu)
 *  2.  estimateCyclingVO2max     — VO2max ciclismo (pico 5min MAP + estado estable)
 *  3.  estimateRunningVO2max     — VO2max carrera (pace/HR extrapolación)
 *  4.  predictRaceTimes          — Pronóstico de carrera (Daniels VDOT + penalización volumen)
 *  5.  calculateTrainingEffect   — Efecto aeróbico / anaeróbico de la última sesión
 *  6.  getTrainingBalance         — Distribución de carga (7/14/28 días)
 *  7.  analyzePowerProfile        — Perfil sprint/anaeróbico desde eFTP + W'
 *  8.  calculateDanielsPaces      — Ritmos Daniels E/M/T/I/R desde VO2max
 *  9.  estimateThresholdPace      — Ritmo umbral estimado
 * 10. calculatePowerZones        — Zonas de potencia Coggan desde eFTP
 * 11. calculateFTPHistory        — Evolución del eFTP en los últimos meses
 * 12. calculateFitnessScore      — Score global 0-100 (VO2max + W/kg + CTL)
 * 13. analyzeIntensityDistribution — Distribución de intensidad (90 días)
 * 14. getPowerProfileBenchmarks  — Comparación W/kg vs nivel Coggan
 * 15. getTrainingStatus          — Estado de entreno (Garmin Training Status style)
 * 16. getHRVAnalysis             — Análisis de variabilidad cardíaca
 */

// ── Tipos compartidos ────────────────────────────────────────────────────────

export type Activity = {
  id?: string | number;
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
  tss?: number;
  hrv_rmssd?: number;
  intensity_factor?: number;
  streams_data?: {
    watts?: { data: number[] };
    time?: { data: number[] };
    heartrate?: { data: number[] };
    velocity_smooth?: { data: number[] };
    [key: string]: unknown;
  };
};

export interface UserSettings {
  weight?: number;
  fcReposo?: number;
  bike?: {
    max?: number;
    lthr?: number;
    ftp?: number;
  };
  run?: {
    max?: number;
    lthr?: number;
    thresholdPace?: string;
  };
}

export interface FtpResult {
  eFTP: number | null;
  wPerKg: string | null;
  method: string;
  description: string;
  anchorDuration?: string;
  anchorPower?: number;
  anchorActivity: { id?: string | number; name?: string; date?: string } | null;
  powerCurve: { secs: number; power: number; activity?: { id?: string | number; name?: string; date?: string } }[];
  modeledCurve: { secs: number; power: number }[];
  model: {
    cp: number;
    wPrime: number;
    wPrimeRaw: number;
    pMax: number;
    eFTP: number;
  } | null;
}

export interface Vo2MaxResult {
  vo2max: number;
  method: string;
  description: string;
  activity: { id?: string | number; name?: string } | null;
}

export interface RacePrediction {
  name: string;
  distance: number;
  emoji: string;
  time: string;
  timeMinutes: number;
  pace: string;
  preparation: number;
}

export interface TrainingEffectResult {
  aerobic: { score: number; label: string; color: string };
  anaerobic: { score: number; label: string; color: string };
  primaryBenefit: string;
  benefitDesc: string;
  peakEpoc: number;
}

export interface TrainingBalanceResult {
  aerobicLow: number;
  aerobicHigh: number;
  anaerobic: number;
  totalLoad: number;
  maxScale: number;
  pcts: { low: number; high: number; anaerobic: number };
  targets: {
    low: { min: number; max: number; pctMin: number; pctMax: number; label: string };
    high: { min: number; max: number; pctMin: number; pctMax: number; label: string };
    anaerobic: { min: number; max: number; pctMin: number; pctMax: number; label: string };
  };
  recommendation: string;
  status: string;
  color: string;
  details: string;
  activityCount: number;
}

export interface PowerProfileAnalysis {
  sprint: string;
  anaerobic: number;
  strengths: { area: string; desc: string; level: 'elite' | 'good' | 'weak' }[];
}

export interface DanielsPaceZone {
  name: string;
  label: string;
  pctVo2: number;
  desc: string;
  pace: string;
  paceDecimal: number;
  speedKmh: number;
}

export interface ThresholdPaceResult {
  pace: string;
  paceDecimal: number;
  speedKmh: number;
  configuredPace: string | null;
  configPaceDecimal: number | null;
  diff: number | null;
}

export interface PowerZone {
  zone: number;
  name: string;
  pctMin: number;
  pctMax: number;
  min: number;
  max: number | null;
  color: string;
}

export interface FTPHistoryEntry {
  label: string;
  date: string;
  eFTP: number;
  wPerKg: number;
}

export interface FitnessScoreResult {
  score: number;
  label: string;
  color: string;
  emoji: string;
  breakdown: {
    vo2: number | null;
    ftp: number | null;
    ctl: number | null;
  };
}

export interface IntensityZone {
  name: string;
  label: string;
  pct: number;
  hours: number;
  color: string;
}

export interface IntensityDistributionResult {
  zones: IntensityZone[];
  totalHours: number;
  pattern: string;
  patternDesc: string;
  patternColor: string;
}

export interface PowerProfileBenchmarks {
  userPoints: { label: string; wKg: number; power: number; duration: number }[];
  references: { category: string; [key: string]: number }[];
  weight: number;
  eFTP: number;
}

export interface TrainingStatusResult {
  status: string;
  desc: string;
  color: string;
  load7: number;
  load28: number;
  tsb: number;
}

export interface HrVAnalysisResult {
  rmssd: number;
  baseline: number;
  state: string;
  color: string;
  msg: string;
  source: string;
  stress: number;
}

// ── Constantes internas ──────────────────────────────────────────────────────

const FTP_RATIO_TABLE = [
  { secs: 1, ratio: 5.60 },
  { secs: 5, ratio: 4.20 },
  { secs: 10, ratio: 3.20 },
  { secs: 30, ratio: 2.10 },
  { secs: 60, ratio: 1.70 },
  { secs: 120, ratio: 1.45 },
  { secs: 180, ratio: 1.35 },
  { secs: 300, ratio: 1.25 },
  { secs: 480, ratio: 1.18 },
  { secs: 600, ratio: 1.14 },
  { secs: 900, ratio: 1.09 },
  { secs: 1200, ratio: 1.053 },
  { secs: 1800, ratio: 1.025 },
  { secs: 3600, ratio: 1.00 },
];

const CURVE_DURATIONS = [1, 3, 5, 10, 15, 30, 60, 120, 180, 300, 480, 600, 900, 1200, 1800, 2400, 3600, 5400, 7200];

const EFTP_MIN_SECS = 300;
const EFTP_MAX_SECS = 1800;

// ── Helpers internos ─────────────────────────────────────────────────────────

function interpolateRatio(secs: number): number {
  const table = FTP_RATIO_TABLE;
  if (secs <= table[0].secs) return table[0].ratio;
  if (secs >= table[table.length - 1].secs) return table[table.length - 1].ratio;
  for (let i = 0; i < table.length - 1; i++) {
    if (secs >= table[i].secs && secs <= table[i + 1].secs) {
      const t = (Math.log(secs) - Math.log(table[i].secs)) / (Math.log(table[i + 1].secs) - Math.log(table[i].secs));
      return table[i].ratio + t * (table[i + 1].ratio - table[i].ratio);
    }
  }
  return 1.0;
}

/**
 * Encuentra la potencia máxima promedio en una ventana de `windowSecs` segundos.
 */
function getPeakPower(wattsData: number[], timeData: number[], windowSecs: number): number {
  if (!wattsData || !timeData || wattsData.length === 0) return 0;

  let maxAvg = 0;
  let startIdx = 0;
  let currentEnergy = 0;

  for (let endIdx = 1; endIdx < timeData.length; endIdx++) {
    const dt = timeData[endIdx] - timeData[endIdx - 1];
    const energyContribution = dt > 5 ? 0 : wattsData[endIdx] * dt;
    currentEnergy += energyContribution;

    while (timeData[endIdx] - timeData[startIdx] > windowSecs) {
      const dtStart = timeData[startIdx + 1] - timeData[startIdx];
      const energyToRemove = dtStart > 5 ? 0 : wattsData[startIdx + 1] * dtStart;
      currentEnergy -= energyToRemove;
      startIdx++;
    }

    const windowDuration = timeData[endIdx] - timeData[startIdx];
    if (windowDuration >= windowSecs * 0.98) {
      const avg = currentEnergy / windowSecs;
      if (avg > maxAvg) maxAvg = avg;
    }
  }
  return maxAvg;
}

function getPeakWindowWithSecondary(
  primaryData: number[],
  secondaryData: number[],
  time: number[],
  windowSecs: number
): { avgPrimary: number; avgSecondary: number } | null {
  let bestPrimary = 0;
  let bestSecondary = 0;

  for (let i = 0; i < time.length; i++) {
    let sumP = 0, sumS = 0, count = 0;
    const endTime = time[i] + windowSecs;
    let j = i;
    while (j < time.length && time[j] <= endTime) {
      sumP += primaryData[j];
      sumS += secondaryData[j];
      count++;
      j++;
    }
    if (count > windowSecs * 0.8) {
      const avgP = sumP / count;
      if (avgP > bestPrimary) {
        bestPrimary = avgP;
        bestSecondary = sumS / count;
      }
    }
  }
  return bestPrimary > 0 ? { avgPrimary: bestPrimary, avgSecondary: bestSecondary } : null;
}

function getPeakPowerWithHR(
  watts: number[],
  hr: number[],
  time: number[],
  windowSecs: number
): { avgW: number; avgHR: number } | null {
  const result = getPeakWindowWithSecondary(watts, hr, time, windowSecs);
  if (!result) return null;
  return { avgW: result.avgPrimary, avgHR: result.avgSecondary };
}

function getPeakSpeedWithHR(
  speed: number[],
  hr: number[],
  time: number[],
  windowSecs: number
): { avgS: number; avgHR: number } | null {
  const result = getPeakWindowWithSecondary(speed, hr, time, windowSecs);
  if (!result) return null;
  return { avgS: result.avgPrimary, avgHR: result.avgSecondary };
}

function vo2ToSpeed(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(vo2 + 4.6);
  const disc = b * b - 4 * a * c;
  if (disc < 0) return 0;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

function sustainableFraction(t: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
}

function estimateRaceTime(vo2max: number, distKm: number): number | null {
  if (!vo2max || vo2max <= 0) return null;
  const dM = distKm * 1000;
  let tG = dM / (vo2ToSpeed(vo2max * 0.85));
  for (let i = 0; i < 50; i++) {
    const v = vo2ToSpeed(vo2max * sustainableFraction(tG));
    if (v <= 0) return null;
    const tC = dM / v;
    if (Math.abs(tC - tG) < 0.1) { tG = tC; break; }
    tG += (tC - tG) * 0.5;
  }
  return tG * 1.03;
}

function fmtTime(m: number): string {
  if (!m || m <= 0) return '--';
  const h = Math.floor(m / 60);
  const mi = Math.floor(m % 60);
  const s = Math.round((m % 1) * 60);
  if (h > 0) return `${h}:${mi.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${mi}:${s.toString().padStart(2, '0')}`;
}

function fmtPace(d: number): string {
  if (!d || d >= 20) return '>20:00';
  const m = Math.floor(d);
  const s = Math.round((d - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getRunningStats(activities: Activity[]): {
  avgWeeklyKm: number;
  maxLongRun: number;
  consistency: number;
} {
  if (!activities || activities.length === 0) return { avgWeeklyKm: 0, maxLongRun: 0, consistency: 0 };

  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));

  const runs = activities.filter((a) => {
    const t = String(a.type).toLowerCase();
    return (t.includes('run') || t.includes('carrera')) && new Date(a.date) >= fourWeeksAgo;
  });

  if (runs.length === 0) return { avgWeeklyKm: 0, maxLongRun: 0, consistency: 0 };

  const totalDistance = runs.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000;
  const maxLongRun = Math.max(...runs.map((a) => (a.distance || 0) / 1000));

  return {
    avgWeeklyKm: totalDistance / 4,
    maxLongRun,
    consistency: runs.length / 4,
  };
}

function getVolumePenalty(distKm: number, stats: ReturnType<typeof getRunningStats>): number {
  const vol = stats.avgWeeklyKm;
  const lRun = stats.maxLongRun;

  const requiredVol: Record<number, number> = {
    5: 20,
    10: 35,
    21.1: 50,
    42.2: 70,
  };

  const rv = requiredVol[distKm] || distKm * 2;
  let penalty = 0;

  if (vol < rv) {
    const sensitivity = distKm / 42.2;
    penalty += (1 - (vol / rv)) * 0.25 * sensitivity;
  }

  if (distKm >= 21.1) {
    const minLongRun = distKm * 0.7;
    if (lRun < minLongRun) {
      penalty += (1 - (lRun / minLongRun)) * 0.15 * (distKm / 42.2);
    }
  }

  return 1 + Math.max(0, penalty);
}

// ── Funciones exportadas ─────────────────────────────────────────────────────

export function estimateFTP(
  activities: Activity[],
  settings: UserSettings,
  options?: { days?: number }
): FtpResult {
  const days = options?.days !== undefined ? options.days : 90;
  const today = new Date();
  let cutoffDate: Date | null = null;
  if (days !== null && days > 0) {
    cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);
  }
  const weight = Number(settings?.weight) || 70;

  const bikeActivities = activities.filter((act) => {
    const t = String(act.type).toLowerCase();
    const matchesSport = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    const matchesDate = cutoffDate ? new Date(act.date) >= cutoffDate : true;
    return matchesSport && matchesDate && act.streams_data?.watts?.data && act.streams_data?.time?.data;
  });

  if (bikeActivities.length === 0) {
    return {
      eFTP: null,
      method: 'none',
      description: 'Sin datos de potencia',
      powerCurve: [],
      modeledCurve: [],
      model: null,
    };
  }

  const actualCurve: { secs: number; power: number; activity?: { id?: string | number; name?: string; date?: string } }[] = [];
  CURVE_DURATIONS.forEach((secs) => {
    let bestPower = 0;
    let bestAct: { id?: string | number; name?: string; date?: string } | null = null;
    bikeActivities.forEach((act) => {
      const peak = getPeakPower(act.streams_data!.watts!.data, act.streams_data!.time!.data, secs);
      if (peak > bestPower) {
        bestPower = peak;
        bestAct = { id: act.id, name: act.name, date: act.date };
      }
    });
    if (bestPower > 0) actualCurve.push({ secs, power: Math.round(bestPower), activity: bestAct });
  });

  let bestEFTP = 0;
  let bestEstimate: { secs: number; power: number; ratio: number; activity: { id?: string | number; name?: string; date?: string } } | null = null;

  actualCurve
    .filter((p) => p.secs >= EFTP_MIN_SECS && p.secs <= EFTP_MAX_SECS)
    .forEach((p) => {
      const ratio = interpolateRatio(p.secs);
      const eFTP = p.power / ratio;
      if (eFTP > bestEFTP) {
        bestEFTP = eFTP;
        bestEstimate = { secs: p.secs, power: p.power, ratio, activity: p.activity! };
      }
    });

  if (!bestEstimate) {
    const longestEffort = actualCurve.filter((p) => p.secs >= 60).sort((a, b) => b.secs - a.secs)[0];
    if (longestEffort) {
      const ratio = interpolateRatio(longestEffort.secs);
      bestEFTP = longestEffort.power / ratio;
      bestEstimate = { secs: longestEffort.secs, power: longestEffort.power, ratio, activity: longestEffort.activity! };
    }
  }

  const eFTP = bestEstimate ? Math.round(bestEFTP) : null;

  let model: FtpResult['model'] = null;
  let modeledCurve: { secs: number; power: number }[] = [];
  if (eFTP && actualCurve.length >= 2) {
    const shortEfforts = actualCurve
      .filter((p) => p.power > eFTP * 1.01)
      .sort((a, b) => a.secs - b.secs);
    const shortEffort = shortEfforts[0];

    if (shortEffort) {
      const wPrime = (shortEffort.power - eFTP) * 3600 * shortEffort.secs / (3600 - shortEffort.secs);
      const cp = eFTP - wPrime / 3600;

      if (cp > 0 && wPrime > 1000 && wPrime < 80000) {
        const pMax = cp + wPrime / 1;
        model = { cp: Math.round(cp), wPrime: Math.round(wPrime / 1000), wPrimeRaw: Math.round(wPrime), pMax: Math.round(pMax), eFTP };
        modeledCurve = CURVE_DURATIONS.filter((t) => t >= 1).map((t) => ({
          secs: t,
          power: Math.round(cp + wPrime / t),
        }));
      }
    }
  }

  const durationLabel = bestEstimate
    ? bestEstimate.secs < 60
      ? `${bestEstimate.secs}s`
      : bestEstimate.secs < 3600
        ? `${bestEstimate.secs / 60}min`
        : `${bestEstimate.secs / 3600}h`
    : '';

  return {
    eFTP,
    wPerKg: eFTP ? (eFTP / weight).toFixed(2) : null,
    method: eFTP ? 'ratio' : 'none',
    description: eFTP ? `Mejor esfuerzo de ${durationLabel}: ${bestEstimate.power}W → eFTP ${eFTP}W` : 'Sin datos suficientes',
    anchorDuration: durationLabel,
    anchorPower: bestEstimate?.power || 0,
    anchorActivity: bestEstimate?.activity || null,
    powerCurve: actualCurve,
    modeledCurve,
    model,
  };
}

export function estimateCyclingVO2max(activities: Activity[], settings: UserSettings): Vo2MaxResult {
  const today = new Date();
  const d45 = new Date(today);
  d45.setDate(today.getDate() - 45);
  const weight = Number(settings?.weight) || 70;
  const hrRest = Number(settings?.fcReposo) || 50;
  const hrMax = Number(settings?.bike?.max || settings?.run?.max) || 190;
  const hrRange = hrMax - hrRest;

  if (hrRange <= 0) return { vo2max: 0, method: 'error', description: 'FC Max/Reposo no configuradas' };

  const candidates: { vo2: number; quality: number; method: string; actId?: string | number; actName?: string; description: string }[] = [];

  activities.forEach((act) => {
    const t = String(act.type).toLowerCase();
    const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    if (!isBike || new Date(act.date) < d45) return;

    const streams = act.streams_data;
    if (streams?.watts?.data && streams?.heartrate?.data && streams?.time?.data) {
      const watts = streams.watts.data;
      const hr = streams.heartrate.data;
      const time = streams.time.data;

      [300, 480, 600, 900, 1200].forEach((duration) => {
        const peak = getPeakPowerWithHR(watts, hr, time, duration);
        if (peak && peak.avgW > 100 && peak.avgHR > hrRest + hrRange * 0.70) {
          const pctHRR = (peak.avgHR - hrRest) / hrRange;
          const vo2Cost = (peak.avgW * 10.8) / weight + 7;
          const estVO2max = vo2Cost / pctHRR;
          if (estVO2max > 20 && estVO2max < 85) {
            candidates.push({
              vo2: estVO2max,
              quality: pctHRR,
              method: 'peak_effort',
              actId: act.id,
              actName: act.name,
              description: 'Basado en mejores esfuerzos aeróbicos (5-20min)',
            });
          }
        }
      });

      const windowSize = 180;
      const thresholdHR = hrRest + hrRange * 0.65;

      for (let i = 0; i < time.length - windowSize; i += windowSize / 2) {
        let sW = 0, sH = 0, c = 0, minH = 999, maxH = 0;
        for (let j = i; j < i + windowSize && j < time.length; j++) {
          sW += watts[j];
          sH += hr[j];
          if (hr[j] < minH) minH = hr[j];
          if (hr[j] > maxH) maxH = hr[j];
          c++;
        }
        const avgW = sW / c;
        const avgH = sH / c;

        if (avgW > 120 && avgH > thresholdHR && (maxH - minH) <= 6) {
          const pctHRR = (avgH - hrRest) / hrRange;
          const estVO2max = ((avgW * 10.8) / weight + 7) / pctHRR;
          if (estVO2max > 20 && estVO2max < 85) {
            candidates.push({
              vo2: estVO2max,
              quality: pctHRR * 0.9,
              method: 'steady_state',
              description: 'Basado en estado estable (Garmin Firstbeat)',
            });
          }
        }
      }
    }
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.quality - a.quality);
    const top = candidates.slice(0, 5);
    const avgVo2 = top.reduce((a, b) => a + b.vo2, 0) / top.length;
    const best = top[0];

    return {
      vo2max: Number(avgVo2.toFixed(1)),
      method: best.method,
      description: best.description,
      activity: best.actId ? { id: best.actId, name: best.actName } : null,
    };
  }

  let bestMAP = 0;
  activities.forEach((act) => {
    const t = String(act.type).toLowerCase();
    if ((t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) && new Date(act.date) >= d45) {
      if (act.streams_data?.watts?.data && act.streams_data?.time?.data) {
        const map5 = getPeakPower(act.streams_data.watts.data, act.streams_data.time.data, 300);
        if (map5 > bestMAP) bestMAP = map5;
      }
    }
  });

  if (bestMAP > 0) {
    return {
      vo2max: Number(((bestMAP * 12.35) / weight + 7).toFixed(1)),
      method: 'map_fallback',
      description: 'Basado en potencia máxima (sin pulso)',
      activity: null,
    };
  }

  if (hrRest > 30 && hrMax > 120) {
    return {
      vo2max: Number((15.3 * (hrMax / hrRest) * 0.95).toFixed(1)),
      method: 'physiological_fallback',
      description: 'Estimado por frecuencia cardíaca (Uth-Sørensen)',
      activity: null,
    };
  }

  return { vo2max: 0, method: 'none', description: 'Sin datos suficientes' };
}

export function estimateRunningVO2max(activities: Activity[], settings: UserSettings): Vo2MaxResult {
  const today = new Date();
  const d45 = new Date(today);
  d45.setDate(today.getDate() - 45);
  const hrRest = Number(settings?.fcReposo) || 50;
  const hrMax = Number(settings?.run?.max || settings?.bike?.max) || 190;
  const hrRange = hrMax - hrRest;

  if (hrRange <= 0) return { vo2max: 0, method: 'error' };

  const candidates: { vo2: number; quality: number; method: string; actId?: string | number; actName?: string; description: string }[] = [];

  activities.forEach((act) => {
    const t = String(act.type).toLowerCase();
    const isRun = t.includes('run') || t.includes('carrera');
    if (!isRun || new Date(act.date) < d45 || (act.duration || 0) < 10) return;

    const streams = act.streams_data;
    if (streams?.velocity_smooth?.data && streams?.heartrate?.data && streams?.time?.data) {
      const speed = streams.velocity_smooth.data;
      const hr = streams.heartrate.data;
      const time = streams.time.data;

      [300, 600, 900, 1200].forEach((duration) => {
        const peak = getPeakSpeedWithHR(speed, hr, time, duration);
        if (peak && peak.avgS > 2.5 && peak.avgHR > hrRest + hrRange * 0.70) {
          const pctHRR = (peak.avgHR - hrRest) / hrRange;
          const vo2Cost = (peak.avgS * 60 * 0.2) + 3.5;
          const estVO2max = vo2Cost / pctHRR;
          if (estVO2max > 25 && estVO2max < 85) {
            candidates.push({
              vo2: estVO2max,
              quality: pctHRR,
              method: 'peak_effort',
              actId: act.id,
              actName: act.name,
              description: 'Basado en mejores esfuerzos de ritmo (5-20min)',
            });
          }
        }
      });

      const windowSize = 180;
      const thresholdHR = hrRest + hrRange * 0.65;

      for (let i = 0; i < time.length - windowSize; i += windowSize / 2) {
        let sS = 0, sH = 0, c = 0, minH = 999, maxH = 0;
        for (let j = i; j < i + windowSize && j < time.length; j++) {
          sS += speed[j];
          sH += hr[j];
          if (hr[j] < minH) minH = hr[j];
          if (hr[j] > maxH) maxH = hr[j];
          c++;
        }
        const avgS = sS / c;
        const avgH = sH / c;
        if (avgS > 2.2 && avgH > thresholdHR && (maxH - minH) <= 6) {
          const pctHRR = (avgH - hrRest) / hrRange;
          const estVO2max = ((avgS * 60 * 0.2) + 3.5) / pctHRR;
          if (estVO2max > 25 && estVO2max < 85) {
            candidates.push({
              vo2: estVO2max,
              quality: pctHRR * 0.9,
              method: 'steady_state',
              description: 'Basado en estado estable (Garmin Firstbeat)',
            });
          }
        }
      }
    } else {
      const avgSpeed = act.speed_avg || 0;
      const avgHR = act.hr_avg || 0;
      if (act.duration >= 20 && avgSpeed > 2.2 && avgHR > hrRest + hrRange * 0.6) {
        const estVO2max = ((avgSpeed * 60 * 0.2) + 3.5) / ((avgHR - hrRest) / hrRange);
        if (estVO2max > 25 && estVO2max < 80) {
          candidates.push({ vo2: estVO2max, quality: 0.4, method: 'summary', description: 'Basado en resumen de actividad' });
        }
      }
    }
  });

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.quality - a.quality);
    const top = candidates.slice(0, 5);
    const avgVo2 = top.reduce((a, b) => a + b.vo2, 0) / top.length;
    const best = top[0];
    return {
      vo2max: Number(avgVo2.toFixed(1)),
      method: best.method,
      description: best.description,
      activity: best.actId ? { id: best.actId, name: best.actName } : null,
    };
  }

  if (hrRest > 30 && hrMax > 120) {
    return {
      vo2max: Number((15.3 * (hrMax / hrRest)).toFixed(1)),
      method: 'physiological_fallback',
      description: 'Estimado por frecuencia cardíaca (Uth-Sørensen)',
      activity: null,
    };
  }

  return { vo2max: 0, method: 'none', description: 'Sin datos para estimar VO2max' };
}

export function predictRaceTimes(vo2max: number, activities: Activity[] = []): RacePrediction[] | null {
  if (!vo2max || vo2max <= 0) return null;

  const runStats = getRunningStats(activities);

  return [
    { name: '5K', distance: 5, emoji: '🏃' },
    { name: '10K', distance: 10, emoji: '🏃‍♂️' },
    { name: 'Media', distance: 21.0975, emoji: '🏅' },
    { name: 'Maratón', distance: 42.195, emoji: '🏆' },
  ].map((r) => {
    const theoryT = estimateRaceTime(vo2max, r.distance);
    const penalty = getVolumePenalty(r.distance, runStats);
    const finalT = theoryT * penalty;

    return {
      ...r,
      time: fmtTime(finalT),
      timeMinutes: finalT,
      pace: finalT ? fmtPace(finalT / r.distance) : '--',
      preparation: Math.round(Math.max(0, 100 - (penalty - 1) * 200)),
    };
  });
}

export function calculateTrainingEffect(act: Activity, settings: UserSettings): TrainingEffectResult | null {
  if (!act) return null;

  const t = String(act.type).toLowerCase();
  const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
  const profile = isBike ? settings.bike : settings.run;

  const hrMax = Number(profile?.max) || 190;
  const hrRest = Number(settings.fcReposo) || 50;
  const lthr = Number(profile?.lthr) || 165;

  let thresholdPower = 200;
  if (isBike) {
    thresholdPower = Number(settings.bike?.ftp) || 200;
  } else {
    const paceStr = settings.run?.thresholdPace || '4:30';
    const [m, s] = paceStr.split(':');
    const paceSecs = (parseInt(m) || 4) * 60 + (parseInt(s) || 30);
    const weight = Number(settings.weight) || 75;
    thresholdPower = (1000 / paceSecs) * weight * 1.05;
  }

  let aerobicScore = 0;
  let anaerobicScore = 0;
  let peakEpoc = 0;

  if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
    const hrs = act.streams_data.heartrate.data;
    const tms = act.streams_data.time.data;

    let epoc = 0;
    const tau = 15.0;

    for (let i = 1; i < hrs.length; i++) {
      const dtMin = (tms[i] - tms[i - 1]) / 60;
      if (dtMin > 0.5) continue;

      const intensity = Math.max(0, (hrs[i] - hrRest) / (hrMax - hrRest));
      const increment = 0.42 * Math.exp(4.5 * intensity);

      epoc = epoc * Math.exp(-dtMin / tau) + (increment * dtMin);
      if (epoc > peakEpoc) peakEpoc = epoc;
    }

    if (peakEpoc < 40) aerobicScore = peakEpoc / 40;
    else if (peakEpoc < 100) aerobicScore = 1.0 + (peakEpoc - 40) / 60;
    else if (peakEpoc < 200) aerobicScore = 2.0 + (peakEpoc - 100) / 100;
    else if (peakEpoc < 350) aerobicScore = 3.0 + (peakEpoc - 200) / 150;
    else aerobicScore = 4.0 + Math.min(1.0, (peakEpoc - 350) / 200);
  } else {
    const p = (act.hr_avg || 0) / hrMax;
    const durMin = act.duration / 60;
    const factor = p > 0.85 ? 1.4 : p > 0.75 ? 1.0 : 0.6;
    aerobicScore = Math.min(5, (durMin / 45) * factor * (p * 4));
  }

  if (act.streams_data?.heartrate?.data) {
    const hrs = act.streams_data.heartrate.data;
    const tms = act.streams_data.time.data;
    const watts = act.streams_data.watts?.data;
    const speed = act.streams_data.velocity_smooth?.data;

    let anaerobicPoints = 0;
    let lastBurstTime = -300;

    for (let i = 10; i < hrs.length; i += 5) {
      const _dt = tms[i] - tms[i - 10];
      const dHR = hrs[i] - hrs[i - 10];
      const hrPct = hrs[i] / hrMax;

      const fastHrRise = dHR > 5 && hrPct > 0.82;
      const highIntense = hrPct > 0.94;

      let workBurst = false;
      if (watts) workBurst = watts[i] > thresholdPower * 1.35;
      else if (speed) workBurst = speed[i] > 5.5;

      if ((fastHrRise || highIntense || workBurst) && (tms[i] - lastBurstTime > 30)) {
        let points = 0.5;
        if (hrPct > 0.96) points = 1.2;
        else if (hrPct > 0.90) points = 0.8;

        anaerobicPoints += points;
        lastBurstTime = tms[i];
      }
    }

    if (anaerobicPoints < 2) anaerobicScore = anaerobicPoints / 2;
    else if (anaerobicPoints < 5) anaerobicScore = 1.0 + (anaerobicPoints - 2) / 3;
    else if (anaerobicPoints < 9) anaerobicScore = 2.0 + (anaerobicPoints - 5) / 4;
    else if (anaerobicPoints < 15) anaerobicScore = 3.0 + (anaerobicPoints - 9) / 6;
    else anaerobicScore = 4.0 + Math.min(1.0, (anaerobicPoints - 15) / 10);
  }

  let primaryBenefit = 'Recuperación';
  let benefitDesc = 'Intensidad baja. Mejora la recuperación y prepara para entrenos más duros.';
  let color = 'text-slate-500';

  const aS = Number(aerobicScore.toFixed(1));
  const anS = Number(anaerobicScore.toFixed(1));

  if (aS >= 5.0 || anS >= 5.0) {
    primaryBenefit = 'Sobre-esfuerzo';
    benefitDesc = 'Carga extremadamente alta. Requiere descanso prolongado.';
    color = 'text-rose-700';
  } else if (anS > aS || (anS >= 3.0 && aS < 3.5)) {
    if (anS >= 3.0) {
      primaryBenefit = 'Capacidad Anaeróbica';
      benefitDesc = 'Mejora tu capacidad de realizar y repetir esfuerzos cortos y explosivos.';
      color = 'text-purple-600';
    } else {
      primaryBenefit = 'Sprint / Velocidad';
      benefitDesc = 'Estimula las fibras rápidas y mejora la economía de esfuerzo a alta velocidad.';
      color = 'text-purple-500';
    }
  } else {
    if (aS >= 3.5) {
      if (aS > 4.0) {
        primaryBenefit = 'Altamente Impactante: VO2 Máx';
        benefitDesc = 'Mejora significativamente tu potencia aeróbica y velocidad de crucero.';
        color = 'text-rose-600';
      } else {
        primaryBenefit = 'VO2 Máx';
        benefitDesc = 'Estimula la capacidad de transporte de oxígeno y el consumo máximo.';
        color = 'text-rose-500';
      }
    } else if (aS >= 3.0) {
      const activityIF = parseFloat(String(act.intensity_factor)) || (act.hr_avg / lthr);
      if (activityIF > 0.92) {
        primaryBenefit = 'Umbral de Lactato';
        benefitDesc = 'Fortalece tu capacidad de mantener ritmos altos durante mucho tiempo.';
        color = 'text-amber-500';
      } else if (activityIF > 0.82) {
        primaryBenefit = 'Tempo';
        benefitDesc = 'Entrenamiento de ritmo constante que mejora la eficiencia metabólica.';
        color = 'text-emerald-500';
      } else {
        primaryBenefit = 'Base Aeróbica';
        benefitDesc = 'Desarrolla resistencia a largo plazo mediante una intensidad aeróbica pura.';
        color = 'text-blue-500';
      }
    } else if (aS >= 2.0) {
      primaryBenefit = 'Mantenimiento';
      benefitDesc = 'Carga adecuada para no perder el nivel de forma actual.';
      color = 'text-blue-400';
    }
  }

  const getFinalLabel = (s: number) =>
    s >= 5.0 ? 'Sobre-esfuerzo' :
    s >= 4.0 ? 'Altamente Impactante' :
    s >= 3.0 ? 'Impacto Importante' :
    s >= 2.0 ? 'Mantenimiento' :
    s >= 1.0 ? 'Beneficio Ligero' : 'Sin Impacto';

  return {
    aerobic: { score: aS, label: getFinalLabel(aS), color },
    anaerobic: { score: anS, label: getFinalLabel(anS), color: anS > 2 ? 'text-purple-500' : color },
    primaryBenefit,
    benefitDesc,
    peakEpoc: Math.round(peakEpoc),
  };
}

export function getTrainingBalance(
  activities: Activity[],
  settings: UserSettings,
  days: number = 7
): TrainingBalanceResult | { empty: true } {
  if (!activities || activities.length === 0) return null;
  const start = new Date();
  start.setDate(start.getDate() - days);

  const relevant = activities.filter((a) => {
    const t = String(a.type).toLowerCase();
    return (t.includes('run') || t.includes('carrera') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride'))
      && new Date(a.date) >= start && (a.duration || 0) >= 10;
  });

  if (!relevant.length) return { empty: true };

  let totalLow = 0;
  let totalHigh = 0;
  let totalAnaerobic = 0;

  relevant.forEach((act) => {
    const actTss = act.tss || ((act.duration || 0) / 3600 * 50);
    const t = String(act.type).toLowerCase();
    const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    const maxHr = Number((isBike ? settings.bike : settings.run)?.max) || 190;

    let focus: 'low' | 'high' | 'anaerobic' = 'low';

    if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
      const hr = act.streams_data.heartrate.data;
      const tm = act.streams_data.time.data;

      let timeLow = 0;
      let timeHigh = 0;
      let timeAnaerobic = 0;

      for (let i = 1; i < hr.length; i++) {
        const dt = tm[i] - tm[i - 1];
        if (dt > 10) continue;

        const p = hr[i] / maxHr;
        if (p > 0.89) {
          timeAnaerobic += dt;
        } else if (p > 0.79) {
          timeHigh += dt;
        } else {
          timeLow += dt;
        }
      }

      const totalActivityTime = timeLow + timeHigh + timeAnaerobic;

      if (timeAnaerobic > 240 || (totalActivityTime > 0 && (timeAnaerobic / totalActivityTime) > 0.08)) {
        focus = 'anaerobic';
      } else if (timeHigh > 1200 || (totalActivityTime > 0 && (timeHigh / totalActivityTime) > 0.25)) {
        focus = 'high';
      } else {
        focus = 'low';
      }
    } else {
      const p = (act.hr_avg || 0) / maxHr;
      const ifac = parseFloat(String(act.intensity_factor)) || 0;

      if (ifac > 1.05 || p > 0.88) {
        focus = 'anaerobic';
      } else if (ifac > 0.85 || p > 0.79) {
        focus = 'high';
      } else {
        focus = 'low';
      }
    }

    if (focus === 'anaerobic') {
      totalAnaerobic += actTss;
    } else if (focus === 'high') {
      totalHigh += actTss;
    } else {
      totalLow += actTss;
    }
  });

  const totalLoad = totalLow + totalHigh + totalAnaerobic;
  const pLow = totalLoad > 0 ? (totalLow / totalLoad) * 100 : 0;
  const pHigh = totalLoad > 0 ? (totalHigh / totalLoad) * 100 : 0;
  const pAnaerobic = totalLoad > 0 ? (totalAnaerobic / totalLoad) * 100 : 0;

  const targets = {
    low: {
      min: Math.round(totalLoad * 0.60),
      max: Math.round(totalLoad * 0.80),
      pctMin: 60,
      pctMax: 80,
      label: 'Baja Aeróbica',
    },
    high: {
      min: Math.round(totalLoad * 0.10),
      max: Math.round(totalLoad * 0.25),
      pctMin: 10,
      pctMax: 25,
      label: 'Alta Aeróbica',
    },
    anaerobic: {
      min: Math.round(totalLoad * 0.05),
      max: Math.round(totalLoad * 0.15),
      pctMin: 5,
      pctMax: 15,
      label: 'Anaeróbica',
    },
  };

  const maxVal = Math.max(
    totalLow,
    totalHigh,
    totalAnaerobic,
    targets.low.max,
    targets.high.max,
    targets.anaerobic.max,
    100
  );

  let recommendation = 'Foco de carga óptimo';
  let status = 'Equilibrado';
  let color = '#10b981';
  let details = 'Tu entrenamiento está bien equilibrado en todas las intensidades, lo que proporciona una base sólida y mejora el rendimiento general.';

  if (totalLoad === 0) {
    recommendation = 'No hay datos suficientes.';
    status = 'Sin Datos';
    color = '#94a3b8';
    details = 'Registra más actividades con pulso para analizar tu foco de carga.';
  } else {
    const isLowShort = totalLow < targets.low.min;
    const isHighShort = totalHigh < targets.high.min;
    const isAnShort = totalAnaerobic < targets.anaerobic.min;
    const isLowOver = totalLow > targets.low.max;
    const isHighOver = totalHigh > targets.high.max;
    const isAnOver = totalAnaerobic > targets.anaerobic.max;

    if (isAnShort && isHighShort && isLowShort) {
      recommendation = 'Carga general baja';
      status = 'Desentrenamiento';
      color = '#f59e0b';
      details = 'Tu carga de entrenamiento es menor que tu rango óptimo en todas las categorías.';
    } else if (isLowShort) {
      recommendation = 'Carga aeróbica baja: insuficiente';
      status = 'Falta Base';
      color = '#00c2e0';
      details = 'Prueba a incluir más actividades fáciles de baja intensidad.';
    } else if (isHighShort) {
      recommendation = 'Carga aeróbica de intensidad alta: insuficiente';
      status = 'Falta Alta Int.';
      color = '#f97316';
      details = 'Prueba a incluir algo más de actividad aeróbica de alta intensidad.';
    } else if (isAnShort) {
      recommendation = 'Capacidad anaeróbica: insuficiente';
      status = 'Falta Anaeróbico';
      color = '#a855f7';
      details = 'Añade más entrenamientos de intervalos cortos y de alta intensidad.';
    } else if (isAnOver) {
      recommendation = 'Exceso de carga anaeróbica';
      status = 'Sobrecarga';
      color = '#ef4444';
      details = 'Has acumulado mucha fatiga anaeróbica.';
    } else if (isHighOver) {
      recommendation = 'Exceso de carga aeróbica alta';
      status = 'No Polarizado';
      color = '#f59e0b';
      details = 'Estás pasando demasiado tiempo en intensidades medias y altas.';
    }
  }

  return {
    aerobicLow: totalLow,
    aerobicHigh: totalHigh,
    anaerobic: totalAnaerobic,
    totalLoad,
    maxScale: maxVal,
    pcts: { low: pLow, high: pHigh, anaerobic: pAnaerobic },
    targets,
    recommendation,
    status,
    color,
    details,
    activityCount: relevant.length,
  };
}

export function analyzePowerProfile(ftpResult: FtpResult): PowerProfileAnalysis | null {
  if (!ftpResult?.model || !ftpResult.powerCurve?.length) return null;
  const { eFTP, pMax, wPrime } = ftpResult.model;
  if (!eFTP || eFTP <= 0) return null;

  const sprint = pMax / eFTP;
  const anaerobic = (wPrime * 1000) / eFTP;
  const strengths: { area: string; desc: string; level: 'elite' | 'good' | 'weak' }[] = [];

  if (sprint > 7) strengths.push({ area: 'Sprint', desc: 'Excelente potencia explosiva', level: 'elite' });
  else if (sprint > 5.5) strengths.push({ area: 'Sprint', desc: 'Buena potencia explosiva', level: 'good' });
  else strengths.push({ area: 'Sprint', desc: 'Sprint por debajo de la media', level: 'weak' });

  if (anaerobic > 200) strengths.push({ area: 'Anaeróbico', desc: 'Gran capacidad anaeróbica (W\' alto)', level: 'elite' });
  else if (anaerobic > 120) strengths.push({ area: 'Anaeróbico', desc: 'Buena capacidad anaeróbica', level: 'good' });
  else strengths.push({ area: 'Anaeróbico', desc: 'Capacidad anaeróbica limitada', level: 'weak' });

  return { sprint: sprint.toFixed(1), anaerobic: Math.round(anaerobic), strengths };
}

export function calculateDanielsPaces(vo2max: number): DanielsPaceZone[] | null {
  if (!vo2max || vo2max <= 0) return null;

  const zones = [
    { name: 'E', label: 'Easy', pctVo2: 0.65, desc: 'Recuperación y base aeróbica' },
    { name: 'M', label: 'Maratón', pctVo2: 0.79, desc: 'Ritmo específico maratón' },
    { name: 'T', label: 'Umbral', pctVo2: 0.88, desc: 'Umbral de lactato (~60min race pace)' },
    { name: 'I', label: 'Intervalos', pctVo2: 0.98, desc: 'VO2max (3-5min esfuerzos)' },
    { name: 'R', label: 'Repeticiones', pctVo2: 1.05, desc: 'Velocidad y economía (<2min)' },
  ];

  return zones.map((z) => {
    const effectiveVo2 = vo2max * z.pctVo2;
    const speed = vo2ToSpeed(effectiveVo2);
    const paceMinPerKm = speed > 0 ? 1000 / speed : 0;
    return {
      ...z,
      pace: fmtPace(paceMinPerKm),
      paceDecimal: paceMinPerKm,
      speedKmh: speed > 0 ? Number((speed * 60 / 1000).toFixed(1)) : 0,
    };
  });
}

export function estimateThresholdPace(
  vo2max: number,
  settings: UserSettings
): ThresholdPaceResult | null {
  if (!vo2max || vo2max <= 0) return null;

  const thresholdVo2 = vo2max * 0.88;
  const speed = vo2ToSpeed(thresholdVo2);
  const paceMinPerKm = speed > 0 ? 1000 / speed : 0;

  const configuredPace = settings?.run?.thresholdPace;
  let configPaceMinPerKm: number | null = null;
  if (configuredPace) {
    const parts = String(configuredPace).split(':');
    if (parts.length === 2) configPaceMinPerKm = Number(parts[0]) + Number(parts[1]) / 60;
  }

  return {
    pace: fmtPace(paceMinPerKm),
    paceDecimal: paceMinPerKm,
    speedKmh: speed > 0 ? Number((speed * 60 / 1000).toFixed(1)) : 0,
    configuredPace: configuredPace || null,
    configPaceDecimal: configPaceMinPerKm,
    diff: configPaceMinPerKm ? Number((configPaceMinPerKm - paceMinPerKm).toFixed(2)) : null,
  };
}

export function calculatePowerZones(eFTP: number): PowerZone[] | null {
  if (!eFTP || eFTP <= 0) return null;

  return [
    { zone: 1, name: 'Recuperación activa', pctMin: 0, pctMax: 0.55, min: 0, max: Math.round(eFTP * 0.55), color: '#94a3b8' },
    { zone: 2, name: 'Resistencia', pctMin: 0.56, pctMax: 0.75, min: Math.round(eFTP * 0.56), max: Math.round(eFTP * 0.75), color: '#3b82f6' },
    { zone: 3, name: 'Tempo', pctMin: 0.76, pctMax: 0.90, min: Math.round(eFTP * 0.76), max: Math.round(eFTP * 0.90), color: '#22c55e' },
    { zone: 4, name: 'Umbral', pctMin: 0.91, pctMax: 1.05, min: Math.round(eFTP * 0.91), max: Math.round(eFTP * 1.05), color: '#f59e0b' },
    { zone: 5, name: 'VO2max', pctMin: 1.06, pctMax: 1.20, min: Math.round(eFTP * 1.06), max: Math.round(eFTP * 1.20), color: '#ef4444' },
    { zone: 6, name: 'Anaeróbica', pctMin: 1.21, pctMax: 1.50, min: Math.round(eFTP * 1.21), max: Math.round(eFTP * 1.50), color: '#a855f7' },
    { zone: 7, name: 'Neuromuscular', pctMin: 1.50, pctMax: null, min: Math.round(eFTP * 1.50), max: null, color: '#ec4899' },
  ];
}

export function calculateFTPHistory(activities: Activity[], settings: UserSettings): FTPHistoryEntry[] {
  const weight = Number(settings?.weight) || 70;
  const today = new Date();

  const history: FTPHistoryEntry[] = [];
  for (let monthsAgo = 0; monthsAgo <= 5; monthsAgo++) {
    const windowEnd = new Date(today);
    windowEnd.setMonth(windowEnd.getMonth() - monthsAgo);
    const windowStart = new Date(windowEnd);
    windowStart.setDate(windowStart.getDate() - 90);

    const windowActivities = activities.filter((act) => {
      const t = String(act.type).toLowerCase();
      const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
      const d = new Date(act.date);
      return isBike && d >= windowStart && d <= windowEnd && act.streams_data?.watts?.data && act.streams_data?.time?.data;
    });

    if (windowActivities.length === 0) continue;

    let bestEFTP = 0;
    [180, 300, 480, 600, 900, 1200, 1800].forEach((secs) => {
      let bestPower = 0;
      windowActivities.forEach((act) => {
        const peak = getPeakPower(act.streams_data!.watts!.data, act.streams_data!.time!.data, secs);
        if (peak > bestPower) bestPower = peak;
      });
      if (bestPower > 0) {
        const ratio = interpolateRatio(secs);
        const eFTP = bestPower / ratio;
        if (eFTP > bestEFTP) bestEFTP = eFTP;
      }
    });

    if (bestEFTP > 0) {
      const label = windowEnd.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      history.push({
        label,
        date: windowEnd.toISOString(),
        eFTP: Math.round(bestEFTP),
        wPerKg: Number((bestEFTP / weight).toFixed(2)),
      });
    }
  }

  return history.reverse();
}

export function calculateFitnessScore(
  vo2max: number | null,
  eFTPwPerKg: number | null,
  ctl: number | null
): FitnessScoreResult | null {
  if (!vo2max && !eFTPwPerKg && !ctl) return null;

  const vo2Score = vo2max ? Math.min(100, Math.max(0, (vo2max - 25) / (70 - 25) * 100)) : null;
  const ftpScore = eFTPwPerKg ? Math.min(100, Math.max(0, (eFTPwPerKg - 1.5) / (5.5 - 1.5) * 100)) : null;
  const ctlScore = ctl != null ? Math.min(100, Math.max(0, ctl / 120 * 100)) : null;

  const scores: { value: number; weight: number }[] = [];
  if (vo2Score !== null) scores.push({ value: vo2Score, weight: 0.40 });
  if (ftpScore !== null) scores.push({ value: ftpScore, weight: 0.35 });
  if (ctlScore !== null) scores.push({ value: ctlScore, weight: 0.25 });

  if (scores.length === 0) return null;

  const totalWeight = scores.reduce((s, x) => s + x.weight, 0);
  const score = Math.round(scores.reduce((s, x) => s + x.value * (x.weight / totalWeight), 0));

  const getLevel = (s: number) => {
    if (s >= 85) return { label: 'Élite', color: '#8b5cf6', emoji: '🏆' };
    if (s >= 70) return { label: 'Excelente', color: '#3b82f6', emoji: '💪' };
    if (s >= 55) return { label: 'Bueno', color: '#22c55e', emoji: '✅' };
    if (s >= 40) return { label: 'Medio', color: '#f59e0b', emoji: '📊' };
    if (s >= 25) return { label: 'En desarrollo', color: '#f97316', emoji: '🔧' };
    return { label: 'Principiante', color: '#94a3b8', emoji: '🌱' };
  };

  const level = getLevel(score);

  return {
    score,
    ...level,
    breakdown: {
      vo2: vo2Score !== null ? Math.round(vo2Score) : null,
      ftp: ftpScore !== null ? Math.round(ftpScore) : null,
      ctl: ctlScore !== null ? Math.round(ctlScore) : null,
    },
  };
}

export function analyzeIntensityDistribution(
  activities: Activity[],
  settings: UserSettings
): IntensityDistributionResult | null {
  const today = new Date();
  const d90 = new Date(today);
  d90.setDate(today.getDate() - 90);

  let totalTime = 0;
  let timeZ12 = 0, timeZ3 = 0, timeZ4 = 0, timeZ5 = 0;

  activities.forEach((act) => {
    if (new Date(act.date) < d90 || (act.duration || 0) < 10) return;
    const t = String(act.type).toLowerCase();
    const isCardio = t.includes('run') || t.includes('carrera') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    if (!isCardio) return;

    const isBike = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    const maxHr = Number((isBike ? settings.bike : settings.run)?.max) || 190;

    if (act.streams_data?.heartrate?.data && act.streams_data?.time?.data) {
      const hr = act.streams_data.heartrate.data;
      const tm = act.streams_data.time.data;

      for (let i = 1; i < hr.length; i++) {
        const dt = tm[i] - tm[i - 1];
        if (dt > 10 || dt <= 0) continue;
        totalTime += dt;
        const pct = hr[i] / maxHr;
        if (pct < 0.72) timeZ12 += dt;
        else if (pct < 0.82) timeZ3 += dt;
        else if (pct < 0.90) timeZ4 += dt;
        else timeZ5 += dt;
      }
    } else if (act.hr_avg) {
      const durSecs = act.duration * 60;
      totalTime += durSecs;
      const pct = act.hr_avg / maxHr;
      if (pct < 0.72) timeZ12 += durSecs;
      else if (pct < 0.82) timeZ3 += durSecs;
      else if (pct < 0.90) timeZ4 += durSecs;
      else timeZ5 += durSecs;
    }
  });

  if (totalTime === 0) return null;

  const pZ12 = (timeZ12 / totalTime) * 100;
  const pZ3 = (timeZ3 / totalTime) * 100;
  const pZ4 = (timeZ4 / totalTime) * 100;
  const pZ5 = (timeZ5 / totalTime) * 100;

  let pattern = 'Mixto';
  let patternDesc = 'Distribución sin patrón definido.';
  let patternColor = '#94a3b8';

  if (pZ12 >= 75 && (pZ4 + pZ5) >= 10) {
    pattern = 'Polarizado';
    patternDesc = 'Mucho volumen fácil + sesiones intensas. Distribución óptima.';
    patternColor = '#22c55e';
  } else if (pZ12 >= 60 && pZ3 >= 15 && pZ3 > (pZ4 + pZ5)) {
    pattern = 'Piramidal';
    patternDesc = 'Base amplia con intensidad decreciente por zona. Buena distribución.';
    patternColor = '#3b82f6';
  } else if (pZ3 + pZ4 >= 40) {
    pattern = 'Threshold-heavy';
    patternDesc = 'Demasiado tiempo en zona media. Riesgo de estancamiento.';
    patternColor = '#f59e0b';
  }

  return {
    zones: [
      { name: 'Z1-Z2', label: 'Fácil', pct: Number(pZ12.toFixed(1)), hours: Number((timeZ12 / 3600).toFixed(1)), color: '#3b82f6' },
      { name: 'Z3', label: 'Tempo', pct: Number(pZ3.toFixed(1)), hours: Number((timeZ3 / 3600).toFixed(1)), color: '#22c55e' },
      { name: 'Z4', label: 'Umbral', pct: Number(pZ4.toFixed(1)), hours: Number((timeZ4 / 3600).toFixed(1)), color: '#f59e0b' },
      { name: 'Z5+', label: 'Alta', pct: Number(pZ5.toFixed(1)), hours: Number((timeZ5 / 3600).toFixed(1)), color: '#ef4444' },
    ],
    totalHours: Number((totalTime / 3600).toFixed(1)),
    pattern,
    patternDesc,
    patternColor,
  };
}

export function getPowerProfileBenchmarks(
  activities: Activity[],
  settings: UserSettings,
  eFTP: number,
  options?: { days?: number }
): PowerProfileBenchmarks {
  const weight = Number(settings?.weight) || 75;
  const days = options?.days !== undefined ? options.days : 90;
  const today = new Date();
  let cutoffDate: Date | null = null;
  if (days !== null && days > 0) {
    cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);
  }

  const durations = [
    { secs: 5, label: '5s' },
    { secs: 15, label: '15s' },
    { secs: 30, label: '30s' },
    { secs: 60, label: '60s' },
    { secs: 120, label: '2m' },
    { secs: 180, label: '3m' },
    { secs: 300, label: '5m' },
    { secs: 600, label: '10m' },
    { secs: 900, label: '15m' },
    { secs: 1200, label: '20m' },
    { secs: 3600, label: '60m' },
    { secs: 5400, label: '90m' },
    { secs: 7200, label: '2h' },
    { secs: 10800, label: '3h' },
    { secs: 14400, label: '4h' },
  ];

  const bikeActivities = activities.filter((act) => {
    const t = String(act.type).toLowerCase();
    const matchesSport = t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
    const matchesDate = cutoffDate ? new Date(act.date) >= cutoffDate : true;
    return matchesSport && matchesDate && act.streams_data?.watts?.data && act.streams_data?.time?.data;
  });

  const userPoints = durations.map((d) => {
    let bestPower = 0;
    bikeActivities.forEach((act) => {
      const peak = getPeakPower(act.streams_data!.watts!.data, act.streams_data!.time!.data, d.secs);
      if (peak > bestPower) bestPower = peak;
    });

    return {
      label: d.label,
      wKg: Number((bestPower / weight).toFixed(2)),
      power: Math.round(bestPower),
      duration: d.secs,
    };
  });

  const references = [
    { category: 'World Class', '5s': 24.0, '15s': 18.0, '30s': 14.5, '60s': 11.5, '2m': 9.2, '3m': 8.5, '5m': 7.6, '10m': 6.8, '15m': 6.6, '20m': 6.4, '60m': 6.0, '90m': 5.6, '2h': 5.2, '3h': 4.8, '4h': 4.5 },
    { category: 'Cat 1 / Elite', '5s': 19.5, '15s': 14.5, '30s': 12.0, '60s': 9.5, '2m': 7.5, '3m': 6.8, '5m': 6.2, '10m': 5.5, '15m': 5.3, '20m': 5.2, '60m': 4.8, '90m': 4.5, '2h': 4.1, '3h': 3.8, '4h': 3.6 },
    { category: 'Cat 2', '5s': 17.0, '15s': 12.5, '30s': 10.5, '60s': 8.5, '2m': 6.8, '3m': 6.1, '5m': 5.5, '10m': 4.8, '15m': 4.6, '20m': 4.5, '60m': 4.2, '90m': 3.9, '2h': 3.6, '3h': 3.4, '4h': 3.2 },
    { category: 'Cat 3', '5s': 14.5, '15s': 11.0, '30s': 9.2, '60s': 7.4, '2m': 6.0, '3m': 5.3, '5m': 4.8, '10m': 4.2, '15m': 4.0, '20m': 3.9, '60m': 3.6, '90m': 3.3, '2h': 3.1, '3h': 2.9, '4h': 2.7 },
    { category: 'Cat 4', '5s': 12.5, '15s': 9.5, '30s': 8.1, '60s': 6.5, '2m': 5.2, '3m': 4.7, '5m': 4.1, '10m': 3.6, '15m': 3.4, '20m': 3.3, '60m': 3.1, '90m': 2.8, '2h': 2.6, '3h': 2.4, '4h': 2.2 },
    { category: 'Cat 5', '5s': 10.5, '15s': 8.0, '30s': 6.8, '60s': 5.5, '2m': 4.4, '3m': 4.0, '5m': 3.5, '10m': 3.1, '15m': 2.9, '20m': 2.8, '60m': 2.6, '90m': 2.3, '2h': 2.1, '3h': 1.9, '4h': 1.7 },
    { category: 'Untrained', '5s': 8.5, '15s': 6.2, '30s': 5.0, '60s': 4.0, '2m': 3.2, '3m': 3.0, '5m': 2.8, '10m': 2.3, '15m': 2.2, '20m': 2.1, '60m': 1.9, '90m': 1.6, '2h': 1.5, '3h': 1.4, '4h': 1.3 },
  ];

  return {
    userPoints,
    references,
    weight,
    eFTP: Math.round(eFTP || 0),
  };
}

export function getTrainingStatus(activities: Activity[]): TrainingStatusResult | null {
  if (!activities || activities.length < 5) return null;

  const today = new Date();
  const d7 = new Date(today);
  d7.setDate(today.getDate() - 7);
  const d28 = new Date(today);
  d28.setDate(today.getDate() - 28);

  const load7 = activities.filter((a) => new Date(a.date) >= d7).reduce((s, a) => s + (a.tss || 45), 0) / 7;
  const load28 = activities.filter((a) => new Date(a.date) >= d28).reduce((s, a) => s + (a.tss || 45), 0) / 28;

  const tsb = load28 - load7;
  const loadTrend = load7 / (load28 || 1);

  let status = 'Mantenimiento';
  let desc = 'Tu carga actual es estable. Estás manteniendo tu nivel físico.';
  let color = '#3b82f6';

  if (loadTrend > 1.15 && tsb < -5) {
    status = 'Productivo';
    desc = 'Carga en aumento y forma en mejora. ¡Sigue así!';
    color = '#10b981';
  } else if (loadTrend > 1.45) {
    status = 'Esfuerzo excesivo';
    desc = 'La carga sube demasiado rápido. Riesgo de fatiga extrema.';
    color = '#ef4444';
  } else if (loadTrend < 0.75 && load7 > 5) {
    status = 'Recuperación';
    desc = 'Carga baja para permitir la supercompensación.';
    color = '#8b5cf6';
  } else if (loadTrend < 0.4) {
    status = 'Desentrenamiento';
    desc = 'Pérdida de condición física por baja carga.';
    color = '#94a3b8';
  } else if (tsb > 12 && loadTrend > 0.8) {
    status = 'Pico de forma';
    desc = 'Excelente balance entre forma y descanso. ¡Momento de competir!';
    color = '#f59e0b';
  }

  return { status, desc, color, load7: Math.round(load7), load28: Math.round(load28), tsb: Math.round(tsb) };
}

export function getHRVAnalysis(
  activities: Activity[],
  wellnessData?: { latestHrv: number | string | null; baselineHrv?: number | null } | null
): HrVAnalysisResult | null {
  if (!activities || activities.length === 0) return null;

  let currentRMSSD: number | null = null;
  let source = 'estimated';
  let baseline = 48;

  if (wellnessData && wellnessData.latestHrv && wellnessData.latestHrv !== '--') {
    currentRMSSD = typeof wellnessData.latestHrv === 'number' ? wellnessData.latestHrv : Number(wellnessData.latestHrv);
    source = 'garmin';
    if (wellnessData.baselineHrv) baseline = wellnessData.baselineHrv;
  } else {
    const hrvData = activities.filter((a) => (a.hrv_rmssd || 0) > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (hrvData.length > 0) {
      currentRMSSD = hrvData[0].hrv_rmssd ?? null;
      source = 'activities';

      const last30 = hrvData.filter((a) => {
        const diff = (new Date().getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      });
      if (last30.length > 0) {
        baseline = Math.round(last30.reduce((s, a) => s + (a.hrv_rmssd || 0), 0) / last30.length);
      }
    }
  }

  if (currentRMSSD === null) {
    const stats = getTrainingStatus(activities);
    const tsb = stats?.tsb || 0;
    currentRMSSD = Math.round(baseline + (tsb * 0.4) + (Math.sin(Date.now() / 1000000) * 5));
  }

  let state = 'Equilibrado';
  let color = '#10b981';
  let msg = 'Tu recuperación es óptima. Tu cuerpo responde bien.';

  if (currentRMSSD < baseline * 0.85) {
    state = 'Bajo';
    color = '#f59e0b';
    msg = 'Ligero estrés acumulado. Considera un día suave.';
  } else if (currentRMSSD < baseline * 0.7) {
    state = 'No equilibrado';
    color = '#ef4444';
    msg = 'Estrés elevado. Tu sistema nervioso necesita descanso.';
  }

  return {
    rmssd: Math.round(currentRMSSD),
    baseline,
    state,
    color,
    msg,
    source,
    stress: Math.round(Math.max(0, 100 - (currentRMSSD / baseline) * 100 + 40)),
  };
}
