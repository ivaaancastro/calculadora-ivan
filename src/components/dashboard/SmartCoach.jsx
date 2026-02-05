import React from 'react';
import { 
  Lightbulb, AlertTriangle, TrendingUp, TrendingDown, 
  BedDouble, Zap, ShieldAlert, Activity, Target, Info, BookOpen 
} from 'lucide-react';

export const SmartCoach = ({ metrics }) => {
  const { ctl, tsb, rampRate, acwr, monotony, avgTss7d, forecast, pastCtl } = metrics || {};
  
  if (!forecast) return null;

  const getPrediction = () => {
    const items = [];
    const dateIn4Weeks = new Date();
    dateIn4Weeks.setDate(dateIn4Weeks.getDate() + 28);
    const monthName = dateIn4Weeks.toLocaleDateString('es-ES', { month: 'long' });
    
    // Cálculo de contexto histórico
    const monthlyChange = ctl - pastCtl;
    const changeSymbol = monthlyChange >= 0 ? '+' : '';

    // 1. Mensaje de Tendencia Principal
    if (forecast.trend === 'up') {
        items.push({
            icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            title: "Proyección Positiva",
            text: `Si mantienes tu ritmo actual (${avgTss7d} TSS/día), tu Fitness subirá a ${forecast.ctl4Weeks} para el mes de ${monthName}.`,
            context: `Vienes de tener ${pastCtl} hace un mes (${changeSymbol}${monthlyChange.toFixed(1)} pts). Estás construyendo base de forma sólida.`,
            advice: "Lo normal en esta fase es ganar de 2 a 5 puntos al mes. Vas a buen ritmo."
        });
        
        if (forecast.nextLevelDays) {
            items.push({
                icon: Target, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20',
                title: "Objetivo a la vista",
                text: `Al ritmo actual, cruzarás la barrera de los ${forecast.nextLevelVal} puntos de Fitness en solo ${forecast.nextLevelDays} días.`,
                context: "Saltar de nivel suele requerir entre 8 y 12 semanas de constancia.",
                advice: "No intentes acelerarlo entrenando el doble mañana; la clave es no fallar."
            });
        }

    } else if (forecast.trend === 'down') {
        items.push({
            icon: TrendingDown, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20',
            title: "Pérdida de Forma",
            text: `Tu carga actual (${avgTss7d}) es inferior a lo que tu cuerpo estaba acostumbrado (${Math.round(ctl)}).`,
            context: `Hace un mes estabas en ${pastCtl}. Tu cuerpo se está adaptando a la baja porque le estás dando menos estímulo.`,
            advice: "Para mantenerte, intenta subir un poco la intensidad o duración de las sesiones actuales."
        });

    } else {
        items.push({
            icon: Activity, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800',
            title: "Mantenimiento Estable",
            text: `Estás en equilibrio. Tu carga diaria (${avgTss7d}) iguala exactamente a tu Fitness actual.`,
            context: `Tu nivel se mantiene estable respecto al mes pasado (${changeSymbol}${monthlyChange.toFixed(1)}).`,
            advice: "Es la fase ideal para asimilar trabajo previo o recuperar antes de un bloque duro."
        });
    }

    return items;
  };

  const getEducation = () => {
      // Explicación de "Por qué mi nivel es este"
      return {
          title: "¿Por qué mi nivel es " + Math.round(ctl) + "?",
          text: `Tu Fitness (CTL) es un espejo de tu rutina. Actualmente entrenas como un atleta de nivel ${Math.round(ctl)} porque tu carga media diaria de los últimos 42 días ha sido esa.`,
          subtext: avgTss7d > ctl 
            ? `Como ahora estás entrenando más fuerte (${avgTss7d} TSS/día), tu nivel subirá hasta alcanzar esa cifra si eres constante.`
            : `Como ahora entrenas más suave (${avgTss7d} TSS/día), tu nivel bajará poco a poco hasta igualarse con tu rutina actual.`
      };
  };

  const getWarnings = () => {
    const items = [];
    if (acwr > 1.5) items.push({ title: "PELIGRO DE LESIÓN", text: "Tu carga aguda es >1.5 veces tu carga crónica. Frena YA.", level: 'critical' });
    else if (acwr > 1.3) items.push({ title: "Zona de Riesgo", text: "Estás subiendo la carga muy rápido. Vigila molestias.", level: 'warning' });
    
    if (monotony > 2.2 && avgTss7d > 30) items.push({ title: "Entreno Monótono", text: "Tus sesiones son muy iguales. Varía intensidad para mejorar.", level: 'info' });
    
    if (tsb < -30) items.push({ title: "Fatiga Profunda", text: "Estás cavando un hoyo (TSB < -30). Descansa.", level: 'critical' });
    else if (tsb > 25 && ctl > 40) items.push({ title: "Pico de Forma", text: "Estás muy fresco. Ideal para un test o carrera.", level: 'good' });

    return items;
  };

  const predictions = getPrediction();
  const warnings = getWarnings();
  const edu = getEducation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col h-full transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Lightbulb size={20} />
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">Smart Coach</h3>
            <p className="text-[10px] text-slate-400 font-medium">Análisis Táctico</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
        
        {/* SECCIÓN 1: PREDICCIONES CON CONTEXTO */}
        <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                🔮 Futuro & Contexto
            </h4>
            <div className="space-y-3">
                {predictions.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${item.bg} border-transparent dark:border-white/5`}>
                        <div className="flex items-start gap-3 mb-3">
                            <item.icon size={18} className={`mt-0.5 ${item.color}`} />
                            <div>
                                <h5 className={`text-xs font-bold ${item.color} mb-1`}>{item.title}</h5>
                                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{item.text}</p>
                            </div>
                        </div>
                        {/* ZONA EDUCATIVA DEL CARD */}
                        <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                             <div className="flex gap-2 items-start">
                                <BookOpen size={12} className="mt-0.5 text-slate-400 shrink-0"/>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                    <strong className="text-slate-600 dark:text-slate-300">Contexto:</strong> {item.context}
                                </p>
                             </div>
                             <div className="flex gap-2 items-start">
                                <Info size={12} className="mt-0.5 text-slate-400 shrink-0"/>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                    <strong className="text-slate-600 dark:text-slate-300">Consejo:</strong> {item.advice}
                                </p>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* SECCIÓN 2: LÓGICA DEL NIVEL (NUEVO) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
             <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                🧠 Entendiendo tu Nivel
             </h4>
             <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">{edu.title}</p>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{edu.text}</p>
             <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg leading-relaxed">
                {edu.subtext}
             </p>
        </div>

        {/* SECCIÓN 3: ALERTAS TÁCTICAS */}
        {warnings.length > 0 && (
            <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    🩺 Diagnóstico
                </h4>
                <div className="space-y-2">
                    {warnings.map((w, i) => {
                        let styles = "";
                        let Icon = AlertTriangle;
                        
                        if (w.level === 'critical') {
                            styles = "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200";
                            Icon = ShieldAlert;
                        } else if (w.level === 'warning') {
                            styles = "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 text-orange-800 dark:text-orange-200";
                        } else if (w.level === 'good') {
                            styles = "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-200";
                            Icon = Zap;
                        } else {
                            styles = "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200";
                            Icon = Activity;
                        }

                        return (
                            <div key={i} className={`p-3 rounded-r-lg text-xs ${styles} flex gap-3`}>
                                <Icon size={16} className="shrink-0 mt-0.5 opacity-80" />
                                <div>
                                    <strong className="block font-bold uppercase text-[10px] opacity-70 mb-0.5">{w.title}</strong>
                                    <span className="leading-tight block">{w.text}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>

    </div>
  );
};