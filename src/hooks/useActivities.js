import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { parseCSV, parseStravaDate } from '../utils/parser';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  const [isStravaConnected, setIsStravaConnected] = useState(false);

  // Valores por defecto
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

  // --- 1. CARGA DE DATOS BÁSICA ---
  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 1).single();
    if (!error && data) {
      if (data.strava_access_token) setIsStravaConnected(true);
      setSettings(prev => ({
        ...prev,
        gender: data.gender || 'male',
        fcReposo: Number(data.fc_rest) || 50,
        run: { max: Number(data.run_fc_max) || 200, lthr: Number(data.run_lthr) || 178, zones: data.run_zones || defaultZones },
        bike: { max: Number(data.bike_fc_max) || 190, lthr: Number(data.bike_lthr) || 168, zones: data.bike_zones || defaultZones }
      }));
    }
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*');
    if (!error && data) {
        const sorted = data
            .map(a => ({...a, dateObj: new Date(a.date)}))
            .sort((a, b) => a.dateObj - b.dateObj);
        setActivities(sorted);
    }
  };

  // --- 2. GESTIÓN STRAVA (CON AUTO-REFRESCO Y DATOS PRO) ---
  const refreshStravaToken = async (refreshToken) => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("Faltan credenciales Strava en .env");

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

  const handleStravaSync = async () => {
    try {
        setUploading(true); setUploadStatus("Verificando sesión...");
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', 1).single();
        if (!profile?.strava_access_token) throw new Error("No conectado a Strava.");

        let accessToken = profile.strava_access_token;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        
        // Refresco de token si está a menos de 5 min de caducar o caducado
        if (profile.strava_expires_at && nowInSeconds >= (profile.strava_expires_at - 300)) {
            setUploadStatus("Renovando token...");
            try {
                const newTokens = await refreshStravaToken(profile.strava_refresh_token);
                await supabase.from('profiles').update({ strava_access_token: newTokens.access_token, strava_refresh_token: newTokens.refresh_token, strava_expires_at: newTokens.expires_at }).eq('id', 1);
                accessToken = newTokens.access_token;
            } catch (e) { await handleDisconnectStrava(); throw new Error("Sesión caducada. Reconecta Strava."); }
        }

        setUploadStatus("Sincronizando con Strava...");
        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.status === 401) {
            await handleDisconnectStrava();
            throw new Error("Strava rechazó el acceso. Reconecta tu cuenta.");
        }
        if (!response.ok) throw new Error("Error conectando con Strava");
        
        const stravaActivities = await response.json();
        const existingIds = new Set(activities.map(a => String(a.strava_id)));
        
        const newRows = stravaActivities
            .filter(act => !existingIds.has(String(act.id)))
            .map(act => {
                let typeES = act.type === 'Run' ? 'Carrera' : (act.type === 'Ride' ? 'Ciclismo' : act.type);
                if (act.type === 'WeightTraining') typeES = 'Fuerza';
                if (act.type === 'Walk') typeES = 'Caminata';
                if (act.type === 'Swim') typeES = 'Natación';
                
                return {
                    date: act.start_date_local, 
                    type: typeES,
                    name: act.name || 'Entreno sin título', 
                    description: act.description || '',       
                    duration: Math.round(act.moving_time / 60),
                    hr_avg: Number(act.average_heartrate) || 0, 
                    calories: act.kilojoules || act.calories || 0,
                    strava_id: act.id,
                    distance: act.distance || 0, 
                    elevation_gain: act.total_elevation_gain || 0, 
                    watts_avg: act.average_watts || 0,
                    speed_avg: act.average_speed || 0         
                };
            });

        if (newRows.length > 0) {
            await supabase.from('activities').insert(newRows);
            await fetchActivities();
            setUploadStatus(`¡${newRows.length} nuevas!`);
        } else {
            setUploadStatus("Todo al día");
        }
    } catch (err) { alert(err.message); } 
    finally { setUploading(false); setTimeout(() => setUploadStatus(null), 3000); }
  };

  // --- 3. GESTIÓN MANUAL Y BORRADO ---
  const processFile = async (file) => {
    setUploading(true); setUploadStatus("Analizando CSV...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) { setUploading(false); return; }
      
      const header = rows[0].map(h => h.toLowerCase().trim().replace(/"/g, ''));
      const getIdx = (opts) => header.findIndex(h => opts.some(opt => h.includes(opt)));
      
      const idxDate = getIdx(['fecha', 'date']);
      const idxType = getIdx(['tipo', 'type']);
      const idxTimeMoved = getIdx(['tiempo en movimiento', 'moving time']);
      const idxHr = getIdx(['frecuencia cardiaca', 'avg heart rate']); 
      
      if (idxDate === -1) { alert("Error CSV: No encuentro fecha"); setUploading(false); return; }
      
      const newRows = [];
      for (let i = 1; i < rows.length; i++) {
         const row = rows[i];
         if (!row[idxDate]) continue;
         const parsedDate = parseStravaDate(row[idxDate]);
         if(parsedDate) {
             const duration = parseFloat(row[idxTimeMoved]) || 0;
             if(duration > 0) {
                 newRows.push({
                     date: parsedDate,
                     type: row[idxType] || 'Actividad',
                     name: 'Importado de CSV',
                     description: '',
                     duration: Math.round(duration/60), 
                     hr_avg: parseFloat(row[idxHr]) || 0,
                     calories: 0, distance: 0, elevation_gain: 0, watts_avg: 0, speed_avg: 0
                 });
             }
         }
      }
      if (newRows.length > 0) {
          await supabase.from('activities').insert(newRows);
          await fetchActivities();
          setUploadStatus("Importado");
      }
      setUploading(false); setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file);
  };
  
  const handleClearDb = async () => {
    if(!window.confirm("¿Borrar todo el historial de la base de datos?")) return;
    setUploadStatus("Borrando base de datos...");
    await supabase.from('activities').delete().neq('id', 0);
    await fetchActivities();
    setUploadStatus(null);
  };

  const deleteActivity = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad permanentemente?")) return;
    setUploadStatus("Eliminando...");
    try {
        const { error } = await supabase.from('activities').delete().eq('id', id);
        if (error) throw error;
        await fetchActivities();
        setUploadStatus("Eliminado con éxito");
        setTimeout(() => setUploadStatus(null), 2000);
    } catch (err) {
        alert("Error borrando: " + err.message);
        setUploadStatus(null);
    }
  };

  const analyzeHistory = (sport) => { /* Lógica de lthr futuro */ };

  // --- 4. CÁLCULOS MATEMÁTICOS (CORE BANISTER & TSS) ---
  const metrics = useMemo(() => {
    if (!activities || activities.length === 0) {
        return { 
            activities: [], filteredData: [], currentMetrics: null, chartData: [], distribution: [], summary: { count: 0 } 
        };
    }

    // A. FUNCIÓN MAESTRA DE TSS (Modelo Cuadrático / hrTSS Coggan)
    const calculateTSS = (act) => {
        const t = act.type.toLowerCase();
        const isBike = t.includes('ciclismo') || t.includes('bici');
        const sportSettings = isBike ? settings.bike : settings.run;
        
        const hr = Number(act.hr_avg);
        const durationHours = act.duration / 60;

        if (!hr || hr <= 40) return Math.round(durationHours * 50);

        let lthr = Number(sportSettings.lthr);
        if (!lthr || lthr < 100) lthr = isBike ? 168 : 178; 

        let IF = hr / lthr;

        if (isBike && IF < 0.75 && IF > 0.5) IF = IF * 1.1; 
        if (IF > 1.15) IF = 1.15; 

        let tss = durationHours * (IF * IF) * 100;

        if (!t.includes('caminata') && !t.includes('andar')) {
            const minTss = durationHours * 40; 
            if (tss < minTss) tss = minTss;
        }

        return Math.round(tss);
    };

    // Inyectar el TSS en cada actividad
    const processedActivities = [...activities].map(act => ({
        ...act,
        tss: calculateTSS(act) 
    }));

    // B. BUCLE DE BANISTER (CTL / ATL / TSB)
    const sortedActs = processedActivities; 
    const startDate = new Date(sortedActs[0].date);
    const today = new Date(); // <--- EL DÍA DE HOY
    
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

    // Usamos UTC para evitar bugs de cambios de hora (Daylight Saving Time) al sumar 24h
    // Y forzamos que el bucle siempre llegue hasta endUTC (Hoy), haya o no entreno
    const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const endUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    for (let time = startUTC; time <= endUTC; time += oneDay) {
        const d = new Date(time);
        const dateStr = d.toISOString().split('T')[0];
        const daysActs = activitiesMap.get(dateStr) || [];
        
        let dailyTss = 0;
        daysActs.forEach(act => { dailyTss += act.tss; });
        loadHistory.push(dailyTss);

        if (fullSeries.length === 0 && dailyTss > 0) { 
            ctl = dailyTss; atl = dailyTss; 
        } else {
            ctl = ctl + (dailyTss - ctl) / settings.ta;
            atl = atl + (dailyTss - atl) / settings.tf;
        }
        
        fullSeries.push({ 
            date: dateStr, 
            ctl: parseFloat(ctl.toFixed(1)), 
            atl: parseFloat(atl.toFixed(1)), 
            tcb: parseFloat((ctl - atl).toFixed(1)), 
            dailyTss: Math.round(dailyTss) 
        });
    }

    // C. MÉTRICAS AVANZADAS Y PREDICCIONES
    // Como el bucle llega siempre hasta hoy, "lastPoint" ahora es siempre el día actual
    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0 };
    const prevWeekPoint = fullSeries[fullSeries.length - 8] || { ctl: 0 }; 
    const pastMonthPoint = fullSeries[fullSeries.length - 30] || fullSeries[0] || { ctl: 0 };
    
    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));

    const last7Loads = loadHistory.slice(-7);
    const last28Loads = loadHistory.slice(-28);
    const sum7 = last7Loads.reduce((a, b) => a + b, 0);
    const avgLoad7 = sum7 / (last7Loads.length || 1);
    const avgLoad28 = last28Loads.reduce((a, b) => a + b, 0) / (last28Loads.length || 1);
    const acwr = avgLoad28 > 0 ? (avgLoad7 / avgLoad28) : 0;
    
    const mean = avgLoad7;
    const variance = last7Loads.reduce((t, n) => t + Math.pow(n - mean, 2), 0) / (last7Loads.length || 1);
    const stdDev = Math.sqrt(variance);
    const monotony = stdDev > 0 ? (mean / stdDev) : (mean > 0 ? 4 : 0);
    const strain = sum7 * monotony;

    let predCtl = lastPoint.ctl;
    let daysToNextLevel = null;
    const currentLevelMax = Math.ceil((lastPoint.ctl + 1) / 30) * 30;
    
    for(let i=1; i<=28; i++) {
        predCtl = predCtl + (avgLoad7 - predCtl) / settings.ta;
        if (!daysToNextLevel && predCtl >= currentLevelMax && lastPoint.ctl < currentLevelMax) daysToNextLevel = i;
    }

    const forecast = {
        ctl4Weeks: parseFloat(predCtl.toFixed(1)),
        trend: predCtl > lastPoint.ctl ? 'up' : (predCtl < lastPoint.ctl ? 'down' : 'flat'),
        diff: parseFloat((predCtl - lastPoint.ctl).toFixed(1)),
        nextLevelDays: daysToNextLevel,
        nextLevelVal: currentLevelMax
    };

    // D. FILTROS PARA INTERFAZ VISUAL
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(today.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(today.getDate() - 90);
    else if (timeRange === '1y') cutoff.setFullYear(today.getFullYear() - 1);
    else if (timeRange === 'all') cutoff.setTime(startDate.getTime()); 
    
    const visibleActs = processedActivities.filter(a => new Date(a.date) >= cutoff);
    const chartData = fullSeries.filter(d => new Date(d.date) >= cutoff);
    const cats = visibleActs.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {});
    const distribution = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

    const currentMetrics = { 
        ctl: lastPoint.ctl, atl: lastPoint.atl, tcb: lastPoint.tcb, 
        rampRate, avgTss7d: Math.round(avgLoad7), acwr: parseFloat(acwr.toFixed(2)), monotony: parseFloat(monotony.toFixed(2)), strain: Math.round(strain),
        pastCtl: parseFloat(pastMonthPoint.ctl.toFixed(1)), forecast
    };

    return { 
        activities: processedActivities.reverse(), 
        filteredData: visibleActs.reverse(), 
        currentMetrics, chartData, distribution, summary: { count: visibleActs.length } 
    };
  }, [activities, timeRange, settings]);

  return { 
      activities: metrics.activities, 
      loading, uploading, uploadStatus, timeRange, settings, 
      isStravaConnected, handleStravaSync, handleDisconnectStrava, 
      setTimeRange, handleClearDb, deleteActivity, processFile, fetchActivities, fetchProfile, analyzeHistory, 
      ...metrics 
  };
};