import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Bike, Footprints, Dumbbell, Activity, 
  Calendar as CalIcon, Clock, Heart, Zap, MapPin 
} from 'lucide-react';

const getActivityStyle = (type) => {
  const t = type ? type.toLowerCase() : '';
  if (t.includes('ciclismo') || t.includes('bici')) 
    return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', icon: Bike };
  if (t.includes('carrera') || t.includes('correr')) 
    return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', icon: Footprints };
  if (t.includes('fuerza') || t.includes('pesas')) 
    return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', icon: Dumbbell };
  if (t.includes('caminata') || t.includes('andar')) 
    return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', icon: Footprints };
  if (t.includes('natación') || t.includes('nadar')) 
    return { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500', icon: Activity };
  
  return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400', icon: Activity };
};

const ActivityCalendar = ({ activities }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const activitiesByDate = useMemo(() => {
    const map = {};
    if(activities) {
        activities.forEach(act => {
        const dateKey = new Date(act.date).toLocaleDateString('en-CA');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(act);
        });
    }
    return map;
  }, [activities]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingSlot = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: startingSlot }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="w-full h-full flex flex-col select-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 capitalize transition-colors">
          <CalIcon size={16} className="text-slate-400 dark:text-slate-500"/>
          {monthNames[month]} <span className="text-slate-400 dark:text-slate-600 font-normal">{year}</span>
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
          <button onClick={goToday} className="px-2 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">HOY</button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
          <span key={d} className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 auto-rows-fr">
        {emptySlots.map((i) => <div key={`e-${i}`} className="bg-transparent"></div>)}

        {daysArray.map(day => {
          const d = new Date(year, month, day);
          const dateKey = d.toLocaleDateString('en-CA');
          const dayActs = activitiesByDate[dateKey] || [];
          
          const sortedActs = [...dayActs].sort((a,b) => b.duration - a.duration);
          const mainAct = sortedActs[0];
          
          const mainStyle = mainAct ? getActivityStyle(mainAct.type) : null;
          const MainIcon = mainStyle ? mainStyle.icon : null;
          const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

          // CÁLCULO DIRECTO LEYENDO LA PROPIEDAD .tss
          // Ya no calculamos nada, solo sumamos lo que nos da el hook
          const totalDuration = dayActs.reduce((acc, curr) => acc + curr.duration, 0);
          const totalTSS = dayActs.reduce((acc, curr) => acc + (curr.tss || 0), 0);

          return (
            <div 
              key={day} 
              className={`h-14 sm:h-16 rounded-lg border flex flex-col items-center justify-center relative group cursor-pointer transition-all
                ${isToday 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-600' 
                    : 'border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:border-blue-200 dark:hover:border-slate-600'}
                ${mainAct ? 'bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-700' : ''}
              `}
            >
              <span className={`absolute top-0.5 left-1 text-[9px] font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>{day}</span>
              
              {mainAct && (
                <>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${mainStyle.bg} ${mainStyle.text} mb-0.5 z-0`}>
                    <MainIcon size={14} strokeWidth={2.5} />
                  </div>

                  {dayActs.length > 1 && (
                    <div className="absolute bottom-1 flex gap-1">
                        {sortedActs.slice(1, 4).map((act, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getActivityStyle(act.type).dot}`}></div>
                        ))}
                    </div>
                  )}

                  {/* TOOLTIP LEEYENDO TSS REAL */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 min-w-[180px] bg-slate-900 text-white rounded-xl p-0 pointer-events-none z-50 shadow-xl border border-slate-700 transition-all duration-200 translate-y-2 group-hover:translate-y-0 hidden sm:block overflow-hidden">
                    
                    <div className="bg-slate-800 p-2 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Resumen Día {day}</span>
                        <div className="flex gap-2 text-[10px] font-mono">
                            <span className="text-blue-300 font-bold">{totalDuration}m</span>
                            <span className="text-emerald-400 font-bold">{totalTSS} TSS</span>
                        </div>
                    </div>
                    
                    <div className="p-2 space-y-2">
                        {sortedActs.map((act, idx) => {
                            const style = getActivityStyle(act.type);
                            const ActIcon = style.icon;
                            // TSS REAL
                            const tss = act.tss || 0;
                            
                            return (
                                <div key={idx} className="flex items-center justify-between gap-3 text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded bg-white/10 ${style.text}`}>
                                            <ActIcon size={10} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold leading-none">{act.type}</span>
                                            <span className="text-slate-500 leading-none mt-0.5">
                                                {act.hr_avg > 0 ? `${Math.round(act.hr_avg)} ppm` : 'Sin pulso'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-mono font-bold">{act.duration}min</span>
                                        <span className="block font-mono text-emerald-500/80">{tss} TSS</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityCalendar;