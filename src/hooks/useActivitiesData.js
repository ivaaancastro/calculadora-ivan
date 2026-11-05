import { useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { useProfileQuery } from "./queries/useProfileQuery";
import { useActivitiesQuery } from "./queries/useActivitiesQuery";
import { usePlannedWorkoutsQuery } from "./queries/usePlannedWorkoutsQuery";
import toast from "react-hot-toast";

/**
 * useActivitiesData — Gestión de datos de actividades (queries).
 *
 * Responsabilidad única: obtener y exponer los datos crudos de actividades,
 * workouts planificados y perfil, junto con su estado de carga.
 *
 * No contiene lógica de Strava, PMC, ni sincronización automática.
 */
export function useActivitiesData() {
  // ── Store global ────────────────────────────────────────────────────────
  const {
    timeRange, setTimeRange,
    settings,
    uploading, uploadStatus, setUploadState,
    isDeepSyncing, deepSyncProgress, setDeepSyncState,
    isStravaConnected, setStravaConnected,
  } = useAppStore();

  // ── Data queries ────────────────────────────────────────────────────────
  const { query: profileQuery, updateProfileMutation }          = useProfileQuery();
  const {
    query: activitiesQuery,
    deleteActivityMutation,
    clearDbMutation,
    loadHistoricalStreams,
    isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams
  } = useActivitiesQuery();
  const { query: workoutsQuery, addWorkoutMutation, updateWorkoutMutation, deleteWorkoutMutation } = usePlannedWorkoutsQuery();

  const activities      = useMemo(() => activitiesQuery.data || [], [activitiesQuery.data]);
  const plannedWorkouts = useMemo(() => workoutsQuery.data   || [], [workoutsQuery.data]);
  const loading         = profileQuery.isLoading || activitiesQuery.isLoading || workoutsQuery.isLoading;

  // ── API pública: acciones de perfil y actividades ──────────────────────
  const updateProfile       = (newSettings) => updateProfileMutation.mutateAsync(newSettings);
  const fetchActivities     = ()            => activitiesQuery.refetch();
  const addPlannedWorkout   = (data)        => addWorkoutMutation.mutateAsync(data);
  const deletePlannedWorkout = (id)         => deleteWorkoutMutation.mutateAsync(id);
  const updatePlannedWorkout = (id, updates) => updateWorkoutMutation.mutateAsync({ id, updates });

  const deleteActivity = async (id) => {
    try {
      await deleteActivityMutation.mutateAsync(id);
      toast.success('Actividad borrada.');
    } catch (err) {
      console.error('Error borrando actividad:', err);
      toast.error('No se pudo borrar la actividad.');
    }
  };

  const handleClearDb = async () => {
    if (!window.confirm('¿Estás seguro de borrar TODAS tus actividades? Esto no se puede deshacer.')) return;
    try {
      await clearDbMutation.mutateAsync();
      toast.success('Tus actividades han sido borradas de la base de datos.');
    } catch (err) {
      console.error('Error al borrar BD:', err);
      toast.error('Hubo un error al borrar las actividades.');
    }
  };

  return {
    // Datos
    activities,
    plannedWorkouts,
    loading,

    // Estado de carga y UI
    uploading,
    uploadStatus,
    setUploadState,
    isDeepSyncing,
    deepSyncProgress,
    setDeepSyncState,
    isStravaConnected,
    setStravaConnected,

    // Configuración
    timeRange,
    setTimeRange,
    settings,

    // Acciones de actividades
    updateProfile,
    fetchActivities,
    addPlannedWorkout,
    deletePlannedWorkout,
    updatePlannedWorkout,
    deleteActivity,
    handleClearDb,
    loadHistoricalStreams,
    isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams,
  };
}
