import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { useIntervalsSync } from "./useIntervalsSync";
import { useProfileQuery } from "./queries/useProfileQuery";

/**
 * useIntervalsAutoSync — Auto-sync diario de Intervals.icu.
 *
 * Responsabilidad única: ejecutar una sincronización automática de Intervals.icu
 * una vez al día, cuando los datos han terminado de cargarse y el usuario tiene
 * configuradas sus credenciales de Intervals.icu.
 *
 * Recibe `loading` y `settings` como parámetros.
 */
export function useIntervalsAutoSync({ loading, settings }) {
  const {
    setUploadState,
  } = useAppStore();
  const { syncAll } = useIntervalsSync();
  const { query: profileQuery } = useProfileQuery();

  // ── Auto-sync diario de Intervals.icu ────────────────────────────────────
  // Se ejecuta una vez al día, cuando los datos han terminado de cargarse.
  useEffect(() => {
    if (loading) return;
    if (!settings?.intervalsId || !settings?.intervalsKey) return;

    const lastSyncDate  = settings.intervalsLastSynced
      ? new Date(settings.intervalsLastSynced).toDateString()
      : null;
    const syncedToday   = lastSyncDate === new Date().toDateString();

    if (!syncedToday) {
      setUploadState(true, 'Sincronizando Intervals.icu...');
      syncAll(settings).then(() => {
        profileQuery.refetch();
        setUploadState(false, null);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settings?.intervalsId, settings?.intervalsKey, settings?.intervalsLastSynced, syncAll, setUploadState, profileQuery]);
}
