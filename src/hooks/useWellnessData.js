import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';

// ── Lectura directa de Supabase (sin importar hooks para evitar deps cíclicas) ──
async function fetchWellnessDB(days = 180) {
  try {
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
      // 42P01 = tabla no creada aún (migración pendiente) — fallback silencioso
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.info('[wellness] wellness_data no existe aún — usando simulador');
        return [];
      }
      console.error('[wellness] fetchWellnessDB:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('[wellness] fetchWellnessDB exception:', e);
    return [];
  }
}

// ── Simulador de bienestar ────────────────────────────────────────────────────
/**
 * Genera 181 días de datos de wellness simulados basándose en el historial de TSS.
 * Se llama como función pura (fuera del hook) para garantizar que `Math.random()`
 * sólo se ejecuta una vez por fetch y no en re-renders.
 *
 * @param {object}          settings  - Settings del usuario (fcReposo, weight)
 * @param {Map<string,number>} dailyTSS - Mapa fecha → TSS diario total
 * @returns {object[]} - Array de objetos de wellness simulados
 */
function buildSimulatedWellness(settings, dailyTSS) {
  const simData    = [];
  const baseHrv    = 65;
  const baseSleep  = 7.5;
  const baseRhr    = settings?.fcReposo || 50;
  const baseWeight = settings?.weight   || 70;
  const today      = new Date();

  for (let i = 180; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr  = d.toISOString().split('T')[0];

    const prevDate = new Date(d);
    prevDate.setDate(d.getDate() - 1);
    const yesterdayTSS = dailyTSS.get(prevDate.toISOString().split('T')[0]) || 0;

    const fatigueImpact    = Math.min(yesterdayTSS / 150, 1);
    const rndHrv           = (Math.random() * 10)  - 5;
    const rndSleep         = (Math.random() * 1.5) - 0.75;
    const rndStress        = Math.random() * 20    - 10;
    const dateObj          = new Date(dateStr + 'T00:00:00');
    const dateLabel        = !isNaN(dateObj)
      ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      : dateStr;

    const simSleep      = Math.max(4, Number((baseSleep - fatigueImpact * 1.5 + rndSleep).toFixed(1)));
    const simSleepScore = Math.min(100, Math.round((simSleep / 8) * 100));
    const simStress     = Math.min(100, Math.max(0, Math.round(20 + fatigueImpact * 50 + rndStress)));
    const simSoreness   = Math.round(fatigueImpact * 3);
    const simHrv        = Math.max(20, Math.round(baseHrv - baseHrv * 0.2 * Math.max(0, fatigueImpact) + rndHrv));

    simData.push({
      date:        dateStr,
      dateLabel,
      hrv:         simHrv,
      hrvSdnn:     null,
      sleep:       simSleep,
      sleepScore:  simSleepScore,
      rhr:         Math.round(baseRhr + fatigueImpact * 5 - rndHrv * 0.2),
      weight:      baseWeight,
      bodyFat:     null,
      vo2max:      null,
      readiness:   null,
      ctl:         null,
      atl:         null,
      steps:       null,
      spo2:        null,
      respiration: null,
      stress:      simStress,
      soreness:    simSoreness,
      isSimulated: true,
      source:      'simulated',
    });
  }

  return simData;
}

/**
 * useWellnessData — Carga de datos de bienestar.
 *
 * Responsabilidad única: cargar datos de wellness en orden de prioridad:
 *  1. Supabase (wellness_data, sincronizado desde Intervals.icu)
 *  2. API directa de Intervals.icu (si CORS lo permite en desarrollo)
 *  3. Simulador (generado una única vez, basado en el historial de TSS)
 *
 * Recibe `activities` y `settings` como parámetros.
 * Devuelve wellnessData, loading, error y dailyTSS.
 */
