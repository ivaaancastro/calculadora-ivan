import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target, Edit3 
} from 'lucide-react';
import { ActivityDetailModal } from '../modals/ActivityDetailModal';

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

export const CalendarPage = ({ activities, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // ESTADO PARA LOS OBJETIVOS SEMANALES (Guardado en LocalStorage)
  const [weeklyTargets, setWeeklyTargets] = useState(() => {
    const saved = localStorage.getItem('planner_targets');
    return saved ? JSON.parse(saved) : {};
  });

  // Guardar cambios en LocalStorage
  useEffect(() => {
    localStorage.setItem('planner_targets', JSON.stringify(weeklyTargets));
  }, [weeklyTargets]);

  // Función para editar objetivo
  const handleEditTarget = (weekKey) => {
    const current = weeklyTargets[weekKey] || 0;
    const newVal = prompt("Define el objetivo de TSS para esta semana:", current);
    if (newVal !== null) {
        const val = parseInt(newVal);
        if (!isNaN(val)) {
            setWeeklyTargets(prev => ({ ...prev, [weekKey]: val }));
        }
    }
  };

  // --- LÓGICA DE CALENDARIO ---
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
      <div className="flex flex-col h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                  <CalIcon className="text-blue-600" />
                  {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToday} className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition">Hoy</button>
          </div>
          <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronLeft /></button>
              <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronRight /></button>
          </div>
        </div>

        {/* COLUMNAS */}
        <div className="grid grid-cols-[repeat(7,1fr)_130px] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          {WEEKDAYS.map(day => (
              <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
          ))}
          <div className="py-2 text-center text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-200/50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">Resumen</div>
        </div>

        {/* GRID */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {calendarGrid.map((week, wIdx) => {
              let weekTSS = 0; let weekDuration = 0; let weekDist = 0;
              
              // Clave única para la semana (usamos la fecha del lunes)
              const weekKey = week[0].date.toLocaleDateString('en-CA');
              const targetTSS = weeklyTargets[weekKey] || 0;
              
              week.forEach(day => {
                  const dateKey = day.date.toLocaleDateString('en-CA');
                  const acts = activitiesByDate[dateKey] || [];
                  acts.forEach(a => { weekTSS += (a.tss || 0); weekDuration += a.duration; weekDist += a.distance; });
              });

              // Cálculo de cumplimiento
              const compliance = targetTSS > 0 ? Math.min((weekTSS / targetTSS) * 100, 100) : 0;
              let complianceColor = 'bg-slate-300';
              if (targetTSS > 0) {
                  if (compliance > 115) complianceColor = 'bg-red-500'; // Pasado
                  else if (compliance >= 90) complianceColor = 'bg-emerald-500'; // Perfecto
                  else if (compliance >= 70) complianceColor = 'bg-blue-500'; // Bien
                  else complianceColor = 'bg-orange-400'; // Bajo
              }

              return (
                  <div key={wIdx} className="grid grid-cols-[repeat(7,1fr)_130px] min-h-[140px] border-b border-slate-200 dark:border-slate-800">
                      {week.map((day, dIdx) => {
                          const dateKey = day.date.toLocaleDateString('en-CA');
                          const acts = activitiesByDate[dateKey] || [];
                          const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                          return (
                              <div key={dIdx} className={`relative p-1 border-r border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 
                                  ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}
                                  ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                              `}>
                                  <div className="flex justify-between items-start px-1">
                                      <span className={`text-[10px] font-bold ${!day.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-blue-600 bg-blue-100 px-1.5 rounded-full' : 'text-slate-400'}`}>
                                          {day.date.getDate()}
                                      </span>
                                  </div>

                                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[110px]">
                                      {acts.map((act, i) => (
                                          <div 
                                            key={i} 
                                            onClick={() => setSelectedActivity(act)}
                                            className={`p-1.5 rounded border text-[10px] leading-tight cursor-pointer transition shadow-sm ${getSportColor(act.type)}`}
                                          >
                                              <div className="flex justify-between items-center mb-0.5">
                                                  <div className="flex items-center gap-1 font-bold">
                                                      {getSportIcon(act.type)}
                                                      <span className="truncate max-w-[50px]">{act.type}</span>
                                                  </div>
                                                  {act.tss > 0 && <span className="font-black opacity-80">{act.tss}</span>}
                                              </div>
                                              <div className="flex justify-between opacity-90">
                                                  <span>{act.duration}m</span>
                                                  {act.distance > 0 && <span>{(act.distance/1000).toFixed(1)}k</span>}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}

                      {/* COLUMNA RESUMEN CON OBJETIVO */}
                      <div className="bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-2 flex flex-col justify-between">
                          
                          {/* Métricas Reales */}
                          <div className="flex flex-col gap-2">
                             <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Volumen</span>
                                <div className="flex items-center justify-end gap-1 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs">
                                    <Clock size={10} /> {Math.floor(weekDuration / 60)}h {weekDuration % 60}m
                                </div>
                            </div>
                             <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Distancia</span>
                                <div className="flex items-center justify-end gap-1 text-blue-600 font-mono font-bold text-xs">
                                    <MapPin size={10} /> {(weekDist / 1000).toFixed(0)}km
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Real</span>
                                <div className="flex items-center justify-end gap-1 text-emerald-600 font-mono font-black text-sm">
                                    <Zap size={12} /> {Math.round(weekTSS)}
                                </div>
                            </div>
                          </div>

                          {/* SECCIÓN OBJETIVO EDITABLE */}
                          <div 
                            onClick={() => handleEditTarget(weekKey)}
                            className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1 transition"
                            title="Haz clic para editar objetivo"
                          >
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Target size={10}/> Obj.
                                </span>
                                <Edit3 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition"/>
                             </div>
                             
                             <div className="text-right mb-1">
                                 {targetTSS > 0 ? (
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                                        {targetTSS} TSS
                                    </span>
                                 ) : (
                                     <span className="text-[9px] italic text-slate-400">Definir</span>
                                 )}
                             </div>

                             {/* Barra de Progreso (Compliance) */}
                             {targetTSS > 0 && (
                                 <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full ${complianceColor} transition-all duration-500`} 
                                        style={{ width: `${compliance}%` }}
                                     ></div>
                                 </div>
                             )}
                          </div>

                      </div>
                  </div>
              );
          })}
        </div>
      </div>

      <ActivityDetailModal 
        activity={selectedActivity} 
        onClose={() => setSelectedActivity(null)} 
        onDelete={onDelete}
      />
    </>
  );
};