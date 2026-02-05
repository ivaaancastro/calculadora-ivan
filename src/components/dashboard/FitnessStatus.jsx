import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  ChevronRight,
  Info,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';

export const FitnessStatus = ({ metrics }) => {
  const safeMetric = (val) => (typeof val !== 'number' || isNaN(val)) ? 0 : val;
  
  const ctl = safeMetric(metrics?.ctl);
  const atl = safeMetric(metrics?.atl);
  const rampRate = safeMetric(metrics?.rampRate);
  const avgTss7d = safeMetric(metrics?.avgTss7d); // TSS Medio diario de los últimos 7 días
  const weeklyLoad = avgTss7d * 7; // Carga total estimada semanal

  const [showDetails, setShowDetails] = useState(false);

  // --- 1. DEFINICIÓN DE NIVELES Y OBJETIVOS ---
  const LEVELS = [
    { name: "Iniciación", min: 0, max: 30, color: "bg-slate-200", text: "text-slate-600", target: "Busca constancia (3-4 días/sem)" },
    { name: "Recreativo", min: 31, max: 60, color: "bg-blue-200", text: "text-blue-600", target: "Objetivo: Mantener > 40 pts" },
    { name: "Deportista", min: 61, max: 90, color: "bg-emerald-200", text: "text-emerald-600", target: "Objetivo: Llegar a 80 pts" },
    { name: "Competitivo", min: 91, max: 120, color: "bg-orange-200", text: "text-orange-600", target: "Mantenimiento alto rendimiento" },
    { name: "Elite / Pro", min: 121, max: 200, color: "bg-purple-200", text: "text-purple-600", target: "Gestión de fatiga crítica" }
  ];

  const currentLevelIndex = LEVELS.findIndex(l => ctl >= l.min && ctl <= l.max);
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];
  const nextLevel = LEVELS[currentLevelIndex + 1] || { name: "Tope", min: 200 };
  
  // Progreso de barra
  const range = currentLevel.max - currentLevel.min;
  const progress = Math.min(100, Math.max(0, ((ctl - currentLevel.min) / range) * 100));

  // --- 2. CÁLCULO DE OBJETIVOS DE CARGA (TSS) ---
  // Regla general: Para mejorar, la carga semanal debe subir un 10% progresivamente o mantenerse.
  // Mantenimiento = CTL * 7. Mejora = (CTL + 5) * 7.
  const maintenanceLoad = Math.round(ctl * 7);
  const improvementLoad = Math.round((ctl + 5) * 7);
  
  // --- 3. LÍMITE DE FATIGA (ATL) ---
  // Peligro si ATL > CTL + 20/30 (dependiendo del nivel)
  const atlLimit = Math.round(ctl + 25);
  const isAtlHigh = atl > atlLimit;

  // --- 4. FASE TÁCTICA ---
  let phase = { title: "Mantenimiento", color: "text-slate-600", bg: "bg-slate-50", icon: Activity };
  if (rampRate > 2) phase = { title: "Fase de Carga", color: "text-blue-600", bg: "bg-blue-50", icon: TrendingUp };
  if (rampRate < -2) phase = { title: "Recuperación", color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingDown };

  return (
    <div className="space-y-4 mb-6">
      
      {/* HEADER TÁCTICO */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${phase.bg}`}>
          <div className="flex items-center gap-2">
             <phase.icon size={18} className={phase.color} />
             <span className={`text-xs font-bold uppercase tracking-wide ${phase.color}`}>Estado: {phase.title}</span>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold text-slate-400 hover:text-blue-600 transition flex items-center gap-1"
          >
            <Info size={14}/> {showDetails ? 'Ocultar Guía' : 'Ver Referencias'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* 1. FITNESS (CTL) + VISUAL */}
          <div className="p-4 flex flex-col justify-center relative col-span-1 md:col-span-2">
             <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nivel Atlético</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-lg font-black uppercase ${currentLevel.text}`}>{currentLevel.name}</span>
                        <span className="text-2xl font-black text-slate-800">{Math.round(ctl)}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Siguiente Nivel</span>
                    <div className="flex items-center justify-end gap-1 text-slate-600 text-xs font-bold">
                        {nextLevel.name} <ChevronRight size={12}/>
                    </div>
                </div>
             </div>
             
             {/* Barra de Progreso */}
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative mb-1">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${currentLevel.color.replace('bg-', 'bg-')}`} 
                    style={{ width: `${progress}%`, backgroundColor: 'currentColor', color: 'var(--tw-text-opacity)' }} // Fallback simple
                >
                    <div className={`h-full w-full ${currentLevel.text.replace('text-', 'bg-')}`}></div>
                </div>
             </div>
             
             {/* REFERENCIA CTL */}
             <div className="flex items-center gap-1.5 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <Target size={12} className="text-blue-500"/>
                <p className="text-[10px] text-slate-500 font-medium">
                   {currentLevel.target}. <span className="opacity-70">(Rango: {currentLevel.min}-{currentLevel.max})</span>
                </p>
             </div>
          </div>

          {/* 2. FATIGA (ATL) + LÍMITE */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fatiga Actual (ATL)</span>
            <span className={`text-2xl font-black ${isAtlHigh ? 'text-red-500' : 'text-orange-500'}`}>
                {Math.round(atl)}
            </span>
            
            {/* REFERENCIA ATL */}
            <div className={`mt-2 px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${isAtlHigh ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                {isAtlHigh ? <ShieldAlert size={12}/> : <ShieldAlert size={12} className="opacity-50"/>}
                <span>Límite Seguro: {atlLimit}</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Si superas el límite, aumenta riesgo de lesión.</p>
          </div>

          {/* 3. CARGA SEMANAL (TSS) + OBJETIVO */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Carga 7 Días (TSS)</span>
            <div className="flex items-center gap-1">
                <Flame size={18} className={weeklyLoad >= maintenanceLoad ? "text-orange-500" : "text-slate-300"} />
                <span className="text-2xl font-black text-slate-800">{Math.round(weeklyLoad)}</span>
            </div>

            {/* REFERENCIA TSS */}
            <div className="w-full mt-2">
                <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    <span>Mantenimiento</span>
                    <span>Mejora</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                    <span>~{maintenanceLoad}</span>
                    <span className="text-emerald-600">~{improvementLoad}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, (weeklyLoad / improvementLoad) * 100)}%` }}
                    ></div>
                </div>
            </div>
          </div>

        </div>
      </div>

      {/* GUÍA EXPANDIDA */}
      {showDetails && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 animate-in slide-in-from-top-2 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div>
                <strong className="block text-blue-600 mb-1">Sobre CTL (Fitness):</strong>
                Tu objetivo debe ser subir de nivel poco a poco. Un aumento sano es de 2 a 5 puntos por semana. No intentes saltar de Recreativo a Competitivo en un mes.
            </div>
            <div>
                <strong className="block text-orange-500 mb-1">Sobre ATL (Fatiga):</strong>
                Representa el cansancio agudo. Es normal que suba en semanas duras, pero no dejes que supere tu "Límite Seguro" (CTL + 25) durante muchos días seguidos.
            </div>
            <div>
                <strong className="block text-emerald-600 mb-1">Sobre Carga (TSS):</strong>
                Para mejorar, necesitas acumular unos <b>{improvementLoad} TSS</b> esta semana. Si haces menos de {maintenanceLoad}, probablemente perderás forma.
            </div>
        </div>
      )}
    </div>
  );
};