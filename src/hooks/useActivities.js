/**
 * useActivities.js — Hook raíz de la aplicación (orquestador).
 *
 * Orquesta todas las operaciones relacionadas con las actividades del usuario
 * componiendo sub-hooks SRP:
 *  - useActivitiesData: queries de datos y estado de carga
 *  - useStravaSync: sincronización con Strava (tokens, resúmenes, telemetría)
 *  - useIntervalsAutoSync: auto-sync diario de Intervals.icu
 *  - usePMCMetrics: cálculo del PMC (CTL, ATL, TSB, ACWR, monotonía, strain)
 *
 * Expone la misma API pública que antes del refactor.
 */
import { useActivitiesData } from "./useActivitiesData";
import { useStravaSync } from "./useStravaSync";
import { useIntervalsAutoSync } from "./useIntervalsAutoSync";
import { usePMCMetrics } from "./usePMCMetrics";

export const useActivities = () => {
  // ── Capa de datos ────────────────────────────────────────────────────────
  const data = useActivitiesData();

  // ── Capa de Strava ───────────────────────────────────────────────────────
  const strava = useStravaSync({
    activities: data.activities,
    plannedWorkouts: data.plannedWorkouts,
    deletePlannedWorkout: data.deletePlannedWorkout,
  });

  // ── Auto-sync de Intervals.icu ───────────────────────────────────────────
  useIntervalsAutoSync({
    loading: data.loading,
    settings: data.settings,
  });

  // ── Capa de PMC y métricas ───────────────────────────────────────────────
  const pmc = usePMCMetrics({
    activities: data.activities,
    settings: data.settings,
    timeRange: data.timeRange,
  });

  // ── Retorno del hook (API pública idéntica a la original) ────────────────
  return {
    // Datos (del PMC, que incluye actividades procesadas con TSS)
    activities:      pmc.activities,
    filteredData:    pmc.filteredData,
    currentMetrics:  pmc.currentMetrics,
    chartData:       pmc.chartData,
    distribution:    pmc.distribution,
    summary:         pmc.summary,
    plannedWorkouts: data.plannedWorkouts,

    // Estado de carga
    loading:         data.loading,
    uploading:       data.uploading,
    uploadStatus:    data.uploadStatus,
    isDeepSyncing:   data.isDeepSyncing,
    deepSyncProgress: data.deepSyncProgress,

    // UI
    timeRange:       data.timeRange,
    setTimeRange:    data.setTimeRange,
    settings:        data.settings,

    // Acciones de Strava
    isStravaConnected: strava.isStravaConnected,
    handleStravaSync:  strava.handleStravaSync,
    handleDisconnectStrava: strava.handleDisconnectStrava,
    handleDeepSync:    strava.handleDeepSync,
    fetchActivityStreams: strava.fetchActivityStreams,

    // Acciones de actividades
    deleteActivity:        data.deleteActivity,
    handleClearDb:         data.handleClearDb,
    fetchActivities:       data.fetchActivities,
    loadHistoricalStreams: data.loadHistoricalStreams,
    isLoadingHistoricalStreams: data.isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams: data.hasLoadedHistoricalStreams,

    // Acciones de planificación
    addPlannedWorkout:     data.addPlannedWorkout,
    deletePlannedWorkout:  data.deletePlannedWorkout,
    updatePlannedWorkout:  data.updatePlannedWorkout,

    // Acciones de perfil
    updateProfile:         data.updateProfile,
  };
}
