import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase";
import {
  LTHR_ZONE_PCT, SPORT_LOAD_CONFIG,
  getSportCategory, calcZonesFromLTHR,
  calculateActivityTSS, recalcTssFromBlocks,
} from "../utils/tssEngine";

import { useAppStore } from "../store/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileQuery } from "./queries/useProfileQuery";
import { useActivitiesQuery } from "./queries/useActivitiesQuery";
import { usePlannedWorkoutsQuery } from "./queries/usePlannedWorkoutsQuery";
import toast from "react-hot-toast";

export const useActivities = () => {
  const queryClient = useQueryClient();

  const {
    timeRange, setTimeRange,
    settings, updateSettings, setSettings,
    uploading, uploadStatus, setUploadState,
    isDeepSyncing, deepSyncProgress, setDeepSyncState,
    isStravaConnected, setStravaConnected
  } = useAppStore();

  const { query: profileQuery, updateProfileMutation } = useProfileQuery();
  const { query: activitiesQuery, deleteActivityMutation, clearDbMutation } = useActivitiesQuery();
  const { query: workoutsQuery, addWorkoutMutation, updateWorkoutMutation, deleteWorkoutMutation } = usePlannedWorkoutsQuery();

  const activities = activitiesQuery.data || [];
  const plannedWorkouts = workoutsQuery.data || [];
  const loading = profileQuery.isLoading || activitiesQuery.isLoading || workoutsQuery.isLoading;

  const fetchProfile = async () => profileQuery.refetch();
  const updateProfile = async (newSettings) => updateProfileMutation.mutateAsync(newSettings);
  const fetchActivities = async () => activitiesQuery.refetch();
  const fetchPlannedWorkouts = async () => workoutsQuery.refetch();

  const addPlannedWorkout = async (workoutData) => addWorkoutMutation.mutateAsync(workoutData);
  const deletePlannedWorkout = async (id) => deleteWorkoutMutation.mutateAsync(id);
  const updatePlannedWorkout = async (id, updates) => updateWorkoutMutation.mutateAsync({ id, updates });

  const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  const refreshStravaToken = async (refreshToken) => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`https://www.strava.com/oauth/token?${params.toString()}`, {
      method: "POST"
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Strava refresh fail:", err);
        throw new Error("Error refrescando token Strava");
    }
    return await response.json();
  };

  const handleDisconnectStrava = async () => {
    const userId = await getCurrentUserId();
    await supabase
      .from("profiles")
      .update({
        strava_access_token: null,
        strava_refresh_token: null,
        strava_expires_at: null,
      })
      .eq("user_id", userId);
    setStravaConnected(false);
  };

  const getValidStravaToken = async () => {
    const userId = await getCurrentUserId();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (!profile?.strava_access_token)
      throw new Error("No conectado a Strava.");

    let accessToken = profile.strava_access_token;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (
      profile.strava_expires_at &&
      nowInSeconds >= profile.strava_expires_at - 300
    ) {
      try {
        const newTokens = await refreshStravaToken(
          profile.strava_refresh_token,
        );
        await supabase
          .from("profiles")
          .update({
            strava_access_token: newTokens.access_token,
            strava_refresh_token: newTokens.refresh_token,
            strava_expires_at: newTokens.expires_at,
          })
          .eq("user_id", userId);
        accessToken = newTokens.access_token;
      } catch (e) {
        await handleDisconnectStrava();
        throw new Error("Sesión caducada.");
      }
    }
    return accessToken;
  };

  const fetchActivityStreams = async (activityId, stravaId) => {
    try {
      const token = await getValidStravaToken();
      // Añadimos latlng a la petición de Strava
      const response = await fetch(
        `https://www.strava.com/api/v3/activities/${stravaId}/streams?keys=time,heartrate,watts,velocity_smooth,altitude,cadence,latlng&key_by_type=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return null;
      const streams = await response.json();

      await supabase
        .from("activities")
        .update({ streams_data: streams })
        .eq("id", activityId);

      // Update react query cache directly
      queryClient.setQueryData(["activities"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((a) => a.id === activityId ? { ...a, streams_data: streams } : a);
      });
      return streams;
    } catch (e) {
      return null;
    }
  };

  // --- SINCRONIZACIÓN TOTAL (BÁSICA + DEEP SYNC AUTOMÁTICO) ---
  const handleStravaSync = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Sesión no válida");

      setUploadState(true, "Buscando historial...");
      const accessToken = await getValidStravaToken();

      let page = 1;
      let hasMore = true;
      let totalNew = 0;
      const existingIds = new Set(activities.map((a) => String(a.strava_id)));

      // Optimizacion: Solo solicitar entrenos ocurridos despues del ultimo registrado
      let afterQueryParam = "";
      const stravaActs = activities.filter(a => a.strava_id);
      if (stravaActs.length > 0) {
        const latestAct = stravaActs.reduce((latest, current) => {
          return new Date(current.date) > new Date(latest.date) ? current : latest;
        });
        const epochSeconds = Math.floor(new Date(latestAct.date).getTime() / 1000);
        // Se le resta 1 día (86400 segundos) para garantizar que no se pierden actividades en ese margen de tiempo
        afterQueryParam = `&after=${epochSeconds - 86400}`;
      }

      // FASE 1: DESCARGA DE RESÚMENES (Paginación)
      while (hasMore) {
        setUploadState(true, `Sincronizando pág. ${page}...`);
        const response = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${page}${afterQueryParam}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (response.status === 401) {
          await handleDisconnectStrava();
          throw new Error("Reconecta tu cuenta.");
        }
        if (!response.ok) throw new Error("Error conectando con Strava");

        const stravaActivities = await response.json();

        if (stravaActivities.length === 0) {
          hasMore = false;
          break;
        }

        const newRows = stravaActivities
          .filter((act) => !existingIds.has(String(act.id)))
          .map((act) => {
            let typeES =
              act.type === "Run"
                ? "Carrera"
                : act.type === "Ride"
                  ? "Ciclismo"
                  : act.type;
            if (act.type === "WeightTraining") typeES = "Fuerza";
            if (act.type === "Walk") typeES = "Caminata";
            if (act.type === "Swim") typeES = "Natación";
            return {
              user_id: userId,
              date: act.start_date_local,
              type: typeES,
              name: act.name || "Entreno sin título",
              description: act.description || "",
              duration: Math.round(act.moving_time / 60),
              hr_avg: Number(act.average_heartrate) || 0,
              calories: act.kilojoules || act.calories || 0,
              strava_id: act.id,
              distance: act.distance || 0,
              elevation_gain: act.total_elevation_gain || 0,
              watts_avg: act.average_watts || 0,
              speed_avg: act.average_speed || 0,
              map_polyline: act.map?.summary_polyline || "",
            };
          });

        if (newRows.length > 0) {
          const { error: insertError } = await supabase
            .from("activities")
            .insert(newRows);
          if (insertError) throw new Error(`Error BD: ${insertError.message}`);
          totalNew += newRows.length;
          page++;

          // --- AUTO-COMPLETAR ENTRENOS PLANIFICADOS ---
          // Match inteligente: fecha + deporte + duración razonable (±50%)
          const planned = workoutsQuery.data || [];
          const matchedPlanIds = new Set();
          if (planned.length > 0) {
            for (const newAct of newRows) {
              const actDate = new Date(newAct.date).toISOString().split('T')[0];
              const actCategory = getSportCategory(newAct.type);
              const actDuration = newAct.duration || 0; // minutos
              
              const match = planned.find(p => {
                if (matchedPlanIds.has(p.id)) return false;
                const planDate = new Date(p.date).toISOString().split('T')[0];
                const planCategory = getSportCategory(p.type);
                if (planDate !== actDate || planCategory !== actCategory) return false;
                // Tolerancia de duración: si ambos tienen duración, verificar ±50%
                const planDuration = p.duration || 0;
                if (planDuration > 0 && actDuration > 0) {
                  const ratio = actDuration / planDuration;
                  return ratio >= 0.5 && ratio <= 1.5;
                }
                return true; // Si no hay duración en alguno, match por fecha+deporte
              });

              if (match) {
                matchedPlanIds.add(match.id);
                await deletePlannedWorkout(match.id);
                console.log(`Auto-completado plan ${match.id} → actividad real de ${actCategory} el ${actDate}`);
              }
            }
          }
          // ----------------------------------------------

        } else {
          hasMore = false;
        }
      }

      if (totalNew > 0) {
        setUploadState(true, "Refrescando base de datos...");
        await queryClient.invalidateQueries(["activities"]);
      }

      // FASE 2: DEEP SYNC AUTOMÁTICO (Telemetría y GPS)
      const { data: rawActivitiesWithoutStreams, error: streamsError } = await supabase
        .from("activities")
        .select("id, strava_id")
        .eq("user_id", userId)
        .not("strava_id", "is", null)
        .is("streams_data", null);
        
      if (streamsError) throw new Error("Error consultando pendientes de telemetría");
      
      const activitiesToSync = rawActivitiesWithoutStreams || [];

      if (activitiesToSync.length > 0) {
        setDeepSyncState(true, { current: 1, total: activitiesToSync.length });
        let count = 0;
        for (const act of activitiesToSync) {
          setUploadState(true, `Telemetría: ${count + 1} de ${activitiesToSync.length}...`);
          setDeepSyncState(true, { current: count + 1, total: activitiesToSync.length });

          await fetchActivityStreams(act.id, act.strava_id);
          await new Promise((resolve) => setTimeout(resolve, 100)); // Turbo mode
          count++;
        }
      }

      // FASE 3: CONFIRMACIÓN FINAL
      setUploadState(
        true,
        totalNew > 0
          ? `¡Éxito! ${totalNew} actividades completas al 100%`
          : "Todo al día y 100% sincronizado",
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeepSyncState(false, null);
      setTimeout(() => setUploadState(false, null), 4000);
    }
  };

  // --- SINCRONIZACIÓN PROFUNDA (MODO PRODUCCIÓN - MÁXIMA VELOCIDAD) ---
  const handleDeepSync = async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast.error("Sesión no válida");
      return;
    }
    
    const { data: rawActivitiesWithoutStreams, error: streamsError } = await supabase
      .from("activities")
      .select("id, strava_id")
      .eq("user_id", userId)
      .not("strava_id", "is", null)
      .is("streams_data", null);

    if (streamsError) {
      toast.error("Error consultando pendientes de telemetría");
      return;
    }

    const activitiesToSync = rawActivitiesWithoutStreams || [];

    if (activitiesToSync.length === 0) {
      toast.success(
        "¡Todo perfecto! Todas tus actividades de Strava ya tienen datos exactos segundo a segundo.",
      );
      return;
    }

    if (
      !window.confirm(
        `Se van a descargar los datos milimétricos (Telemetría y GPS) de ${activitiesToSync.length} actividades.\n\nAl tener cuenta de Producción, el proceso irá a máxima velocidad. ¿Empezamos?`,
      )
    )
      return;

    setDeepSyncState(true, { current: 1, total: activitiesToSync.length });
    let count = 0;

    try {
      for (const act of activitiesToSync) {
        setDeepSyncState(true, { current: count + 1, total: activitiesToSync.length });

        await fetchActivityStreams(act.id, act.strava_id);

        // Freno de mano quitado: Solo 100ms para que la UI respire, ¡15 veces más rápido!
        await new Promise((resolve) => setTimeout(resolve, 100));
        count++;
      }
      toast.success(
        "Sincronización profunda completada a velocidad turbo. ¡Tu motor matemático y el mapa interactivo ahora son 100% exactos!",
      );
    } catch (error) {
      console.error("Error en deep sync:", error);
      toast.error("La sincronización profunda se detuvo por un error de conexión.");
    } finally {
      setDeepSyncState(false, null);
    }
  };

  const processFile = async (file) => {
    console.log("Lógica de CSV pendiente", file);
  };

  const handleClearDb = async () => {
    if (!window.confirm("¿Estás seguro de borrar TODAS tus actividades? Esto no se puede deshacer.")) return;
    try {
      await clearDbMutation.mutateAsync();
      toast.success("Tus actividades han sido borradas de la base de datos.");
    } catch (error) {
      console.error("Error al borrar BD:", error);
      toast.error("Hubo un error al borrar las actividades.");
    }
  };

  const deleteActivity = async (id) => {
    try {
      await deleteActivityMutation.mutateAsync(id);
      toast.success("Actividad borrada.");
    } catch (error) {
      console.error("Error borrando actividad:", error);
      toast.error("No se pudo borrar la actividad.");
    }
  };

  const analyzeHistory = (sport) => {
    console.log("Análisis manual pendiente para:", sport);
  };

  // --- NÚCLEO MATEMÁTICO (CON PROYECCIÓN FUTURA) ---
  const metrics = useMemo(() => {
    if (!activities || activities.length === 0)
      return {
        activities: [],
        filteredData: [],
        currentMetrics: null,
        chartData: [],
        distribution: [],
        summary: { count: 0 },
      };

    const processedActivities = [...activities].map((act) => {
      const calcTss = calculateActivityTSS(act, settings);
      const tssVal = typeof calcTss === 'number' ? calcTss : (calcTss?.tss || 0);
      return {
        ...act,
        tss: tssVal,
        np: calcTss?.np || null,
        intensity_factor: calcTss?.intensity_factor || null,
        tssMethod: calcTss?.method || 'unknown',
        sportCategory: getSportCategory(act.type),
      };
    });
    const sortedActs = processedActivities;
    const startDate = new Date(sortedActs[0].date);
    const today = new Date();

    const activitiesMap = new Map();
    sortedActs.forEach((act) => {
      const dKey = new Date(act.date).toISOString().split("T")[0];
      if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
      activitiesMap.get(dKey).push(act);
    });

    let ctl = 0;
    let atl = 0;
    const fullSeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    const loadHistory = [];

    const startUTC = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    );
    const todayUTC = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    const endUTC = todayUTC + 7 * oneDay;

    for (let time = startUTC; time <= endUTC; time += oneDay) {
      const d = new Date(time);
      const dateStr = d.toISOString().split("T")[0];
      const daysActs = activitiesMap.get(dateStr) || [];

      let dailyTss = 0;
      let dailyCtlContrib = 0;
      let dailyAtlContrib = 0;
      daysActs.forEach((act) => {
        const cfg = SPORT_LOAD_CONFIG[act.sportCategory] || SPORT_LOAD_CONFIG.other;
        dailyTss += act.tss;
        dailyCtlContrib += act.tss * cfg.fitness;
        dailyAtlContrib += act.tss * cfg.fatigue;
      });

      if (time <= todayUTC) loadHistory.push(Math.round(dailyAtlContrib));

      if (fullSeries.length === 0 && dailyTss > 0) {
        ctl = dailyCtlContrib;
        atl = dailyAtlContrib;
      } else {
        ctl = ctl + (dailyCtlContrib - ctl) / settings.ta;
        atl = atl + (dailyAtlContrib - atl) / settings.tf;
      }

      fullSeries.push({
        date: dateStr,
        ctl: parseFloat(ctl.toFixed(1)),
        atl: parseFloat(atl.toFixed(1)),
        tcb: parseFloat((ctl - atl).toFixed(1)),
        dailyTss: Math.round(dailyTss),
        dailyTssEffective: Math.round(dailyAtlContrib),
      });
    }

    const todayStr = new Date(todayUTC).toISOString().split("T")[0];
    const todayIndex = fullSeries.findIndex((d) => d.date === todayStr);
    const currentIndex = todayIndex !== -1 ? todayIndex : fullSeries.length - 8;

    const lastPoint = fullSeries[currentIndex] || { ctl: 0, atl: 0, tcb: 0 };
    const prevWeekPoint = fullSeries[currentIndex - 7] || { ctl: 0 };
    const pastMonthPoint = fullSeries[currentIndex - 30] ||
      fullSeries[0] || { ctl: 0 };

    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));
    const last7Loads = loadHistory.slice(-7);
    const last28Loads = loadHistory.slice(-28);
    const sum7 = last7Loads.reduce((a, b) => a + b, 0);
    const avgLoad7 = sum7 / (last7Loads.length || 1);
    const avgLoad28 =
      last28Loads.reduce((a, b) => a + b, 0) / (last28Loads.length || 1);
    const acwr = avgLoad28 > 0 ? avgLoad7 / avgLoad28 : 0;

    const mean = avgLoad7;
    const variance =
      last7Loads.reduce((t, n) => t + Math.pow(n - mean, 2), 0) /
      (last7Loads.length || 1);
    const stdDev = Math.sqrt(variance);
    const monotony = stdDev > 0 ? mean / stdDev : mean > 0 ? 4 : 0;
    const strain = sum7 * monotony;

    const cutoff = new Date();
    if (timeRange === "7d") cutoff.setDate(today.getDate() - 7);
    else if (timeRange === "30d") cutoff.setDate(today.getDate() - 30);
    else if (timeRange === "90d") cutoff.setDate(today.getDate() - 90);
    else if (timeRange === "1y") cutoff.setFullYear(today.getFullYear() - 1);
    else if (timeRange === "all") cutoff.setTime(startDate.getTime());

    const visibleActs = processedActivities.filter(
      (a) => new Date(a.date) >= cutoff,
    );
    const chartData = fullSeries.filter((d) => new Date(d.date) >= cutoff);

    const cats = visibleActs.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});
    const distribution = Object.keys(cats).map((k) => ({
      name: k,
      value: cats[k],
    }));

    let sumDur = 0,
      sumDist = 0,
      sumElev = 0,
      sumTSS = 0,
      sumTSSEffective = 0;
    visibleActs.forEach((a) => {
      const cfg = SPORT_LOAD_CONFIG[a.sportCategory] || SPORT_LOAD_CONFIG.other;
      sumDur += a.duration;
      sumDist += a.distance;
      sumElev += a.elevation_gain;
      sumTSS += a.tss;
      sumTSSEffective += Math.round(a.tss * cfg.fatigue);
    });
    const summary = {
      count: visibleActs.length,
      duration: Math.floor(sumDur / 60),
      distance: Math.round(sumDist / 1000),
      elevation: sumElev,
      tss: sumTSS,
      tssEffective: sumTSSEffective,
    };

    const currentMetrics = {
      ctl: lastPoint.ctl,
      atl: lastPoint.atl,
      tcb: lastPoint.tcb,
      rampRate,
      avgTss7d: Math.round(avgLoad7),
      acwr: parseFloat(acwr.toFixed(2)),
      monotony: parseFloat(monotony.toFixed(2)),
      strain: Math.round(strain),
      pastCtl: parseFloat(pastMonthPoint.ctl.toFixed(1)),
    };

    return {
      activities: processedActivities.reverse(),
      filteredData: visibleActs.reverse(),
      currentMetrics,
      chartData,
      distribution,
      summary,
    };
  }, [activities, timeRange, settings]);

  return {
    activities: metrics.activities,
    plannedWorkouts,
    addPlannedWorkout,
    deletePlannedWorkout,
    updatePlannedWorkout,
    loading,
    uploading,
    uploadStatus,
    timeRange,
    settings,
    isStravaConnected,
    handleStravaSync,
    handleDisconnectStrava,
    setTimeRange,
    handleClearDb,
    deleteActivity,
    processFile,
    fetchActivities,
    fetchProfile,
    analyzeHistory,
    fetchActivityStreams,
    isDeepSyncing,
    deepSyncProgress,
    handleDeepSync,
    updateProfile,
    ...metrics,
  };
};
