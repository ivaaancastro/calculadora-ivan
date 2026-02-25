import React, { useMemo, useState } from 'react';
import { 
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Activity, Flame, Mountain, Clock, MapPin, Zap, TrendingUp, Trophy, Heart, Wind, CalendarDays, BarChart2, Target, MousePointer2 } from 'lucide-react';

// Motor de picos (ahora devuelve el valor máximo de la ventana temporal)
const getPeak = (data, windowSize) => {
    if (!data || data.length < windowSize) return 0;
    let currentSum = 0;
    for (let i = 0; i < windowSize; i++) currentSum += data[i];
    let maxSum = currentSum;
    for (let i = windowSize; i < data.length; i++) {
        currentSum += data[i] - data[i - windowSize];
        if (currentSum > maxSum) maxSum = currentSum;
    }
    return maxSum / windowSize;
};

const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200]; 
const formatInterval = (secs) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${secs/60}m`;
    return `${secs/3600}h`;
};

const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getSportColor = (sportType) => {
    const t = String(sportType).toLowerCase();
    if (t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) return '#2563eb'; 
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return '#ea580c'; 
    if (t.includes('nadar') || t.includes('swim')) return '#0891b2'; 
    if (t.includes('gym') || t.includes('fuerza') || t.includes('weight')) return '#7c3aed'; 
    if (t.includes('andar') || t.includes('caminata') || t.includes('walk')) return '#10b981'; 
    return '#71717a'; 
};

const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#eab308', '#ef4444'];
const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base Aeróbica', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2Max'];

// NUEVA PROP: onSelectActivity (necesaria para el click interactivo)
export const AdvancedAnalytics = ({ activities, settings, onSelectActivity }) => {
  const [accumType, setAccumType] = useState('distance'); 
  const [curveType, setCurveType] = useState('speed'); 
  const [curveSport, setCurveSport] = useState('run'); // Por defecto Run para ver el ritmo
  const [scatterSport, setScatterSport] = useState('run');

  const analytics = useMemo(() => {
      const tssBySport = {}; const zonesData = [0, 0, 0, 0, 0]; 
      const sortedActivities = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
      const accumMap = new Map(); const weeklyMap = new Map(); 

      // MAGIA: Ahora los picos guardan la información del entreno ganador
      const initPeaks = () => {
          const p = {};
          TIME_INTERVALS.forEach(i => { p[i] = { value: 0, actId: null, actName: '', actDate: '' }; });
          return p;
      };

      const peaks = {
          all: { hr: initPeaks(), spd: initPeaks() },
          bike: { hr: initPeaks(), spd: initPeaks() },
          run: { hr: initPeaks(), spd: initPeaks() }
      };
      
      const efData = [];
      const scatterData = { bike: [], run: [] };

      // Helper para actualizar el pico si es superado
      const updatePeak = (sport, metric, window, value, act) => {
          if (value > peaks[sport][metric][window].value) {
              peaks[sport][metric][window] = { value, actId: act.id, actName: act.name, actDate: act.date };
          }
      };

      sortedActivities.forEach(act => {
          if (act.tss > 0) tssBySport[act.type] = (tssBySport[act.type] || 0) + act.tss;

          const dateKey = new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          if (!accumMap.has(dateKey)) accumMap.set(dateKey, { date: dateKey, dailyDistance: 0, dailyTime: 0, dailyElevation: 0 });
          
          const dayData = accumMap.get(dateKey);
          dayData.dailyDistance += (act.distance / 1000); 
          dayData.dailyTime += (act.duration / 60); 
          dayData.dailyElevation += act.elevation_gain; 

          const weekStart = getMonday(act.date);
          if (!weeklyMap.has(weekStart)) weeklyMap.set(weekStart, { week: weekStart, tss: 0, hours: 0 });
          const wData = weeklyMap.get(weekStart);
          wData.tss += act.tss || 0; wData.hours += (act.duration || 0) / 60;

          const typeLower = String(act.type).toLowerCase();
          const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo');
          const isRun = typeLower.includes('run') || typeLower.includes('carrera');

          // Rellenar datos de Eficiencia Dispersa (Scatter Plot)
          if ((isBike || isRun) && act.hr_avg > 80 && act.speed_avg > 0 && act.duration >= 20) {
              const speedKmH = Number((act.speed_avg * 3.6).toFixed(1));
              const paceMinKm = Number((16.6666667 / act.speed_avg).toFixed(2));
              if (isBike) scatterData.bike.push({ hr: Math.round(act.hr_avg), speed: speedKmH, name: act.name, date: act.date, id: act.id });
              if (isRun && paceMinKm < 15) scatterData.run.push({ hr: Math.round(act.hr_avg), pace: paceMinKm, name: act.name, date: act.date, id: act.id });
          }

          if (act.streams_data) {
              if (act.streams_data.heartrate && act.streams_data.time) {
                  const hrData = act.streams_data.heartrate.data; const timeData = act.streams_data.time.data;
                  const userZones = isBike ? settings.bike.zones : settings.run.zones;
                  
                  for (let i = 1; i < hrData.length; i++) {
                      const hr = hrData[i]; const dt = timeData[i] - timeData[i-1];
                      const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
                      if (zIndex !== -1) zonesData[zIndex] += dt; else if (hr > userZones[4].max) zonesData[4] += dt;
                  }
                  
                  TIME_INTERVALS.forEach(windowSize => {
                      if (hrData.length >= windowSize) {
                          const peak = getPeak(hrData, windowSize);
                          updatePeak('all', 'hr', windowSize, peak, act);
                          if (isBike) updatePeak('bike', 'hr', windowSize, peak, act);
                          if (isRun) updatePeak('run', 'hr', windowSize, peak, act);
                      }
                  });
              }

              if (act.streams_data.velocity_smooth && act.streams_data.time) {
                  const spdData = act.streams_data.velocity_smooth.data;
                  TIME_INTERVALS.forEach(windowSize => {
                      if (spdData.length >= windowSize) {
                          const peak = getPeak(spdData, windowSize);
                          updatePeak('all', 'spd', windowSize, peak, act);
                          if (isBike) updatePeak('bike', 'spd', windowSize, peak, act);
                          if (isRun) updatePeak('run', 'spd', windowSize, peak, act);
                      }
                  });
              }
          }

          let vamBike = null; let costRun = null;
          if (isBike && act.elevation_gain >= 100 && act.duration > 0) vamBike = Math.round(act.elevation_gain / (act.duration / 60)); 
          const runZ2Max = settings.run.zones[1].max + 3; 
          if (isRun && act.hr_avg > 100 && act.hr_avg <= runZ2Max && act.speed_avg > 0) {
              const paceMinKm = 16.666666666667 / act.speed_avg; costRun = Math.round(act.hr_avg * paceMinKm); 
          }
          if (vamBike || costRun) efData.push({ date: dateKey, vamBike: vamBike, costRun: costRun, name: act.name });
      });

      const weeklyChart = Array.from(weeklyMap.values()).map(w => ({
          dateLabel: new Date(w.week).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          tss: Math.round(w.tss), hours: Number(w.hours.toFixed(1))
      }));

      let totalDist = 0; let totalTime = 0; let totalElev = 0;
      const accumChart = Array.from(accumMap.values()).map(day => {
          totalDist += day.dailyDistance; totalTime += day.dailyTime; totalElev += day.dailyElevation;
          return { date: day.date, distance: Number(totalDist.toFixed(1)), time: Number(totalTime.toFixed(1)), elevation: Math.round(totalElev) };
      });

      const tssChart = Object.keys(tssBySport).map(key => ({ name: key, value: Math.round(tssBySport[key]), color: getSportColor(key) })).sort((a, b) => b.value - a.value);
      const zonesChart = zonesData.map((secs, i) => ({ name: ZONE_LABELS[i], hours: Number((secs / 3600).toFixed(1)), fill: ZONE_COLORS[i] }));
      
      const lowAerobic = zonesData[0] + zonesData[1]; const highAerobic = zonesData[2] + zonesData[3]; const anaerobic = zonesData[4];
      const totalFocus = lowAerobic + highAerobic + anaerobic;
      const focusChart = totalFocus > 0 ? [
          { name: 'Base Aeróbica', value: Math.round((lowAerobic/totalFocus)*100), color: '#3b82f6', desc: 'Z1-Z2' },
          { name: 'Umbral', value: Math.round((highAerobic/totalFocus)*100), color: '#eab308', desc: 'Z3-Z4' },
          { name: 'Anaeróbico', value: Math.round((anaerobic/totalFocus)*100), color: '#ef4444', desc: 'Z5' }
      ] : [];

      // CURVAS CON METADATOS INTEGRADOS
      const curves = { all: { spd: [], hr: [] }, bike: { spd: [], hr: [] }, run: { spd: [], hr: [] } };
      
      ['all', 'bike', 'run'].forEach(sport => {
          curves[sport].spd = TIME_INTERVALS.map(i => {
              const peakData = peaks[sport].spd[i];
              if (sport === 'run' && peakData.value > 0.1) {
                  return { name: formatInterval(i), value: Number((16.6666667 / peakData.value).toFixed(2)), rawSpeed: peakData.value, actId: peakData.actId, actName: peakData.actName, actDate: peakData.actDate };
              }
              return { name: formatInterval(i), value: Number((peakData.value * 3.6).toFixed(1)), actId: peakData.actId, actName: peakData.actName, actDate: peakData.actDate };
          }).filter(d => sport === 'run' ? (d.value > 0 && d.value < 20) : d.value > 0);

          curves[sport].hr = TIME_INTERVALS.map(i => {
              const peakData = peaks[sport].hr[i];
              return { name: formatInterval(i), value: Math.round(peakData.value), actId: peakData.actId, actName: peakData.actName, actDate: peakData.actDate };
          }).filter(d => d.value > 0);
      });

      return { tssChart, zonesChart, focusChart, accumChart, weeklyChart, efData, curves, scatterData };
  }, [activities, settings]);

  if (!activities || activities.length === 0) return null;

  const accumColor = accumType === 'distance' ? '#2563eb' : accumType === 'time' ? '#059669' : '#7c3aed';
  const accumUnit = accumType === 'distance' ? 'km' : accumType === 'time' ? 'h' : 'm+';
  
  const currentCurve = analytics.curves[curveSport][curveType === 'speed' ? 'spd' : 'hr'];
  const isPace = curveSport === 'run' && curveType === 'speed';
  const curveColor = curveType === 'hr' ? '#ef4444' : (isPace ? '#ea580c' : '#2563eb');
  const curveUnit = isPace ? '/km' : (curveType === 'speed' ? 'km/h' : 'ppm');

  const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '11px', fontWeight: '600', padding: '10px 12px' };

  const PanelHeader = ({ icon: Icon, title, subtitle }) => (
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
          <div>
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> {title}
              </h4>
              {subtitle && <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
      </div>
  );

  // MANEJADOR INTERACTIVO PARA IR A LA ACTIVIDAD
  const handleChartClick = (data) => {
      if (data && data.activePayload && data.activePayload.length > 0 && onSelectActivity) {
          const actId = data.activePayload[0].payload.actId || data.activePayload[0].payload.id;
          if (actId) {
              const fullActivity = activities.find(a => a.id === actId);
              if (fullActivity) onSelectActivity(fullActivity);
          }
      }
  };

  // TOOLTIP PERSONALIZADO PARA LA CURVA (Muestra la actividad origen)
  const CustomCurveTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div style={tooltipStyle} className="shadow-lg shadow-black/50">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Pico de {label}</p>
                  <p className="text-base font-black mb-2" style={{color: curveColor}}>
                      {isPace ? formatPace(data.value) : data.value} <span className="text-[10px] font-bold">{curveUnit}</span>
                  </p>
                  {data.actName && (
                      <div className="border-t border-zinc-700 pt-2 mt-2">
                          <p className="text-[10px] text-blue-400 truncate max-w-[150px]">{data.actName}</p>
                          <p className="text-[9px] text-zinc-500">{new Date(data.actDate).toLocaleDateString()}</p>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-1.5 opacity-70">
                              <MousePointer2 size={10} /> Click para analizar
                          </div>
                      </div>
                  )}
              </div>
          );
      }
      return null;
  };

  // TOOLTIP PERSONALIZADO PARA SCATTER PLOT
  const CustomScatterTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const isRun = scatterSport === 'run';
          return (
              <div style={tooltipStyle} className="shadow-lg shadow-black/50">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Eficiencia de Sesión</p>
                  <div className="flex justify-between gap-4 mb-2">
                      <p className="text-sm font-black text-rose-500">{data.hr} <span className="text-[9px]">ppm</span></p>
                      <p className="text-sm font-black text-blue-400">
                          {isRun ? formatPace(data.pace) : data.speed} <span className="text-[9px]">{isRun ? '/km' : 'km/h'}</span>
                      </p>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 mt-2">
                      <p className="text-[10px] text-blue-400 truncate max-w-[150px]">{data.name}</p>
                      <p className="text-[9px] text-zinc-500">{new Date(data.date).toLocaleDateString()}</p>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-1.5 opacity-70">
                          <MousePointer2 size={10} /> Click para analizar
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-4">
      
      {/* FILA 1: KPIs Rápidos (Mantenida igual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col">
              <PanelHeader icon={Zap} title="Puntuación de Estrés" />
              <div className="flex-1 h-[100px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={analytics.tssChart} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                              {analytics.tssChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{color: '#fff'}} cursor={{fill: 'transparent'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3">
                  {analytics.tssChart.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                          <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></div>
                          <span className="truncate">{item.name}</span>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col">
              <PanelHeader icon={Target} title="Foco de Entrenamiento" />
              {analytics.focusChart.length > 0 ? (
                  <div className="flex-1 flex flex-col justify-center space-y-3 mt-2">
                      {analytics.focusChart.map((focus, i) => (
                          <div key={i}>
                              <div className="flex justify-between items-end mb-1">
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">{focus.name} <span className="text-slate-500 font-normal ml-1">({focus.desc})</span></span>
                                  <span className="text-[10px] font-bold" style={{ color: focus.color }}>{focus.value}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-none overflow-hidden">
                                  <div className="h-full" style={{ width: `${focus.value}%`, backgroundColor: focus.color }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : <p className="text-[10px] text-slate-500 dark:text-zinc-600 text-center m-auto">Sin telemetría</p>}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 lg:col-span-2 flex flex-col">
              <PanelHeader icon={BarChart2} title="Tiempo en Zonas" subtitle="Horas absolutas distribuidas fisiológicamente" />
              <div className="flex-1 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.zonesChart} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{fontSize: 9, fill: '#71717a'}} axisLine={{stroke: '#3f3f46'}} tickLine={false} />
                          <YAxis tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                          <Bar dataKey="hours" radius={[2, 2, 0, 0]}>{analytics.zonesChart.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* FILA 2: NUEVO GRÁFICO (SCATTER PLOT DE EFICIENCIA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
                  <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Heart size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Eficiencia Aeróbica (Relación)</h4>
                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">Vel/Ritmo respecto al Pulso Medio (Progreso abajo-derecha)</p>
                  </div>
                  <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                      <button onClick={() => setScatterSport('bike')} className={`px-2 py-1 text-[9px] font-bold uppercase transition-colors ${scatterSport === 'bike' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Bici</button>
                      <button onClick={() => setScatterSport('run')} className={`px-2 py-1 text-[9px] font-bold uppercase border-l border-slate-200 dark:border-zinc-700 transition-colors ${scatterSport === 'run' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Run</button>
                  </div>
              </div>

              <div className="flex-1 h-[200px] w-full mt-2 cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 10, bottom: 10, left: -20 }} onClick={handleChartClick}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} />
                          {/* Eje X: Pulso */}
                          <XAxis 
                              type="number" dataKey="hr" name="Pulso" domain={['dataMin - 5', 'dataMax + 5']} 
                              tick={{fontSize: 9, fill: '#71717a'}} axisLine={{stroke: '#3f3f46'}} tickLine={false} 
                              label={{ value: 'Pulsaciones Medias', position: 'insideBottom', offset: -5, fontSize: 9, fill: '#71717a' }}
                          />
                          {/* Eje Y: Ritmo o Velocidad (Ritmo va invertido) */}
                          <YAxis 
                              type="number" dataKey={scatterSport === 'run' ? 'pace' : 'speed'} name={scatterSport === 'run' ? 'Ritmo' : 'Velocidad'} 
                              domain={['dataMin', 'dataMax']} tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false}
                              reversed={scatterSport === 'run'} tickFormatter={scatterSport === 'run' ? formatPace : undefined}
                          />
                          <ZAxis range={[20, 20]} /> {/* Tamaño de los puntos fijos */}
                          <RechartsTooltip content={<CustomScatterTooltip />} cursor={{strokeDasharray: '3 3', stroke: '#71717a'}} />
                          <Scatter data={analytics.scatterData[scatterSport]} fill={scatterSport === 'run' ? '#ea580c' : '#2563eb'} fillOpacity={0.6} />
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4">
              <PanelHeader icon={CalendarDays} title="Gestión del Rendimiento" subtitle="TSS Semanal vs Horas de Inversión" />
              <div className="h-[200px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.weeklyChart} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false}/>
                          <XAxis dataKey="dateLabel" tick={{fontSize: 9, fill: '#71717a'}} minTickGap={15} axisLine={{stroke: '#3f3f46'}} tickLine={false} />
                          <YAxis yAxisId="left" tick={{fontSize: 9, fill: '#8b5cf6'}} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} hide />
                          <RechartsTooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} iconType="plainline" />
                          <Bar yAxisId="left" dataKey="tss" name="Carga (TSS)" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={30} />
                          <Line yAxisId="right" type="step" dataKey="hours" name="Volumen (h)" stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* FILA 3: CURVA DE POTENCIA/RITMO (AHORA INTERACTIVA) Y VOLUMEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-3 mb-4 gap-3">
                  <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Trophy size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Curva de Rendimiento Máximo</h4>
                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">Tus mejores picos históricos por duración</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                      <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                          <button onClick={() => setCurveSport('all')} className={`px-2 py-1 text-[9px] font-bold uppercase transition-colors ${curveSport === 'all' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Todo</button>
                          <button onClick={() => setCurveSport('bike')} className={`px-2 py-1 text-[9px] font-bold uppercase border-l border-slate-200 dark:border-zinc-700 transition-colors ${curveSport === 'bike' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Bici</button>
                          <button onClick={() => setCurveSport('run')} className={`px-2 py-1 text-[9px] font-bold uppercase border-l border-slate-200 dark:border-zinc-700 transition-colors ${curveSport === 'run' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Run</button>
                      </div>
                      <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                          <button onClick={() => setCurveType('speed')} className={`px-2 py-1 text-[9px] font-bold uppercase transition-colors ${curveType === 'speed' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>
                              {curveSport === 'run' ? 'Ritmo' : 'Vel'}
                          </button>
                          <button onClick={() => setCurveType('hr')} className={`px-2 py-1 text-[9px] font-bold uppercase border-l border-slate-200 dark:border-zinc-700 transition-colors ${curveType === 'hr' ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Pulso</button>
                      </div>
                  </div>
              </div>

              <div className="flex-1 h-[170px] w-full cursor-pointer relative group">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentCurve} margin={{ top: 10, right: 10, bottom: 0, left: -25 }} onClick={handleChartClick}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 9, fill: '#71717a'}} interval={0} minTickGap={10} axisLine={{stroke: '#3f3f46'}} tickLine={false} />
                          
                          <YAxis 
                              tick={{fontSize: 9, fill: curveColor}} 
                              domain={isPace ? ['dataMin - 0.5', 'dataMax + 1'] : [curveType === 'speed' ? 0 : 'dataMin - 5', 'dataMax + 5']} 
                              axisLine={false} tickLine={false} reversed={isPace} tickFormatter={isPace ? formatPace : undefined}
                          />
                          
                          <RechartsTooltip content={<CustomCurveTooltip />} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area type="monotone" dataKey="value" stroke={curveColor} strokeWidth={2} fillOpacity={0.1} fill={curveColor} activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
                  <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Volumen Acumulado</h4>
                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">Suma progresiva de carga</p>
                  </div>
                  <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                      <button onClick={() => setAccumType('distance')} className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${accumType === 'distance' ? 'bg-slate-800 text-blue-400 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Km</button>
                      <button onClick={() => setAccumType('time')} className={`px-3 py-1 text-[10px] font-bold uppercase border-x border-slate-200 dark:border-zinc-700 transition-colors ${accumType === 'time' ? 'bg-slate-800 text-emerald-400 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>Hr</button>
                      <button onClick={() => setAccumType('elevation')} className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${accumType === 'elevation' ? 'bg-slate-800 text-purple-400 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>M+</button>
                  </div>
              </div>
              <div className="flex-1 h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.accumChart} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false}/>
                          <XAxis dataKey="date" tick={{fontSize: 9, fill: '#71717a'}} minTickGap={30} axisLine={{stroke: '#3f3f46'}} tickLine={false} />
                          <YAxis tick={{fontSize: 9, fill: '#71717a'}} domain={[0, 'auto']} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} ${accumUnit}`, 'Total']} />
                          <Area type="step" dataKey={accumType} stroke={accumColor} strokeWidth={2} fillOpacity={0.05} fill={accumColor} activeDot={{ r: 4, strokeWidth: 0 }} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};