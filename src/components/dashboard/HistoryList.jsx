import React from 'react';
import { Clock, Calendar, Heart, Flame } from 'lucide-react';

const COLORS = { 
    'Ciclismo': '#3b82f6', 
    'Carrera': '#f97316', 
    'Fuerza': '#8b5cf6', 
    'Caminata': '#10b981', 
    'Natación': '#06b6d4',
    'Entrenamiento': '#6366f1' 
};

export const HistoryList = ({ activities }) => {
  const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden transition-colors duration-300">
      
      {/* CABECERA */}
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
          <Clock size={14}/> Historial Reciente
        </h3>
        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {activities.length}
        </span>
      </div>
      
      {/* LISTA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {sortedActivities.slice(0, 50).map((act, i) => (
            <div key={i} className="group flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-default">
              
              {/* IZQUIERDA: ICONO + INFO */}
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-sm shrink-0" 
                  style={{backgroundColor: COLORS[act.type] || '#94a3b8'}}
                >
                  {act.type ? act.type.substring(0,2).toUpperCase() : '??'}
                </div>
                
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate capitalize">
                    {act.type}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar size={10} className="opacity-70"/>
                    {new Date(act.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                     <span className="opacity-50">•</span> 
                    {new Date(act.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>

              {/* DERECHA: MÉTRICAS */}
              <div className="flex items-center gap-4 text-right shrink-0">
                
                {/* DURACIÓN + DISTANCIA */}
                <div className="flex flex-col items-end w-12">
                   <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <span className="text-sm font-black">{act.duration}</span>
                      <span className="text-[9px] font-bold text-slate-400">min</span>
                   </div>
                   {act.distance > 0 && (
                       <span className="text-[9px] font-bold text-slate-400">
                           {(act.distance / 1000).toFixed(1)} km
                       </span>
                   )}
                </div>

                {/* PULSO */}
                <div className="hidden sm:flex flex-col items-end w-14">
                  {act.hr_avg > 0 ? (
                      <>
                        <div className="flex items-center gap-1 text-rose-600 dark:text-rose-500">
                            <Heart size={10} className="fill-current" />
                            <span className="text-xs font-black">{Math.round(act.hr_avg)}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">ppm</span>
                      </>
                  ) : (
                      <span className="text-slate-200 dark:text-slate-700 text-xs font-bold">-</span>
                  )}
                </div>

                {/* CALORÍAS */}
                <div className="hidden sm:flex flex-col items-end w-14">
                  {act.calories > 0 ? (
                      <>
                        <div className="flex items-center gap-1 text-orange-500">
                            <Flame size={10} className="fill-current" />
                            <span className="text-xs font-black">{Math.round(act.calories)}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">kcal</span>
                      </>
                  ) : (
                      <span className="text-slate-200 dark:text-slate-700 text-xs font-bold">-</span>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};