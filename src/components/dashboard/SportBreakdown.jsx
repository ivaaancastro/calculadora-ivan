import React, { useMemo } from 'react';
import { PieChart, Zap, Clock, TrendingUp, Footprints, Bike, Dumbbell, Activity, CalendarDays, Flame } from 'lucide-react';

// Helpers para colores e iconos
const getSportTheme = (type) => {
  const t = type.toLowerCase();
  if (t.includes('run') || t.includes('carrera')) return { hex: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', icon: Footprints };
  if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return { hex: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', icon: Bike };
  if (t.includes('swim') || t.includes('nadar')) return { hex: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600', icon: Activity };
  if (t.includes('gym') || t.includes('fuerza')) return { hex: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', icon: Dumbbell };
  return { hex: '#64748b', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600', icon: Activity };
};

export const SportBreakdown = ({ activities }) => {
  
  // 1. PROCESAMIENTO DE DATOS
  const { stats, totals, highlights } = useMemo(() => {
    if (!activities || activities.length === 0) return { stats: [], totals: { tss: 0, hours: 0 }, highlights: null };

    const map = {};
    let totalTSS = 0;
    let totalMins = 0;
    const uniqueDays = new Set();

    activities.forEach(act => {
      const t = act.type;
      if (!map[t]) map[t] = { type: t, duration: 0, tss: 0, count: 0 };
      map[t].duration += act.duration;
      map[t].tss += (act.tss || 0);
      map[t].count += 1;
      
      totalTSS += (act.tss || 0);
      totalMins += act.duration;
      
      if (act.date) uniqueDays.add(act.date.split('T')[0]);
    });

    const processedStats = Object.values(map).map(s => {
      const hours = s.duration / 60;
      return {
        ...s,
        hours: hours,
        tssPerHour: hours > 0 ? Math.round(s.tss / hours) : 0,
        pctTSS: totalTSS > 0 ? (s.tss / totalTSS) * 100 : 0,
        pctTime: totalMins > 0 ? (s.duration / totalMins) * 100 : 0,
        theme: getSportTheme(s.type)
      };
    }).sort((a, b) => b.tss - a.tss); 

    const hardestSession = activities.reduce((prev, current) => {
        return (prev.tss || 0) > (current.tss || 0) ? prev : current;
    }, activities[0]);

    return { 
        stats: processedStats, 
        totals: { tss: Math.round(totalTSS), hours: (totalMins / 60).toFixed(1) },
        highlights: {
            activeDays: uniqueDays.size,
            avgTssPerSession: Math.round(totalTSS / activities.length),
            avgMinsPerSession: Math.round(totalMins / activities.length),
            hardest: hardestSession
        }
    };
  }, [activities]);

  if (stats.length === 0) return null;

  let cumulativePercent = 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-center lg:items-start transition-colors">
      
      {/* 1. SECCIÓN GRÁFICA Y HIGHLIGHTS (IZQUIERDA) */}
      <div className="w-full lg:w-1/3 flex flex-col items-center justify-center shrink-0">
         <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            
            {/* SVG Donut Chart */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                
                {stats.map((s, i) => {
                    const strokeDasharray = `${s.pctTSS} ${100 - s.pctTSS}`;
                    const strokeDashoffset = -cumulativePercent;
                    cumulativePercent += s.pctTSS;
                    
                    return (
                        <circle 
                            key={i} cx="50" cy="50" r="40" 
                            fill="transparent" 
                            stroke={s.theme.hex} 
                            strokeWidth="12" 
                            strokeDasharray={strokeDasharray} 
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            pathLength="100"
                            className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer focus:outline-none"
                        >
                            {/* NATIVO: Tooltip al pasar el ratón */}
                            <title>{s.type}: {Math.round(s.pctTSS)}% ({Math.round(s.tss)} TSS)</title>
                        </circle>
                    );
                })}
            </svg>

            {/* Texto Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Carga Total</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white leading-none mt-1">{totals.tss}</span>
                <span className="text-xs font-bold text-slate-400 mt-1">TSS</span>
            </div>
         </div>

         {/* LEYENDA VISUAL DEL DÓNUT (NUEVO) */}
         <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5 w-full px-2">
            {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: s.theme.hex }}></span>
                    <span className="text-slate-700 dark:text-slate-300">{s.type}</span> 
                    <span className="opacity-60">{Math.round(s.pctTSS)}%</span>
                </div>
            ))}
         </div>

         {/* HIGHLIGHTS DEL PERIODO */}
         <div className="mt-8 w-full flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 text-center lg:text-left mb-1">
                Métricas del Periodo
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                        <CalendarDays size={10}/> Constancia
                    </span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">
                        {highlights.activeDays} <span className="text-[10px] font-bold text-slate-400">días</span>
                    </span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                        <Activity size={10}/> Promedio
                    </span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">
                        {highlights.avgTssPerSession} <span className="text-[10px] font-bold text-slate-400">TSS</span>
                    </span>
                </div>

                {highlights.hardest && (
                    <div className="col-span-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 p-3 rounded-2xl border border-orange-100 dark:border-red-900/20 flex justify-between items-center group">
                        <div>
                            <span className="text-[9px] uppercase font-bold text-orange-500/80 mb-0.5 flex items-center gap-1">
                                <Flame size={10} className="group-hover:animate-pulse"/> Sesión Top
                            </span>
                            <span className="text-sm font-black text-orange-700 dark:text-orange-400 leading-tight">
                                {highlights.hardest.name && highlights.hardest.name !== 'Entreno sin título' 
                                    ? (highlights.hardest.name.length > 20 ? highlights.hardest.name.substring(0, 20) + '...' : highlights.hardest.name)
                                    : highlights.hardest.type}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-orange-600 dark:text-orange-500 leading-none">
                                {highlights.hardest.tss}
                            </span>
                            <span className="text-[10px] font-bold text-orange-500/80 block">TSS</span>
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* 2. TARJETAS DE DESGLOSE (DERECHA) */}
      <div className="w-full lg:w-2/3 flex flex-col justify-center gap-3 mt-4 lg:mt-0">
          <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PieChart size={18} className="text-blue-500" /> Desglose Detallado
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                  Volumen: {totals.hours}h
              </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map((s, i) => (
                  <div key={i} className="group flex flex-col p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                      
                      <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2.5 rounded-xl ${s.theme.bg} ${s.theme.text}`}>
                              <s.theme.icon size={18} />
                          </div>
                          <div className="flex-1">
                              <h4 className="text-sm font-black text-slate-800 dark:text-white leading-none">
                                  {s.type}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400">
                                  {s.count} sesiones
                              </span>
                          </div>
                          <div className="text-right">
                              <span className={`text-xs font-black ${s.theme.text}`}>
                                  {Math.round(s.pctTSS)}%
                              </span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                                  <Zap size={10} /> Carga
                              </span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-200 leading-none">
                                  {Math.round(s.tss)} <span className="text-[10px] text-slate-400">TSS</span>
                              </span>
                          </div>
                          <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                                  <Clock size={10} /> Tiempo
                              </span>
                              <span className="text-base font-bold text-slate-800 dark:text-slate-200 leading-none">
                                  {s.hours.toFixed(1)} <span className="text-[10px] text-slate-400">h</span>
                              </span>
                          </div>
                      </div>

                      <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <TrendingUp size={12} /> Coste Fisiológico
                          </span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                              {s.tssPerHour} <span className="text-[9px] font-bold text-slate-400">TSS/h</span>
                          </span>
                      </div>

                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};