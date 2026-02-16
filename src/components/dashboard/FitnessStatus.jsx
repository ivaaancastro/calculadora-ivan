import React from 'react';
import { 
  Zap, Battery, Activity, AlertTriangle, TrendingUp, 
  Anchor, Play, Timer, Heart, ShieldCheck, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export const FitnessStatus = ({ metrics }) => {
  if (!metrics) return <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse"></div>;

  const { ctl, atl, tcb: tsb, rampRate } = metrics;

  // 1. LÓGICA DE ESTADO (MOTORES)
  let mode = {
    title: "Mantenimiento",
    gradient: "from-blue-600 to-cyan-500",
    shadow: "shadow-blue-500/20",
    icon: Activity,
    bgIcon: "bg-blue-100 text-blue-600",
    trend: "Estable",
    recommendation: {
      type: "Técnica / Aeróbico",
      duration: "45 - 60 min",
      intensity: "Z1 - Z2",
      desc: "Mantén el motor en marcha sin quemarlo."
    }
  };

  if (tsb < -30) {
    mode = {
      title: "Sobrecarga",
      gradient: "from-red-600 to-orange-600",
      shadow: "shadow-red-600/30",
      icon: AlertTriangle,
      bgIcon: "bg-red-100 text-red-600",
      trend: "Fatiga Extrema",
      recommendation: {
        type: "Descanso Total",
        duration: "0 min",
        intensity: "Off",
        desc: "Riesgo alto. Apaga el motor hoy."
      }
    };
  } else if (tsb < -10) {
    mode = {
      title: "Productivo",
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/30",
      icon: TrendingUp,
      bgIcon: "bg-orange-100 text-orange-600",
      trend: "Construyendo",
      recommendation: {
        type: "Resistencia / Tempo",
        duration: "60 - 90 min",
        intensity: "Z2 - Z3",
        desc: "Estás asimilando bien. Sigue sumando."
      }
    };
  } else if (tsb > 25) {
    mode = {
      title: "Desentreno",
      gradient: "from-slate-500 to-slate-400",
      shadow: "shadow-slate-500/20",
      icon: Anchor,
      bgIcon: "bg-slate-100 text-slate-600",
      trend: "Perdiendo Forma",
      recommendation: {
        type: "Activación / Series",
        duration: "45 min",
        intensity: "Z4 - Z5",
        desc: "El motor se enfría. Dale un apretón."
      }
    };
  } else if (tsb > 5) {
    mode = {
      title: "Pico de Forma",
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/30",
      icon: Zap,
      bgIcon: "bg-emerald-100 text-emerald-600",
      trend: "Race Ready",
      recommendation: {
        type: "Race Day / Test",
        duration: "Variable",
        intensity: "All Out",
        desc: "Baterías llenas. Ve a por el PR."
      }
    };
  }

  // Riesgo de Lesión
  const isRisk = rampRate > 6;
  if (isRisk) {
      mode.recommendation.desc = "⚠️ Carga aguda excesiva. Reduce volumen hoy.";
      mode.recommendation.type = "Recuperación Activa";
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative transition-all">
      
      {/* FONDO DECORATIVO */}
      <div className={`absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l ${mode.gradient} opacity-10 blur-3xl -skew-x-12 translate-x-20`}></div>

      <div className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-stretch">
        
        {/* COLUMNA 1: ESTADO VISUAL + INSIGNIAS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-5 lg:pr-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0">
            
            {/* Título y Estado */}
            <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${mode.bgIcon} shadow-sm`}>
                    <mode.icon size={28} />
                </div>
                <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado Actual</span>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">
                        {mode.title}
                    </h1>
                </div>
            </div>

            {/* AQUI ESTÁ EL CAMBIO: INSIGNIAS TÁCTICAS (Adiós Barrita) */}
            <div className="flex gap-3">
                {/* Insignia 1: Tendencia */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 flex items-center gap-3 border border-slate-100 dark:border-slate-700/50">
                    <div className={`p-1.5 rounded-lg ${atl > ctl ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {atl > ctl ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                    </div>
                    <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Tendencia</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">{mode.trend}</span>
                    </div>
                </div>

                {/* Insignia 2: Riesgo Lesión (Ramp Rate) */}
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 flex items-center gap-3 border border-slate-100 dark:border-slate-700/50">
                    <div className={`p-1.5 rounded-lg ${isRisk ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                        {isRisk ? <AlertTriangle size={14}/> : <ShieldCheck size={14}/>}
                    </div>
                    <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Riesgo</span>
                        <span className={`text-xs font-bold leading-none ${isRisk ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {isRisk ? 'Alto' : 'Bajo'}
                        </span>
                    </div>
                </div>
            </div>

        </div>

        {/* COLUMNA 2: MÉTRICAS COMPACTAS (3 cols) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between items-center lg:justify-center px-0 lg:px-8 gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0">
            <div className="text-center lg:text-left w-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fitness (CTL)</span>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Activity size={18} className="text-blue-500"/>
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{Math.round(ctl)}</span>
                </div>
            </div>
            <div className="text-center lg:text-left w-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fatiga (ATL)</span>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Battery size={18} className="text-purple-500"/>
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{Math.round(atl)}</span>
                </div>
            </div>
        </div>

        {/* COLUMNA 3: EL ENTRENADOR (4 cols) */}
        <div className="lg:col-span-4 pl-0 lg:pl-6 flex flex-col justify-center">
            
            <div className={`relative rounded-2xl p-5 text-white shadow-lg overflow-hidden bg-gradient-to-br ${mode.gradient} ${mode.shadow} group cursor-default transition-transform hover:scale-[1.02]`}>
                
                {/* Header Tarjeta */}
                <div className="relative z-10 flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <Play size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Hoy</span>
                    </div>
                    <Heart size={16} className="opacity-80 animate-pulse"/>
                </div>

                {/* Contenido Principal */}
                <div className="relative z-10 space-y-1">
                    <h3 className="text-xl font-black tracking-tight leading-none">
                        {mode.recommendation.type}
                    </h3>
                    <p className="text-xs font-medium opacity-90 leading-relaxed border-t border-white/20 pt-2 mt-2">
                        "{mode.recommendation.desc}"
                    </p>
                </div>

                {/* Footer Tarjeta */}
                <div className="relative z-10 mt-4 flex items-center gap-4 text-xs font-bold opacity-80">
                    <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-md">
                        <Timer size={12}/> {mode.recommendation.duration}
                    </div>
                    <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-md">
                        <Zap size={12}/> {mode.recommendation.intensity}
                    </div>
                </div>

                {/* Decoración Fondo */}
                <div className="absolute -bottom-6 -right-6 text-white opacity-10 rotate-12">
                    <mode.icon size={120} />
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};