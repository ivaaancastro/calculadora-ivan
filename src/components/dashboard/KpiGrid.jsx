import React from 'react';
import { Activity, Battery, Zap, TrendingUp, Clock, Anchor, Info } from 'lucide-react';

export const KpiGrid = ({ metrics, summary, timeRange }) => {
  const { ctl, atl, tcb: tsb, rampRate, avgTss7d, monotony, acwr } = metrics || {};

  const cards = [
    { 
        title: "Fitness (CTL)", value: Math.round(ctl || 0), icon: Activity, 
        color: "#2563eb", 
        tooltip: "Carga Crónica (42 días). Capacidad física base.", status: "Base"
    },
    { 
        title: "Fatiga (ATL)", value: Math.round(atl || 0), icon: Battery, 
        color: "#7c3aed", 
        tooltip: "Carga Aguda (7 días). Nivel de cansancio reciente.", status: atl > ctl + 20 ? "Alta" : "Control"
    },
    { 
        title: "Forma (TSB)", value: Math.round(tsb || 0), icon: Zap, 
        color: tsb < -30 ? "#ef4444" : (tsb > 25 ? "#71717a" : (tsb > 0 ? "#10b981" : "#f59e0b")),
        tooltip: "Balance (CTL - ATL). Óptimo para entrenar: -10 a -30.", status: tsb > 0 ? "Fresco" : "Carga"
    },
    { 
        title: "Ramp Rate", value: rampRate || 0, icon: TrendingUp, 
        color: rampRate > 6 ? "#ef4444" : "#0ea5e9",
        tooltip: "Incremento de CTL semanal. > 6 dispara riesgo de lesión.", status: rampRate > 6 ? "Peligro" : "Seguro"
    },
    { 
      title: "Monotonía", value: monotony || 0, icon: Clock, 
      color: monotony > 2 ? "#f97316" : "#14b8a6",
      tooltip: "Variabilidad del entreno. > 2.0 indica estancamiento.", status: monotony > 2 ? "Riesgo" : "Óptimo"
    },
    { 
      title: "ACWR", value: acwr || 0, icon: Anchor, 
      color: (acwr > 1.3 || acwr < 0.8) ? "#ef4444" : "#10b981",
      tooltip: "Ratio Carga Aguda/Crónica. Zona dulce: 0.8 - 1.3.", status: (acwr > 0.8 && acwr < 1.3) ? "Óptimo" : "Riesgo"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="group relative bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-zinc-700">
          
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <card.icon size={12} style={{ color: card.color }} /> {card.title}
            </h4>
            
            <div className="relative group/tooltip">
                <Info size={12} className="text-slate-400 dark:text-zinc-600 cursor-help hover:text-slate-500 dark:hover:text-zinc-400"/>
                <div className="absolute right-0 top-5 w-48 p-2.5 bg-slate-800 dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 text-slate-100 dark:text-zinc-100 text-[10px] font-medium leading-relaxed rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                    {card.tooltip}
                </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono font-black text-slate-800 dark:text-zinc-100 leading-none">
                {card.value}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-transparent" style={{ color: card.color, borderColor: card.color }}>
                {card.status}
            </span>
          </div>

        </div>
      ))}
    </div>
  );
};