import React, { useMemo, useState } from 'react';
import { 
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { Target, Activity, Flame, Mountain, Clock, MapPin, Zap, TrendingUp, Trophy, Heart, Wind, CalendarDays } from 'lucide-react';

// Algoritmo hiper-rápido de ventana deslizante (O(n))
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

// Array Logarítmico para crear la "Curva Continua" (en segundos)
const TIME_INTERVALS = [1, 5, 15, 30, 60, 180, 300, 600, 1200, 2400, 3600, 7200]; 

const formatInterval = (secs) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${secs/60}m`;
    return `${secs/3600}h`;
};

const getSportColor = (sportType) => {
    const t = sportType.toLowerCase();
    if (t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) return '#3b82f6'; 
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return '#f97316'; 
    if (t.includes('nadar') || t.includes('swim')) return '#06b6d4'; 
    if (t.includes('gym') || t.includes('fuerza') || t.includes('weight')) return '#a855f7'; 
    if (t.includes('andar') || t.includes('caminata') || t.includes('walk')) return '#10b981'; 
    return '#64748b'; 
};

const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export const AdvancedAnalytics = ({ activities, settings }) => {
  const [accumType, setAccumType] = useState('distance'); 
  const [curveType, setCurveType] = useState('speed'); 

  const analytics = useMemo(() => {
      const tssBySport = {};
      const zonesData = [0, 0, 0, 0, 0]; 
      
      const sortedActivities = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
      const accumMap = new Map();
      const weeklyMap = new Map(); 

      // Inicializar objetos de récords dinámicos
      const peakHr = {}; const peakSpd = {};
      TIME_INTERVALS.forEach(i => { peakHr[i] = 0; peakSpd[i] = 0; });

      const efData = [];

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
          wData.tss += act.tss || 0;
          wData.hours += (act.duration || 0) / 60;

          const typeLower = act.type.toLowerCase();
          const isBike = typeLower.includes('bici') || typeLower.includes('ciclismo');
          const isRun = typeLower.includes('run') || typeLower.includes('carrera') || typeLower.includes('correr');

          if (act.streams_data) {
              if (act.streams_data.heartrate && act.streams_data.time) {
                  const hrData = act.streams_data.heartrate.data;
                  const timeData = act.streams_data.time.data;
                  const userZones = isBike ? settings.bike.zones : settings.run.zones;

                  for (let i = 1; i < hrData.length; i++) {
                      const hr = hrData[i];
                      const dt = timeData[i] - timeData[i-1];
                      const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
                      if (zIndex !== -1) zonesData[zIndex] += dt;
                      else if (hr > userZones[4].max) zonesData[4] += dt;
                  }

                  // ESCÁNER MÁGICO DE RÉCORDS (Bucle Dinámico)
                  TIME_INTERVALS.forEach(windowSize => {
                      if (hrData.length >= windowSize) {
                          peakHr[windowSize] = Math.max(peakHr[windowSize], getPeak(hrData, windowSize));
                      }
                  });
              }

              if (act.streams_data.velocity_smooth && act.streams_data.time) {
                  const spdData = act.streams_data.velocity_smooth.data;
                  TIME_INTERVALS.forEach(windowSize => {
                      if (spdData.length >= windowSize) {
                          peakSpd[windowSize] = Math.max(peakSpd[windowSize], getPeak(spdData, windowSize));
                      }
                  });
              }
          }

          let vamBike = null; let costRun = null;
          if (isBike && act.elevation_gain >= 100 && act.duration > 0) vamBike = Math.round(act.elevation_gain / (act.duration / 60)); 
          const runZ2Max = settings.run.zones[1].max + 3; 
          if (isRun && act.hr_avg > 100 && act.hr_avg <= runZ2Max && act.speed_avg > 0) {
              const paceMinKm = 16.666666666667 / act.speed_avg;
              costRun = Math.round(act.hr_avg * paceMinKm); 
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
      const zonesChart = zonesData.map((secs, i) => ({ name: ['Z1 Recup.', 'Z2 Base', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2Max'][i], hours: Number((secs / 3600).toFixed(1)), fill: ['#94a3b8', '#10b981', '#3b82f6', '#f97316', '#ef4444'][i] }));
      
      const lowAerobic = zonesData[0] + zonesData[1]; const highAerobic = zonesData[2] + zonesData[3]; const anaerobic = zonesData[4];
      const totalFocus = lowAerobic + highAerobic + anaerobic;
      const focusChart = totalFocus > 0 ? [
          { name: 'Aeróbico Bajo', value: Math.round((lowAerobic/totalFocus)*100), color: '#3b82f6', desc: 'Base/Recup' },
          { name: 'Aeróbico Alto', value: Math.round((highAerobic/totalFocus)*100), color: '#f97316', desc: 'Umbral' },
          { name: 'Anaeróbico', value: Math.round((anaerobic/totalFocus)*100), color: '#a855f7', desc: 'Sprint' }
      ] : [];

      // CONVERTIR DICCIONARIOS EN ARRAYS CONTINUOS PARA LA GRÁFICA
      const curveSpd = TIME_INTERVALS.map(i => ({ name: formatInterval(i), value: Number((peakSpd[i] * 3.6).toFixed(1)) })).filter(d => d.value > 0);
      const curveHr = TIME_INTERVALS.map(i => ({ name: formatInterval(i), value: Math.round(peakHr[i]) })).filter(d => d.value > 0);

      return { tssChart, zonesChart, focusChart, accumChart, weeklyChart, efData, curveSpd, curveHr };
  }, [activities, settings]);

  if (!activities || activities.length === 0) return null;

  const accumColor = accumType === 'distance' ? '#3b82f6' : accumType === 'time' ? '#10b981' : '#a855f7';
  const accumUnit = accumType === 'distance' ? 'km' : accumType === 'time' ? 'h' : 'm+';
  const currentCurve = curveType === 'speed' ? analytics.curveSpd : analytics.curveHr;
  const curveColor = curveType === 'speed' ? '#3b82f6' : '#f43f5e';
  const curveUnit = curveType === 'speed' ? 'km/h' : 'ppm';

  const CustomWeeklyTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 min-w-[150px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Semana del {label}</p>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Carga:</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white">{payload[0].value} <span className="text-[10px] text-slate-400">TSS</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Volumen:</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white">{payload[1].value} <span className="text-[10px] text-slate-400">hr</span></span>
                  </div>
              </div>
          );
      }
      return null;
  };

  const CustomEFTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{label}</p>
                  {payload.map((entry, i) => (
                      <div key={i} className="mb-2">
                          <p className="text-xs font-black flex items-center justify-between gap-4" style={{ color: entry.color }}>
                              <span>{entry.name}:</span>
                              <span>{entry.value} {entry.dataKey === 'vamBike' ? 'm/h' : 'lat/km'}</span>
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium">{entry.dataKey === 'vamBike' ? 'Velocidad de Ascenso Media' : 'Coste cardíaco en Zona 2'}</p>
                      </div>
                  ))}
              </div>
          );
      }
      return null;
  };

  const CustomDonutTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
          const data = payload[0];
          return (
              <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.color }}></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{data.name}:</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white">{data.value} <span className="text-[10px] text-slate-400">TSS</span></span>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-2">
          <Activity size={16}/> Laboratorio Fisiológico Avanzado
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Zap size={14} className="text-amber-500"/> Carga (TSS)</h4>
              <div className="flex-1 h-[120px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={analytics.tssChart} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                              {analytics.tssChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip content={<CustomDonutTooltip />} cursor={{fill: 'transparent'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                  {analytics.tssChart.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                          <span className="truncate">{item.name}</span>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Target size={14} className="text-blue-500"/> Foco</h4>
              {analytics.focusChart.length > 0 ? (
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                      {analytics.focusChart.map((focus, i) => (
                          <div key={i}>
                              <div className="flex justify-between items-end mb-1">
                                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{focus.name}</span>
                                  <span className="text-[10px] font-black" style={{ color: focus.color }}>{focus.value}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full transition-all" style={{ width: `${focus.value}%`, backgroundColor: focus.color }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : <p className="text-[9px] text-slate-400 text-center m-auto">Sin datos exactos</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm lg:col-span-2 flex flex-col">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Flame size={14} className="text-orange-500"/> Zonas Exactas (Horas)</h4>
              <div className="flex-1 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.zonesChart} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold' }} />
                          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>{analytics.zonesChart.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CalendarDays size={14} className="text-purple-500"/> Progreso y Carga Semanal</h4>
              <p className="text-[9px] font-medium text-slate-400 mb-4">¿Estás siendo constante? Compara el Estrés (TSS) generado vs las Horas invertidas.</p>
              <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.weeklyChart} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                          <XAxis dataKey="dateLabel" tick={{fontSize: 10, fill: '#94a3b8'}} minTickGap={15} />
                          <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#a855f7'}} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} hide />
                          <Tooltip content={<CustomWeeklyTooltip />} cursor={{fill: '#f1f5f9', opacity: 0.1}} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar yAxisId="left" dataKey="tss" name="Carga (TSS)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={35} />
                          <Line yAxisId="right" type="monotone" dataKey="hours" name="Volumen (Horas)" stroke="#10b981" strokeWidth={3} dot={{r:3, fill: '#10b981'}} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500"/> Progreso Aeróbico y Escalada</h4>
              <p className="text-[9px] font-medium text-slate-400 mb-4">
                  <span className="text-blue-500 font-bold">Bici:</span> VAM subiendo puertos (Sube). <span className="text-orange-500 font-bold">Run:</span> Coste cardíaco en Z2 (Baja).
              </p>
              <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.efData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                          <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} minTickGap={30} />
                          <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#3b82f6'}} domain={['auto', 'auto']} />
                          <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#f97316'}} domain={['auto', 'auto']} hide />
                          <Tooltip content={<CustomEFTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Line yAxisId="left" type="monotone" name="Bici VAM" dataKey="vamBike" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} connectNulls />
                          <Line yAxisId="right" type="monotone" name="Run (Latidos/Km)" dataKey="costRun" stroke="#f97316" strokeWidth={2} dot={{r:3}} connectNulls />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500"/> Curva de Rendimiento Máximo Continua</h4>
                      <p className="text-[9px] font-medium text-slate-400 mt-1">Tu perfil fisiológico completo: Desde 1 segundo hasta 2 horas.</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button onClick={() => setCurveType('speed')} className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-md ${curveType === 'speed' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}><Wind size={10}/> Vel</button>
                      <button onClick={() => setCurveType('hr')} className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold rounded-md ${curveType === 'hr' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm' : 'text-slate-500'}`}><Heart size={10}/> Pulso</button>
                  </div>
              </div>

              <div className="flex-1 h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentCurve} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                          <defs>
                              <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={curveColor} stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor={curveColor} stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} interval={0} minTickGap={10} />
                          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} domain={[curveType === 'speed' ? 0 : 'dataMin - 5', 'dataMax + 10']} />
                          <Tooltip formatter={(value) => [`${value} ${curveUnit}`, 'Récord']} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="value" stroke={curveColor} strokeWidth={3} fillOpacity={1} fill="url(#colorCurve)" activeDot={{ r: 6 }} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={14} className="text-emerald-500"/> Tendencia Acumulada</h4>
                      <p className="text-[9px] font-medium text-slate-400 mt-1">Tu progreso sumando día a día.</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button onClick={() => setAccumType('distance')} className={`px-2 py-1 text-[9px] font-bold rounded-md ${accumType === 'distance' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}>Km</button>
                      <button onClick={() => setAccumType('time')} className={`px-2 py-1 text-[9px] font-bold rounded-md ${accumType === 'time' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Hr</button>
                      <button onClick={() => setAccumType('elevation')} className={`px-2 py-1 text-[9px] font-bold rounded-md ${accumType === 'elevation' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-500'}`}>M+</button>
                  </div>
              </div>

              <div className="flex-1 h-[170px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.accumChart} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                          <defs>
                              <linearGradient id="colorAccum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={accumColor} stopOpacity={0.4}/><stop offset="95%" stopColor={accumColor} stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false}/>
                          <XAxis dataKey="date" tick={{fontSize: 9, fill: '#94a3b8'}} minTickGap={30} />
                          <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} domain={[0, 'auto']} />
                          <Tooltip formatter={(value) => [`${value} ${accumUnit}`, 'Acumulado']} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey={accumType} stroke={accumColor} strokeWidth={2} fillOpacity={1} fill="url(#colorAccum)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>
    </div>
  );
};