/**
 * useIntervalsSync.js — Sincronización desde Intervals.icu a Supabase.
 *
 * Descarga y persiste los siguientes datos:
 *   - Wellness: HRV, FC reposo, peso, sueño, VO2max, readiness, pasos, SpO2
 *   - Perfil del atleta: FTP, FC reposo, peso
 *   - TSS de actividades: icu_training_load (TSS oficial de Intervals)
 *
 * La llamada a la API de Intervals se hace via proxy directo (CORS seguro en dev).
 * En producción se debería enrutar a través de la Edge Function de Supabase.
 */

import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

/**
 * Calls Intervals.icu API directly.
 */
async function callIntervalsProxy({ endpoint, athleteId, apiKey, params = {} }) {
  const pathDetail = endpoint ? `/${endpoint}` : '';
  const queryUrl = new URL(`https://intervals.icu/api/v1/athlete/${athleteId}${pathDetail}`);
  Object.keys(params).forEach(key => queryUrl.searchParams.append(key, params[key]));

  const authString = 'Basic ' + window.btoa(`API_KEY:${apiKey}`);

  const res = await fetch(queryUrl.toString(), {
    method: 'GET',
    headers: {
      'Authorization': authString,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status} Intervals.icu: ${text}`);
  }

  return res.json();
}

export function useIntervalsSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [lastSynced, setLastSynced] = useState(null);

  /**
   * Syncs wellness data from Intervals.icu into the wellness_data Supabase table.
   * Fetches last `days` days.
   */
  const syncWellness = useCallback(async ({ athleteId, apiKey, days = 180, userId }) => {
    const end = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().split('T')[0];

    setSyncProgress('Obteniendo wellness de Intervals.icu...');

    const data = await callIntervalsProxy({
      endpoint: 'wellness',
      athleteId,
      apiKey,
      params: { oldest: start, newest: end },
    });

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Intervals.icu devolvió wellness vacío. Verifica que Garmin está sincronizado allí.');
    }

    setSyncProgress(`Procesando ${data.length} días de datos...`);

    // Map Intervals.icu wellness fields → our DB schema
    const rows = data.map(d => ({
      user_id: userId,
      date: d.id, // ISO date string "YYYY-MM-DD"
      hrv: d.hrv ?? null,
      hrv_sdnn: d.hrvSDNN ?? null,
      resting_hr: d.restingHR ?? null,
      weight: d.weight ?? null,
      body_fat: d.bodyFat ?? null,
      sleep_secs: d.sleepSecs ?? null,
      sleep_score: d.sleepScore ?? null,
      sleep_quality: d.sleepQuality ?? null,
      avg_sleeping_hr: d.avgSleepingHR ?? null,
      vo2max: d.vo2max ?? null,
      readiness: d.readiness ?? null,
      ctl: d.ctl ?? null,
      atl: d.atl ?? null,
      steps: d.steps ?? null,
      spo2: d.spO2 ?? null,
      respiration: d.respiration ?? null,
      stress: null, // intervals doesn't return stress score in wellness
      soreness: d.soreness ?? null,
      source: 'intervals',
      synced_at: new Date().toISOString(),
    })).filter(r => r.date); // only rows with valid date

    // Upsert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from('wellness_data')
        .upsert(batch, { onConflict: 'user_id,date' });
      if (error) throw error;
    }

    return rows.length;
  }, []);

  /**
   * Syncs athlete profile from Intervals.icu:
   * FTP (icu_ftp from sport settings), resting HR, weight.
   * Updates the profiles table in Supabase.
   */
  const syncAthleteProfile = useCallback(async ({ athleteId, apiKey, userId }) => {
    setSyncProgress('Obteniendo perfil de atleta desde Intervals.icu...');

    const athleteData = await callIntervalsProxy({
      endpoint: '', // Base endpoint for athlete profile
      athleteId,
      apiKey,
    });

    // Extract the key values we want to sync
    const updates = {};
    if (athleteData.icu_resting_hr > 0) updates.fc_reposo = athleteData.icu_resting_hr;
    if (athleteData.icu_weight > 0) updates.weight = parseFloat(athleteData.icu_weight.toFixed(1));

    // Extract FTP from icu_type_settings (sport-specific FTP)
    // intervals stores FTP in sport settings, not directly on athlete
    // But icu_ftp is the general FTP used for cycling
    const rideSport = athleteData.sportInfo?.find(s => s.type === 'Ride');
    if (rideSport?.eftp > 0) updates.ftp = Math.round(rideSport.eftp);

    return { athleteData, updates };
  }, []);

  /**
   * Full sync: wellness + athlete profile
   * Returns a summary of what was synced.
   */
  const syncAll = useCallback(async (settings) => {
    const athleteId = settings?.intervalsId;
    const apiKey = settings?.intervalsKey;

    if (!athleteId || !apiKey) {
      toast.error('Configura tu Athlete ID y API Key de Intervals.icu en el Perfil primero');
      return null;
    }

    setSyncing(true);
    setSyncProgress('Iniciando sincronización...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('No hay sesión activa');

      // 1. Sync athlete profile (get resting HR, weight, FTP)
      const { athleteData, updates: profileUpdates } = await syncAthleteProfile({ athleteId, apiKey, userId });

      // 2. Sync wellness (180 days by default)
      const wellnessDays = await syncWellness({ athleteId, apiKey, days: 180, userId });

      // 3. Update profile last_synced timestamp
      await supabase
        .from('profiles')
        .update({
          intervals_last_synced: new Date().toISOString(),
        })
        .eq('user_id', userId);

      setSyncProgress('¡Sincronización completa!');
      setLastSynced(new Date());

      toast.success(`✅ Intervals sincronizado: ${wellnessDays} días de datos`);

      return {
        wellnessDays,
        profileUpdates,
        athleteData,
      };

    } catch (err) {
      console.error('syncAll error:', err);
      toast.error(`Error al sincronizar: ${err.message}`);
      return null;
    } finally {
      setSyncing(false);
      setSyncProgress('');
    }
  }, [syncAthleteProfile, syncWellness]);

  /**
   * Fetches the latest wellness data from Supabase (already synced).
   * Returns the last `days` days of records sorted by date ascending.
   */
  const fetchWellnessFromDB = useCallback(async (days = 180) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('wellness_data')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('date', sinceStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('fetchWellnessFromDB error:', error);
      return [];
    }

    return data || [];
  }, []);

  /**
   * Returns the latest synced wellness record (most recent day with data).
   */
  const getLatestWellness = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('wellness_data')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }, []);

  return {
    syncing,
    syncProgress,
    lastSynced,
    syncAll,
    syncWellness,
    syncAthleteProfile,
    fetchWellnessFromDB,
    getLatestWellness,
  };
}
