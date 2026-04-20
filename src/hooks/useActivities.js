/**
 * useActivities.js — Hook raíz de la aplicación.
 *
 * Orquesta todas las operaciones relacionadas con las actividades del usuario:
 *  - Carga de datos (actividades, workouts planificados, perfil) vía TanStack Query
 *  - Sincronización con Strava (resúmenes + telemetría)
 *  - Auto-completado de workouts planificados cuando se sincroniza Strava
 *  - Auto-sync diario de Intervals.icu al cargar la app
 *  - Cálculo del PMC (Performance Management Chart): CTL, ATL, TSB
 *  - Derivación de métricas adicionales (ACWR, monotonía, strain)
 *
 * El hook expone un único objeto con todo lo que necesita el Dashboard.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase";
import {
    SPORT_LOAD_CONFIG,
    getSportCategory,
    calculateActivityTSS,
} from "../utils/tssEngine";
import { useAppStore } from "../store/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileQuery } from "./queries/useProfileQuery";
import { useActivitiesQuery } from "./queries/useActivitiesQuery";
import { usePlannedWorkoutsQuery } from "./queries/usePlannedWorkoutsQuery";
import { useIntervalsSync } from "./useIntervalsSync";
import toast from "react-hot-toast";

// ── Constantes de timeRange ──────────────────────────────────────────────────
const TIME_RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

export const useActivities = () => {
    const queryClient = useQueryClient();

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
    const { query: activitiesQuery, deleteActivityMutation, clearDbMutation } = useActivitiesQuery();
    const { query: workoutsQuery, addWorkoutMutation, updateWorkoutMutation, deleteWorkoutMutation } = usePlannedWorkoutsQuery();
    const { syncAll }                                              = useIntervalsSync();

    const activities      = activitiesQuery.data || [];
    const plannedWorkouts = workoutsQuery.data   || [];
    const loading         = profileQuery.isLoading || activitiesQuery.isLoading || workoutsQuery.isLoading;

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
            syncAll(settings).then(() => profileQuery.refetch());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, settings?.intervalsId, settings?.intervalsKey, settings?.intervalsLastSynced]);

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
     *
     * @param {string|number} activityId  - ID interno (BD)
     * @param {string|number} stravaId    - ID de Strava
     * @returns {object|null}             - Objeto con streams + laps, o null si falla
     */
    const fetchActivityStreams = useCallback(async (activityId, stravaId) => {
        try {
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

    const handleStravaSync = async () => {
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
                // Restar 1 día (86400s) para cubrir posibles solapes por zona horaria
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
                    page++;

                    // ── Auto-completado de planes ── ─────────────────────────
                    // Si hay un workout planificado el mismo día y mismo deporte
                    // con duración similar (±50%), se elimina automáticamente.
                    const planned     = workoutsQuery.data || [];
                    const matchedIds  = new Set();

                    for (const newAct of newRows) {
                        const actDate     = new Date(newAct.date).toISOString().split('T')[0];
                        const actCategory = getSportCategory(newAct.type);
                        const actDuration = newAct.duration || 0;

                        const match = planned.find(p => {
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
                } else {
                    hasMore = false;
                }
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
                    await new Promise(r => setTimeout(r, 100)); // Pequeña pausa para dejar respirar la UI
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
    };

    // ── Strava: deep sync manual ─────────────────────────────────────────────

    /**
     * Descarga la telemetría de todas las actividades de Strava que aún no
     * tienen streams almacenados. Solicita confirmación al usuario.
     */
    const handleDeepSync = async () => {
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
            for (let i = 0; i < toSync.length; i++) {
                setDeepSyncState(true, { current: i + 1, total: toSync.length });
                await fetchActivityStreams(toSync[i].id, toSync[i].strava_id);
                await new Promise(r => setTimeout(r, 100));
            }
            toast.success('¡Sincronización profunda completada! Telemetría y mapas 100% exactos.');
        } catch (err) {
            console.error('Error en deep sync:', err);
            toast.error('La sincronización se detuvo por un error de conexión.');
        } finally {
            setDeepSyncState(false, null);
        }
    };

    // ── Núcleo matemático del PMC (Performance Management Chart) ─────────────
    /**
     * Calcula el PMC completo para todos los días desde la primera actividad
     * hasta hoy + 7 días (ventana de proyección).
     *
     * Implementa el modelo EWMA exacto de Intervals.icu:
     *   CTL_new = CTL_prev × k_ctl + TSS × (1 − k_ctl)
     *   ATL_new = ATL_prev × k_atl + TSS × (1 − k_atl)
     *   k_ctl   = exp(-1/42)  ≈ 0.97614  (constante de 42 días)
     *   k_atl   = exp(-1/7)   ≈ 0.86671  (constante de 7 días)
     *
     * Cada deporte contribuye con su factor de fitness/fatiga de SPORT_LOAD_CONFIG.
     */
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

        // ── Calcular TSS de cada actividad ─────────────────────────────────
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

        // ── Indexar actividades por día ────────────────────────────────────
        const activitiesMap = new Map();
        processedActivities.forEach((act) => {
            const dKey = new Date(act.date).toISOString().split('T')[0];
            if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
            activitiesMap.get(dKey).push(act);
        });

        // ── Constantes del modelo EWMA ─────────────────────────────────────
        const ta           = settings.ta || 42;
        const tf           = settings.tf || 7;
        const K_CTL        = Math.exp(-1 / ta);   // Factor de decaimiento CTL
        const K_ATL        = Math.exp(-1 / tf);   // Factor de decaimiento ATL
        const K_CTL_GAIN   = 1 - K_CTL;
        const K_ATL_GAIN   = 1 - K_ATL;
        const offsetCtl    = parseFloat(settings.offsetCtl) || 0;

        // ── Iterar día a día ───────────────────────────────────────────────
        const oneDay     = 24 * 60 * 60 * 1000;
        const startDate  = new Date(processedActivities[0].date);
        const today      = new Date();
        const startUTC   = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
        const todayUTC   = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        const endUTC     = todayUTC + 7 * oneDay; // Proyectar 1 semana hacia adelante

        let ctl          = 0;
        let atl          = 0;
        const fullSeries = [];
        const loadHistory = []; // Carga diaria efectiva (ATL contrib) para calcular ACWR

        for (let time = startUTC; time <= endUTC; time += oneDay) {
            const dateStr = new Date(time).toISOString().split('T')[0];
            const daysActs = activitiesMap.get(dateStr) || [];

            let dailyTss         = 0;
            let dailyCtlContrib  = 0;
            let dailyAtlContrib  = 0;

            daysActs.forEach((act) => {
                const cfg = SPORT_LOAD_CONFIG[act.sportCategory] || SPORT_LOAD_CONFIG.other;
                dailyTss        += act.tss;
                dailyCtlContrib += act.tss * cfg.fitness;
                dailyAtlContrib += act.tss * cfg.fatigue;
            });

            if (time <= todayUTC) loadHistory.push(Math.round(dailyAtlContrib));

            // Fórmula EWMA exacta de Intervals.icu
            if (fullSeries.length === 0 && dailyTss > 0) {
                // Seeding: primer día con entrenamiento inicializa CTL/ATL
                ctl = dailyCtlContrib;
                atl = dailyAtlContrib;
            } else {
                ctl = ctl * K_CTL + dailyCtlContrib * K_CTL_GAIN;
                atl = atl * K_ATL + dailyAtlContrib * K_ATL_GAIN;
            }

            const finalCtl = ctl + offsetCtl;
            const tsb      = parseFloat((finalCtl - atl).toFixed(1));

            fullSeries.push({
                date:              dateStr,
                ctl:               parseFloat(finalCtl.toFixed(1)),
                atl:               parseFloat(atl.toFixed(1)),
                tsb,
                dailyTss:          Math.round(dailyTss),
                dailyTssEffective: Math.round(dailyAtlContrib),
            });
        }

        // ── Métricas actuales ──────────────────────────────────────────────
        const todayStr    = new Date(todayUTC).toISOString().split('T')[0];
        const todayIdx    = fullSeries.findIndex(d => d.date === todayStr);
        const currentIdx  = todayIdx !== -1 ? todayIdx : fullSeries.length - 8;

        const lastPoint      = fullSeries[currentIdx]       || { ctl: 0, atl: 0, tsb: 0 };
        const prevWeekPoint  = fullSeries[currentIdx - 7]   || { ctl: 0 };
        const pastMonthPoint = fullSeries[currentIdx - 30]  || fullSeries[0] || { ctl: 0 };

        const rampRate     = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));
        const last7Loads   = loadHistory.slice(-7);
        const last28Loads  = loadHistory.slice(-28);
        const sum7         = last7Loads.reduce((a, b) => a + b, 0);
        const avg7         = sum7 / (last7Loads.length || 1);
        const avg28        = last28Loads.reduce((a, b) => a + b, 0) / (last28Loads.length || 1);
        const acwr         = avg28 > 0 ? avg7 / avg28 : 0;

        // Monotonía y Strain (Foster, 1998)
        const variance  = last7Loads.reduce((t, n) => t + Math.pow(n - avg7, 2), 0) / (last7Loads.length || 1);
        const stdDev    = Math.sqrt(variance);
        const monotony  = stdDev > 0 ? avg7 / stdDev : (avg7 > 0 ? 4 : 0);
        const strain    = sum7 * monotony;

        // ── Filtrado por timeRange ─────────────────────────────────────────
        const cutoff = new Date();
        const days   = TIME_RANGE_DAYS[timeRange];
        if (days) cutoff.setDate(today.getDate() - days);
        else      cutoff.setTime(processedActivities[0] ? new Date(processedActivities[0].date).getTime() : 0);

        const visibleActs = processedActivities.filter(a => new Date(a.date) >= cutoff);
        const chartData   = fullSeries.filter(d => new Date(d.date) >= cutoff);

        // ── Distribución por tipo de deporte ──────────────────────────────
        const cats = visibleActs.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});
        const distribution = Object.entries(cats).map(([name, value]) => ({ name, value }));

        // ── Resumen del período visible ────────────────────────────────────
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

        const currentMetrics = {
            ctl:        lastPoint.ctl,
            rawCtl:     lastPoint.ctl - offsetCtl,
            atl:        lastPoint.atl,
            tsb:        lastPoint.tsb,
            rampRate,
            avgTss7d:   Math.round(avg7),
            acwr:       parseFloat(acwr.toFixed(2)),
            monotony:   parseFloat(monotony.toFixed(2)),
            strain:     Math.round(strain),
            pastCtl:    parseFloat(pastMonthPoint.ctl.toFixed(1)),
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

    // ── Retorno del hook ─────────────────────────────────────────────────────
    return {
        // Datos
        activities:      metrics.activities,
        filteredData:    metrics.filteredData,
        currentMetrics:  metrics.currentMetrics,
        chartData:       metrics.chartData,
        distribution:    metrics.distribution,
        summary:         metrics.summary,
        plannedWorkouts,

        // Estado de carga
        loading,
        uploading,
        uploadStatus,
        isDeepSyncing,
        deepSyncProgress,

        // UI
        timeRange,
        setTimeRange,
        settings,

        // Acciones de Strava
        isStravaConnected,
        handleStravaSync,
        handleDisconnectStrava: disconnectStrava,
        handleDeepSync,
        fetchActivityStreams,

        // Acciones de actividades
        deleteActivity,
        handleClearDb,
        fetchActivities,

        // Acciones de planificación
        addPlannedWorkout,
        deletePlannedWorkout,
        updatePlannedWorkout,

        // Acciones de perfil
        updateProfile,
    };
};
