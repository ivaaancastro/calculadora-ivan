import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Flag, Trophy, Trash2, TrendingUp, Clock, 
  Footprints, Bike, Dumbbell, Zap, Lock, Edit3, CheckCircle2 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePlanner } from '../../hooks/usePlanner';

// --- COMPONENTE PREDICCIÓN (Sin cambios) ---
const RacePredictor = ({ nextRace, activities, currentCtl, currentTsb }) => {
  if (!nextRace || !activities || activities.length === 0) return null;

  const isRun = nextRace.sport === 'run';
  const relevantActs = activities
    .filter(a => {
        const type = a.type.toLowerCase();
        return (isRun ? (type.includes('carrera') || type.includes('correr')) : (type.includes('ciclismo') || type.includes('bici')))
               && a.duration > 20 && a.distance > 0;
    });

  if (relevantActs.length < 3) return null;

  const sortedBySpeed = relevantActs.map(a => ({...a, speed: a.distance / a.duration})).sort((a, b) => b.speed - a.speed);
  const topSlice = Math.max(3, Math.floor(sortedBySpeed.length * 0.2));
  const bestSessions = sortedBySpeed.slice(0, topSlice);
  const avgBestSpeed = bestSessions.reduce((acc, curr) => acc + curr.speed, 0) / bestSessions.length;
  const fatigueFactor = currentCtl > 80 ? 1.05 : (currentCtl > 50 ? 1.06 : 1.075);
  const targetDist = nextRace.distance || (isRun ? 21097 : 90000);
  const baseTime = targetDist / avgBestSpeed; 
  const distanceRatio = targetDist > (bestSessions.reduce((a,c)=>a+c.distance,0)/bestSessions.length) ? (targetDist / (bestSessions.reduce((a,c)=>a+c.distance,0)/bestSessions.length)) : 1;
  const predictedTimeMin = baseTime * Math.pow(distanceRatio, fatigueFactor - 1) * 0.96 * (currentTsb < -20 ? 1.02 : 1.0);

  const hours = Math.floor(predictedTimeMin / 60);
  const mins = Math.floor(predictedTimeMin % 60);
  const paceSec = Math.round((predictedTimeMin * 60) / (targetDist / 1000));

  return (
    <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-900/40 dark:to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80}/></div>
        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14}/> Potencial Estimado
        </h4>
        <div className="flex justify-between items-end relative z-10">
            <div>
                <p className="text-[10px] text-slate-300 uppercase mb-1">Objetivo: {nextRace.name}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-300 uppercase mb-1">Ritmo {isRun ? '/km' : 'km/h'}</p>
                <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-emerald-400 tracking-tighter">
                        {isRun ? `${Math.floor(paceSec / 60)}:${(paceSec % 60).toString().padStart(2, '0')}` : ((targetDist/1000)/(predictedTimeMin/60)).toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const SeasonPlanner = ({ currentMetrics, activities }) => {
  const { events, fetchEvents, addEvent, deleteEvent, simulation } = usePlanner(currentMetrics);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', priority: 'B', sport: 'run', distance: 0 });

  const [weekData, setWeekData] = useState([]);
  const [projectedStats, setProjectedStats] = useState({ ctl: 0, tsb: 0, totalTss: 0 });

  // 1. GENERAR LA SEMANA ACTUAL (CORREGIDO: ZONA HORARIA Y MULTI-ACTIVIDAD)
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizamos "hoy" a medianoche local

    // Calcular el Lunes de esta semana (respetando zona local)
    const dayOfWeek = today.getDay(); // 0 (Domingo) - 6 (Sábado)
    // Convertimos a: 0 (Lunes) - 6 (Domingo)
    const daysSinceMonday = (dayOfWeek + 6) % 7; 
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        
        // CLAVE: Usamos toLocaleDateString('en-CA') para obtener "YYYY-MM-DD" LOCAL
        // Esto evita que las 23:00 del día anterior cuenten como hoy por culpa del UTC
        const dateKey = d.toLocaleDateString('en-CA');
        
        const isPast = d < today;
        const isToday = d.getTime() === today.getTime();

        // 1. Buscar TODAS las actividades de ese día (no solo la primera)
        const dayActivities = activities?.filter(a => {
            const actDate = new Date(a.date);
            return actDate.toLocaleDateString('en-CA') === dateKey;
        }) || [];

        // 2. Sumarizar datos reales
        let realStats = { sport: 'run', mins: 0, tss: 0 };
        if (dayActivities.length > 0) {
            // Sumamos duración y TSS de todo lo que hiciste ese día
            const totalMins = dayActivities.reduce((acc, curr) => acc + curr.duration, 0);
            const totalTss = dayActivities.reduce((acc, curr) => acc + (curr.tss || 0), 0);
            
            // Para el icono, cogemos el deporte de la actividad más larga
            const mainAct = dayActivities.sort((a,b) => b.duration - a.duration)[0];
            const type = mainAct.type.toLowerCase();
            let mainSport = 'run';
            if (type.includes('bici') || type.includes('ciclismo')) mainSport = 'bike';
            else if (type.includes('fuerza') || type.includes('pesa') || type.includes('gim')) mainSport = 'gym';

            realStats = { sport: mainSport, mins: totalMins, tss: totalTss };
        }
        
        week.push({
            date: d,
            dayName: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i],
            isPast,
            isToday,
            isReal: dayActivities.length > 0, // Es real si hay al menos 1 actividad
            sport: dayActivities.length > 0 ? realStats.sport : 'run',
            mins: dayActivities.length > 0 ? realStats.mins : 0,
            tss: dayActivities.length > 0 ? realStats.tss : 0,
            plannedMins: 60,
            plannedIntensity: 'med'
        });
    }
    setWeekData(week);
  }, [activities]);

  // 2. SIMULADOR DE FUTURO (PROYECCIÓN)
  useEffect(() => {
    if (weekData.length === 0 || !currentMetrics) return;

    let runningCtl = currentMetrics.ctl;
    let runningAtl = currentMetrics.atl;
    let accumulatedTss = 0;

    weekData.forEach(day => {
        let dayTss = 0;
        
        // Si es pasado o es hoy y ya hay dato real -> REAL
        if (day.isPast || (day.isToday && day.isReal)) {
            dayTss = day.tss;
        } else {
            // Si es futuro -> PLANIFICADO
            const factors = { 'low': 45, 'med': 60, 'high': 80, 'rest': 0 };
            dayTss = Math.round((day.plannedMins / 60) * factors[day.plannedIntensity]);
        }

        accumulatedTss += dayTss;
        
        if (!day.isPast) {
            runningCtl = runningCtl + (dayTss - runningCtl) / 42;
            runningAtl = runningAtl + (dayTss - runningAtl) / 7;
        }
    });

    setProjectedStats({
        ctl: Math.round(runningCtl),
        tsb: Math.round(runningCtl - runningAtl),
        totalTss: Math.round(accumulatedTss)
    });

  }, [weekData, currentMetrics]);


  const updatePlan = (index, field, value) => {
      const newData = [...weekData];
      newData[index][field] = value;
      setWeekData(newData);
  };

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const nextMainRace = useMemo(() => {
    const upcoming = events.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date));
    return upcoming.find(e => e.priority === 'A') || upcoming[0];
  }, [events]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;
    await addEvent(newEvent);
    setNewEvent({ name: '', date: '', priority: 'B', sport: 'run', distance: 0 });
  };

  const getIcon = (sport) => sport === 'run' ? <Footprints size={14}/> : (sport === 'bike' ? <Bike size={14}/> : <Dumbbell size={14}/>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* IZQUIERDA */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 uppercase">
                <Flag size={16} className="text-red-500"/> Definir Objetivo
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                    <input type="text" placeholder="Ej: Media Maratón" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})}
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
                    <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Distancia</label>
                            <input type="number" placeholder="km" value={newEvent.distance > 0 ? newEvent.distance / 1000 : ''} onChange={e => setNewEvent({...newEvent, distance: Number(e.target.value) * 1000})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Prio</label>
                            <select value={newEvent.priority} onChange={e => setNewEvent({...newEvent, priority: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs font-bold text-slate-700 dark:text-white outline-none">
                                <option value="A">A</option><option value="B">B</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-2 rounded-lg text-xs mt-2 hover:opacity-90 transition shadow-lg shadow-slate-200 dark:shadow-blue-900/20">Añadir</button>
            </form>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 uppercase">
                <Calendar size={16} className="text-blue-500"/> Próximas Carreras
            </h3>
            {events.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Sin carreras.</p> : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {events.map(ev => (
                        <div key={ev.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-all">
                            <div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${ev.priority === 'A' ? 'bg-red-500' : 'bg-orange-400'}`}>{ev.priority}</span>
                                <h4 className="text-xs font-bold text-slate-700 dark:text-white mt-1">{ev.name}</h4>
                            </div>
                            <button onClick={() => deleteEvent(ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <RacePredictor nextRace={nextMainRace} activities={activities} currentCtl={currentMetrics?.ctl || 0} currentTsb={currentMetrics?.tcb || 0} />
      </div>

      {/* DERECHA */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* PANEL PROYECCIÓN */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp size={150}/></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                        <Zap className="text-yellow-400" size={20}/> Proyección Semanal
                    </h2>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                        Así acabarás el domingo combinando lo entrenado + lo planificado.
                    </p>
                </div>
                
                <div className="flex gap-6">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Carga Total</span>
                        <span className="text-3xl font-black tracking-tight">{projectedStats.totalTss}</span>
                        <span className="text-xs text-slate-500 font-bold">TSS</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Fitness (CTL)</span>
                        <span className="text-3xl font-black tracking-tight text-blue-400">{projectedStats.ctl}</span>
                        <span className="text-xs text-slate-500 font-bold">Puntos</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Forma (TSB)</span>
                        <span className={`text-3xl font-black tracking-tight ${projectedStats.tsb >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {projectedStats.tsb > 0 ? '+' : ''}{projectedStats.tsb}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* TABLERO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors">
            
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Calendar size={18} className="text-blue-500"/>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase">
                    Planificador Táctico
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {weekData.map((day, i) => {
                    let displayTss = 0;
                    if (day.isPast || (day.isToday && day.isReal)) {
                        displayTss = day.tss;
                    } else {
                        const factors = { 'low': 45, 'med': 60, 'high': 80, 'rest': 0 };
                        displayTss = Math.round((day.plannedMins / 60) * factors[day.plannedIntensity]);
                    }

                    return (
                        <div 
                            key={i} 
                            className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all
                                ${day.isToday ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/10 dark:bg-blue-900/10 scale-105 z-10 shadow-lg' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}
                                ${day.isPast ? 'opacity-70 grayscale-[0.5]' : ''}
                            `}
                        >
                            <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                <span className={`text-[10px] font-black uppercase ${day.isToday ? 'text-blue-500' : 'text-slate-400'}`}>
                                    {day.dayName}
                                </span>
                                {day.isPast || (day.isToday && day.isReal) ? (
                                    <Lock size={10} className="text-slate-300"/>
                                ) : (
                                    <Edit3 size={10} className="text-emerald-500"/>
                                )}
                            </div>

                            {(day.isPast || (day.isToday && day.isReal)) ? (
                                <div className="flex flex-col gap-1 py-2">
                                    {day.isReal ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {getIcon(day.sport)}
                                                </div>
                                                <span className="text-[10px] font-bold capitalize text-slate-600 dark:text-slate-300">
                                                    {day.sport === 'run' ? 'Carrera' : day.sport}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="text-xs font-black text-slate-800 dark:text-white">{day.mins}m</span>
                                                <span className="text-[9px] text-slate-400 ml-1 block">{displayTss} TSS</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4 text-[10px] text-slate-400 italic">Descanso</div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <select 
                                        value={day.plannedIntensity} 
                                        onChange={(e) => updatePlan(i, 'plannedIntensity', e.target.value)}
                                        className={`w-full text-[10px] font-bold rounded p-1 outline-none border cursor-pointer
                                            ${day.plannedIntensity === 'rest' ? 'bg-slate-100 text-slate-400 border-transparent' : 
                                              day.plannedIntensity === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                                              day.plannedIntensity === 'med' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                              'bg-green-50 text-green-600 border-green-100'}`}
                                    >
                                        <option value="rest">💤 Descanso</option>
                                        <option value="low">🟢 Suave</option>
                                        <option value="med">🟠 Medio</option>
                                        <option value="high">🔴 Duro</option>
                                    </select>

                                    {day.plannedIntensity !== 'rest' && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-400">Duración</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{day.plannedMins}m</span>
                                            </div>
                                            <input 
                                                type="range" min="20" max="180" step="10"
                                                value={day.plannedMins}
                                                onChange={(e) => updatePlan(i, 'plannedMins', Number(e.target.value))}
                                                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                            <div className="text-right pt-1 border-t border-dashed border-slate-100 dark:border-slate-800">
                                                <span className="text-[9px] font-bold text-blue-500">Est. {displayTss} TSS</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 flex items-start gap-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5"/>
                <p>
                    <strong className="text-slate-600 dark:text-slate-300">Modo Híbrido Activo:</strong> Se han sincronizado tus datos reales con el calendario local. Tus días pasados están bloqueados con lo que realmente hiciste. Planifica el resto para ver tu proyección.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};