import React from 'react';
import { Clock, Activity, Flame, Calendar } from 'lucide-react';

const COLORS = { 'Ciclismo': '#3b82f6', 'Carrera': '#f97316', 'Fuerza': '#8b5cf6', 'Caminata': '#10b981', 'Entrenamiento': '#6366f1' };

export const HistoryList = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
          <Clock size={14}/> Últimas Sesiones
        </h3>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{activities.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {activities.slice(0, 50).map((act, i) => (
            <div key={i} className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-default">
              
              {/* Icono y Nombre */}
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[9px] shadow-sm shrink-0" 
                  style={{backgroundColor: COLORS[act.type] || '#94a3b8'}}
                >
                  {act.type.substring(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate pr-2">{act.type}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar size={10}/>
                    {new Date(act.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-3 text-right shrink-0">
                <div>
                  <p className="text-xs font-bold text-slate-700">{act.duration}'</p>
                  <p className="text-[9px] text-slate-400">min</p>
                </div>
                <div className="hidden sm:block w-12 text-right">
                  <p className="text-xs font-bold text-slate-600">{act.hr_avg > 0 ? act.hr_avg : '-'}</p>
                  <p className="text-[9px] text-slate-400">bpm</p>
                </div>
                <div className="hidden sm:block w-12 text-right">
                  <p className="text-xs font-bold text-slate-600">{act.calories > 0 ? act.calories : '-'}</p>
                  <p className="text-[9px] text-slate-400">kcal</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};