import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Bike, Footprints, Dumbbell, Activity, Calendar as CalIcon 
} from 'lucide-react';

const getActivityStyle = (type) => {
  const t = type.toLowerCase();
  if (t.includes('ciclismo') || t.includes('bici')) return { bg: 'bg-blue-100 text-blue-600', icon: Bike };
  if (t.includes('carrera') || t.includes('correr')) return { bg: 'bg-orange-100 text-orange-600', icon: Footprints };
  if (t.includes('fuerza') || t.includes('pesas')) return { bg: 'bg-purple-100 text-purple-600', icon: Dumbbell };
  if (t.includes('caminata') || t.includes('andar')) return { bg: 'bg-emerald-100 text-emerald-600', icon: Footprints };
  return { bg: 'bg-slate-100 text-slate-500', icon: Activity };
};

const ActivityCalendar = ({ activities }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const activitiesByDate = useMemo(() => {
    const map = {};
    activities.forEach(act => {
      const dateKey = new Date(act.date).toLocaleDateString('en-CA');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(act);
    });
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
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 capitalize">
          <CalIcon size={16} className="text-slate-400"/>
          {monthNames[month]} <span className="text-slate-400 font-normal">{year}</span>
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"><ChevronLeft size={16}/></button>
          <button onClick={goToday} className="px-2 py-1 text-[10px] font-bold bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100">HOY</button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
          <span key={d} className="text-[9px] font-bold text-slate-300 uppercase">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 auto-rows-fr">
        {emptySlots.map((i) => <div key={`e-${i}`} className="bg-transparent"></div>)}

        {daysArray.map(day => {
          const d = new Date(year, month, day);
          const dateKey = d.toLocaleDateString('en-CA');
          const dayActs = activitiesByDate[dateKey] || [];
          const mainAct = dayActs.sort((a,b) => b.duration - a.duration)[0];
          const style = mainAct ? getActivityStyle(mainAct.type) : null;
          const Icon = style ? style.icon : null;
          const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

          return (
            <div 
              key={day} 
              className={`h-14 sm:h-16 rounded-lg border flex flex-col items-center justify-center relative group cursor-default transition-all
                ${isToday ? 'border-blue-500 bg-blue-50/20' : 'border-slate-50 bg-slate-50/30 hover:border-blue-200'}
                ${mainAct ? 'bg-white shadow-sm border-slate-100' : ''}
              `}
            >
              <span className={`absolute top-0.5 left-1 text-[9px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-300'}`}>{day}</span>
              
              {mainAct && (
                <>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${style.bg} mb-0.5`}>
                    <Icon size={12} strokeWidth={2.5} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                    {mainAct.type} • {mainAct.duration}min
                  </div>
                </>
              )}
              
              {dayActs.length > 1 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayActs.slice(1).map((_, idx) => <div key={idx} className="w-1 h-1 rounded-full bg-slate-300"></div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityCalendar;