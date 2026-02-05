import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { parseCSV, parseStravaDate } from '../utils/parser';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  
  const defaultZones = [
    { min: 0, max: 135 }, { min: 136, max: 150 }, { min: 151, max: 165 }, { min: 166, max: 178 }, { min: 179, max: 200 }
  ];

  const [settings, setSettings] = useState({
    gender: 'male',
    fcReposo: 50, weight: 70, zonesMode: 'manual',
    run: { max: 200, lthr: 175, zones: defaultZones },
    bike: { max: 190, lthr: 165, zones: defaultZones },
    ta: 42, tf: 7 
  });

  useEffect(() => {
    Promise.all([fetchProfile(), fetchActivities()]).then(() => setLoading(false));
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', 1).single();
    if (!error && data) {
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

  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*');
    if (!error && data) {
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setActivities(sorted);
    }
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
    return { 
        lthr: Math.round(bestEffort.hr_avg * factor), 
        basedOnDate: bestEffort.date, 
        basedOnHr: bestEffort.hr_avg, 
        basedOnDuration: bestEffort.duration 
    };
  };

  const processFile = async (file) => {
    setUploading(true); setUploadStatus("Analizando...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) { setUploading(false); return; }
      
      const header = rows[0].map(h => h.toLowerCase().trim().replace(/"/g, ''));
      const getIdx = (opts, exclude = []) => header.findIndex(h => opts.some(opt => h.includes(opt)) && !exclude.some(ex => h.includes(ex)));
      
      const idxDate = getIdx(['fecha', 'date']);
      const idxType = getIdx(['tipo', 'type']);
      const idxTimeMoved = getIdx(['tiempo en movimiento', 'moving time']);
      const idxTimeElapsed = getIdx(['tiempo transcurrido', 'elapsed time']);
      const idxHr = getIdx(['frecuencia cardiaca media', 'ritmo cardiaco promedio', 'avg heart rate']);
      const idxCal = getIdx(['calorías', 'calories']);

      if (idxDate === -1) { alert("Error CSV"); setUploading(false); return; }
      
      setUploadStatus(`Procesando ${rows.length} filas...`);
      const newRows = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[idxDate]) continue;
        const parsedDate = parseStravaDate(row[idxDate]);
        if (parsedDate) {
          const parseNum = (val) => {
             if (!val) return 0;
             if (val.toString().includes(':')) {
                const parts = val.split(':').map(Number);
                if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
                if (parts.length === 2) return parts[0]*60 + parts[1];
                return 0;
             }
             return parseFloat(val.toString().replace(',', '.')) || 0;
          };

          const rawMoved = row[idxTimeMoved];
          const rawElapsed = row[idxTimeElapsed];
          let durationSec = parseNum(rawMoved);
          if (durationSec === 0) durationSec = parseNum(rawElapsed);
          const hrVal = parseNum(row[idxHr]);

          if (durationSec > 0) {
             newRows.push({
                date: parsedDate,
                type: row[idxType] || 'Actividad',
                duration: Math.round(durationSec / 60),
                hr_avg: hrVal,
                calories: parseNum(row[idxCal]),
             });
          }
        }
      }
      setUploadStatus(`Guardando ${newRows.length} actividades...`);
      const batchSize = 50;
      for (let i = 0; i < newRows.length; i += batchSize) {
        await supabase.from('activities').insert(newRows.slice(i, i + batchSize));
      }
      setUploadStatus("¡Listo!"); await fetchActivities(); setUploading(false); setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleClearDb = async () => {
    if(!window.confirm("¿Borrar TODOS los datos?")) return;
    setUploadStatus("Borrando...");
    await supabase.from('activities').delete().neq('id', 0);
    await fetchActivities();
    setUploadStatus(null);
  };

  // --- CÁLCULO CORE CON "ESTADO CONGELADO" ---
  const metrics = useMemo(() => {
    if (activities.length === 0) return { filteredData: [], currentMetrics: {}, chartData: [], distribution: [], zones: [], summary: {} };

    // 1. Clonar y ordenar
    const sortedActs = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const startDate = new Date(sortedActs[0].date);
    const lastActivityDate = new Date(sortedActs[sortedActs.length - 1].date);
    const today = new Date();
    
    // --- LÓGICA INTELIGENTE DE FECHA DE CORTE ---
    
    // 1. ¿Cuánto hace del último entreno registrado?
    const daysSinceLast = (today - lastActivityDate) / (1000 * 60 * 60 * 24);

    // 2. ¿Tenemos alguna actividad HOY?
    // Convertimos a string YYYY-MM-DD para comparar sin horas
    const todayStr = today.toISOString().split('T')[0];
    const hasActivityToday = sortedActs.some(a => a.date.startsWith(todayStr));

    // 3. Decidir Fecha Final (endDate):
    let endDate = today;

    if (daysSinceLast > 30) {
        // A. Si hace más de un mes que no entrenas, cortamos ahí (evita caída infinita a cero)
        endDate = lastActivityDate;
    } else if (!hasActivityToday) {
        // B. Si entrenas habitualmente pero HOY aún no has subido nada:
        // CORTAMOS AYER. Así tu gráfica se congela en el último estado conocido y no baja.
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        endDate = yesterday;
    } 
    // C. Si hasActivityToday es true, endDate es HOY (se calcula el entreno nuevo).

    // --- FIN LÓGICA DE CORTE ---

    // Filtros visuales
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(today.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(today.getDate() - 90);
    else if (timeRange === '1y') cutoff.setFullYear(today.getFullYear() - 1);
    else if (timeRange === 'all') cutoff.setTime(startDate.getTime()); 

    const visibleActs = sortedActs.filter(a => new Date(a.date) >= cutoff);
    
    const factorA = settings.gender === 'female' ? 0.86 : 0.64;
    const factorB = settings.gender === 'female' ? 1.67 : 1.92;

    const calculateTSS = (act) => {
        const t = act.type.toLowerCase();
        const isBike = t.includes('ciclismo') || t.includes('bici');
        const sportSettings = isBike ? settings.bike : settings.run;
        
        const hr = Number(act.hr_avg);
        const fcReposo = Number(settings.fcReposo) || 50;
        
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

    // Indexado por fecha para rendimiento
    const activitiesMap = new Map();
    sortedActs.forEach(act => {
        const dKey = new Date(act.date).toISOString().split('T')[0];
        if (!activitiesMap.has(dKey)) activitiesMap.set(dKey, []);
        activitiesMap.get(dKey).push(act);
    });

    let ctl = 0; 
    let atl = 0; 
    const fullSeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Bucle temporal hasta endDate (que puede ser Ayer u Hoy)
    for (let time = startDate.getTime(); time <= endDate.getTime(); time += oneDay) {
        const d = new Date(time);
        const dateStr = d.toISOString().split('T')[0];
        
        const daysActs = activitiesMap.get(dateStr) || [];
        
        let dailyTss = 0;
        daysActs.forEach(act => { dailyTss += calculateTSS(act); });

        if (fullSeries.length === 0 && dailyTss > 0) {
            ctl = dailyTss;
            atl = dailyTss;
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

    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0, dailyTss: 0 };
    const prevWeekPoint = fullSeries[fullSeries.length - 8] || { ctl: 0 };
    const rampRate = parseFloat((lastPoint.ctl - prevWeekPoint.ctl).toFixed(1));
    
    const last7Days = fullSeries.slice(-7);
    const avgTss7d = last7Days.reduce((sum, d) => sum + d.dailyTss, 0) / (last7Days.length || 1);

    const currentMetrics = { ...lastPoint, rampRate, avgTss7d: Math.round(avgTss7d) };
    const chartData = fullSeries.filter(d => new Date(d.date) >= cutoff);
    const zoneBins = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }; 
    const zones = Object.keys(zoneBins).map(k => ({ name: k, value: 0 })); 
    const cats = visibleActs.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {});
    const distribution = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

    return { filteredData: visibleActs.reverse(), currentMetrics, chartData, distribution, zones, summary: { count: visibleActs.length } };
  }, [activities, timeRange, settings]);

  return { activities, loading, uploading, uploadStatus, timeRange, settings, setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, analyzeHistory, ...metrics };
};