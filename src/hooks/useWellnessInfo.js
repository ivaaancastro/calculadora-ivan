/**
 * useWellnessInfo.js — Hook de Datos de Salud y Bienestar (orquestador).
 *
 * Orquesta la carga y analítica de datos de bienestar componiendo sub-hooks SRP:
 *  - useWellnessData: carga de wellness (Supabase / Intervals.icu / simulador)
 *  - useWellnessAnalytics: métricas analíticas (EWMA, readiness, insights, esfuerzo)
 *
 * Recibe los mismos parámetros que antes del refactor y expone la misma API pública.
 */
import { useWellnessData } from './useWellnessData';
import { useWellnessAnalytics } from './useWellnessAnalytics';

/** `pmcToday`: métricas de hoy del PMC (`currentMetrics`); sin ellas no hay alertas de forma. */
export const useWellnessInfo = (activities, settings, pmcToday) => {
  // ── Capa de datos de wellness ────────────────────────────────────────────
  const wellness = useWellnessData({ activities, settings });

  // ── Capa de analítica ────────────────────────────────────────────────────
  const analytics = useWellnessAnalytics({
    wellnessData: wellness.wellnessData,
    pmcToday,
    dailyTSS: wellness.dailyTSS,
    error: wellness.error,
  });

  // ── Retorno del hook (API pública idéntica a la original) ────────────────
  return {
    wellnessMetrics: analytics?.wellnessMetrics ?? null,
    loading:         wellness.loading,
    error:           wellness.error,
  };
}
