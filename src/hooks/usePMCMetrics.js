import { useMemo } from "react";
import {
  calculateActivityTSS,
  SPORT_LOAD_CONFIG,
  getSportCategory,
  calculatePMC,
} from "../utils/tssEngine";

// ── Constantes de timeRange ──────────────────────────────────────────────────
const TIME_RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

/**
 * usePMCMetrics — Cálculo del Performance Management Chart (PMC).
 *
 * Responsabilidad única: calcular TSS por actividad, PMC (CTL, ATL, TSB,
 * ACWR, monotonía, strain), filtrado por timeRange, distribución por deporte
 * y resumen del período visible.
 *
 * Recibe `activities`, `settings` y `timeRange` como parámetros.
 */
export function usePMCMetrics({ activities, settings, timeRange }) {
  const metrics = useMemo(() => {
    if (!activities || activities.length === 0) {
      return {
        activities:     [],
        filteredData:   [],
        currentMetrics: null,
        chartData:      [],
        distribution:   [],
        summary:        { count: 0 },
      };
    }

    // ── 1. Calcular TSS de cada actividad ─────────────────────────────────
    const processedActivities = activities.map((act) => {
      const calcTss = calculateActivityTSS(act, settings);
      const tssVal  = typeof calcTss === 'number' ? calcTss : (calcTss?.tss || 0);
      return {
        ...act,
        tss:              tssVal,
        np:               calcTss?.np              || null,
        intensity_factor: calcTss?.intensity_factor || null,
        tssMethod:        calcTss?.method          || 'unknown',
        sportCategory:    getSportCategory(act.type),
      };
    });

    // ── 2. Calcular PMC (Performance Management Chart) ───────────────────
    const { fullSeries, metrics: pmcMetrics, loadHistory } = calculatePMC(processedActivities, settings);

    // ── 3. Filtrado por timeRange ─────────────────────────────────────────
    const cutoff = new Date();
    const days   = TIME_RANGE_DAYS[timeRange];
    const today  = new Date();
    if (days) cutoff.setDate(today.getDate() - days);
    else      cutoff.setTime(processedActivities[0] ? new Date(processedActivities[0].date).getTime() : 0);

    const visibleActs = processedActivities.filter(a => new Date(a.date) >= cutoff);
    const chartData   = fullSeries.filter(d => new Date(d.date) >= cutoff);

    // ── 4. Distribución por tipo de deporte ──────────────────────────────
    const cats = visibleActs.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const distribution = Object.entries(cats).map(([name, value]) => ({ name, value }));

    // ── 5. Resumen del período visible ────────────────────────────────────
    let sumDur = 0, sumDist = 0, sumElev = 0, sumTSS = 0, sumTSSEffective = 0;
    visibleActs.forEach((a) => {
      const cfg = SPORT_LOAD_CONFIG[a.sportCategory] || SPORT_LOAD_CONFIG.other;
      sumDur          += a.duration;
      sumDist         += a.distance;
      sumElev         += a.elevation_gain;
      sumTSS          += a.tss;
      sumTSSEffective += Math.round(a.tss * cfg.fatigue);
    });

    const summary = {
      count:     visibleActs.length,
      duration:  Math.floor(sumDur / 60),    // Horas
      distance:  Math.round(sumDist / 1000),  // km
      elevation: sumElev,                      // m
      tss:       sumTSS,
      tssEffective: sumTSSEffective,
    };

    // Monotonía y Strain (Foster, 1998)
    const avg7 = pmcMetrics ? pmcMetrics.avgTss7d : 0;
    const last7Loads = loadHistory ? loadHistory.slice(-7) : [];
    const variance  = last7Loads.reduce((t, n) => t + Math.pow(n - avg7, 2), 0) / (last7Loads.length || 1);
    const stdDev    = Math.sqrt(variance);
    const monotony  = stdDev > 0 ? avg7 / stdDev : (avg7 > 0 ? 4 : 0);
    const strain    = (avg7 * (last7Loads.length || 7)) * monotony;

    const currentMetrics = {
      ctl:        pmcMetrics?.ctl || 0,
      rawCtl:     pmcMetrics?.rawCtl || 0,
      atl:        pmcMetrics?.atl || 0,
      tsb:        pmcMetrics?.tsb || 0,
      tcb:        pmcMetrics?.tsb || 0, // Alias
      rampRate:   pmcMetrics?.rampRate || 0,
      avgTss7d:   pmcMetrics?.avgTss7d || 0,
      acwr:       pmcMetrics?.acwr || 0,
      monotony:   parseFloat(monotony.toFixed(2)),
      strain:     Math.round(strain),
      pastCtl:    pmcMetrics?.pastCtl || 0,
    };

    return {
      activities:   processedActivities.slice().reverse(), // Más reciente primero
      filteredData: visibleActs.slice().reverse(),
      currentMetrics,
      chartData,
      distribution,
      summary,
    };
  }, [activities, timeRange, settings]);

  return {
    activities:      metrics.activities,
    filteredData:    metrics.filteredData,
    currentMetrics:  metrics.currentMetrics,
    chartData:       metrics.chartData,
    distribution:    metrics.distribution,
    summary:         metrics.summary,
  };
}
