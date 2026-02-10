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

  // --- 1. CARGA DE DATOS ---
  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 1).single();
    if (!error && data) {
      if (data.strava_access_token) setIsStravaConnected(true);
      setSettings(prev => ({
        ...prev,
        gender: data.gender || 'male',
        fcReposo: Number(data.fc_rest) || 50,
        run: { 
            max: Number(data.run_fc_max) || 200, 
            lthr: Number(data.run_lthr) || 178, 
            zones: data.run_zones || defaultZones 
        },
        bike: { 
            max: Number(data.bike_fc_max) || 190, 
            lthr: Number(data.bike_lthr) || 168, 
            zones: data.bike_zones || defaultZones 
        }
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

  // --- 2. GESTIÓN STRAVA (CON AUTO-REFRESCO) ---
  
  // Función auxiliar para renovar el token si ha caducado
  const refreshStravaToken = async (refreshToken) => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Faltan las credenciales de Strava (Client ID/Secret) en .env");
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) throw new Error("No se pudo refrescar el token. Reconecta Strava.");
    return await response.json();
  };

  const handleDisconnectStrava = async () => {
      await supabase.from('profiles').update({ strava_access_token: null, strava_refresh_token: null, strava_expires_at: null }).eq('id', 1);
      setIsStravaConnected(false);
  };

  const handleStravaSync = async () => {
    try {
        setUploading(true); setUploadStatus("Verificando sesión...");
        
        // A. Obtener tokens de BD
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', 1).single();
        if (!profile?.strava_access_token) throw new Error("No conectado a Strava.");

        let accessToken = profile.strava_access_token;
        
        // B. Verificar Expiración (Token dura 6 horas)
        const nowInSeconds = Math.floor(Date.now() / 1000);
        // Si caduca en menos de 5 min (300s) o ya caducó, renovamos
        if (profile.strava_expires_at && nowInSeconds >= (profile.strava_expires_at - 300)) {
            setUploadStatus("Renovando token...");
            console.log("🔄 Renovando token de Strava...");
            
            try {
                const newTokens = await refreshStravaToken(profile.strava_refresh_token);
                
                // Guardar nuevos tokens
                const { error: updateError } = await supabase.from('profiles').update({
                    strava_access_token: newTokens.access_token,
                    strava_refresh_token: newTokens.refresh_token,
                    strava_expires_at: newTokens.expires_at
                }).eq('id', 1);

                if (updateError) throw updateError;
                accessToken = newTokens.access_token; // Usar el nuevo
                console.log("✅ Token renovado.");
            } catch (refreshError) {
                console.error("Fallo renovación:", refreshError);
                await handleDisconnectStrava();
                throw new Error("Sesión caducada. Por favor, reconecta Strava.");
            }
        }

        // C. Descargar Actividades
        setUploadStatus("Sincronizando...");
        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.status === 401) {
             await handleDisconnectStrava();
             throw new Error("Strava rechazó el acceso. Reconecta tu cuenta.");
        }
        if (!response.ok) throw new Error(`Error Strava: ${response.status}`);
        
        const stravaActivities = await response.json();
        
        // D. Procesar y Guardar
        const existingIds = new Set(activities.map(a => String(a.strava_id)));
        const newRows = stravaActivities
            .filter(act => !existingIds.has(String(act.id)))
            .map(act => {
                let typeES = act.type === 'Run' ? 'Carrera' : (act.type === 'Ride' ? 'Ciclismo' : act.type);
                if (act.type === 'WeightTraining') typeES = 'Fuerza';
                if (act.type === 'Walk') typeES = 'Caminata';
                return {
                    date: act.start_date_local, type: typeES,
                    duration: Math.round(act.moving_time / 60),
                    hr_avg: Number(act.average_heartrate) || 0, 
                    calories: act.kilojoules || act.calories || 0,
                    strava_id: act.id,
                    distance: act.distance || 0, 
                    elevation_gain: act.total_elevation_gain || 0, 
                    watts_avg: act.average_watts || 0
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

  // --- 3. GESTIÓN MANUAL Y ARCHIVOS ---
  const processFile = async (file) => {
    setUploading(true); setUploadStatus("Analizando...");
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
                     duration: Math.round(duration/60), 
                     hr_avg: parseFloat(row[idxHr]) || 0,
                     calories: 0, distance: 0, elevation_gain: 0, watts_avg: 0
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
    if(!window.confirm("¿Borrar todo el historial?")) return;
    setUploadStatus("Borrando...");
    await supabase.from('activities').delete().neq('id', 0);
    await fetchActivities();
    setUploadStatus(null);
  };

  // FUNCIÓN NUEVA: BORRAR UNA ACTIVIDAD
  const deleteActivity = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad?")) return;
    setUploadStatus("Eliminando...");
    try {
        const { error } = await supabase.from('activities').delete().eq('id', id);
        if (error) throw error;
        await fetchActivities();
        setUploadStatus("Eliminado");
        setTimeout(() => setUploadStatus(null), 2000);
    } catch (err) {
        alert("Error borrando: " + err.message);
        setUploadStatus(null);
    }
  };

  const analyzeHistory = (sport) => { /* Lógica existente para perfil */ };

  // --- 4. CÁLCULOS MATEMÁTICOS (CORE) ---
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

        // Caso 1: Sin pulso -> Estimación manual (50 TSS/hora)
        if (!hr || hr <= 40) return Math.round(durationHours * 50);

        // Caso 2: Con pulso -> Modelo Cuadrático
        let lthr = Number(sportSettings.lthr);
        if (!lthr || lthr < 100) lthr = isBike ? 168 : 178; // Defaults de seguridad

        // Factor de Intensidad (IF) = HR / LTHR
        let IF = hr / lthr;

        // Correcciones de realismo
        if (isBike && IF < 0.75 && IF > 0.5) IF = IF * 1.1; // Boost bici suave (el pulso baja en bajadas)
        if (IF > 1.15) IF = 1.15; // Cap máximo (nadie aguanta 120% mucho tiempo)

        // Fórmula: TSS = Horas * IF² * 100
        let tss = durationHours * (IF * IF) * 100;

        // Suelo Aeróbico (Mínimo 40 TSS/hora para deporte real)
        if (!t.includes('caminata') && !t.includes('andar')) {
            const minTss = durationHours * 40; 
            if (tss < minTss) tss = minTss;
        }

        return Math.round(tss);
    };

    // B. PROCESAMIENTO E INYECCIÓN DE TSS
    // Calculamos el TSS y se lo pegamos a cada actividad
    const processedActivities = [...activities].map(act => ({
        ...act,
        tss: calculateTSS(act) 
    }));

    // C. CÁLCULO DE MÉTRICAS (BANISTER)
    const sortedActs = processedActivities; // Ya ordenadas por fecha en fetch
    const startDate = new Date(sortedActs[0].date);
    const lastActivityDate = new Date(sortedActs[sortedActs.length - 1].date);
    const today = new Date();
    
    // Determinamos rango de fechas para el gráfico
    const daysSinceLast = (today - lastActivityDate) / (1000 * 60 * 60 * 24);
    const todayStr = today.toISOString().split('T')[0];
    const hasActivityToday = sortedActs.some(a => a.date.startsWith(todayStr));
    
    let endDate = today;
    if (daysSinceLast > 30) endDate = lastActivityDate;
    else if (!hasActivityToday) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        endDate = yesterday;
    } 

    // Mapear actividades por día
    const activitiesMap = new Map();
    sortedActs.forEach(act => {
        const dKey = new Date(act.date).toISOString().split('T')[0];
        if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
        activitiesMap.get(dKey).push(act);
    });

    // Bucle día a día (CTL/ATL)
    let ctl = 0; let atl = 0; 
    const fullSeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    const loadHistory = []; 

    for (let time = startDate.getTime(); time <= endDate.getTime(); time += oneDay) {
        const d = new Date(time);
        const dateStr = d.toISOString().split('T')[0];
        const daysActs = activitiesMap.get(dateStr) || [];
        
        // Sumamos el TSS pre-calculado
        let dailyTss = 0;
        daysActs.forEach(act => { dailyTss += act.tss; });
        loadHistory.push(dailyTss);

        if (fullSeries.length === 0 && dailyTss > 0) { ctl = dailyTss; atl = dailyTss; } 
        else {
            // Fórmulas de Banister
            ctl = ctl + (dailyTss - ctl) / settings.ta;
            atl = atl + (dailyTss - atl) / settings.tf;
        }
        
        fullSeries.push({ 
            date: dateStr, 
            ctl: parseFloat(ctl.toFixed(1)), 
            atl: parseFloat(atl.toFixed(1)), 
            tcb: parseFloat((ctl - atl).toFixed(1)), // TCB = TSB (Forma)
            dailyTss: Math.round(dailyTss) 
        });
    }

    // Métricas Actuales (Último punto)
    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0 };
    const prevWeekPoint = fullSeries[fullSeries.length - 8] || { ctl: 0 }; 
    const pastMonthPoint = fullSeries[fullSeries.length - 30] || fullSeries[0] || { ctl: 0 };
    
    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));

    // ACWR, Monotonía y Strain
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

    // Predicción Futura (Forecast)
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

    // D. FILTROS VISUALES
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
        activities: processedActivities.reverse(), // Exportamos las actividades con TSS ya calculado
        filteredData: visibleActs.reverse(), 
        currentMetrics, chartData, distribution, zones: [], summary: { count: visibleActs.length } 
    };
  }, [activities, timeRange, settings]);

  return { 
      activities: metrics.activities, // Usar las procesadas
      loading, uploading, uploadStatus, timeRange, settings, 
      isStravaConnected, handleStravaSync, handleDisconnectStrava, 
      setTimeRange, handleClearDb, deleteActivity, processFile, fetchActivities, fetchProfile, analyzeHistory, 
      ...metrics 
  };
};