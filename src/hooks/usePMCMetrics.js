import { useMemo } from "react";
import {
  calculateActivityTSS,
  SPORT_LOAD_CONFIG,
  getSportCategory,
  calculatePMC,
} from "../utils/tssEngine";
import { activityDayKey, addDays, todayKey } from "../utils/dates";
import { streamsWindowStart, totalTss } from "../utils/load";

// ── Constantes de timeRange ──────────────────────────────────────────────────
const TIME_RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

/** Días proyectados que enseña la gráfica del Dashboard. */
const CHART_PROJECTION_DAYS = 7;

/**
 * usePMCMetrics — Única entrada de la app al PMC.
 *
 * Calcula el TSS de cada actividad, la serie completa (real + proyectada con los planes) y las
 * métricas de hoy. `timeRange` solo recorta la gráfica y el resumen del periodo del Dashboard.
 */
export function usePMCMetrics({ activities, plannedWorkouts, settings, timeRange }) {
  const today = todayKey();

  // La serie no depende del rango elegido: cambiarlo no recalcula ni altera ninguna cifra.
  const pmc = useMemo(() => {
    const windowStart = streamsWindowStart(today);
    const processed = (activities || []).map((act) => {
      // D2: fuera de la ventana el TSS sale del resumen, se hayan cargado o no los streams.
      const useStreams = activityDayKey(act.date) >= windowStart;
      const calc = calculateActivityTSS(useStreams ? act : { ...act, streams_data: null }, settings);
      return {
        ...act,
        tss:              calc.tss || 0,
        np:               calc.np || null,
        intensity_factor: calc.intensity_factor || null,
        tssMethod:        calc.method || 'unknown',
        sportCategory:    getSportCategory(act.type),
      };
    });
    const { fullSeries, metrics } = calculatePMC(processed, settings, plannedWorkouts, { today });
    return { processed, fullSeries, metrics };
  }, [activities, plannedWorkouts, settings, today]);

  const view = useMemo(() => {
    const days = TIME_RANGE_DAYS[timeRange];
    const from = days ? addDays(today, -days) : '';
    const to = addDays(today, CHART_PROJECTION_DAYS);
    const visible = pmc.processed.filter((a) => activityDayKey(a.date) >= from);

    const cats = visible.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    let sumDur = 0, sumDist = 0, sumElev = 0, sumTSSEffective = 0;
    visible.forEach((a) => {
      const cfg = SPORT_LOAD_CONFIG[a.sportCategory] || SPORT_LOAD_CONFIG.other;
      sumDur          += a.duration || 0;
      sumDist         += a.distance || 0;
      sumElev         += a.elevation_gain || 0;
      sumTSSEffective += Math.round(a.tss * cfg.fatigue);
    });

    return {
      filteredData: visible.slice().reverse(),
      chartData:    pmc.fullSeries.filter((d) => d.date >= from && d.date <= to),
      distribution: Object.entries(cats).map(([name, value]) => ({ name, value })),
      summary: {
        count:        visible.length,
        duration:     Math.floor(sumDur / 60),     // Horas
        distance:     Math.round(sumDist / 1000),  // km
        elevation:    sumElev,                      // m
        tss:          totalTss(visible),
        tssEffective: sumTSSEffective,
      },
    };
  }, [pmc, timeRange, today]);

  return {
    activities:     useMemo(() => pmc.processed.slice().reverse(), [pmc]), // Más reciente primero
    currentMetrics: pmc.metrics,
    pmcSeries:      pmc.fullSeries,
    ...view,
  };
}
