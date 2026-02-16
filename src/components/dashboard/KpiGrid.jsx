import React from 'react';
import { Activity, Battery, Zap, TrendingUp, Clock, Anchor, Info } from 'lucide-react';

export const KpiGrid = ({ metrics, summary, timeRange }) => {
  const { ctl, atl, tcb: tsb, rampRate, avgTss7d, monotony, acwr } = metrics || {};

  // Configuración de las tarjetas con sus explicaciones PRO
  const cards = [
    { 
        title: "Fitness (CTL)", 
        value: Math.round(ctl || 0), 
        icon: Activity, 
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        tooltip: "Carga de Entrenamiento Crónica. Es el promedio de tu carga diaria en los últimos 42 días. Representa 'cuánto aguantas'. Para subirlo, necesitas constancia.",
        status: "Base Sólida"
    },
    { 
        title: "Fatiga (ATL)", 
        value: Math.round(atl || 0), 
        icon: Battery, 
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-900/20",
        tooltip: "Carga de Entrenamiento Aguda. Es el promedio de tu carga en los últimos 7 días. Sube rápido cuando entrenas duro y baja rápido cuando descansas.",
        status: atl > ctl + 20 ? "Alta" : "Controlada"
    },
    { 
        title: "Forma (TSB)", 
        value: Math.round(tsb || 0),
        icon: Zap, 
        // Lógica de color semáforo
        color: tsb < -30 ? "text-red-600 dark:text-red-400" : (tsb > 25 ? "text-slate-500" : (tsb > 0 ? "text-emerald-500" : "text-amber-500")),
        bg: tsb < -30 ? "bg-red-50 dark:bg-red-900/20" : (tsb > 25 ? "bg-slate-100 dark:bg-slate-800" : (tsb > 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20")),
        tooltip: "Balance de Estrés (Fitness - Fatiga). Si es negativo, estás cargando/entrenando. Si es positivo, estás fresco para competir. Lo ideal para entrenar es entre -10 y -30.",
        status: tsb > 0 ? "Fresco" : "Cargando"
    },
    { 
        title: "Ramp Rate", 
        value: rampRate || 0, 
        icon: TrendingUp, 
        color: rampRate > 6 ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400",
        bg: rampRate > 6 ? "bg-red-50 dark:bg-red-900/20" : "bg-indigo-50 dark:bg-indigo-900/20",
        tooltip: "Ritmo de incremento de Fitness. Indica cuántos puntos de CTL has subido esta semana. Si subes más de 6 puntos por semana, el riesgo de lesión se dispara.",
        status: rampRate > 6 ? "¡Peligro!" : "Seguro"
    },
    { 
      title: "Monotonía", 
      value: monotony || 0, 
      icon: Clock, 
      color: monotony > 2 ? "text-orange-600 dark:text-orange-400" : "text-teal-600 dark:text-teal-400",
      bg: monotony > 2 ? "bg-orange-50 dark:bg-orange-900/20" : "bg-teal-50 dark:bg-teal-900/20",
      tooltip: "Mide si tus entrenos son siempre iguales. Menos de 1.5 es bueno (varías entre días duros y suaves). Más de 2.0 es peligroso (siempre haces lo mismo y te estancas).",
      status: monotony > 2 ? "Aburrido" : "Variado"
    },
    { 
      title: "Ratio (ACWR)", 
      value: acwr || 0, 
      icon: Anchor, 
      color: (acwr > 1.3 || acwr < 0.8) ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400",
      bg: (acwr > 1.3 || acwr < 0.8) ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20",
      tooltip: "Ratio de Carga Aguda vs Crónica. Compara tu fatiga de esta semana con tu fitness del mes. La 'Zona Dulce' para evitar lesiones está entre 0.8 y 1.3.",
      status: (acwr > 0.8 && acwr < 1.3) ? "Óptimo" : "Riesgo"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {cards.map((card, idx) => (
        <div 
            key={idx} 
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
        >
          {/* Header Tarjeta */}
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={18} />
            </div>
            
            {/* TOOLTIP INTERACTIVO */}
            <div className="relative group/tooltip">
                <Info size={14} className="text-slate-300 cursor-help hover:text-blue-500 transition-colors"/>
                {/* El texto del tooltip */}
                <div className="absolute right-0 top-6 w-48 p-3 bg-slate-800 text-white text-[10px] leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                    {card.tooltip}
                    <div className="absolute top-[-4px] right-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
            </div>
          </div>

          {/* Valor Principal */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                {card.title}
            </h4>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                    {card.value}
                </span>
                {/* Badge de Estado Pequeño */}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${card.bg} ${card.color} opacity-80`}>
                    {card.status}
                </span>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};