import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity 
} from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getSportColor = (type) => {
  const t = type.toLowerCase();
  if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900';
  if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
  if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-900';
  if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
};

const getSportIcon = (type) => {
  const t = type.toLowerCase();
  if (t.includes('run') || t.includes('carrera')) return <Footprints size={12} />;
  if (t.includes('bike') || t.includes('bici')) return <Bike size={12} />;
  if (t.includes('gym') || t.includes('fuerza')) return <Dumbbell size={12} />;
  return <Activity size={12} />;
};

export const CalendarPage = ({ activities }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- LÓGICA DE CALENDARIO ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Mapa de actividades por fecha (YYYY-MM-DD)
  const activitiesByDate = useMemo(() => {
    const map = {};
    if (activities) {
      activities.forEach(act => {
        const dateKey = new Date(act.date).toLocaleDateString('en-CA'); // Formato local YYYY-MM-DD
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(act);
      });
    }
    return map;
  }, [activities]);

  // Generar la cuadrícula del mes
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajuste para que la semana empiece en Lunes (0 = Domingo en JS estándar)
    let startDayOfWeek = firstDay.getDay(); 
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Domingo es 7
    
    const daysInMonth = lastDay.getDate();
    
    // Generamos semanas
    const weeks = [];
    let currentWeek = [];
    
    // Relleno días previos (mes anterior)
    for (let i = 1; i < startDayOfWeek; i++) {
        const d = new Date(year, month, 1 - (startDayOfWeek - i));
        currentWeek.push({ date: d, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        currentWeek.push({ date: date, isCurrentMonth: true });
        
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Relleno días posteriores (mes siguiente) para completar la última semana
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
    <div className="flex flex-col h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* HEADER CALENDARIO */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                <CalIcon className="text-blue-600" />
                {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={goToday} className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                Hoy
            </button>
        </div>
        <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronLeft /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition"><ChevronRight /></button>
        </div>
      </div>

      {/* CABECERA DIAS SEMANA + COLUMNA RESUMEN */}
      <div className="grid grid-cols-[repeat(7,1fr)_120px] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        {WEEKDAYS.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
            </div>
        ))}
        <div className="py-2 text-center text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-200/50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            Resumen
        </div>
      </div>

      {/* CUERPO DEL CALENDARIO (GRID) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {calendarGrid.map((week, wIdx) => {
            
            // CÁLCULO DE TOTALES DE LA SEMANA
            let weekTSS = 0;
            let weekDuration = 0;
            let weekDist = 0;

            // Recorremos los días de la semana para sumar
            week.forEach(day => {
                const dateKey = day.date.toLocaleDateString('en-CA');
                const acts = activitiesByDate[dateKey] || [];
                acts.forEach(a => {
                    weekTSS += (a.tss || 0);
                    weekDuration += a.duration;
                    weekDist += a.distance;
                });
            });

            return (
                <div key={wIdx} className="grid grid-cols-[repeat(7,1fr)_120px] min-h-[140px] border-b border-slate-200 dark:border-slate-800">
                    
                    {/* 7 DÍAS DE LA SEMANA */}
                    {week.map((day, dIdx) => {
                        const dateKey = day.date.toLocaleDateString('en-CA');
                        const acts = activitiesByDate[dateKey] || [];
                        const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                        return (
                            <div key={dIdx} className={`relative p-1 border-r border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 
                                ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}
                                ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                            `}>
                                {/* Número del día */}
                                <div className="flex justify-between items-start px-1">
                                    <span className={`text-[10px] font-bold ${!day.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-blue-600 bg-blue-100 px-1.5 rounded-full' : 'text-slate-400'}`}>
                                        {day.date.getDate()}
                                    </span>
                                </div>

                                {/* Lista de Actividades */}
                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[110px]">
                                    {acts.map((act, i) => (
                                        <div key={i} className={`p-1.5 rounded border text-[10px] leading-tight cursor-pointer hover:opacity-80 transition shadow-sm ${getSportColor(act.type)}`}>
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

                    {/* COLUMNA RESUMEN SEMANAL */}
                    <div className="bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-2 flex flex-col justify-center gap-3">
                        
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Volumen</span>
                            <div className="flex items-center justify-end gap-1 text-slate-700 dark:text-slate-200">
                                <Clock size={12} />
                                <span className="text-sm font-black">
                                    {Math.floor(weekDuration / 60)}h {weekDuration % 60}m
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Carga</span>
                            <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                                <Zap size={12} />
                                <span className="text-sm font-black">{Math.round(weekTSS)}</span>
                                <span className="text-[9px] font-bold">TSS</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Distancia</span>
                            <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400">
                                <MapPin size={12} />
                                <span className="text-sm font-black">{(weekDist / 1000).toFixed(1)}</span>
                                <span className="text-[9px] font-bold">km</span>
                            </div>
                        </div>

                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};