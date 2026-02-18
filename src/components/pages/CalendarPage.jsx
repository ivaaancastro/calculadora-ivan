import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target 
} from 'lucide-react';
// IMPORTANTE: Ya NO importamos ActivityDetailModal aquí

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getSportColor = (type) => {
  const t = type.toLowerCase();
  if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900 hover:bg-orange-200 dark:hover:bg-orange-900/50';
  if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900 hover:bg-blue-200 dark:hover:bg-blue-900/50';
  if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-900 hover:bg-cyan-200 dark:hover:bg-cyan-900/50';
  if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900 hover:bg-purple-200 dark:hover:bg-purple-900/50';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200';
};

const getSportIcon = (type) => {
  const t = type.toLowerCase();
  if (t.includes('run') || t.includes('carrera')) return <Footprints size={12} />;
  if (t.includes('bike') || t.includes('bici')) return <Bike size={12} />;
  if (t.includes('gym') || t.includes('fuerza')) return <Dumbbell size={12} />;
  return <Activity size={12} />;
};

// NUEVO: Añadimos onSelectActivity a las props
export const CalendarPage = ({ activities, onDelete, onSelectActivity }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-visible mb-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-1.5 sm:gap-2">
                  <CalIcon className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                  {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToday} className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition">Hoy</button>
          </div>
          <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronLeft size={20}/></button>
              <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="w-full relative">
            
            {/* CABECERA DÍAS DE LA SEMANA */}
            <div className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
              {WEEKDAYS.map(day => (
                  <div key={day} className="py-2 text-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day}</div>
              ))}
              <div className="hidden lg:block py-2 text-center text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-800">
                  Resumen
              </div>
            </div>

            {/* CUERPO DEL CALENDARIO */}
            <div className="pb-4">
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
                  let complianceColor = 'bg-slate-300';
                  if (targetTSS > 0) {
                      if (compliance > 115) complianceColor = 'bg-red-500';
                      else if (compliance >= 90) complianceColor = 'bg-emerald-500';
                      else if (compliance >= 70) complianceColor = 'bg-blue-500';
                      else complianceColor = 'bg-orange-400';
                  }

                  return (
                      <div key={wIdx} className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] border-b border-slate-200 dark:border-slate-800">
                          
                          {/* 7 DÍAS INDIVIDUALES */}
                          {week.map((day, dIdx) => {
                              const dateKey = day.date.toLocaleDateString('en-CA');
                              const acts = activitiesByDate[dateKey] || [];
                              const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                              return (
                                  <div key={dIdx} className={`relative p-0.5 sm:p-1 lg:p-1.5 border-r border-slate-200 dark:border-slate-800/50 flex flex-col gap-0.5 sm:gap-1 min-h-[90px] sm:min-h-[110px] lg:min-h-[130px]
                                      ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}
                                      ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                                  `}>
                                      <div className="flex justify-center lg:justify-between items-start px-1 mb-0.5">
                                          <span className={`text-[9px] lg:text-[11px] font-bold ${!day.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-blue-600 bg-blue-100 px-1.5 rounded-full' : 'text-slate-500'}`}>
                                              {day.date.getDate()}
                                          </span>
                                      </div>

                                      <div className="flex-1 flex flex-col gap-1 w-full">
                                          {acts.map((act, i) => (
                                              <div 
                                                key={i} 
                                                onClick={() => onSelectActivity && onSelectActivity(act)} // <--- NUEVO CLICK
                                                className={`p-1 lg:p-1.5 rounded border cursor-pointer transition shadow-sm flex flex-col items-center lg:items-stretch ${getSportColor(act.type)}`}
                                              >
                                                  <div className="flex lg:flex-row flex-col items-center lg:justify-between w-full gap-0.5">
                                                      <div className="flex items-center gap-1 font-bold">
                                                          {getSportIcon(act.type)}
                                                          <span className="hidden lg:inline text-[10px] truncate max-w-[45px]">{act.type}</span>
                                                      </div>
                                                      {act.tss > 0 && <span className="text-[9px] lg:text-[10px] font-black opacity-90">{act.tss}</span>}
                                                  </div>
                                                  <div className="flex justify-center lg:justify-between opacity-90 text-[8px] lg:text-[9px] mt-0.5">
                                                      <span>{act.duration}m</span>
                                                      {act.distance > 0 && <span className="hidden lg:inline">{(act.distance/1000).toFixed(0)}k</span>}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}

                          {/* COLUMNA RESUMEN Y OBJETIVO */}
                          <div className="col-span-7 lg:col-span-1 bg-slate-50 dark:bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-2 flex flex-row lg:flex-col justify-between items-center lg:items-stretch gap-2 lg:gap-0">
                              
                              <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 flex-1 justify-around lg:justify-end">
                                 <div className="text-center lg:text-right">
                                    <span className="hidden lg:block text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Volumen</span>
                                    <div className="flex items-center justify-center lg:justify-end gap-1 text-slate-600 dark:text-slate-300 font-mono font-bold text-[10px] lg:text-xs">
                                        <Clock size={10} className="lg:w-3 lg:h-3" /> {Math.floor(weekDuration / 60)}h <span className="hidden sm:inline">{weekDuration % 60}m</span>
                                    </div>
                                </div>
                                 <div className="text-center lg:text-right">
                                    <span className="hidden lg:block text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Distancia</span>
                                    <div className="flex items-center justify-center lg:justify-end gap-1 text-blue-500 font-mono font-bold text-[10px] lg:text-xs">
                                        <MapPin size={10} className="lg:w-3 lg:h-3" /> {(weekDist / 1000).toFixed(0)}km
                                    </div>
                                </div>
                                <div className="text-center lg:text-right">
                                    <span className="hidden lg:block text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Carga (TSS)</span>
                                    <div className="flex items-center justify-center lg:justify-end gap-1 text-emerald-600 font-mono font-black text-xs lg:text-sm">
                                        <Zap size={10} className="lg:w-3 lg:h-3" /> {Math.round(weekTSS)} <span className="lg:hidden text-[8px]">TSS</span>
                                    </div>
                                </div>
                              </div>

                              <div 
                                onClick={() => handleEditTarget(weekKey)}
                                className="flex-shrink-0 w-1/3 lg:w-full border-l lg:border-l-0 lg:border-t border-slate-200 dark:border-slate-800 pl-3 lg:pl-0 lg:pt-2 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                              >
                                 <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Target size={10}/> Obj.
                                    </span>
                                 </div>
                                 <div className="text-right lg:text-right mb-0.5">
                                     {targetTSS > 0 ? (
                                        <span className="text-[10px] lg:text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                                            {targetTSS} TSS
                                        </span>
                                     ) : (
                                         <span className="text-[9px] italic text-slate-400">Definir</span>
                                     )}
                                 </div>
                                 {targetTSS > 0 && (
                                     <div className="w-full h-1 lg:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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