export function useWellnessData({ activities, settings }) {
  const [wellnessData, setWellnessData] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // TSS diario acumulado — se usa tanto en el simulador como en el cómputo de esfuerzo
  const dailyTSS = useMemo(() => {
    const map = new Map();
    if (!activities) return map;
    activities.forEach(act => {
      const dateKey = new Date(act.date).toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) || 0) + (act.tss || 0));
    });
    return map;
  }, [activities]);

  // ── Carga de datos ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchWellness = async () => {
      setLoading(true);
      setError(null);

      try {
        // Prioridad 1: Supabase (sincronizado desde Intervals.icu)
        const dbRows = await fetchWellnessDB(180);

        if (dbRows && dbRows.length > 0) {
          if (cancelled) return;

          const realData = dbRows.map(d => {
            const dateObj   = new Date(d.date + 'T00:00:00');
            const sleepHours = d.sleep_secs
              ? Number((d.sleep_secs / 3600).toFixed(1))
              : null;

            return {
              date:        d.date,
              dateLabel:   !isNaN(dateObj)
                ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                : d.date,
              hrv:         d.hrv         ?? null,
              hrvSdnn:     d.hrv_sdnn    ?? null,
              sleep:       sleepHours,
              sleepScore:  d.sleep_score ?? null,
              rhr:         d.resting_hr  ?? null,
              weight:      d.weight       ?? null,
              bodyFat:     d.body_fat     ?? null,
              vo2max:      d.vo2max       ?? null,
              readiness:   d.readiness    ?? null,  // Readiness nativo de Intervals.icu
              ctl:         d.ctl          ?? null,  // CTL nativo de Intervals.icu
              atl:         d.atl          ?? null,  // ATL nativo de Intervals.icu
              steps:       d.steps        ?? null,
              spo2:        d.spo2         ?? null,
              respiration: d.respiration  ?? null,
              stress:      d.stress       ?? null,
              soreness:    d.soreness     ?? null,
              isSimulated: false,
              source:      'intervals',
            };
          });

          setWellnessData(realData);
          setLoading(false);
          return;
        }

        // Prioridad 2: API directa de Intervals.icu (sólo en dev, suele fallar CORS en prod)
        if (settings?.intervalsId && settings?.intervalsKey) {
          const end       = new Date().toISOString().split('T')[0];
          const startIcu  = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const authHeader = 'Basic ' + btoa(`API_KEY:${settings.intervalsKey}`);

          try {
            const res = await fetch(
              `https://intervals.icu/api/v1/athlete/${settings.intervalsId}/wellness?oldest=${startIcu}&newest=${end}`,
              { headers: { Authorization: authHeader, Accept: 'application/json' } }
            );

            if (res.ok) {
              const data = await res.json();
              if (cancelled) return;

              if (Array.isArray(data) && data.length > 0) {
                const realData = data.map(d => {
                  const dateStr   = d.id || d.date;
                  const dateObj   = new Date(dateStr + 'T00:00:00');
                  const sleepHours = d.sleepSecs
                    ? Number((d.sleepSecs / 3600).toFixed(1))
                    : (d.sleep ?? null);

                  return {
                    date:        dateStr,
                    dateLabel:   !isNaN(dateObj)
                      ? dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      : dateStr,
                    hrv:         d.hrv         ?? null,
                    hrvSdnn:     d.hrvSDNN     ?? null,
                    sleep:       sleepHours,
                    sleepScore:  d.sleepScore  ?? null,
                    rhr:         d.restingHR   ?? null,
                    weight:      d.weight       ?? null,
                    bodyFat:     d.bodyFat      ?? null,
                    vo2max:      d.vo2max       ?? null,
                    readiness:   d.readiness    ?? null,
                    ctl:         d.ctl          ?? null,
                    atl:         d.atl          ?? null,
                    steps:       d.steps        ?? null,
                    spo2:        d.spO2         ?? null,
                    respiration: d.respiration  ?? null,
                    stress:      null,
                    soreness:    d.soreness     ?? null,
                    isSimulated: false,
                    source:      'intervals_direct',
                  };
                }).sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));

                setWellnessData(realData);
                setLoading(false);
                return;
              }
            }
          } catch {
            // CORS bloqueado en producción — cae al simulador
            console.warn('[wellness] CORS bloqueó la petición a Intervals.icu. Usa el botón "Sync Intervals" para cargar datos reales.');
          }
        }

        // Prioridad 3: Simulador (fallback cuando no hay datos reales)
        if (cancelled) return;
        setWellnessData(buildSimulatedWellness(settings, dailyTSS));

      } catch (err) {
        console.error('[wellness] fetchWellness error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWellness();
    return () => { cancelled = true; };
  }, [settings, dailyTSS]);

  return { wellnessData, loading, error, dailyTSS };
}
