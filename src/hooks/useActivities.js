import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { parseCSV, parseStravaDate } from '../utils/parser';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  // Estado de conexión con Strava
  const [isStravaConnected, setIsStravaConnected] = useState(false);

  // Zonas por defecto
  const defaultZones = [
    { min: 0, max: 135 }, { min: 136, max: 150 }, { min: 151, max: 165 }, { min: 166, max: 178 }, { min: 179, max: 200 }
  ];

  // Configuración del perfil
  const [settings, setSettings] = useState({
    gender: 'male',
    fcReposo: 50, weight: 70, zonesMode: 'manual',
    run: { max: 200, lthr: 175, zones: defaultZones },
    bike: { max: 190, lthr: 165, zones: defaultZones },
    ta: 42, tf: 7 
  });

  // Carga inicial
  useEffect(() => {
    Promise.all([fetchProfile(), fetchActivities()]).then(() => setLoading(false));
  }, []);

  // 1. OBTENER PERFIL Y ESTADO STRAVA
  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 1).single();
    if (!error && data) {
      if (data.strava_access_token) setIsStravaConnected(true);

      setSettings(prev => ({
        ...prev,
        gender: data.gender || 'male',
        fcReposo: Number(data.fc_rest) || 50,
        weight: Number(data.weight) || 70,
        zonesMode: data.zones_mode || 'manual',
        run: { 
            max: Number(data.run_fc_max) || 200, 
            lthr: Number(data.run_lthr) || 175, 
            zones: data.run_zones || defaultZones 
        },
        bike: { 
            max: Number(data.bike_fc_max) || 190, 
            lthr: Number(data.bike_lthr) || 165, 
            zones: data.bike_zones || defaultZones 
        }
      }));
    }
  };

  // 2. OBTENER ACTIVIDADES DE SUPABASE
  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*');
    if (!error && data) {
        // Pre-ordenamos y creamos objetos fecha para evitar errores luego
        const sorted = data
            .map(a => ({...a, dateObj: new Date(a.date)}))
            .sort((a, b) => a.dateObj - b.dateObj);
        setActivities(sorted);
    }
  };

  // 3. DESCONEXIÓN DE EMERGENCIA
  const handleDisconnectStrava = async () => {
      await supabase.from('profiles').update({
          strava_access_token: null,
          strava_refresh_token: null,
          strava_expires_at: null
      }).eq('id', 1);
      setIsStravaConnected(false);
  };

  // 4. SINCRONIZACIÓN CON STRAVA (NÚCLEO)
 const handleStravaSync = async () => {
    try {
        setUploading(true);
        setUploadStatus("Conectando con Strava...");

        const { data: profile } = await supabase.from('profiles').select('strava_access_token').eq('id', 1).single();
        
        if (!profile?.strava_access_token) {
            alert("No estás conectado a Strava.");
            setIsStravaConnected(false);
            setUploading(false);
            return;
        }

        setUploadStatus("Comprobando historial...");
        
        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
            headers: { 'Authorization': `Bearer ${profile.strava_access_token}` }
        });

        if (response.status === 401) {
            console.warn("Token revocado. Desconectando...");
            await handleDisconnectStrava();
            throw new Error("El permiso de Strava ha caducado. Conecta de nuevo.");
        }

        if (!response.ok) throw new Error("Error de conexión con Strava");

        const stravaActivities = await response.json();
        
        // --- 🛡️ FILTRO INFALIBLE POR ID ---
        setUploadStatus("Filtrando duplicados...");

        // 1. Creamos una lista con los IDs de Strava que YA tenemos en la base de datos
        // (Convertimos a String por seguridad, aunque sean números)
        const existingIds = new Set(activities.map(a => String(a.strava_id)));

        const newRows = stravaActivities
            .filter(act => {
                // Si la actividad ya tiene su ID registrado, NO pasa.
                return !existingIds.has(String(act.id));
            })
            .map(act => {
                let typeES = act.type;
                if (act.type === 'Run') typeES = 'Carrera';
                if (act.type === 'Ride') typeES = 'Ciclismo';
                if (act.type === 'WeightTraining') typeES = 'Fuerza';
                if (act.type === 'Walk') typeES = 'Caminata';
                if (act.type === 'Swim') typeES = 'Natación';

                const hr = Number(act.average_heartrate) || 0; 

                return {
                    date: act.start_date_local, 
                    type: typeES,
                    duration: Math.round(act.moving_time / 60),
                    hr_avg: hr, 
                    calories: act.kilojoules || act.calories || 0,
                    strava_id: act.id // <--- 🔥 LA CLAVE: Guardamos el ID para la próxima
                };
            });

        // --- FIN DEL FILTRO ---

        if (newRows.length === 0) {
            setUploadStatus("¡Todo actualizado!");
            setUploading(false);
            setTimeout(() => setUploadStatus(null), 2000);
            return; 
        }

        setUploadStatus(`Guardando ${newRows.length} nuevas...`);

        const { error } = await supabase.from('activities').insert(newRows);
        if (error) throw error;

        setUploadStatus("¡Sincronizado!");
        await fetchActivities();
        
    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        setUploading(false);
        setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // 5. IMPORTACIÓN CSV (LEGACY)
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
      const idxHr = getIdx(['frecuencia cardiaca', 'avg heart rate', 'frecuencia cardíaca']); // Añadida tilde
      
      if (idxDate === -1) { alert("Error CSV: No encuentro la fecha"); setUploading(false); return; }
      
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
                     calories: 0
                 });
             }
         }
      }
      await supabase.from('activities').insert(newRows);
      setUploadStatus("¡Listo!"); await fetchActivities(); setUploading(false); setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  // 6. UTILIDADES: BORRAR Y ANALIZAR
  const handleClearDb = async () => {
    if(!window.confirm("¿Estás seguro de borrar TODOS los datos de actividad?")) return;
    setUploadStatus("Borrando...");
    await supabase.from('activities').delete().neq('id', 0);
    await fetchActivities();
    setUploadStatus(null);
  };

  const analyzeHistory = (sportType) => {
    if (activities.length === 0) return null;
    const isRun = sportType === 'run';
    const relevantActs = activities.filter(a => {
        const type = a.type.toLowerCase();
        if (isRun) return type.includes('carrera') || type.includes('correr');
        return type.includes('ciclismo') || type.includes('bici');
    });
    if (relevantActs.length === 0) return null;
    const efforts = relevantActs.filter(a => a.duration >= 20 && a.duration <= 60 && a.hr_avg > 0);
    efforts.sort((a, b) => b.hr_avg - a.hr_avg);
    const bestEffort = efforts[0];
    if (!bestEffort) return null;
    let factor = 0.95;
    if (bestEffort.duration > 50) factor = 1.0;
    else if (bestEffort.duration > 30) factor = 0.97;
    return { lthr: Math.round(bestEffort.hr_avg * factor), basedOnDate: bestEffort.date, basedOnHr: bestEffort.hr_avg, basedOnDuration: bestEffort.duration };
  };

  // 7. CÁLCULO DE MÉTRICAS (CORE ALGORÍTMICO)
  const metrics = useMemo(() => {
    // Si no hay datos, retornamos ceros seguros
    if (!activities || activities.length === 0) {
        return { 
            filteredData: [], 
            currentMetrics: { ctl: 0, atl: 0, tcb: 0, rampRate: 0, avgTss7d: 0 }, 
            chartData: [], distribution: [], zones: [], summary: { count: 0 } 
        };
    }

    const factorA = settings.gender === 'female' ? 0.86 : 0.64;
    const factorB = settings.gender === 'female' ? 1.67 : 1.92;

    const calculateTSS = (act) => {
        const t = act.type.toLowerCase();
        const isBike = t.includes('ciclismo') || t.includes('bici');
        const sportSettings = isBike ? settings.bike : settings.run;
        
        const hr = Number(act.hr_avg);
        const fcReposo = Number(settings.fcReposo) || 50;
        
        // Estimación si no hay pulso
        if (!hr || hr <= fcReposo) return (act.duration / 60) * 40; 

        const fcMax = Number(sportSettings.max) || 190;
        const lthr = Number(sportSettings.lthr) || 165;
        const hrReserve = fcMax - fcReposo;
        if (hrReserve <= 0) return 0; 

        const hrRatio = (hr - fcReposo) / hrReserve;
        const safeRatio = Math.min(hrRatio, 1.15); 
        const yFactor = factorA * Math.exp(factorB * safeRatio);
        const trimp = act.duration * safeRatio * yFactor;

        const lthrRatio = (lthr - fcReposo) / hrReserve;
        const lthrFactor = factorA * Math.exp(factorB * lthrRatio);
        const oneHourLthrTrimp = 60 * lthrRatio * lthrFactor;

        if (oneHourLthrTrimp <= 0) return 0; 
        return Math.max(0, (trimp / oneHourLthrTrimp) * 100);
    };

    // Preparar fechas
    const sortedActs = [...activities]; 
    const startDate = new Date(sortedActs[0].date);
    const lastActivityDate = new Date(sortedActs[sortedActs.length - 1].date);
    const today = new Date();
    
    // Lógica de "Fecha de Corte" (Congelar estado si no hay entreno hoy)
    const daysSinceLast = (today - lastActivityDate) / (1000 * 60 * 60 * 24);
    const todayStr = today.toISOString().split('T')[0];
    const hasActivityToday = sortedActs.some(a => a.date.startsWith(todayStr));
    
    let endDate = today;
    if (daysSinceLast > 30) {
        endDate = lastActivityDate; // Si dejaste de entrenar hace un mes, cortamos ahí
    } else if (!hasActivityToday) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        endDate = yesterday; // Congelamos en ayer
    } 

    // Indexar actividades por fecha
    const activitiesMap = new Map();
    sortedActs.forEach(act => {
        const dKey = new Date(act.date).toISOString().split('T')[0];
        if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
        activitiesMap.get(dKey).push(act);
    });

    // Bucle de cálculo diario (Banister/Coggan)
    let ctl = 0; 
    let atl = 0; 
    const fullSeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (let time = startDate.getTime(); time <= endDate.getTime(); time += oneDay) {
        const d = new Date(time);
        const dateStr = d.toISOString().split('T')[0];
        const daysActs = activitiesMap.get(dateStr) || [];
        
        let dailyTss = 0;
        daysActs.forEach(act => { dailyTss += calculateTSS(act); });

        if (fullSeries.length === 0 && dailyTss > 0) {
            ctl = dailyTss; atl = dailyTss; // Arranque rápido
        } else {
            ctl = ctl + (dailyTss - ctl) / settings.ta;
            atl = atl + (dailyTss - atl) / settings.tf;
        }
        
        const tsb = ctl - atl;
        fullSeries.push({ 
            date: dateStr, 
            ctl: parseFloat(ctl.toFixed(1)), 
            atl: parseFloat(atl.toFixed(1)), 
            tcb: parseFloat(tsb.toFixed(1)), 
            dailyTss: Math.round(dailyTss) 
        });
    }

    // Métricas finales
    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0, dailyTss: 0 };
    const prevWeekPoint = fullSeries[fullSeries.length - 8] || { ctl: 0 }; 
    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));
    const last7Days = fullSeries.slice(-7);
    const avgTss7d = last7Days.reduce((sum, d) => sum + d.dailyTss, 0) / (last7Days.length || 1);

    // Filtros de visualización
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(today.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(today.getDate() - 90);
    else if (timeRange === '1y') cutoff.setFullYear(today.getFullYear() - 1);
    else if (timeRange === 'all') cutoff.setTime(startDate.getTime()); 

    const visibleActs = sortedActs.filter(a => new Date(a.date) >= cutoff);
    const chartData = fullSeries.filter(d => new Date(d.date) >= cutoff);

    // Distribución
    const cats = visibleActs.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {});
    const distribution = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

    const currentMetrics = { 
        ctl: lastPoint.ctl, 
        atl: lastPoint.atl, 
        tcb: lastPoint.tcb, 
        rampRate, 
        avgTss7d: Math.round(avgTss7d) 
    };

    return { filteredData: visibleActs.reverse(), currentMetrics, chartData, distribution, zones: [], summary: { count: visibleActs.length } };
  }, [activities, timeRange, settings]);

  return { 
      activities, loading, uploading, uploadStatus, timeRange, settings, 
      isStravaConnected, handleStravaSync, handleDisconnectStrava, 
      setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, analyzeHistory, 
      ...metrics 
  };
};