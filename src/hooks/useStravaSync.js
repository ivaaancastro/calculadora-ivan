import { useCallback } from "react";
import { supabase } from "../supabase";
import { useAppStore } from "../store/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { getSportCategory } from "../utils/tssEngine";
import toast from "react-hot-toast";

/**
 * useStravaSync — Sincronización con Strava.
 *
 * Responsabilidad única: gestión de tokens de Strava (obtención, refresco,
 * desconexión), descarga de resúmenes de actividades paginada, descarga de
 * streams/telemetría y deep sync (manual y automático).
 *
 * Recibe `activities` y `plannedWorkouts` de useActivitiesData para calcular
 * existingIds y auto-completar workouts planificados.
 */
export function useStravaSync({ activities, plannedWorkouts, deletePlannedWorkout }) {
  const {
    isStravaConnected, setStravaConnected,
    setUploadState, setDeepSyncState,
  } = useAppStore();
  const queryClient = useQueryClient();

  // ── Strava: token management ─────────────────────────────────────────────

  const disconnectStrava = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase.from('profiles').update({
      strava_access_token:  null,
      strava_refresh_token: null,
      strava_expires_at:    null,
    }).eq('user_id', userId);
    setStravaConnected(false);
  }, [setStravaConnected]);

  /** Refresca el access token de Strava usando el refresh token. */
  const refreshStravaToken = async (refreshToken) => {
    const params = new URLSearchParams({
      client_id:     import.meta.env.VITE_STRAVA_CLIENT_ID,
      client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    });
    const response = await fetch(`https://www.strava.com/oauth/token?${params}`, { method: 'POST' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Strava refresh fail:', err);
      throw new Error('Error refrescando token Strava');
    }
    return response.json();
  };

  /** Devuelve un access token válido, refrescándolo automáticamente si ha caducado. */
  const getValidStravaToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('strava_access_token, strava_refresh_token, strava_expires_at')
      .eq('user_id', userId)
      .single();

    if (!profile?.strava_access_token) throw new Error('No conectado a Strava.');

    // Refrescar si caduca en menos de 5 minutos
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (profile.strava_expires_at && nowSeconds >= profile.strava_expires_at - 300) {
      try {
        const newTokens = await refreshStravaToken(profile.strava_refresh_token);
        await supabase.from('profiles').update({
          strava_access_token:  newTokens.access_token,
          strava_refresh_token: newTokens.refresh_token,
          strava_expires_at:    newTokens.expires_at,
        }).eq('user_id', userId);
        return newTokens.access_token;
      } catch {
        await disconnectStrava();
        throw new Error('Sesión de Strava caducada. Reconecta tu cuenta.');
      }
    }
    return profile.strava_access_token;
  }, [disconnectStrava]);

  // ── Strava: descarga de telemetría ───────────────────────────────────────

  /**
   * Descarga los streams (telemetría segundo a segundo) y los laps de una actividad
   * desde la API de Strava y los persiste en Supabase.
   */
  const fetchActivityStreams = useCallback(async (activityId, stravaId) => {
    try {
      // 1. Comprobar si ya existe en Supabase
      const { data: dbAct } = await supabase
        .from('activities')
        .select('streams_data')
        .eq('id', activityId)
        .single();

      if (dbAct?.streams_data) {
        queryClient.setQueryData(['activities'], (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((a) =>
            a.id === activityId ? { ...a, streams_data: dbAct.streams_data } : a
          );
        });
        return dbAct.streams_data;
      }

      if (!stravaId) return null;
      const token = await getValidStravaToken();

      const [streamsRes, lapsRes] = await Promise.all([
        fetch(
          `https://www.strava.com/api/v3/activities/${stravaId}/streams?keys=time,heartrate,watts,velocity_smooth,altitude,cadence,latlng&key_by_type=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `https://www.strava.com/api/v3/activities/${stravaId}/laps`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      if (streamsRes.status === 429) {
        toast.error('Límite de peticiones de Strava alcanzado (100 peticiones / 15 min). Inténtalo más tarde.');
        return { error: 'rate_limit' };
      }

      if (!streamsRes.ok) return null;

      const streams         = await streamsRes.json();
      const laps            = lapsRes.ok ? await lapsRes.json() : [];
      const enrichedStreams  = { ...streams, laps };

      await supabase.from('activities')
        .update({ streams_data: enrichedStreams })
        .eq('id', activityId);

      queryClient.setQueryData(['activities'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((a) =>
          a.id === activityId ? { ...a, streams_data: enrichedStreams } : a
        );
      });

      return enrichedStreams;
    } catch (e) {
      console.error('Error descargando telemetría:', e);
      return null;
    }
  }, [getValidStravaToken, queryClient]);

  // ── Strava: sincronización de resúmenes + auto-completado de planes ──────

  /**
   * Traduce el tipo de actividad de Strava (inglés) al equivalente en español
   * usado en la aplicación.
   */
  const translateStravaType = (stravaType) => {
    const map = {
      Run:           'Carrera',
      Ride:          'Ciclismo',
      WeightTraining: 'Fuerza',
      Walk:          'Caminata',
      Swim:          'Natación',
    };
    return map[stravaType] || stravaType;
  };

  const handleStravaSync = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Sesión no válida');

      setUploadState(true, 'Buscando historial...');
      const accessToken = await getValidStravaToken();

      let page       = 1;
      let hasMore    = true;
      let totalNew   = 0;
      const existingIds = new Set(activities.map((a) => String(a.strava_id)));

      // Optimización: sólo pedir actividades posteriores a la última registrada
      let afterParam = '';
      const stravaActs = activities.filter(a => a.strava_id);
      if (stravaActs.length > 0) {
        const latest = stravaActs.reduce((latest, curr) =>
          new Date(curr.date) > new Date(latest.date) ? curr : latest
        );
        const epoch = Math.floor(new Date(latest.date).getTime() / 1000) - 86400;
        afterParam  = `&after=${epoch}`;
      }

      // ── Fase 1: Descarga de resúmenes (paginada) ────────────────────
      while (hasMore) {
        setUploadState(true, `Sincronizando pág. ${page}...`);

        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}${afterParam}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.status === 401) {
          await disconnectStrava();
          throw new Error('Sesión de Strava caducada. Reconecta tu cuenta.');
        }
        if (!response.ok) throw new Error('Error conectando con Strava');

        const stravaActivities = await response.json();
        if (stravaActivities.length === 0) { hasMore = false; break; }

        const newRows = stravaActivities
          .filter((act) => !existingIds.has(String(act.id)))
          .map((act) => ({
            user_id:        userId,
            date:           act.start_date_local,
            type:           translateStravaType(act.type),
            name:           act.name || 'Entreno sin título',
            description:    act.description || '',
            duration:       Math.round(act.moving_time / 60),
            hr_avg:         Number(act.average_heartrate) || 0,
            calories:       act.kilojoules || act.calories || 0,
            strava_id:      act.id,
            distance:       act.distance || 0,
            elevation_gain: act.total_elevation_gain || 0,
            watts_avg:      act.average_watts || 0,
            speed_avg:      act.average_speed || 0,
            map_polyline:   act.map?.summary_polyline || '',
          }));

        if (newRows.length > 0) {
          const { error: insertError } = await supabase.from('activities').insert(newRows);
          if (insertError) throw new Error(`Error BD: ${insertError.message}`);
          totalNew += newRows.length;

          // ── Auto-completado de planes ── ─────────────────────────
          const matchedIds  = new Set();

          for (const newAct of newRows) {
            const actDate     = new Date(newAct.date).toISOString().split('T')[0];
            const actCategory = getSportCategory(newAct.type);
            const actDuration = newAct.duration || 0;

            const match = plannedWorkouts.find(p => {
              if (matchedIds.has(p.id)) return false;
              const planDate     = new Date(p.date).toISOString().split('T')[0];
              const planCategory = getSportCategory(p.type);
              if (planDate !== actDate || planCategory !== actCategory) return false;
              const planDuration = p.duration || 0;
              if (planDuration > 0 && actDuration > 0) {
                const ratio = actDuration / planDuration;
                return ratio >= 0.5 && ratio <= 1.5;
              }
              return true; // Sin duración → match por fecha + deporte
            });

            if (match) {
              matchedIds.add(match.id);
              await deletePlannedWorkout(match.id);
            }
          }
        }

        if (stravaActivities.length < 200) {
          hasMore = false;
        }
        page++;
      }

      if (totalNew > 0) {
        setUploadState(true, 'Refrescando base de datos...');
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
      }

      // ── Fase 2: Deep Sync automático (telemetría de nuevas actividades) ──
      const { data: { session: sess } } = await supabase.auth.getSession();
      const { data: withoutStreams } = await supabase
        .from('activities')
        .select('id, strava_id')
        .eq('user_id', sess.user.id)
        .not('strava_id', 'is', null)
        .is('streams_data', null);

      const toSync = withoutStreams || [];
      if (toSync.length > 0) {
        setDeepSyncState(true, { current: 1, total: toSync.length });
        for (let i = 0; i < toSync.length; i++) {
          setUploadState(true, `Telemetría: ${i + 1} de ${toSync.length}...`);
          setDeepSyncState(true, { current: i + 1, total: toSync.length });
          await fetchActivityStreams(toSync[i].id, toSync[i].strava_id);
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // ── Fase 3: Confirmación ────────────────────────────────────────
      setUploadState(true, totalNew > 0
        ? `¡Éxito! ${totalNew} actividades nuevas sincronizadas`
        : 'Todo al día y 100% sincronizado'
      );

    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeepSyncState(false, null);
      setTimeout(() => setUploadState(false, null), 4000);
    }
  }, [
    activities, plannedWorkouts, deletePlannedWorkout,
    getValidStravaToken, disconnectStrava,
    setUploadState, setDeepSyncState, queryClient, fetchActivityStreams,
  ]);

  // ── Strava: deep sync manual ─────────────────────────────────────────────

  const handleDeepSync = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { toast.error('Sesión no válida'); return; }

    const { data: withoutStreams, error } = await supabase
      .from('activities')
      .select('id, strava_id')
      .eq('user_id', userId)
      .not('strava_id', 'is', null)
      .is('streams_data', null);

    if (error) { toast.error('Error consultando pendientes de telemetría'); return; }

    const toSync = withoutStreams || [];
    if (toSync.length === 0) {
      toast.success('¡Todo perfecto! Todas tus actividades ya tienen telemetría completa.');
      return;
    }

    if (!window.confirm(
      `Se van a descargar los datos milimétricos de ${toSync.length} actividades.\n\n¿Empezamos?`
    )) return;

    setDeepSyncState(true, { current: 1, total: toSync.length });

    try {
      let hitRateLimit = false;
      for (let i = 0; i < toSync.length; i++) {
        setDeepSyncState(true, { current: i + 1, total: toSync.length });
        const res = await fetchActivityStreams(toSync[i].id, toSync[i].strava_id);
        if (res?.error === 'rate_limit') {
          hitRateLimit = true;
          break;
        }
        await new Promise(r => setTimeout(r, 100));
      }
      if (hitRateLimit) {
        toast.info('Sincronización pausada por límite de peticiones de Strava (100 req/15 min). Puedes continuar más tarde.');
      } else {
        toast.success('¡Sincronización profunda completada! Telemetría y mapas 100% exactos.');
      }
    } catch (err) {
      console.error('Error en deep sync:', err);
      toast.error('La sincronización se detuvo por un error de conexión.');
    } finally {
      setDeepSyncState(false, null);
    }
  }, [fetchActivityStreams, setDeepSyncState]);

  return {
    isStravaConnected,
    handleStravaSync,
    handleDeepSync,
    fetchActivityStreams,
    handleDisconnectStrava: disconnectStrava,
  };
}
