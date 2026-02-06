import React from 'react';
import { Activity, Battery, TrendingUp, Zap, Clock, Anchor } from 'lucide-react';

export const KpiGrid = ({ metrics, summary, timeRange }) => {
  // CORRECCIÓN AQUÍ:
  // El hook nos devuelve 'tcb', pero aquí lo usábamos como 'tsb'.
  // Usamos destructuración con renombrado (tcb: tsb) para arreglarlo.
  const { ctl, atl, tcb: tsb, rampRate, avgTss7d, monotony, acwr } = metrics || {};

  const cards = [
    { 
        title: "Fitness (CTL)", 
        value: Math.round(ctl || 0), 
        icon: Activity, 
        desc: "Tu motor físico actual",
        ideal: "Cuanto más, mejor", 
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    { 
        title: "Fatiga (ATL)", 
        value: Math.round(atl || 0), 
        icon: Battery, 
        desc: "Cansancio acumulado (7d)",
        ideal: "< Fitness + 20", 
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    { 
        title: "Forma (TSB)", 
        value: Math.round(tsb || 0), // Ahora sí leerá el valor correcto
        icon: Zap, 
        desc: "Frescura para competir",
        ideal: tsb > 0 ? "Zona: Descanso/Carrera" : "Zona: Entrenamiento",
        // Lógica de color semáforo
        color: tsb < -30 ? "text-red-600 dark:text-red-400" : (tsb > 25 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"),
        bg: tsb < -30 ? "bg-red-50 dark:bg-red-900/20" : (tsb > 25 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20")
    },
    { 
        title: "Ramp Rate", 
        value: rampRate || 0, 
        icon: TrendingUp, 
        desc: "Ritmo de subida de carga",
        ideal: "< 6 pts/semana", 
        color: rampRate > 6 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400",
        bg: rampRate > 6 ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-50 dark:bg-slate-800"
    },
    { 
      title: "Monotonía", 
      value: monotony || 0, 
      icon: Clock, 
      desc: "Variedad en los entrenos",
      ideal: "< 2.0 (Varía la intensidad)", 
      color: monotony > 2 ? "text-orange-600 dark:text-orange-400" : "text-indigo-600 dark:text-indigo-400",
      bg: monotony > 2 ? "bg-orange-50 dark:bg-orange-900/20" : "bg-indigo-50 dark:bg-indigo-900/20"
    },
    { 
      title: "Riesgo (ACWR)", 
      value: acwr || 0, 
      icon: Anchor, 
      desc: "Ratio Agudo vs Crónico",
      ideal: "0.8 - 1.3 (Zona Segura)", 
      color: (acwr > 1.3 || acwr < 0.7) && acwr !== 0 ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400",
      bg: (acwr > 1.3 || acwr < 0.7) && acwr !== 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-teal-50 dark:bg-teal-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => (
        <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon size={18} />
            </div>
            {idx === 0 && (
                <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">
                    {timeRange}
                </span>
            )}
          </div>

          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                {card.title}
            </h4>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                {card.value}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mb-1">
                {card.desc}
             </p>
             <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase">Meta:</span>
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                    {card.ideal}
                </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};