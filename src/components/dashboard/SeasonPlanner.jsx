import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Flag, Trophy, Trash2, AlertTriangle, CheckCircle, 
  RefreshCw, Timer, TrendingUp, MapPin, Footprints, Bike 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { usePlanner } from '../../hooks/usePlanner';

// --- COMPONENTE MEJORADO: PREDICCIÓN DE CARRERA ---
const RacePredictor = ({ nextRace, activities, currentCtl, currentTsb }) => {
  if (!nextRace || !activities || activities.length === 0) return null;

  // 1. FILTRADO INTELIGENTE
  // Solo miramos el deporte objetivo y sesiones de más de 20 min (para evitar series cortas de GPS loco o paseos)
  const isRun = nextRace.sport === 'run';
  const relevantActs = activities
    .filter(a => {
        const type = a.type.toLowerCase();
        return (isRun ? (type.includes('carrera') || type.includes('correr')) : (type.includes('ciclismo') || type.includes('bici')))
               && a.duration > 20 && a.distance > 0;
    });

  if (relevantActs.length < 3) return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4 text-center">
        <p className="text-xs text-slate-500">Necesito al menos 3 entrenos de más de 20 min para calcular.</p>
    </div>
  );

  // 2. BUSCAR EL POTENCIAL REAL (NO LA MEDIA)
  // Ordenamos por velocidad (m/min) de más rápido a más lento
  const sortedBySpeed = relevantActs.map(a => ({...a, speed: a.distance / a.duration}))
                                    .sort((a, b) => b.speed - a.speed);
  
  // Nos quedamos con el "Top 3" de tus mejores sesiones recientes (o el 20% superior si tienes muchas)
  // Esto elimina los rodajes de recuperación que bajan la media.
  const topSlice = Math.max(3, Math.floor(sortedBySpeed.length * 0.2));
  const bestSessions = sortedBySpeed.slice(0, topSlice);
  
  // Ritmo base: Promedio de tus MEJORES sesiones
  const avgBestSpeed = bestSessions.reduce((acc, curr) => acc + curr.speed, 0) / bestSessions.length;

  // 3. FÓRMULA DE RIEGEL AJUSTADA
  // Riegel dice: T2 = T1 * (D2/D1)^1.06
  // Pero ajustamos el exponente (Fatiga) según tu CTL.
  // Si tienes mucho CTL (Fitness), aguantas mejor el ritmo en largas distancias.
  // CTL bajo (<40) = 1.07 (Decaes más). CTL alto (>80) = 1.05 (Aguantas como un pro).
  const fatigueFactor = currentCtl > 80 ? 1.05 : (currentCtl > 50 ? 1.06 : 1.075);
  
  const avgDist = bestSessions.reduce((acc, curr) => acc + curr.distance, 0) / bestSessions.length;
  const targetDist = nextRace.distance || (isRun ? 21097 : 90000); // Default a Media o 90k bici

  // Aplicamos la predicción
  const baseTime = targetDist / avgBestSpeed; 
  // Corrección: Si la distancia objetivo es mucho mayor que la entrenada, penalizamos más
  const distanceRatio = targetDist > avgDist ? (targetDist / avgDist) : 1;
  
  // "Factor Adrenalina": En carrera se rinde un 3-5% más que en el mejor entreno en solitario
  const raceDayBonus = 0.96; 

  let predictedTimeMin = baseTime * Math.pow(distanceRatio, fatigueFactor - 1) * raceDayBonus;

  // Ajuste final por TSB (Frescura)
  // Si vas muy cansado (TSB negativo), rindes peor.
  const tsbFactor = currentTsb < -20 ? 1.02 : 1.0;
  predictedTimeMin = predictedTimeMin * tsbFactor;

  // Formatear
  const hours = Math.floor(predictedTimeMin / 60);
  const mins = Math.floor(predictedTimeMin % 60);
  const paceSec = Math.round((predictedTimeMin * 60) / (targetDist / 1000));
  const paceMin = Math.floor(paceSec / 60);
  const paceRem = paceSec % 60;

  return (
    <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-900/40 dark:to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80}/></div>

        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Timer size={14}/> Potencial Estimado
        </h4>

        <div className="flex justify-between items-end relative z-10">
            <div>
                <p className="text-[10px] text-slate-300 uppercase mb-1">Objetivo: {nextRace.name}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">
                        {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                    </span>
                    {/* Quitamos el "Est." para que quede más limpio */}
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-300 uppercase mb-1">Ritmo {isRun ? '/km' : 'km/h'}</p>
                <div className="flex items-baseline gap-1 justify-end">
                    {isRun ? (
                        <span className="text-2xl font-bold text-emerald-400 tracking-tighter">
                            {paceMin}:{paceRem.toString().padStart(2, '0')}
                        </span>
                    ) : (
                        <span className="text-2xl font-bold text-emerald-400 tracking-tighter">
                            {((targetDist/1000)/(predictedTimeMin/60)).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-blue-400"/>
                <span>Basado en tus {bestSessions.length} mejores sesiones</span>
            </div>
        </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
export const SeasonPlanner = ({ currentMetrics, activities }) => { // <--- AÑADIDO PROP ACTIVITIES
  const { events, fetchEvents, addEvent, deleteEvent, plannedLoad, setPlannedLoad, simulation } = usePlanner(currentMetrics);
  
  // Estado formulario
  const [newEvent, setNewEvent] = useState({ name: '', date: '', priority: 'B', sport: 'run', distance: 0 });
  const [targetTss, setTargetTss] = useState(500);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Encontrar el próximo evento importante (Prioridad A o el más cercano)
  const nextMainRace = useMemo(() => {
    const upcoming = events.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date));
    return upcoming.find(e => e.priority === 'A') || upcoming[0];
  }, [events]);

  // Manejar cambios manuales
  const handleLoadChange = (index, value) => {
    const newLoad = [...plannedLoad];
    newLoad[index] = Number(value);
    setPlannedLoad(newLoad);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    // Asegurar que la distancia se guarda bien (si el usuario eligió preset)
    await addEvent(newEvent);
    setNewEvent({ name: '', date: '', priority: 'B', sport: 'run', distance: 0 });
  };

  // Generador Automático (Igual que antes)
  const autoGeneratePlan = () => {
    const startTss = currentMetrics?.avgTss7d ? currentMetrics.avgTss7d * 7 : 300;
    const weeks = plannedLoad.length;
    const newLoad = [];
    let current = startTss;
    const linearIncrement = (targetTss - startTss) / (weeks * 0.75);

    for (let i = 0; i < weeks; i++) {
        const cycleWeek = (i + 1) % 4; 
        if (cycleWeek === 0) current = current * 0.7; 
        else {
            if (i > 0 && cycleWeek === 1) current = newLoad[i-2] + linearIncrement; 
            else current += linearIncrement;
        }
        
        // Tapering automático si hay carrera A
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
        const hasRace = events.some(ev => {
            const d = new Date(ev.date);
            return d >= weekStart && d <= weekEnd && ev.priority === 'A';
        });

        if (hasRace) newLoad.push(Math.round(current * 0.4)); 
        else newLoad.push(Math.round(current));
    }
    setPlannedLoad(newLoad);
  };

  const getWeekDate = (index) => {
      const d = new Date(); d.setDate(d.getDate() + (index * 7));
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getWeekLabel = (tss, index) => {
      if (index === 0) return { label: 'Inicio', color: 'text-slate-500' };
      const prev = plannedLoad[index - 1];
      if (tss < prev * 0.8) return { label: 'Descarga 📉', color: 'text-emerald-500 font-bold' };
      if (tss > prev * 1.05) return { label: 'Construcción 🧱', color: 'text-blue-500' };
      if (tss < 200) return { label: 'Tapering 🏁', color: 'text-red-500 font-black' };
      return { label: 'Base', color: 'text-slate-400' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* --- COLUMNA IZQUIERDA: GESTIÓN Y PREDICCIÓN --- */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* 1. CREAR EVENTO AVANZADO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 uppercase">
                <Flag size={16} className="text-red-500"/> Definir Objetivo
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                    <input type="text" placeholder="Ej: Media Maratón BCN" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-2 ring-blue-500"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                        <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Prioridad</label>
                        <select value={newEvent.priority} onChange={e => setNewEvent({...newEvent, priority: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none"
                        >
                            <option value="A">A (Principal)</option>
                            <option value="B">B (Test)</option>
                            <option value="C">C (Entreno)</option>
                        </select>
                    </div>
                </div>

                {/* SELECTOR TIPO Y DISTANCIA */}
                <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Deporte</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setNewEvent({...newEvent, sport: 'run'})} className={`flex-1 p-2 rounded-lg flex justify-center ${newEvent.sport === 'run' ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                <Footprints size={16}/>
                            </button>
                            <button type="button" onClick={() => setNewEvent({...newEvent, sport: 'bike'})} className={`flex-1 p-2 rounded-lg flex justify-center ${newEvent.sport === 'bike' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                <Bike size={16}/>
                            </button>
                        </div>
                    </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Distancia (km)</label>
                        <input type="number" placeholder="Ej: 21.1" value={newEvent.distance > 0 ? newEvent.distance / 1000 : ''} onChange={e => setNewEvent({...newEvent, distance: Number(e.target.value) * 1000})}
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none"
                        />
                    </div>
                </div>

                {/* PRESETS DISTANCIA */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                        {l: '5K', d: 5000}, {l: '10K', d: 10000}, {l: 'Media', d: 21097}, {l: 'Maratón', d: 42195}
                    ].map(p => (
                        <button key={p.l} type="button" onClick={() => setNewEvent({...newEvent, distance: p.d, sport: 'run'})} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap">
                            {p.l}
                        </button>
                    ))}
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-2 rounded-lg text-xs mt-2 hover:opacity-90 transition shadow-lg shadow-slate-200 dark:shadow-blue-900/20">
                    Añadir al Calendario
                </button>
            </form>
        </div>

        {/* 2. CALENDARIO LISTA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 uppercase">
                <Calendar size={16} className="text-blue-500"/> Próximas Carreras
            </h3>
            {events.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sin carreras a la vista.</p>
            ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {events.map(ev => {
                        const daysLeft = Math.ceil((new Date(ev.date) - new Date()) / (1000 * 60 * 60 * 24));
                        const simDay = simulation.find(s => s.date === ev.date);
                        const projectedTsb = simDay ? simDay.tsb : null;
                        
                        return (
                            <div key={ev.id} className="group relative p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${ev.priority === 'A' ? 'bg-red-500' : ev.priority === 'B' ? 'bg-orange-400' : 'bg-green-500'}`}>
                                                {ev.priority}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-700 dark:text-white">{ev.name}</h4>
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                                            <span>{new Date(ev.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                            <span>•</span>
                                            <span className={daysLeft < 14 ? 'text-orange-500 font-bold' : ''}>{daysLeft} días</span>
                                            {ev.distance > 0 && <><span>•</span><span>{(ev.distance/1000).toFixed(1)}k</span></>}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteEvent(ev.id)} className="text-slate-300 hover:text-red-500 transition">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                                
                                {projectedTsb !== null && (
                                    <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Forma el día D:</span>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded ${projectedTsb > 10 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : projectedTsb < -10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {projectedTsb > 0 ? '+' : ''}{Math.round(projectedTsb)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        {/* 3. ORÁCULO DE PREDICCIÓN (Nuevo) */}
        <RacePredictor 
            nextRace={nextMainRace} 
            activities={activities} 
            currentCtl={currentMetrics?.ctl || 0}
            currentTsb={currentMetrics?.tcb || 0}
        />

      </div>

      {/* --- COLUMNA DERECHA: SIMULADOR Y TABLA (Igual que antes, mejorado) --- */}
      <div className="lg:col-span-8 space-y-6">
          
        {/* GRÁFICA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm h-[320px] transition-colors relative">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 uppercase">
                <Trophy size={16} className="text-purple-500"/> Simulación de Forma
            </h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10"/>
                        <XAxis dataKey="date" tick={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} labelStyle={{color: '#64748b'}}/>
                        {events.map(ev => (
                            <ReferenceLine key={ev.id} x={ev.date} stroke="#ef4444" strokeDasharray="3 3" label={{position: 'top', value: '🏁', fontSize: 20}} />
                        ))}
                        <Area type="monotone" dataKey="tsb" stroke="#10b981" strokeWidth={2} fill="url(#splitColor)" name="Forma (TSB)" animationDuration={300} />
                        <Area type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2} fill="none" name="Fitness (CTL)" animationDuration={300} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="absolute top-5 right-5 flex gap-3 text-[10px] font-bold">
                <span className="text-blue-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Fitness</span>
                <span className="text-emerald-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Forma</span>
            </div>
        </div>

        {/* EDITOR DE CARGA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-1">Planificador Semanal</h3>
                    <p className="text-[10px] text-slate-400">Define el TSS objetivo para cada semana.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                    <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Meta TSS (Sem 12)</label>
                        <input type="number" value={targetTss} onChange={e => setTargetTss(Number(e.target.value))} className="bg-transparent text-sm font-bold text-slate-800 dark:text-white w-20 outline-none border-b border-slate-300 dark:border-slate-600 focus:border-blue-500" />
                    </div>
                    <button onClick={autoGeneratePlan} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition shadow-lg shadow-blue-900/20">
                        <RefreshCw size={14} /> Auto-Planificar
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {plannedLoad.map((load, i) => {
                    const info = getWeekLabel(load, i);
                    return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                            <div className="flex flex-col flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Semana {getWeekDate(i)}</span>
                                <span className={`text-[10px] ${info.color}`}>{info.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <input type="number" value={load} onChange={(e) => handleLoadChange(i, e.target.value)} className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs font-bold text-slate-800 dark:text-white text-center outline-none focus:ring-2 ring-blue-500" />
                                <span className="text-[9px] font-bold text-slate-400">TSS</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};