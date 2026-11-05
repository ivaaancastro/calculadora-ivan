/**
 * useWellnessInfo.js — Hook de Datos de Salud y Bienestar (orquestador).
 *
 * Orquesta la carga y analítica de datos de bienestar componiendo sub-hooks SRP:
 *  - useWellnessData: carga de wellness (Supabase / Intervals.icu / simulador)
 *  - useWellnessAnalytics: métricas analíticas (EWMA, readiness, insights, esfuerzo)
 *
 * Recibe los mismos parámetros que antes del refactor y expone la misma API pública.
 */
import { useMemo } from 'react';
import { useWellnessData } from './useWellnessData';
import { useWellnessAnalytics } from './useWellnessAnalytics';

export const useWellnessInfo = (activities, settings, chartData) => {
  // ── Capa de datos de wellness ────────────────────────────────────────────
  const wellness = useWellnessData({ activities, settings });

  // ── TSB actual del último punto del chart ────────────────────────────────
  const currentTsb = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const last = chartData[chartData.length - 1];
    return last?.tsb ?? 0;
  }, [chartData]);

  // ── Capa de analítica ────────────────────────────────────────────────────
  const analytics = useWellnessAnalytics({
    wellnessData: wellness.wellnessData,
    currentTsb,
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
