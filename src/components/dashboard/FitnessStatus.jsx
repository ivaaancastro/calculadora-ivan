import React, { useMemo } from 'react';
import { Target, AlertTriangle, CheckCircle2, Activity, Info, Zap } from 'lucide-react';

export const FitnessStatus = ({ activities, metrics }) => {
  // 1. ANÁLISIS 80/20 (Últimos 28 días)
  const analysis = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const today = new Date();
    const cutoff = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 Semanas

    let low = 0;   // Z1/Z2 (Base aeróbica)
    let mod = 0;   // Z3 (Tempo / Threshold / Zona Gris)
    let high = 0;  // Z4/Z5 (VO2Max / Anaeróbico)
    let totalMins = 0;

    activities.forEach(act => {
      const d = new Date(act.date);
      if (d >= cutoff && act.duration > 0) {
        const hours = act.duration / 60;
        let IF = 0;
        
        // Calculamos el Intensity Factor real de la sesión: IF = Raíz(TSS / (Horas * 100))
        if (act.tss && hours > 0) {
           IF = Math.sqrt(act.tss / (hours * 100));
        } else {
           IF = 0.70; // Fallback por defecto si no hay datos
        }
        
        // Clasificamos los minutos en las 3 zonas fisiológicas
        if (IF < 0.80) low += act.duration;
        else if (IF < 0.95) mod += act.duration;
        else high += act.duration;
        
        totalMins += act.duration;
      }
    });

    if (totalMins === 0) return null;

    // Porcentajes
    const pLow = Math.round((low / totalMins) * 100);
    const pMod = Math.round((mod / totalMins) * 100);
    const pHigh = Math.round((high / totalMins) * 100);

    return { pLow, pMod, pHigh, totalHours: (totalMins / 60).toFixed(1) };
  }, [activities]);

  if (!analysis) return <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse"></div>;

  const { pLow, pMod, pHigh, totalHours } = analysis;

  // 2. EL ENTRENADOR (Lógica de diagnóstico)
  let coach = {
      title: "Distribución Óptima",
      status: "Polarizado",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle2,
      msg: "Estás entrenando como un pro. Gran base aeróbica y dejas la fatiga para los días clave. Mantén este equilibrio."
  };

  if (pMod > 30) {
      coach = {
          title: "Peligro: Zona Gris",
          status: "Estancamiento",
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
          icon: AlertTriangle,
          msg: "Haces demasiados kilómetros a intensidad media (Tempo). Te cansas mucho pero mejoras poco. Los días suaves, rueda MÁS SUAVE."
      };
  } else if (pHigh > 25) {
      coach = {
          title: "Sobrecarga Alta Intensidad",
          status: "Riesgo Lesión",
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: Zap,
          msg: "Estás abusando del trabajo anaeróbico. Si superas el 20% de alta intensidad de forma crónica, tu sistema nervioso colapsará."
      };
  } else if (pLow > 90) {
      coach = {
          title: "Construcción de Base",
          status: "Aeróbico",
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: Activity,
          msg: "Volumen aeróbico puro. Ideal para invierno/pretemporada, pero si vas a competir pronto, toca meter más 'chispazos' (Z4/Z5)."
      };
  }

  return (
    <div className={`w-full bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden relative transition-all ${coach.border}`}>
      
      {/* Etiqueta superior */}
      <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider text-slate-500 border-l border-b border-slate-100 dark:border-slate-800">
          Análisis Últimos 28 Días
      </div>

      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
          
          {/* IZQUIERDA: Diagnóstico del Coach */}
          <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${coach.bg} ${coach.color}`}>
                      <coach.icon size={24} />
                  </div>
                  <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Radar de Calidad</span>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                          {coach.title}
                      </h2>
                  </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative">
                  <Info size={16} className="absolute top-4 right-4 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                      {coach.msg}
                  </p>
              </div>
          </div>

          {/* DERECHA: Gráfico Visual 80/20 */}
          <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center">
              
              <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Regla 80/20</span>
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                      Volumen: {totalHours}h
                  </span>
              </div>

              {/* Barra Apilada Central */}
              <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  {/* Zona 1: Base (Verde) */}
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white/90" 
                    style={{ width: `${pLow}%` }}
                    title={`Base Aeróbica: ${pLow}%`}
                  >
                      {pLow > 10 ? `${pLow}%` : ''}
                  </div>
                  {/* Zona 2: Gris/Tempo (Naranja) */}
                  <div 
                    className="h-full bg-amber-400 transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white/90" 
                    style={{ width: `${pMod}%` }}
                    title={`Zona Gris (Tempo): ${pMod}%`}
                  >
                      {pMod > 10 ? `${pMod}%` : ''}
                  </div>
                  {/* Zona 3: Alta Int (Rojo) */}
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white/90" 
                    style={{ width: `${pHigh}%` }}
                    title={`Alta Intensidad: ${pHigh}%`}
                  >
                      {pHigh > 10 ? `${pHigh}%` : ''}
                  </div>
              </div>

              {/* Leyenda Inferior */}
              <div className="flex justify-between text-[10px] font-bold uppercase mt-3 px-1">
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-slate-500">Z1-Z2 (Base)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <span className="text-slate-500">Z3 (Gris)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <span className="text-slate-500">Z4-Z5 (HIIT)</span>
                  </div>
              </div>

          </div>

      </div>
    </div>
  );
};