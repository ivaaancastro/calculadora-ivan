import { useMemo } from 'react';

/**
 * Función pura que calcula las métricas analíticas de bienestar.
 * No es un hook de React, por lo que no está sujeta a las reglas
 * de react-hooks/immutability (reasignación de variables locales).
 *
 * @param {object[]} wellnessData - Datos de bienestar ordenados por fecha
 * @param {number} currentTsb - TSB actual del último punto del chart PMC
 * @param {Map<string,number>} dailyTSS - Mapa fecha → TSS diario total
 * @param {Error|null} error - Error de carga, si lo hay
 * @returns {object|null} Métricas analíticas calculadas o null si no hay datos
 */
function calculateWellnessAnalytics(wellnessData, currentTsb, dailyTSS, error) {
  if (!wellnessData || wellnessData.length === 0 || error) return null;

  // EWMA de 30 días para HRV y RHR (alpha = 2/(30+1))
  const alpha = 2 / (30 + 1);
  let ewmaHrv = null;
  let ewmaRhr = null;

  const finalChartData = wellnessData.map((d, index, arr) => {
    if (d.hrv > 0) {
      ewmaHrv = ewmaHrv === null ? d.hrv : (d.hrv * alpha) + (ewmaHrv * (1 - alpha));
    }
    if (d.rhr > 0) {
      ewmaRhr = ewmaRhr === null ? d.rhr : (d.rhr * alpha) + (ewmaRhr * (1 - alpha));
    }

    // Medias de la última semana (ventana deslizante de 7 días)
    const startIdx7 = Math.max(0, index - 6);
    const window7   = arr.slice(startIdx7, index + 1);

    const validHrv7    = window7.filter(w => w.hrv   > 0);
    const validSleep7  = window7.filter(w => w.sleep > 0);
    const validRhr7    = window7.filter(w => w.rhr   > 0);
    const validWeight7 = window7.filter(w => w.weight > 0);

    const rollHrv    = validHrv7.length    > 0 ? Math.round(validHrv7.reduce((s, c) => s + c.hrv, 0) / validHrv7.length) : null;
    const rollSleep  = validSleep7.length  > 0 ? Number((validSleep7.reduce((s, c) => s + c.sleep, 0) / validSleep7.length).toFixed(1)) : null;
    const rollRhr    = validRhr7.length    > 0 ? Math.round(validRhr7.reduce((s, c) => s + c.rhr, 0) / validRhr7.length) : null;
    const rollWeight = validWeight7.length > 0 ? Number((validWeight7.reduce((s, c) => s + c.weight, 0) / validWeight7.length).toFixed(1)) : null;

    // Desviación estándar de HRV en 30 días (para calcular rango normal)
    const startIdx30 = Math.max(0, index - 29);
    const window30   = arr.slice(startIdx30, index + 1);
    const valid30Hrv = window30.filter(w => w.hrv > 0);
    let stdevHrv     = ewmaHrv ? ewmaHrv * 0.05 : 5;

    if (valid30Hrv.length > 5 && ewmaHrv !== null) {
      const variance = valid30Hrv.reduce((acc, val) => acc + Math.pow(val.hrv - ewmaHrv, 2), 0) / valid30Hrv.length;
      stdevHrv = Math.max(Math.sqrt(variance), ewmaHrv * 0.05);
    }

    return {
      ...d,
      baselineTop:    Math.round(ewmaHrv + stdevHrv),
      baselineBottom: Math.round(ewmaHrv - stdevHrv),
      baselineMid:    Math.round(ewmaHrv),
      hrv7dAvg:       rollHrv,
      sleep7dAvg:     rollSleep,
      rhr7dAvg:       rollRhr,
      weight7dAvg:    rollWeight,
      ewmaHrv,
      ewmaRhr,
    };
  });

  const todayData     = finalChartData[finalChartData.length - 1];
  const baselineHrv   = todayData.ewmaHrv;
  const baselineRhr   = todayData.ewmaRhr;
  const normalHrvRange = [todayData.baselineBottom, todayData.baselineTop];

  const avgHrv7d    = todayData.hrv7dAvg    ?? '--';
  const avgSleep7d  = todayData.sleep7dAvg  ?? '--';
  const avgRhr7d    = todayData.rhr7dAvg    ?? '--';
  const avgWeight7d = todayData.weight7dAvg ?? '--';

  const yesterdayData  = finalChartData.length > 1 ? finalChartData[finalChartData.length - 2] : null;
  const yesterdayTSS   = yesterdayData ? (dailyTSS.get(yesterdayData.date) || 0) : 0;
  const todayTSS       = dailyTSS.get(todayData.date) || 0;
  const activeTSS      = yesterdayTSS + todayTSS;

  // ── Score de Readiness ──────────────────────────────────────────────
  const nativeReadiness = todayData.readiness;

  const insights  = [];
  let scoreHRV    = 0;
  let scoreSleep  = 0;
  let scoreRHR    = 0;

  const latestDailyHrv = todayData.hrv ?? avgHrv7d;

  // 1. HRV Score (0-45 puntos)
  let hrvStatus = { label: 'Adaptado', color: 'text-emerald-500', id: 'balanced' };
  if (latestDailyHrv !== '--' && baselineHrv > 0) {
    if (latestDailyHrv >= normalHrvRange[0] && latestDailyHrv <= normalHrvRange[1]) {
      scoreHRV = 45;
      insights.push({ type: 'success', label: 'VFC Óptima', desc: 'Tu corazón indica máxima adaptación al entrenamiento y bajo estrés.' });
    } else if (latestDailyHrv > normalHrvRange[1]) {
      scoreHRV  = 35;
      hrvStatus = { label: 'Hiper-Recuperado', color: 'text-amber-500', id: 'unbalanced' };
      insights.push({ type: 'warning', label: 'Fatiga Parasimpática', desc: 'VFC inusualmente alta. Puede denotar una respuesta protectora ante el sobreentrenamiento.' });
    } else {
      const dropRatio = Math.max(0, latestDailyHrv / normalHrvRange[0]);
      scoreHRV  = Math.round(45 * dropRatio);
      hrvStatus = { label: 'Suprimido', color: 'text-red-500', id: 'unbalanced' };
      insights.push({ type: 'danger', label: 'VFC Suprimida', desc: 'Sistema nervioso simpático activado. Prioriza descanso o recuperación activa.' });
    }
  } else {
    scoreHRV  = 22;
    hrvStatus = { label: 'Desconocido', color: 'text-slate-400', id: 'unknown' };
  }

  // 2. Sleep Score (0-35 puntos)
  const dailySleepScore = todayData.sleepScore ??
    (todayData.sleep ? Math.min(100, Math.round((todayData.sleep / 8) * 100)) : 70);
  if (dailySleepScore) {
    scoreSleep = (dailySleepScore / 100) * 35;
    if (dailySleepScore < 60) {
      insights.push({ type: 'danger', label: 'Deuda de Sueño', desc: `Tu sueño (${todayData.sleep}h) no fue suficiente para limpiar la fatiga del sistema nervioso.` });
    } else if (dailySleepScore >= 85) {
      insights.push({ type: 'success', label: 'Descanso Profundo', desc: 'Patrón de sueño excelente. Gran pico de secreción hormonal.' });
    }
  }

  // 3. Resting HR Score (0-20 puntos)
  const dailyRHR = todayData.rhr ?? avgRhr7d;
  if (dailyRHR !== '--' && baselineRhr > 0) {
    const diff = dailyRHR - baselineRhr;
    if (diff <= 2) {
      scoreRHR = 20;
    } else if (diff <= 8) {
      scoreRHR = 10;
      insights.push({ type: 'warning', label: 'Pulsaciones Elevadas', desc: `Tu FC Mínima está ${diff} lpm por encima de la media. Tu cuerpo está combatiendo estrés o fatiga metabólica.` });
    } else {
      scoreRHR = 0;
      insights.push({ type: 'danger', label: 'Alerta Cardiovascular', desc: `RHR significativamente elevado (+${diff} lpm). Riesgo inminente de sobreentrenamiento o enfermedad.` });
    }
  } else {
    scoreRHR = 10;
  }

  const calculatedReadiness = Math.max(1, Math.min(100, Math.round(scoreHRV + scoreSleep + scoreRHR)));
  const todayReadiness = nativeReadiness != null
    ? Math.round(nativeReadiness)
    : ((avgHrv7d === '--' && avgSleep7d === '--') ? '--' : calculatedReadiness);

  // Alertas por TSB extremos
  if (currentTsb < -30) {
    insights.push({ type: 'danger', label: 'Carga Extrema (TSB)', desc: 'Acumulación de fatiga crónica altísima. Riesgo de estancamiento asegurado sin descanso.' });
  } else if (currentTsb > 10) {
    insights.push({ type: 'warning', label: 'Desentrenamiento', desc: 'Riesgo de perder estado de forma general. TSB indicando infra-carga.' });
  }

  // ── Esfuerzo / Strain ────────────────────────────────────────────────
  let effortScore = 0;
  let effortLabel = 'Recuperación';
  let effortColor = 'text-blue-500';

  if (activeTSS > 0) {
    effortScore = Math.min(100, Math.round(100 * (1 - Math.exp(-activeTSS / 110))));
    if      (effortScore > 85) { effortLabel = 'Extremo';  effortColor = 'text-purple-500'; }
    else if (effortScore > 65) { effortLabel = 'Alto';     effortColor = 'text-red-500';    }
    else if (effortScore > 40) { effortLabel = 'Moderado'; effortColor = 'text-amber-500';  }
    else                       { effortLabel = 'Ligero';   effortColor = 'text-emerald-500'; }
  } else {
    effortColor = 'text-slate-400';
    effortLabel = 'Día Base';
  }

  // Sintetizar estrés si no está disponible desde datos reales
  let finalStress = todayData.stress ?? '--';
  if (finalStress === '--' && baselineHrv > 0 && dailyRHR !== '--') {
    let calc = 20;
    if (dailyRHR > baselineRhr)   calc += (dailyRHR - baselineRhr) * 3;
    if (activeTSS > 0)            calc += activeTSS * 0.2;
    finalStress = Math.round(Math.max(10, Math.min(95, calc)));
  }

  // ── Tendencia de peso ────────────────────────────────────────────────
  const weightData = finalChartData.filter(d => d.weight > 0);
  let weightTrend  = null;
  if (weightData.length >= 7) {
    const first7Avg = weightData.slice(0, 7).reduce((s, d) => s + d.weight, 0) / 7;
    const last7Avg  = weightData.slice(-7).reduce((s, d) => s + d.weight, 0) / 7;
    weightTrend     = Number((last7Avg - first7Avg).toFixed(1));
  }

  // Últimos valores disponibles por métrica
  const findLast = (field) => {
    for (let i = finalChartData.length - 1; i >= 0; i--) {
      if (finalChartData[i][field] != null) return finalChartData[i][field];
    }
    return null;
  };

  return {
    avgHrv7d, avgSleep7d, avgRhr7d, avgWeight7d, normalHrvRange,
    baselineHrv:    Math.round(baselineHrv),
    baselineRhr:    Math.round(baselineRhr),
    todayReadiness,
    readinessSource: nativeReadiness != null ? 'intervals' : 'calculated',
    hrvStatus:      hrvStatus.id,
    hrvStatusObj:   hrvStatus,
    insights,
    chartData:      finalChartData,
    isSimulated:    wellnessData[0]?.isSimulated || false,
    source:         wellnessData[0]?.source      || 'simulated',

    // Últimas métricas disponibles (día más reciente con dato registrado)
    latestHrv:        findLast('hrv')         ?? '--',
    latestHrvSdnn:    findLast('hrvSdnn')     ?? '--',
    latestSleep:      findLast('sleep')       ?? '--',
    latestSleepScore: findLast('sleepScore')  ?? '--',
    latestRhr:        findLast('rhr')         ?? '--',
    latestStress:     finalStress,
    latestSoreness:   findLast('soreness')    ?? '--',
    latestWeight:     findLast('weight')      ?? '--',
    latestBodyFat:    findLast('bodyFat')     ?? '--',
    latestVo2max:     findLast('vo2max')      ?? '--',
    latestReadiness:  nativeReadiness != null ? Math.round(nativeReadiness) : '--',
    latestSteps:      findLast('steps')       ?? '--',
    latestSpo2:       findLast('spo2')        ?? '--',
    latestRespiration: findLast('respiration') ?? '--',
    weightTrend,

    effort:     { score: effortScore, label: effortLabel, color: effortColor, tss: activeTSS },
    currentTsb,
  };
}

/**
 * useWellnessAnalytics — Analítica de bienestar (hook).
 *
 * Responsabilidad única: calcular métricas analíticas a partir de los datos
 * de bienestar. Delega el cálculo a la función pura `calculateWellnessAnalytics`.
 *
 * Recibe `wellnessData`, `currentTsb`, `dailyTSS` y `error` como parámetros.
 * Devuelve `wellnessMetrics`.
 */
export function useWellnessAnalytics({ wellnessData, currentTsb, dailyTSS, error }) {
  const wellnessMetrics = useMemo(() => {
    return calculateWellnessAnalytics(wellnessData, currentTsb, dailyTSS, error);
  }, [wellnessData, currentTsb, dailyTSS, error]);

  return { wellnessMetrics };
}
