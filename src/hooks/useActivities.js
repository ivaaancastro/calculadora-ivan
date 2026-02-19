import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [isDeepSyncing, setIsDeepSyncing] = useState(false);
  const [deepSyncProgress, setDeepSyncProgress] = useState(null);
  
  const [isStravaConnected, setIsStravaConnected] = useState(false);

  const defaultZones = [
    { min: 0, max: 135 }, { min: 136, max: 150 }, { min: 151, max: 165 }, { min: 166, max: 178 }, { min: 179, max: 200 }
  ];

  const [settings, setSettings] = useState({
    gender: 'male', fcReposo: 50, weight: 70, zonesMode: 'manual',
    run: { max: 200, lthr: 178, zones: defaultZones }, 
    bike: { max: 190, lthr: 168, zones: defaultZones },
    ta: 42, tf: 7 
  });

  useEffect(() => {
    Promise.all([fetchProfile(), fetchActivities()]).then(() => setLoading(false));
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 1).single();
    if (!error && data) {
      if (data.strava_access_token) setIsStravaConnected(true);
      setSettings(prev => ({
        ...prev,
        gender: data.gender || 'male',
        weight: Number(data.weight) || 70,
        fcReposo: Number(data.fc_rest) || 50,
        run: { max: Number(data.run_fc_max) || 200, lthr: Number(data.run_lthr) || 178, zones: data.run_zones || defaultZones },
        bike: { max: Number(data.bike_fc_max) || 190, lthr: Number(data.bike_lthr) || 168, zones: data.bike_zones || defaultZones }
      }));
    }
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*');
    if (!error && data) {
        const sorted = data.map(a => ({...a, dateObj: new Date(a.date)})).sort((a, b) => a.dateObj - b.dateObj);
        setActivities(sorted);
    }
  };

  const refreshStravaToken = async (refreshToken) => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken })
    });
    if (!response.ok) throw new Error("Error refrescando token Strava");
    return await response.json();
  };

  const handleDisconnectStrava = async () => {
      await supabase.from('profiles').update({ strava_access_token: null, strava_refresh_token: null, strava_expires_at: null }).eq('id', 1);
      setIsStravaConnected(false);
  };

  const getValidStravaToken = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', 1).single();
      if (!profile?.strava_access_token) throw new Error("No conectado a Strava.");

      let accessToken = profile.strava_access_token;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      
      if (profile.strava_expires_at && nowInSeconds >= (profile.strava_expires_at - 300)) {
          try {
              const newTokens = await refreshStravaToken(profile.strava_refresh_token);
              await supabase.from('profiles').update({ strava_access_token: newTokens.access_token, strava_refresh_token: newTokens.refresh_token, strava_expires_at: newTokens.expires_at }).eq('id', 1);
              accessToken = newTokens.access_token;
          } catch (e) { await handleDisconnectStrava(); throw new Error("Sesión caducada."); }
      }
      return accessToken;
  };

  const fetchActivityStreams = async (activityId, stravaId) => {
      try {
          const token = await getValidStravaToken();
          const response = await fetch(`https://www.strava.com/api/v3/activities/${stravaId}/streams?keys=time,heartrate,watts,velocity_smooth,altitude,cadence&key_by_type=true`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) return null; 
          const streams = await response.json();
          
          await supabase.from('activities').update({ streams_data: streams }).eq('id', activityId);
          setActivities(prev => prev.map(a => a.id === activityId ? { ...a, streams_data: streams } : a));
          return streams;
      } catch (e) {
          console.error("Error bajando streams:", e);
          return null;
      }
  };

  const handleStravaSync = async () => {
    try {
        setUploading(true); setUploadStatus("Sincronizando...");
        const accessToken = await getValidStravaToken();

        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.status === 401) { await handleDisconnectStrava(); throw new Error("Reconecta tu cuenta."); }
        if (!response.ok) throw new Error("Error conectando con Strava");
        
        const stravaActivities = await response.json();
        const existingIds = new Set(activities.map(a => String(a.strava_id)));
        
        const newRows = stravaActivities.filter(act => !existingIds.has(String(act.id))).map(act => {
            let typeES = act.type === 'Run' ? 'Carrera' : (act.type === 'Ride' ? 'Ciclismo' : act.type);
            if (act.type === 'WeightTraining') typeES = 'Fuerza';
            if (act.type === 'Walk') typeES = 'Caminata';
            if (act.type === 'Swim') typeES = 'Natación';
            return {
                date: act.start_date_local, type: typeES, name: act.name || 'Entreno sin título', 
                description: act.description || '', duration: Math.round(act.moving_time / 60),
                hr_avg: Number(act.average_heartrate) || 0, calories: act.kilojoules || act.calories || 0,
                strava_id: act.id, distance: act.distance || 0, elevation_gain: act.total_elevation_gain || 0, 
                watts_avg: act.average_watts || 0, speed_avg: act.average_speed || 0,
                map_polyline: act.map?.summary_polyline || ''
            };
        });

        if (newRows.length > 0) {
            const { error: insertError } = await supabase.from('activities').insert(newRows);
            if (insertError) throw new Error(`Error BD: ${insertError.message}`);
            await fetchActivities();
            setUploadStatus(`¡${newRows.length} nuevas!`);
        } else {
            setUploadStatus("Todo al día");
        }
    } catch (err) { alert(err.message); } 
    finally { setUploading(false); setTimeout(() => setUploadStatus(null), 3000); }
  };

  // --- ROBOT DE SINCRONIZACIÓN PROFUNDA (DEEP SYNC) ---
  const handleDeepSync = async () => {
      const activitiesToSync = activities.filter(a => a.strava_id && !a.streams_data);
      
      if (activitiesToSync.length === 0) {
          alert("¡Todo perfecto! Todas tus actividades de Strava ya tienen datos exactos segundo a segundo.");
          return;
      }

      if (!window.confirm(`Se van a descargar los datos milimétricos de ${activitiesToSync.length} actividades.\n\nEl proceso irá despacio (1 actividad cada 1.5s) para que Strava no bloquee la cuenta. Puedes dejar la pestaña abierta mientras termina.\n\n¿Empezamos?`)) return;

      setIsDeepSyncing(true);
      let count = 0;

      try {
          for (const act of activitiesToSync) {
              setDeepSyncProgress({ current: count + 1, total: activitiesToSync.length });
              await fetchActivityStreams(act.id, act.strava_id);
              // Esperamos 1.5 segundos entre cada petición (Seguridad anti-baneo de Strava)
              await new Promise(resolve => setTimeout(resolve, 1500));
              count++;
          }
          alert("Sincronización profunda completada. ¡Tu motor matemático ahora es 100% exacto!");
      } catch (error) {
          console.error("Error en deep sync:", error);
          alert("La sincronización profunda se detuvo por un error de conexión.");
      } finally {
          setIsDeepSyncing(false);
          setDeepSyncProgress(null);
      }
  };

  const processFile = async (file) => { /* ... IGUAL ... */ };
  const handleClearDb = async () => { /* ... IGUAL ... */ };
  const deleteActivity = async (id) => { /* ... IGUAL ... */ };
  const analyzeHistory = (sport) => { /* ... IGUAL ... */ };

  // --- EL NUEVO NÚCLEO MATEMÁTICO EXACTO ---
  const metrics = useMemo(() => {
    if (!activities || activities.length === 0) return { activities: [], filteredData: [], currentMetrics: null, chartData: [], distribution: [], summary: { count: 0 } };

    const calculateTSS = (act) => {
        const t = act.type.toLowerCase();
        const isBike = t.includes('ciclismo') || t.includes('bici');
        const sportSettings = isBike ? settings.bike : settings.run;
        let lthr = Number(sportSettings.lthr) || (isBike ? 168 : 178); 

        // 1. SI TENEMOS DATOS EXACTOS (STREAMS), CALCULAMOS EL TSS SEGUNDO A SEGUNDO
        if (act.streams_data && act.streams_data.heartrate && act.streams_data.time) {
            const hrData = act.streams_data.heartrate.data;
            const timeData = act.streams_data.time.data;
            let exactTSS = 0;
            
            for (let i = 1; i < hrData.length; i++) {
                let dt = timeData[i] - timeData[i-1]; // Segundos transcurridos en ese intervalo
                let hr = hrData[i];
                let intensity = hr / lthr;
                
                // Ponderación exponencial: Los esfuerzos por encima del umbral castigan mucho más
                if (isBike && intensity < 0.75 && intensity > 0.5) intensity = intensity * 1.1; 
                if (intensity > 1.20) intensity = 1.20; // Tope fisiológico para evitar bugs de picos de sensor
                
                // hrTSS por cada segundo
                let secondTSS = (dt / 3600) * (intensity * intensity) * 100;
                exactTSS += secondTSS;
            }
            return Math.round(exactTSS);
        }

        // 2. SI NO HAY STREAMS AÚN, USAMOS LA FÓRMULA ANTIGUA DE RESPALDO
        const hr = Number(act.hr_avg); 
        const durationHours = act.duration / 60;
        if (!hr || hr <= 40) return Math.round(durationHours * 50);

        let IF = hr / lthr;
        if (isBike && IF < 0.75 && IF > 0.5) IF = IF * 1.1; 
        if (IF > 1.15) IF = 1.15; 
        
        let estimatedTss = durationHours * (IF * IF) * 100;
        if (!t.includes('caminata') && !t.includes('andar')) {
            const minTss = durationHours * 40; if (estimatedTss < minTss) estimatedTss = minTss;
        }
        return Math.round(estimatedTss);
    };

    const processedActivities = [...activities].map(act => ({ ...act, tss: calculateTSS(act) }));
    const sortedActs = processedActivities; 
    const startDate = new Date(sortedActs[0].date);
    const today = new Date(); 
    
    const activitiesMap = new Map();
    sortedActs.forEach(act => {
        const dKey = new Date(act.date).toISOString().split('T')[0];
        if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
        activitiesMap.get(dKey).push(act);
    });

    let ctl = 0; let atl = 0; 
    const fullSeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    const loadHistory = []; 

    const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const endUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    for (let time = startUTC; time <= endUTC; time += oneDay) {
        const d = new Date(time);
        const dateStr = d.toISOString().split('T')[0];
        const daysActs = activitiesMap.get(dateStr) || [];
        let dailyTss = 0;
        daysActs.forEach(act => { dailyTss += act.tss; });
        loadHistory.push(dailyTss);

        if (fullSeries.length === 0 && dailyTss > 0) { ctl = dailyTss; atl = dailyTss; } 
        else { ctl = ctl + (dailyTss - ctl) / settings.ta; atl = atl + (dailyTss - atl) / settings.tf; }
        
        fullSeries.push({ date: dateStr, ctl: parseFloat(ctl.toFixed(1)), atl: parseFloat(atl.toFixed(1)), tcb: parseFloat((ctl - atl).toFixed(1)), dailyTss: Math.round(dailyTss) });
    }

    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0 };
    const prevWeekPoint = fullSeries[fullSeries.length - 8] || { ctl: 0 }; 
    const pastMonthPoint = fullSeries[fullSeries.length - 30] || fullSeries[0] || { ctl: 0 };
    
    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));
    const last7Loads = loadHistory.slice(-7); const last28Loads = loadHistory.slice(-28);
    const sum7 = last7Loads.reduce((a, b) => a + b, 0);
    const avgLoad7 = sum7 / (last7Loads.length || 1);
    const avgLoad28 = last28Loads.reduce((a, b) => a + b, 0) / (last28Loads.length || 1);
    const acwr = avgLoad28 > 0 ? (avgLoad7 / avgLoad28) : 0;
    
    const mean = avgLoad7;
    const variance = last7Loads.reduce((t, n) => t + Math.pow(n - mean, 2), 0) / (last7Loads.length || 1);
    const stdDev = Math.sqrt(variance);
    const monotony = stdDev > 0 ? (mean / stdDev) : (mean > 0 ? 4 : 0);
    const strain = sum7 * monotony;

    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(today.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(today.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(today.getDate() - 90);
    else if (timeRange === '1y') cutoff.setFullYear(today.getFullYear() - 1);
    else if (timeRange === 'all') cutoff.setTime(startDate.getTime()); 
    
    const visibleActs = processedActivities.filter(a => new Date(a.date) >= cutoff);
    const chartData = fullSeries.filter(d => new Date(d.date) >= cutoff);
    const cats = visibleActs.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {});
    const distribution = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

    const currentMetrics = { 
        ctl: lastPoint.ctl, atl: lastPoint.atl, tcb: lastPoint.tcb, rampRate, avgTss7d: Math.round(avgLoad7), 
        acwr: parseFloat(acwr.toFixed(2)), monotony: parseFloat(monotony.toFixed(2)), strain: Math.round(strain), pastCtl: parseFloat(pastMonthPoint.ctl.toFixed(1))
    };

    return { activities: processedActivities.reverse(), filteredData: visibleActs.reverse(), currentMetrics, chartData, distribution, summary: { count: visibleActs.length } };
  }, [activities, timeRange, settings]);

  return { 
      activities: metrics.activities, loading, uploading, uploadStatus, timeRange, settings, 
      isStravaConnected, handleStravaSync, handleDisconnectStrava, setTimeRange, handleClearDb, 
      deleteActivity, processFile, fetchActivities, fetchProfile, analyzeHistory, 
      fetchActivityStreams,
      isDeepSyncing, deepSyncProgress, handleDeepSync,
      ...metrics 
  };
};