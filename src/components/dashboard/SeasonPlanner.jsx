import React, { useState, useMemo, useEffect } from 'react';
import { Target, Calendar as CalIcon, TrendingUp, AlertTriangle, CheckCircle2, Zap, ArrowRight, Save, ShieldAlert, Flag } from 'lucide-react';

// Helper para encontrar el lunes de una semana (Para sincronizar perfecto con el calendario)
const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

export const SeasonPlanner = ({ currentMetrics }) => {
  // Estados iniciales: Evento a 12 semanas vista por defecto, CTL objetivo +20 del actual
  const [eventName, setEventName] = useState('Mi Gran Objetivo');
  const [eventDate, setEventDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 12 * 7); // +12 semanas
      return d.toISOString().split('T')[0];
  });
  
  const currentCtl = currentMetrics?.ctl ? Math.round(currentMetrics.ctl) : 40;
  const [targetCtl, setTargetCtl] = useState(currentCtl + 20);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- EL MOTOR MATEMÁTICO (Planificador Inverso) ---
  const plan = useMemo(() => {
      if (!eventDate || !targetCtl) return null;
      
      const today = new Date();
      const end = new Date(eventDate);
      const days = Math.round((end - today) / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);

      if (weeks < 3) return { error: 'El evento está demasiado cerca. Necesitas al menos 3 semanas para planificar un Tapering.' };
      if (weeks > 52) return { error: 'El evento está a más de un año. Planifica macrociclos más cortos.' };

      const ctlDelta = targetCtl - currentCtl;
      
      // Reservamos 2 semanas para Taper (Descanso)
      const buildWeeks = weeks - 2; 
      
      // Ramp Rate Requerido (Puntos de CTL que hay que subir por semana útil)
      const requiredRamp = ctlDelta / buildWeeks;

      // Diagnóstico de Riesgo
      let risk = { level: 'low', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', msg: 'Rampa conservadora. Muy segura.' };
      if (requiredRamp > 2 && requiredRamp <= 5) risk = { level: 'optimal', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', msg: 'Zona Óptima. Ganancia sólida sin sobreentrenamiento.' };
      else if (requiredRamp > 5 && requiredRamp <= 8) risk = { level: 'high', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', msg: 'Rampa Agresiva. Mucha fatiga, cuida la nutrición y el sueño.' };
      else if (requiredRamp > 8) risk = { level: 'extreme', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', msg: 'Riesgo Crítico de Lesión. Baja tu CTL objetivo o retrasa la carrera.' };

      // Generar Semanas
      const weeklyPlan = [];
      let simCtl = currentCtl;

      for (let i = 1; i <= weeks; i++) {
          const isTaper1 = i === weeks - 1;
          const isRaceWeek = i === weeks;
          const isRestWeek = !isTaper1 && !isRaceWeek && (i % 3 === 0); // Cada 3 semanas, descarga

          let weekTss = 0;
          let type = 'Carga';
          let theme = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800';

          if (isRaceWeek) {
              type = 'Semana de Carrera';
              theme = 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800';
              simCtl -= 2; // Pierdes algo de fitness por descansar
              weekTss = (simCtl * 7) * 0.4; // Solo 40% del volumen habitual
          } else if (isTaper1) {
              type = 'Tapering (Descarga)';
              theme = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800';
              simCtl -= 1;
              weekTss = (simCtl * 7) * 0.6; // 60% del volumen
          } else if (isRestWeek) {
              type = 'Recuperación Activa';
              theme = 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800';
              // Mantiene el CTL sin subirlo
              weekTss = (simCtl * 7) * 0.8;
          } else {
              type = 'Carga (Build)';
              theme = 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
              // Subimos el CTL (compensando las semanas de descanso)
              const effectiveRamp = requiredRamp * 1.3; 
              simCtl += effectiveRamp;
              // Fórmula aproximada de TSS para subir X puntos de CTL
              weekTss = (simCtl * 7) + (effectiveRamp * 15);
          }

          const wDate = new Date();
          wDate.setDate(wDate.getDate() + (i - 1) * 7);

          weeklyPlan.push({
              weekNum: i,
              date: wDate,
              type,
              theme,
              targetTss: Math.round(weekTss),
              projectedCtl: Math.round(simCtl)
          });
      }

      return { weeks, ctlDelta, requiredRamp: requiredRamp.toFixed(1), risk, weeklyPlan };
  }, [eventDate, targetCtl, currentCtl]);

  // --- SINCRONIZACIÓN CON EL CALENDARIO ---
  const handleApplyToCalendar = () => {
      if (!plan || !plan.weeklyPlan) return;

      const saved = localStorage.getItem('planner_targets');
      const currentTargets = saved ? JSON.parse(saved) : {};

      plan.weeklyPlan.forEach(week => {
          const monday = getMonday(week.date);
          const dateKey = monday.toLocaleDateString('en-CA');
          currentTargets[dateKey] = week.targetTss;
      });

      localStorage.setItem('planner_targets', JSON.stringify(currentTargets));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      
      {/* CABECERA (HERO) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Target size={24} />
                  </div>
                  Road to Race
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl leading-relaxed">
                  El planificador inverso calcula el estrés (TSS) que necesitas sumar cada semana para construir el estado de forma exacto que exige tu próxima carrera.
              </p>
          </div>

          {/* BOTÓN MAGIA */}
          {plan && !plan.error && (
              <button 
                  onClick={handleApplyToCalendar}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg w-full md:w-auto justify-center ${
                      saveSuccess 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-95' 
                      : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white shadow-slate-900/20 dark:shadow-blue-900/20 hover:scale-105'
                  }`}
              >
                  {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18}/>}
                  {saveSuccess ? 'Enviado al Calendario' : 'Aplicar al Calendario'}
              </button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                      <Flag size={14}/> Configuración del Evento
                  </h3>
                  
                  <div className="space-y-5">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre de la Carrera / Reto</label>
                          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
                               className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                      </div>

                      <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha del Evento</label>
                          <div className="relative">
                              <CalIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400"/>
                              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                          </div>
                      </div>

                      <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex justify-between">
                              <span>Fitness Actual (CTL)</span>
                              <span className="text-blue-500">{currentCtl}</span>
                          </label>
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex justify-between mt-3">
                              <span>Fitness Objetivo (CTL Día D)</span>
                              <span className="text-blue-500">{targetCtl}</span>
                          </label>
                          <input 
                              type="range" min={currentCtl} max={150} value={targetCtl} 
                              onChange={(e) => setTargetCtl(Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                          />
                          <p className="text-[10px] font-medium text-slate-400 text-center mt-2">
                              Desliza para elegir lo en forma que quieres llegar.
                          </p>
                      </div>
                  </div>
              </div>

              {/* DIAGNÓSTICO DE RIESGO */}
              {plan && !plan.error && (
                  <div className={`rounded-2xl border p-5 transition-colors ${plan.risk.bg} ${plan.risk.border}`}>
                      <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 ${plan.risk.color}`}>
                              {plan.requiredRamp > 8 ? <ShieldAlert size={20}/> : (plan.requiredRamp > 5 ? <AlertTriangle size={20}/> : <TrendingUp size={20}/>)}
                          </div>
                          <div>
                              <h4 className={`text-xs font-black uppercase tracking-wider mb-1 ${plan.risk.color}`}>
                                  Rampa: +{plan.requiredRamp} CTL/sem
                              </h4>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {plan.risk.msg}
                              </p>
                          </div>
                      </div>
                  </div>
              )}

          </div>

          {/* COLUMNA DERECHA: LA RECETA SEMANAL (8 cols) */}
          <div className="lg:col-span-8">
              {plan?.error ? (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                      <AlertTriangle size={48} className="text-red-400 mb-4"/>
                      <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">No se puede calcular</h3>
                      <p className="text-sm text-red-600/80 dark:text-red-500/80 max-w-md">{plan.error}</p>
                  </div>
              ) : plan && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <CalIcon size={16} className="text-blue-500"/> Prescripción Semanal
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                              Faltan {plan.weeks} semanas
                          </span>
                      </div>

                      <div className="p-4 md:p-6 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                          {plan.weeklyPlan.map((week, i) => (
                              <div key={i} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${week.theme}`}>
                                  
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-white/50 dark:bg-black/20 flex flex-col items-center justify-center shrink-0">
                                          <span className="text-[9px] uppercase font-bold opacity-60 leading-none">Sem</span>
                                          <span className="text-lg font-black leading-none mt-0.5">{week.weekNum}</span>
                                      </div>
                                      <div>
                                          <h4 className="text-sm font-black tracking-tight">{week.type}</h4>
                                          <span className="text-[10px] font-bold opacity-70 flex items-center gap-1 mt-0.5">
                                              Inicia: {getMonday(week.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                          </span>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-6 sm:justify-end">
                                      <div className="text-center">
                                          <span className="block text-[9px] font-bold uppercase opacity-60 mb-0.5">Target TSS</span>
                                          <span className="text-xl font-black flex items-center gap-1 justify-center">
                                              <Zap size={14} className="opacity-50"/> {week.targetTss}
                                          </span>
                                      </div>
                                      <ArrowRight size={16} className="opacity-30 hidden sm:block"/>
                                      <div className="text-center w-16">
                                          <span className="block text-[9px] font-bold uppercase opacity-60 mb-0.5">CTL Fin</span>
                                          <span className="text-xl font-black">{week.projectedCtl}</span>
                                      </div>
                                  </div>

                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};