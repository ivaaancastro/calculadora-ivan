import React, { useState } from 'react';
import { 
  Activity, TrendingUp, TrendingDown, Target, ChevronDown, ChevronUp, 
  Info, ShieldAlert, Flame, Medal, Trophy, Star
} from 'lucide-react';

export const FitnessStatus = ({ metrics }) => {
  const safeMetric = (val) => (typeof val !== 'number' || isNaN(val)) ? 0 : val;
  
  const ctl = safeMetric(metrics?.ctl);
  const atl = safeMetric(metrics?.atl);
  const rampRate = safeMetric(metrics?.rampRate);
  const avgTss7d = safeMetric(metrics?.avgTss7d);
  const weeklyLoad = avgTss7d * 7;

  const [showLevels, setShowLevels] = useState(false);

  // --- DEFINICIÓN DE NIVELES ---
  const LEVELS = [
    { name: "Iniciación", min: 0, max: 30, color: "text-slate-500", bg: "bg-slate-100", icon: Star, desc: "Construyendo hábito. 2-3 días/sem." },
    { name: "Recreativo", min: 31, max: 60, color: "text-blue-500", bg: "bg-blue-50", icon: Medal, desc: "Entreno regular. Fin de semana activo." },
    { name: "Deportista", min: 61, max: 90, color: "text-emerald-600", bg: "bg-emerald-50", icon: Trophy, desc: "Entreno estructurado. Competición amateur." },
    { name: "Competitivo", min: 91, max: 120, color: "text-orange-500", bg: "bg-orange-50", icon: Flame, desc: "Alto rendimiento. Gestión fina de fatiga." },
    { name: "Elite / Pro", min: 121, max: 200, color: "text-purple-600", bg: "bg-purple-50", icon: Activity, desc: "Dedicación total. Límite fisiológico." }
  ];

  const currentLevelIndex = LEVELS.findIndex(l => ctl >= l.min && ctl <= l.max);
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];
  const nextLevel = LEVELS[currentLevelIndex + 1] || { name: "Tope de Gama", min: 200 };
  
  // Progreso dentro del nivel
  const range = currentLevel.max - currentLevel.min;
  const progress = Math.min(100, Math.max(0, ((ctl - currentLevel.min) / range) * 100));

  // --- FASE TÁCTICA ---
  let phase = { title: "Mantenimiento", color: "text-slate-600", bg: "bg-slate-50", icon: Activity };
  if (rampRate > 2) phase = { title: "Construcción (Carga)", color: "text-blue-600", bg: "bg-blue-50", icon: TrendingUp };
  if (rampRate < -2) phase = { title: "Recuperación / Pérdida", color: "text-orange-600", bg: "bg-orange-50", icon: TrendingDown };
  if (rampRate < -10) phase = { title: "Desentrenamiento", color: "text-slate-400", bg: "bg-slate-100", icon: TrendingDown };

  return (
    <div className="space-y-4 mb-6">
      
      {/* TARJETA PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
        
        {/* HEADER */}
        <div className={`px-5 py-3 border-b border-slate-100 flex items-center justify-between ${phase.bg}`}>
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-lg bg-white/60 ${phase.color}`}>
                <phase.icon size={16} />
             </div>
             <div>
                 <p className="text-[10px] font-bold uppercase opacity-60 leading-none mb-0.5">Estado Actual</p>
                 <span className={`text-sm font-bold uppercase tracking-wide ${phase.color}`}>{phase.title}</span>
             </div>
          </div>
          <button 
            onClick={() => setShowLevels(!showLevels)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            {showLevels ? 'Ocultar Niveles' : 'Ver Niveles'} {showLevels ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>

        {/* DESPLEGABLE DE NIVELES (NUEVO) */}
        {showLevels && (
            <div className="bg-slate-50/50 border-b border-slate-100 p-4 animate-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Escalera de Rendimiento (Basado en CTL)</h4>
                <div className="space-y-2">
                    {LEVELS.map((lvl, idx) => {
                        const isCurrent = idx === currentLevelIndex;
                        const isPassed = idx < currentLevelIndex;
                        return (
                            <div key={lvl.name} className={`flex items-center justify-between p-3 rounded-xl border ${isCurrent ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-transparent border-transparent opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${lvl.bg} ${lvl.color}`}>
                                        <lvl.icon size={16} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isCurrent ? 'text-slate-800' : 'text-slate-500'}`}>{lvl.name}</p>
                                        <p className="text-[10px] text-slate-400">{lvl.desc}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono font-bold text-slate-600">{lvl.min}-{lvl.max} pts</span>
                                    {isCurrent && <span className="block text-[9px] font-bold text-blue-600 uppercase mt-0.5">Tu Nivel</span>}
                                    {isPassed && <span className="block text-[9px] font-bold text-emerald-500 uppercase mt-0.5">Superado</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* GRID DE DATOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* 1. NIVEL ATLÉTICO + BARRA */}
          <div className="p-5 flex flex-col justify-center relative">
             <div className="flex justify-between items-end mb-1">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nivel Actual</span>
                    <div className="flex items-center gap-2">
                        <currentLevel.icon size={18} className={currentLevel.color} />
                        <span className={`text-xl font-black uppercase ${currentLevel.color}`}>{currentLevel.name}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-slate-800">{Math.round(ctl)}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1">CTL</span>
                </div>
             </div>
             
             {/* Barra de Progreso Mejorada */}
             <div className="relative pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>{currentLevel.min}</span>
                    <span className="text-blue-600">{Math.round(progress)}% completado</span>
                    <span>{currentLevel.max}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${currentLevel.bg.replace('bg-', 'bg-')}`} 
                        style={{ width: `${progress}%`, backgroundColor: 'currentColor', color: 'var(--tw-text-opacity)' }} 
                    >
                         <div className={`h-full w-full opacity-50 ${currentLevel.color.replace('text-', 'bg-')}`}></div>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                    Te faltan <b>{Math.round(currentLevel.max - ctl)} puntos</b> para subir a {nextLevel.name}.
                </p>
             </div>
          </div>

          {/* 2. FATIGA & RIESGO */}
          <div className="p-5 flex flex-col items-center justify-center text-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fatiga Acumulada (ATL)</span>
             <div className="relative">
                 <span className={`text-3xl font-black ${atl > ctl + 20 ? 'text-red-500' : 'text-slate-700'}`}>{Math.round(atl)}</span>
                 {atl > ctl + 20 && (
                     <div className="absolute -top-3 -right-6 animate-pulse text-red-500">
                         <ShieldAlert size={18} />
                     </div>
                 )}
             </div>
             <p className="text-[10px] text-slate-400 mt-1 px-4 leading-tight">
                {atl > ctl + 20 
                 ? "⚠️ Estás acumulando fatiga muy rápido. Riesgo de lesión." 
                 : "✅ Fatiga controlada. Puedes seguir empujando."}
             </p>
          </div>

          {/* 3. CARGA SEMANAL */}
          <div className="p-5 flex flex-col items-center justify-center text-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Volumen Semanal (Est.)</span>
             <div className="flex items-center gap-1">
                 <Flame size={20} className={weeklyLoad > ctl*7 ? "text-orange-500" : "text-slate-300"}/>
                 <span className="text-3xl font-black text-slate-800">{Math.round(weeklyLoad)}</span>
                 <span className="text-xs font-bold text-slate-400">TSS</span>
             </div>
             <div className="mt-2 text-[10px] font-medium bg-slate-50 px-3 py-1 rounded-full text-slate-500 border border-slate-100">
                Objetivo Mejora: <span className="text-emerald-600 font-bold">~{Math.round((ctl+5)*7)}</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};