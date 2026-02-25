import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target 
} from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getSportColor = (type) => {
  const t = String(type).toLowerCase();
  if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-900/40';
  if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/40';
  if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-900/40';
  if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/40';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700/50';
};

const getSportIcon = (type) => {
  const t = String(type).toLowerCase();
  if (t.includes('run') || t.includes('carrera')) return <Footprints size={12} />;
  if (t.includes('bike') || t.includes('bici')) return <Bike size={12} />;
  if (t.includes('gym') || t.includes('fuerza')) return <Dumbbell size={12} />;
  return <Activity size={12} />;
};

export const CalendarPage = ({ activities, onDelete, onSelectActivity }) => {
  
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = sessionStorage.getItem('forma_calendar_date');
    if (savedDate) {
        const d = new Date(savedDate);
        if (!isNaN(d.getTime())) return d; 
    }
    return new Date();
  });

  useEffect(() => {
    sessionStorage.setItem('forma_calendar_date', currentDate.toISOString());
  }, [currentDate]);
  
  const [weeklyTargets, setWeeklyTargets] = useState(() => {
    const saved = localStorage.getItem('planner_targets');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('planner_targets', JSON.stringify(weeklyTargets));
  }, [weeklyTargets]);

  const handleEditTarget = (weekKey) => {
    const current = weeklyTargets[weekKey] || 0;
    const newVal = prompt("Define el objetivo de TSS para esta semana:", current);
    if (newVal !== null) {
        const val = parseInt(newVal);
        if (!isNaN(val)) setWeeklyTargets(prev => ({ ...prev, [weekKey]: val }));
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const activitiesByDate = useMemo(() => {
    const map = {};
    if (activities) {
      activities.forEach(act => {
        const dateKey = new Date(act.date).toLocaleDateString('en-CA');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(act);
      });
    }
    return map;
  }, [activities]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDay.getDay(); 
    if (startDayOfWeek === 0) startDayOfWeek = 7;
    const daysInMonth = lastDay.getDate();
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 1; i < startDayOfWeek; i++) {
        const d = new Date(year, month, 1 - (startDayOfWeek - i));
        currentWeek.push({ date: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        currentWeek.push({ date: date, isCurrentMonth: true });
        if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }

    if (currentWeek.length > 0) {
        let d = 1;
        while (currentWeek.length < 7) {
            const date = new Date(year, month + 1, d++);
            currentWeek.push({ date: date, isCurrentMonth: false });
        }
        weeks.push(currentWeek);
    }
    return weeks;
  }, [year, month]);

  return (
    <>
      <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-visible mb-6 shadow-sm">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-zinc-100 capitalize flex items-center gap-1.5 sm:gap-2 tracking-tight">
                  <CalIcon className="text-blue-600 dark:text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
                  {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToday} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">Hoy</button>
          </div>
          <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
              <button onClick={prevMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronLeft size={18}/></button>
              <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700"></div>
              <button onClick={nextMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="w-full relative">
            
            {/* CABECERA DÍAS DE LA SEMANA */}
            <div className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] bg-slate-50/95 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-20">
              {WEEKDAYS.map(day => (
                  <div key={day} className="py-2 text-center text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{day}</div>
              ))}
              <div className="hidden lg:block py-2 text-center text-[10px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-widest border-l border-slate-200 dark:border-zinc-800">
                  Resumen Semanal
              </div>
            </div>

            {/* CUERPO DEL CALENDARIO */}
            <div className="pb-2">
              {calendarGrid.map((week, wIdx) => {
                  let weekTSS = 0; let weekDuration = 0; let weekDist = 0;
                  const weekKey = week[0].date.toLocaleDateString('en-CA');
                  const targetTSS = weeklyTargets[weekKey] || 0;
                  
                  week.forEach(day => {
                      const dateKey = day.date.toLocaleDateString('en-CA');
                      const acts = activitiesByDate[dateKey] || [];
                      acts.forEach(a => { weekTSS += (a.tss || 0); weekDuration += a.duration; weekDist += a.distance; });
                  });

                  const compliance = targetTSS > 0 ? Math.min((weekTSS / targetTSS) * 100, 100) : 0;
                  let complianceColor = 'bg-slate-300 dark:bg-zinc-600';
                  if (targetTSS > 0) {
                      if (compliance > 115) complianceColor = 'bg-red-500';
                      else if (compliance >= 90) complianceColor = 'bg-emerald-500';
                      else if (compliance >= 70) complianceColor = 'bg-blue-500';
                      else complianceColor = 'bg-orange-400';
                  }

                  return (
                      // FILA PRINCIPAL: Aquí está la altura fija (lg:h-[140px])
                      <div key={wIdx} className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] border-b border-slate-200 dark:border-zinc-800 last:border-b-0 lg:h-[140px]">
                          
                          {/* 7 DÍAS INDIVIDUALES (Ahora toman la altura del padre con lg:h-full) */}
                          {week.map((day, dIdx) => {
                              const dateKey = day.date.toLocaleDateString('en-CA');
                              const acts = activitiesByDate[dateKey] || [];
                              const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                              return (
                                  <div key={dIdx} className={`relative p-1 lg:p-1.5 border-r border-slate-200 dark:border-zinc-800 flex flex-col h-[90px] sm:h-[110px] lg:h-full overflow-hidden
                                      ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-zinc-950/30' : 'bg-white dark:bg-zinc-900'}
                                      ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' : ''}
                                  `}>
                                      {/* Número del día */}
                                      <div className="flex justify-center lg:justify-between items-start px-1 mb-1 shrink-0">
                                          <span className={`text-[9px] lg:text-[11px] font-bold ${!day.isCurrentMonth ? 'text-slate-300 dark:text-zinc-600' : isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 rounded-sm' : 'text-slate-500 dark:text-zinc-400'}`}>
                                              {day.date.getDate()}
                                          </span>
                                      </div>

                                      {/* Contenedor de entrenos con SCROLL si hay más de la cuenta */}
                                      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 w-full pr-0.5">
                                          {acts.map((act, i) => (
                                              <div 
                                                key={i} 
                                                onClick={() => onSelectActivity && onSelectActivity(act)}
                                                className={`p-1 lg:p-1.5 rounded border cursor-pointer transition-colors flex flex-col items-center lg:items-stretch w-full shrink-0 ${getSportColor(act.type)}`}
                                              >
                                                  {/* Título truncado inteligentemente */}
                                                  <div className="flex flex-col lg:flex-row items-center lg:justify-between w-full gap-0.5 lg:gap-1">
                                                      <div className="flex items-center justify-center lg:justify-start gap-1 font-bold flex-1 min-w-0 w-full" title={act.name || act.type}>
                                                          <span className="shrink-0">{getSportIcon(act.type)}</span>
                                                          <span className="hidden lg:block text-[9px] xl:text-[10px] truncate w-full text-left">
                                                              {act.name || act.type}
                                                          </span>
                                                      </div>
                                                      {act.tss > 0 && <span className="text-[9px] lg:text-[10px] font-black font-mono opacity-90 shrink-0">{Math.round(act.tss)}</span>}
                                                  </div>
                                                  <div className="flex justify-center lg:justify-between opacity-80 text-[8px] lg:text-[9px] mt-0.5 font-mono w-full">
                                                      <span>{act.duration}m</span>
                                                      {act.distance > 0 && <span className="hidden lg:inline">{(act.distance/1000).toFixed(0)}k</span>}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}

                          {/* COLUMNA RESUMEN Y OBJETIVO (Ajustada para que no se aplaste) */}
                          <div className="col-span-7 lg:col-span-1 bg-slate-50 dark:bg-zinc-950/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 p-2 flex flex-row lg:flex-col justify-between h-[60px] lg:h-full">
                              
                              {/* MÉTRICAS ALINEADAS IZQUIERDA/DERECHA */}
                              <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 flex-1 justify-around lg:justify-center w-full px-1">
                                 
                                 {/* VOLUMEN */}
                                 <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                     <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                         <Clock size={10} /> Vol
                                     </span>
                                     <span className="text-emerald-600 dark:text-emerald-500 font-mono font-bold">
                                         {Math.floor(weekDuration / 60)}h <span className="hidden sm:inline">{weekDuration % 60}m</span>
                                     </span>
                                 </div>

                                 {/* DISTANCIA */}
                                 <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                     <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                         <MapPin size={10} /> Dist
                                     </span>
                                     <span className="text-blue-600 dark:text-blue-500 font-mono font-bold">
                                         {(weekDist / 1000).toFixed(0)}km
                                     </span>
                                 </div>

                                 {/* CARGA */}
                                 <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                     <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                         <Zap size={10} /> TSS
                                     </span>
                                     <span className="text-amber-600 dark:text-amber-500 font-mono font-black">
                                         {Math.round(weekTSS)}
                                     </span>
                                 </div>
                              </div>

                              {/* PANEL DE OBJETIVOS (Fijo en la parte inferior) */}
                              <div 
                                onClick={() => handleEditTarget(weekKey)}
                                className="flex-shrink-0 w-1/3 lg:w-full border-l lg:border-l-0 lg:border-t border-slate-200 dark:border-zinc-800 pl-3 lg:pl-0 lg:pt-2 cursor-pointer group hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded transition-colors mt-auto"
                              >
                                 <div className="flex justify-between items-center mb-1 lg:mb-0.5">
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 px-1">
                                        <Target size={10}/> Objetivo
                                    </span>
                                 </div>
                                 <div className="text-right mb-1.5 px-1">
                                     {targetTSS > 0 ? (
                                        <span className="text-[10px] lg:text-[11px] font-bold text-slate-700 dark:text-zinc-200 font-mono">
                                            {targetTSS} TSS
                                        </span>
                                     ) : (
                                         <span className="text-[9px] italic text-slate-400 dark:text-zinc-600">Definir</span>
                                     )}
                                 </div>
                                 {targetTSS > 0 && (
                                     <div className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-none overflow-hidden">
                                         <div className={`h-full ${complianceColor} transition-all duration-500`} style={{ width: `${compliance}%` }}></div>
                                     </div>
                                 )}
                              </div>

                          </div>
                      </div>
                  );
              })}
            </div>
        </div>
      </div>
    </>
  );
};