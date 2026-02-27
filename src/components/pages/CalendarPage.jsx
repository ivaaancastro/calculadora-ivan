import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalIcon,
    Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target,
    Plus, Trash2, X
} from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const getSportColor = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-900/40';
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/40';
    if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-900/40';
    if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/40';
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700/50';
};

const getSportIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return <Footprints size={12} />;
    if (t.includes('bike') || t.includes('bici')) return <Bike size={12} />;
    if (t.includes('gym') || t.includes('fuerza')) return <Dumbbell size={12} />;
    return <Activity size={12} />;
};

export const CalendarPage = ({ activities, plannedWorkouts = [], addPlannedWorkout, deletePlannedWorkout, currentMetrics, onDelete, onSelectActivity }) => {

    const [currentDate, setCurrentDate] = useState(() => {
        const savedDate = sessionStorage.getItem('forma_calendar_date');
        if (savedDate) {
            const d = new Date(savedDate);
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    });

    useEffect(() => {
        sessionStorage.setItem('forma_calendar_date', currentDate.toISOString());
    }, [currentDate]);

    const [weeklyTargets, setWeeklyTargets] = useState(() => {
        const saved = localStorage.getItem('planner_targets');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('planner_targets', JSON.stringify(weeklyTargets));
    }, [weeklyTargets]);

    const handleEditTarget = (weekKey) => {
        const current = weeklyTargets[weekKey] || 0;
        const newVal = prompt("Define el objetivo de TSS para esta semana:", current);
        if (newVal !== null) {
            const val = parseInt(newVal);
            if (!isNaN(val)) setWeeklyTargets(prev => ({ ...prev, [weekKey]: val }));
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    // Using DB instead of localStorage for planned activities

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [selectedDateForPlan, setSelectedDateForPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        type: 'Run',
        name: '',
        tss: 50,
        duration: 60,
        blocks: []
    });

    // --- INTENSITY FACTORS PER ZONE (para estimación de TSS) ---
    const ZONE_IF = { Z1: 0.55, Z2: 0.75, Z3: 0.88, Z4: 1.0, Z5: 1.15, Z6: 1.3 };

    // --- AUTO TSS ESTIMATION FROM BLOCKS ---
    const estimatedTSS = useMemo(() => {
        if (newPlan.blocks.length === 0) return null;
        let totalMinutes = 0;
        let weightedIF = 0;

        const processBlock = (block) => {
            if (block.type === 'repeat') {
                const reps = block.repeats || 1;
                block.steps.forEach(step => {
                    const mins = Number(step.duration) || 0;
                    const ifVal = ZONE_IF[step.zone] || 0.75;
                    totalMinutes += mins * reps;
                    weightedIF += mins * reps * ifVal * ifVal;
                });
            } else {
                const mins = Number(block.duration) || 0;
                const ifVal = ZONE_IF[block.zone] || 0.75;
                totalMinutes += mins;
                weightedIF += mins * ifVal * ifVal;
            }
        };

        newPlan.blocks.forEach(processBlock);
        if (totalMinutes === 0) return null;
        return Math.round((weightedIF * 100) / 60);
    }, [newPlan.blocks]);

    // Auto-update TSS and duration when blocks change
    useEffect(() => {
        if (estimatedTSS !== null) {
            let totalMins = 0;
            newPlan.blocks.forEach(b => {
                if (b.type === 'repeat') {
                    b.steps.forEach(s => { totalMins += (Number(s.duration) || 0) * (b.repeats || 1); });
                } else {
                    totalMins += Number(b.duration) || 0;
                }
            });
            setNewPlan(prev => ({ ...prev, tss: estimatedTSS, duration: totalMins }));
        }
    }, [estimatedTSS]);

    // --- SMART COACH RECOMMENDATION ---
    const getSmartRecommendation = () => {
        if (!selectedDateForPlan) return null;
        const selectedDate = new Date(selectedDateForPlan);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        // 1. Calcular carga de los últimos 7 días (actividades reales)
        let last7TSS = 0;
        let last7Count = 0;
        const sevenDaysAgo = new Date(selectedDate); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (activities) {
            activities.forEach(a => {
                const ad = new Date(a.date);
                if (ad >= sevenDaysAgo && ad < selectedDate && !a.isPlanned) {
                    last7TSS += (a.tss || 0);
                    last7Count++;
                }
            });
        }

        // 2. Calcular carga planificada esta semana (lunes a domingo de la semana seleccionada)
        const dayOfWeek = selectedDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(selectedDate); weekStart.setDate(weekStart.getDate() + mondayOffset);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

        let weekActualTSS = 0;
        let weekPlannedTSS = 0;
        let plannedDays = new Set();
        let actualDays = new Set();

        if (activities) {
            activities.forEach(a => {
                const ad = new Date(a.date);
                if (ad >= weekStart && ad < weekEnd) {
                    weekActualTSS += (a.tss || 0);
                    actualDays.add(ad.toLocaleDateString('en-CA'));
                }
            });
        }
        if (plannedWorkouts) {
            plannedWorkouts.forEach(p => {
                const pd = new Date(p.date);
                if (pd >= weekStart && pd < weekEnd && pd.toLocaleDateString('en-CA') !== selectedDate.toLocaleDateString('en-CA')) {
                    weekPlannedTSS += (p.tss || 0);
                    plannedDays.add(pd.toLocaleDateString('en-CA'));
                }
            });
        }

        const totalWeekTSS = weekActualTSS + weekPlannedTSS;

        // 3. Calcular CTL/TSB desde currentMetrics o analytics
        const ctl = currentMetrics?.ctl || 0;
        const tsb = currentMetrics?.tsb || 0;
        const monotony = currentMetrics?.monotony || 0;

        // 4. Calcular target semanal ideal (CTL * 7 para mantener, + 10-20% para crecer)
        const weeklyMaintenance = Math.round(ctl * 7);
        const weeklyGrowth = Math.round(ctl * 7 * 1.1);
        const remainingBudget = Math.max(0, weeklyGrowth - totalWeekTSS);

        // 5. Ayer entrené?
        const yesterday = new Date(selectedDate); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toLocaleDateString('en-CA');
        let yesterdayTSS = 0;
        if (activities) {
            activities.forEach(a => {
                if (new Date(a.date).toLocaleDateString('en-CA') === yesterdayKey) yesterdayTSS += (a.tss || 0);
            });
        }

        // 6. Generar recomendación inteligente
        let type, intensity, tssRange, reason;

        if (tsb < -30) {
            type = '🛑 Descanso Total';
            intensity = 'rest';
            tssRange = [0, 0];
            reason = `TSB en ${Math.round(tsb)} — riesgo de sobreentrenamiento. Tu cuerpo necesita recuperarse.`;
        } else if (tsb < -15 || monotony > 2.0) {
            type = '🧘 Recovery / Z1';
            intensity = 'recovery';
            tssRange = [20, 40];
            reason = `Fatiga acumulada (TSB: ${Math.round(tsb)}). Un rodaje suave en Z1 facilitará la absorción del entrenamiento.`;
        } else if (yesterdayTSS > ctl * 1.3) {
            type = '🏃 Endurance / Z2';
            intensity = 'endurance';
            tssRange = [40, 60];
            reason = `Ayer cargaste fuerte (${Math.round(yesterdayTSS)} TSS). Hoy toca asimilar con aeróbico base.`;
        } else if (tsb > 5 && totalWeekTSS < weeklyMaintenance * 0.6) {
            type = '⚡ Intervalos / Tempo Z3-Z4';
            intensity = 'hard';
            tssRange = [80, 120];
            reason = `Estás fresco (TSB: +${Math.round(tsb)}) y la semana está descargada. Momento ideal para buscar adaptaciones.`;
        } else if (tsb >= -10 && tsb <= 5) {
            type = '🎯 Tempo / Progresivo Z2-Z3';
            intensity = 'moderate';
            tssRange = [50, 80];
            reason = `Form equilibrada. Un esfuerzo de intensidad media mantendrá tu progresión sin sobrecargar.`;
        } else {
            type = '🏃 Endurance / Z2';
            intensity = 'endurance';
            tssRange = [40, 70];
            reason = `Día estándar para acumular volumen aeróbico base.`;
        }

        return {
            type,
            intensity,
            tssRange,
            reason,
            weekContext: {
                actual: Math.round(weekActualTSS),
                planned: Math.round(weekPlannedTSS),
                target: weeklyGrowth,
                remaining: remainingBudget,
                daysTrainedOrPlanned: actualDays.size + plannedDays.size,
            },
            last7: { tss: Math.round(last7TSS), count: last7Count },
            tsb: Math.round(tsb),
        };
    };

    const addBlock = (blockType) => {
        if (blockType === 'repeat') {
            setNewPlan(prev => ({
                ...prev,
                blocks: [...prev.blocks, { id: Date.now(), type: 'repeat', repeats: 4, steps: [] }]
            }));
        } else {
            setNewPlan(prev => ({
                ...prev,
                blocks: [...prev.blocks, { id: Date.now(), type: blockType, duration: 10, zone: 'Z2', details: '' }]
            }));
        }
    };

    const addStepToRepeat = (blockId, stepType) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: [...b.steps, { id: Date.now() + Math.random(), type: stepType, duration: 2, zone: stepType === 'active' ? 'Z4' : 'Z1' }]
            } : b)
        }));
    };

    const updateStep = (blockId, stepId, field, value) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: b.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s)
            } : b)
        }));
    };

    const removeStep = (blockId, stepId) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: b.steps.filter(s => s.id !== stepId)
            } : b)
        }));
    };

    const updateBlock = (id, field, value) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
        }));
    };

    const removeBlock = (id) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, isDeleted: true } : b).filter(b => !b.isDeleted)
        }));
    };

    const handleOpenPlanModal = (e, date) => {
        e.stopPropagation();
        setSelectedDateForPlan(date);
        setIsModalOpen(true);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSavePlan = async () => {
        if (!selectedDateForPlan) return;
        setIsSaving(true);
        try {
            await addPlannedWorkout({
                date: selectedDateForPlan.toISOString(),
                type: newPlan.type,
                name: newPlan.name || `Plan ${newPlan.type}`,
                tss: Number(newPlan.tss),
                duration: Number(newPlan.duration),
                description: JSON.stringify({ blocks: newPlan.blocks })
            });
            setIsModalOpen(false);
            setNewPlan({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
        } catch (e) {
            alert("Error guardando plan: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlan = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("¿Borrar entrenamiento planeado?")) {
            try {
                await deletePlannedWorkout(id);
            } catch (e) {
                alert("Error al borrar: " + e.message);
            }
        }
    };

    const activitiesByDate = useMemo(() => {
        const map = {};
        if (activities) {
            activities.forEach(act => {
                const dateKey = new Date(act.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push({ ...act, isPlanned: false });
            });
        }
        if (plannedWorkouts) {
            plannedWorkouts.forEach(pAct => {
                const dateKey = new Date(pAct.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push({ ...pAct, isPlanned: true });
            });
        }
        return map;
    }, [activities, plannedWorkouts]);

    const calendarGrid = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDayOfWeek = firstDay.getDay();
        if (startDayOfWeek === 0) startDayOfWeek = 7;
        const daysInMonth = lastDay.getDate();
        const weeks = [];
        let currentWeek = [];

        for (let i = 1; i < startDayOfWeek; i++) {
            const d = new Date(year, month, 1 - (startDayOfWeek - i));
            currentWeek.push({ date: d, isCurrentMonth: false });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            currentWeek.push({ date: date, isCurrentMonth: true });
            if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
        }

        if (currentWeek.length > 0) {
            let d = 1;
            while (currentWeek.length < 7) {
                const date = new Date(year, month + 1, d++);
                currentWeek.push({ date: date, isCurrentMonth: false });
            }
            weeks.push(currentWeek);
        }
        return weeks;
    }, [year, month]);

    return (
        <>
            <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-visible mb-6 shadow-sm">

                {/* HEADER */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-zinc-100 capitalize flex items-center gap-1.5 sm:gap-2 tracking-tight">
                            <CalIcon className="text-blue-600 dark:text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
                            {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={goToday} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">Hoy</button>
                    </div>
                    <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                        <button onClick={prevMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronLeft size={18} /></button>
                        <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700"></div>
                        <button onClick={nextMonth} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="w-full relative">

                    {/* CABECERA DÍAS DE LA SEMANA */}
                    <div className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] bg-slate-50/95 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-20">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="py-2 text-center text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{day}</div>
                        ))}
                        <div className="hidden lg:block py-2 text-center text-[10px] font-black text-slate-600 dark:text-zinc-300 uppercase tracking-widest border-l border-slate-200 dark:border-zinc-800">
                            Resumen Semanal
                        </div>
                    </div>

                    {/* CUERPO DEL CALENDARIO */}
                    <div className="pb-2">
                        {calendarGrid.map((week, wIdx) => {
                            let weekTSS = 0; let weekDuration = 0; let weekDist = 0;
                            const weekKey = week[0].date.toLocaleDateString('en-CA');
                            const targetTSS = weeklyTargets[weekKey] || 0;

                            week.forEach(day => {
                                const dateKey = day.date.toLocaleDateString('en-CA');
                                const acts = activitiesByDate[dateKey] || [];
                                acts.forEach(a => { weekTSS += (a.tss || 0); weekDuration += a.duration; weekDist += a.distance; });
                            });

                            const compliance = targetTSS > 0 ? Math.min((weekTSS / targetTSS) * 100, 100) : 0;
                            let complianceColor = 'bg-slate-300 dark:bg-zinc-600';
                            if (targetTSS > 0) {
                                if (compliance > 115) complianceColor = 'bg-red-500';
                                else if (compliance >= 90) complianceColor = 'bg-emerald-500';
                                else if (compliance >= 70) complianceColor = 'bg-blue-500';
                                else complianceColor = 'bg-orange-400';
                            }

                            return (
                                // FILA PRINCIPAL: Aquí está la altura fija (lg:h-[140px])
                                <div key={wIdx} className="grid grid-cols-7 lg:grid-cols-[repeat(7,1fr)_130px] border-b border-slate-200 dark:border-zinc-800 last:border-b-0 lg:h-[140px]">

                                    {/* 7 DÍAS INDIVIDUALES (Ahora toman la altura del padre con lg:h-full) */}
                                    {week.map((day, dIdx) => {
                                        const dateKey = day.date.toLocaleDateString('en-CA');
                                        const acts = activitiesByDate[dateKey] || [];
                                        const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                                        return (
                                            <div key={dIdx} className={`relative p-1 lg:p-1.5 border-r border-slate-200 dark:border-zinc-800 flex flex-col h-[90px] sm:h-[110px] lg:h-full overflow-hidden
                                      ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-zinc-950/30' : 'bg-white dark:bg-zinc-900'}
                                      ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' : ''}
                                  `}>
                                                {/* Número del día */}
                                                <div className="flex justify-center lg:justify-between items-start px-1 mb-1 shrink-0 group/dayheader">
                                                    <span className={`text-[9px] lg:text-[11px] font-bold ${!day.isCurrentMonth ? 'text-slate-300 dark:text-zinc-600' : isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 rounded-sm' : 'text-slate-500 dark:text-zinc-400'}`}>
                                                        {day.date.getDate()}
                                                    </span>
                                                    <button onClick={(e) => handleOpenPlanModal(e, day.date)} className="hidden lg:flex opacity-0 group-hover/dayheader:opacity-100 items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 p-0.5 rounded transition-all">
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                {/* Contenedor de entrenos con SCROLL si hay más de la cuenta */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 w-full pr-0.5">
                                                    {acts.map((act, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (act.isPlanned) {
                                                                    let descObj = { blocks: [] };
                                                                    try { descObj = JSON.parse(act.description) } catch (err) { }
                                                                    setViewingPlan({ ...act, descriptionObj: descObj });
                                                                } else {
                                                                    if (onSelectActivity) onSelectActivity(act);
                                                                }
                                                            }}
                                                            className={`p-1 lg:p-1.5 rounded cursor-pointer transition-colors flex flex-col items-center lg:items-stretch w-full shrink-0 relative group/act
                                                    ${getSportColor(act.type)}
                                                    ${act.isPlanned ? 'border-dashed border-[1.5px] opacity-80' : 'border'}
                                                `}
                                                        >
                                                            {/* Título truncado inteligentemente */}
                                                            <div className="flex flex-col lg:flex-row items-center lg:justify-between w-full gap-0.5 lg:gap-1">
                                                                <div className="flex items-center justify-center lg:justify-start gap-1 font-bold flex-1 min-w-0 w-full" title={act.name || act.type}>
                                                                    <span className="shrink-0">{getSportIcon(act.type)}</span>
                                                                    <span className="hidden lg:block text-[9px] xl:text-[10px] truncate w-full text-left">
                                                                        {act.isPlanned ? <><span className="text-[8px] uppercase tracking-widest mr-1">Plan</span> {act.name || act.type}</> : (act.name || act.type)}
                                                                    </span>
                                                                </div>
                                                                {act.tss > 0 && <span className="text-[9px] lg:text-[10px] font-black font-mono opacity-90 shrink-0">{Math.round(act.tss)}</span>}
                                                            </div>
                                                            <div className="flex justify-center lg:justify-between opacity-80 text-[8px] lg:text-[9px] mt-0.5 font-mono w-full">
                                                                <span>{act.duration}m</span>
                                                                {act.distance > 0 && <span className="hidden lg:inline">{(act.distance / 1000).toFixed(0)}k</span>}
                                                            </div>
                                                            {act.isPlanned && (
                                                                <button onClick={(e) => handleDeletePlan(e, act.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/act:opacity-100 shadow-md transition-opacity">
                                                                    <Trash2 size={8} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* COLUMNA RESUMEN Y OBJETIVO (Ajustada para que no se aplaste) */}
                                    <div className="col-span-7 lg:col-span-1 bg-slate-50 dark:bg-zinc-950/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 p-2 flex flex-row lg:flex-col justify-between h-[60px] lg:h-full">

                                        {/* MÉTRICAS ALINEADAS IZQUIERDA/DERECHA */}
                                        <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 flex-1 justify-around lg:justify-center w-full px-1">

                                            {/* VOLUMEN */}
                                            <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                                <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                                    <Clock size={10} /> Vol
                                                </span>
                                                <span className="text-emerald-600 dark:text-emerald-500 font-mono font-bold">
                                                    {Math.floor(weekDuration / 60)}h <span className="hidden sm:inline">{weekDuration % 60}m</span>
                                                </span>
                                            </div>

                                            {/* DISTANCIA */}
                                            <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                                <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                                    <MapPin size={10} /> Dist
                                                </span>
                                                <span className="text-blue-600 dark:text-blue-500 font-mono font-bold">
                                                    {(weekDist / 1000).toFixed(0)}km
                                                </span>
                                            </div>

                                            {/* CARGA */}
                                            <div className="flex flex-col lg:flex-row lg:justify-between items-center text-[10px] lg:text-xs">
                                                <span className="hidden lg:flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                                                    <Zap size={10} /> TSS
                                                </span>
                                                <span className="text-amber-600 dark:text-amber-500 font-mono font-black">
                                                    {Math.round(weekTSS)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* PANEL DE OBJETIVOS (Fijo en la parte inferior) */}
                                        <div
                                            onClick={() => handleEditTarget(weekKey)}
                                            className="flex-shrink-0 w-1/3 lg:w-full border-l lg:border-l-0 lg:border-t border-slate-200 dark:border-zinc-800 pl-3 lg:pl-0 lg:pt-2 cursor-pointer group hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded transition-colors mt-auto"
                                        >
                                            <div className="flex justify-between items-center mb-1 lg:mb-0.5">
                                                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1 px-1">
                                                    <Target size={10} /> Objetivo
                                                </span>
                                            </div>
                                            <div className="text-right mb-1.5 px-1">
                                                {targetTSS > 0 ? (
                                                    <span className="text-[10px] lg:text-[11px] font-bold text-slate-700 dark:text-zinc-200 font-mono">
                                                        {targetTSS} TSS
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] italic text-slate-400 dark:text-zinc-600">Definir</span>
                                                )}
                                            </div>
                                            {targetTSS > 0 && (
                                                <div className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-none overflow-hidden">
                                                    <div className={`h-full ${complianceColor} transition-all duration-500`} style={{ width: `${compliance}%` }}></div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL PLANIFICADOR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* HEADER */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={16} className="text-blue-500" /> Planificar Entreno
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                    {selectedDateForPlan?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={18} /></button>
                        </div>

                        <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                {/* LEFT COLUMN: Coach + Context */}
                                <div className="space-y-4">
                                    {(() => {
                                        const rec = getSmartRecommendation();
                                        if (!rec) return null;
                                        const intensityColor = { rest: 'border-l-red-500', recovery: 'border-l-amber-500', endurance: 'border-l-blue-500', moderate: 'border-l-cyan-500', hard: 'border-l-emerald-500' }[rec.intensity] || 'border-l-slate-500';
                                        return (
                                            <>
                                                <div className="bg-slate-50 dark:bg-zinc-950/50 rounded-lg border border-slate-200 dark:border-zinc-800 p-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Carga Semanal</span>
                                                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-300">{rec.weekContext.actual + rec.weekContext.planned} / {rec.weekContext.target} TSS</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                                        <div className="h-full flex">
                                                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min((rec.weekContext.actual / Math.max(rec.weekContext.target, 1)) * 100, 100)}%` }} />
                                                            <div className="bg-blue-300 dark:bg-blue-700 h-full transition-all" style={{ width: `${Math.min((rec.weekContext.planned / Math.max(rec.weekContext.target, 1)) * 100, 100 - (rec.weekContext.actual / Math.max(rec.weekContext.target, 1)) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between mt-1.5 text-[8px] font-bold uppercase tracking-widest">
                                                        <span className="text-blue-500">Hecho: {rec.weekContext.actual}</span>
                                                        <span className="text-blue-400 dark:text-blue-600">Plan: {rec.weekContext.planned}</span>
                                                        <span className="text-slate-400">Restante: ~{rec.weekContext.remaining}</span>
                                                    </div>
                                                </div>
                                                <div className={`rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 border-l-4 ${intensityColor} overflow-hidden`}>
                                                    <div className="p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Coach IA</span>
                                                            <span className="text-[8px] font-bold text-slate-500 dark:text-zinc-500">TSB: {rec.tsb > 0 ? '+' : ''}{rec.tsb} · 7d: {rec.last7.tss} TSS</span>
                                                        </div>
                                                        <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mb-0.5">{rec.type} — {rec.tssRange[0]}-{rec.tssRange[1]} TSS</p>
                                                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">{rec.reason}</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-center">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1"><Zap size={10} className="inline mr-1" />TSS</span>
                                            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-500">{newPlan.tss}</span>
                                            {estimatedTSS !== null && <span className="text-[8px] text-slate-400 block mt-0.5">auto</span>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-center">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1"><Clock size={10} className="inline mr-1" />Duración</span>
                                            <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-500">{newPlan.duration}<span className="text-sm">m</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2">Deporte</label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[
                                                { key: 'Run', label: 'Carrera', icon: <Footprints size={14} />, color: 'bg-orange-500 text-white' },
                                                { key: 'Ride', label: 'Bici', icon: <Bike size={14} />, color: 'bg-blue-500 text-white' },
                                                { key: 'Swim', label: 'Nadar', icon: <Activity size={14} />, color: 'bg-cyan-500 text-white' },
                                                { key: 'WeightTraining', label: 'Fuerza', icon: <Dumbbell size={14} />, color: 'bg-purple-500 text-white' },
                                                { key: 'Workout', label: 'Otro', icon: <Activity size={14} />, color: 'bg-slate-500 text-white' },
                                            ].map(s => (
                                                <button key={s.key} onClick={() => setNewPlan(prev => ({ ...prev, type: s.key, blocks: [] }))}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${newPlan.type === s.key ? s.color + ' shadow-md scale-105' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
                                                    {s.icon}{s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Título</label>
                                        <input type="text" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                            placeholder={newPlan.type === 'Run' ? 'Ej: Series en umbral' : newPlan.type === 'Ride' ? 'Ej: Sweet spot 2x20' : newPlan.type === 'WeightTraining' ? 'Ej: Fuerza tren inferior' : 'Ej: Sesión mixta'}
                                            className="w-full bg-slate-50 dark:bg-zinc-950 text-sm font-medium text-slate-800 dark:text-zinc-200 rounded-lg p-3 outline-none ring-1 ring-slate-200 dark:ring-zinc-800 focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2">Estructura</label>
                                        <div className="flex gap-1.5 flex-wrap mb-3">
                                            {newPlan.type === 'WeightTraining' ? (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2.5 py-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-amber-100">🔥 Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2.5 py-1.5 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-purple-100">💪 Ejercicio</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-indigo-100">🔄 Circuito</button>
                                                <button onClick={() => addBlock('cooldown')} className="px-2.5 py-1.5 bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-slate-200">🧊 Estirar</button>
                                            </>) : (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2.5 py-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-amber-100">🔥 Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-blue-100">{newPlan.type === 'Run' ? '🏃' : newPlan.type === 'Ride' ? '🚴' : '🏊'} Bloque</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2.5 py-1.5 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-purple-100">🔁 Repetir</button>
                                                <button onClick={() => addBlock('cooldown')} className="px-2.5 py-1.5 bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg text-[10px] font-bold transition-colors hover:bg-slate-200">🧊 Soltar</button>
                                            </>)}
                                        </div>
                                        <div className="space-y-2">
                                            {newPlan.blocks.length === 0 && (
                                                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg">
                                                    <p className="text-slate-400 dark:text-zinc-500 text-xs font-medium">Pulsa los botones para construir tu sesión</p>
                                                    <p className="text-slate-300 dark:text-zinc-600 text-[10px] mt-1">El TSS se estimará automáticamente</p>
                                                </div>
                                            )}
                                            {newPlan.blocks.map((block) => {
                                                const isStr = newPlan.type === 'WeightTraining';
                                                const zones = isStr
                                                    ? [{ v: 'Z1', l: 'Ligero' }, { v: 'Z2', l: 'Moderado' }, { v: 'Z3', l: 'Duro' }, { v: 'Z4', l: 'Máximo' }]
                                                    : [{ v: 'Z1', l: 'Z1 Rec' }, { v: 'Z2', l: 'Z2 Base' }, { v: 'Z3', l: 'Z3 Tempo' }, { v: 'Z4', l: 'Z4 Umbral' }, { v: 'Z5', l: 'Z5 VO2' }, { v: 'Z6', l: 'Z6 Sprint' }];
                                                if (block.type === 'repeat') {
                                                    return (
                                                        <div key={block.id} className="rounded-lg border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-950/10 overflow-hidden relative group">
                                                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/50 dark:bg-purple-900/20 border-b border-purple-200/50 dark:border-purple-800/30">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">{isStr ? '🔄 CIRCUITO' : '🔁 REPETIR'}</span>
                                                                <input type="number" value={block.repeats} min={1} onChange={e => updateBlock(block.id, 'repeats', parseInt(e.target.value) || 1)}
                                                                    className="w-14 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-700 text-xs font-mono p-1.5 rounded text-center" />
                                                                <span className="text-[10px] text-slate-500 font-bold">veces</span>
                                                                <button onClick={() => removeBlock(block.id)} className="ml-auto text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                                            </div>
                                                            <div className="p-2 space-y-1.5">
                                                                {block.steps.map(step => (
                                                                    <div key={step.id} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-md border border-slate-100 dark:border-zinc-800 group/step">
                                                                        <select value={step.type} onChange={e => updateStep(block.id, step.id, 'type', e.target.value)}
                                                                            className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase outline-none cursor-pointer">
                                                                            <option value="active">{isStr ? 'Trabajo' : 'Activo'}</option>
                                                                            <option value="recovery">{isStr ? 'Pausa' : 'Recu'}</option>
                                                                        </select>
                                                                        <input type="number" value={step.duration} min={0} onChange={e => updateStep(block.id, step.id, 'duration', e.target.value)}
                                                                            className="w-14 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono p-1.5 rounded text-center" />
                                                                        <span className="text-[9px] text-slate-400">min</span>
                                                                        <select value={step.zone} onChange={e => updateStep(block.id, step.id, 'zone', e.target.value)}
                                                                            className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[10px] font-bold p-1.5 rounded">
                                                                            {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                                        </select>
                                                                        <button onClick={() => removeStep(block.id, step.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/step:opacity-100 transition-opacity"><X size={14} /></button>
                                                                    </div>
                                                                ))}
                                                                <div className="flex gap-2 pt-1">
                                                                    <button onClick={() => addStepToRepeat(block.id, 'active')} className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded">+ {isStr ? 'Trabajo' : 'Activo'}</button>
                                                                    <button onClick={() => addStepToRepeat(block.id, 'recovery')} className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 px-2 py-1 rounded">+ {isStr ? 'Pausa' : 'Descanso'}</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                const bLabel = block.type === 'warmup' ? '🔥 CALENTAR' : block.type === 'cooldown' ? (isStr ? '🧊 ESTIRAR' : '🧊 SOLTAR') : (isStr ? '💪 EJERCICIO' : (newPlan.type === 'Run' ? '🏃 BLOQUE' : newPlan.type === 'Ride' ? '🚴 BLOQUE' : '🏊 BLOQUE'));
                                                const bBg = block.type === 'main' ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/10' : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30';
                                                return (
                                                    <div key={block.id} className={`rounded-lg border ${bBg} p-3 relative group`}>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400">{bLabel}</span>
                                                            <input type="number" placeholder="Min" value={block.duration} min={0} onChange={e => updateBlock(block.id, 'duration', e.target.value)}
                                                                className="w-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono p-1.5 rounded text-center" />
                                                            <span className="text-[10px] text-slate-400">min</span>
                                                            <select value={block.zone} onChange={e => updateBlock(block.id, 'zone', e.target.value)}
                                                                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold p-1.5 rounded flex-1 min-w-[80px]">
                                                                {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                            </select>
                                                            <button onClick={() => removeBlock(block.id)} className="ml-auto text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                                        </div>
                                                        {block.type === 'main' && (
                                                            <input type="text" value={block.details} onChange={e => updateBlock(block.id, 'details', e.target.value)}
                                                                placeholder={isStr ? 'Ej: Sentadilla 4x8, Peso muerto 3x6' : 'Ej: Progresivo de Z2 a Z3'}
                                                                className="w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs p-2 rounded placeholder-slate-300 dark:placeholder-zinc-600" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                {estimatedTSS !== null && <span>TSS auto: <strong className="text-amber-600">{estimatedTSS}</strong> · {newPlan.duration}min</span>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 uppercase tracking-wider transition-colors">Cancelar</button>
                                <button onClick={handleSavePlan} disabled={isSaving} className="px-5 py-2 rounded-lg text-xs font-black text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20">
                                    {isSaving ? 'Guardando...' : 'Añadir al Plan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL VER ENTRENAMIENTO PLANEADO */}
            {viewingPlan && (
                <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                    {getSportIcon(viewingPlan.type)} {viewingPlan.name || `Entrenamiento de ${viewingPlan.type}`}
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                    {new Date(viewingPlan.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={() => setViewingPlan(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={16} /></button>
                        </div>

                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-around items-center bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-800">
                                <div className="text-center">
                                    <span className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1"><Zap size={10} className="inline mr-1" />TSS</span>
                                    <strong className="text-sm font-black text-amber-600 dark:text-amber-500">{viewingPlan.tss}</strong>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800"></div>
                                <div className="text-center">
                                    <span className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1"><Clock size={10} className="inline mr-1" />Tiempo</span>
                                    <strong className="text-sm font-black text-blue-600 dark:text-blue-500">{viewingPlan.duration}m</strong>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-zinc-800 pb-1">Estructura</h4>
                                {(!viewingPlan.descriptionObj?.blocks || viewingPlan.descriptionObj.blocks.length === 0) ? (
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 italic">No hay estructura definida.</p>
                                ) : (
                                    viewingPlan.descriptionObj.blocks.map((block, idx) => {
                                        if (block.type === 'repeat') {
                                            return (
                                                <div key={idx} className="p-2 rounded bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-800/30">
                                                    <div className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-200/50 dark:border-purple-800/30 pb-1">
                                                        {block.repeats}x Repeticiones
                                                    </div>
                                                    <div className="pl-2 border-l-2 border-purple-300 dark:border-purple-700 space-y-1">
                                                        {block.steps.map((step, sIdx) => (
                                                            <div key={sIdx} className="flex justify-between text-xs items-center bg-white/50 dark:bg-zinc-900 overflow-hidden rounded px-2 py-1">
                                                                <span className="font-bold text-slate-700 dark:text-zinc-300 capitalize">{step.type === 'active' ? 'Intensidad' : 'Descanso'}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-slate-500 font-bold">{step.duration}m</span>
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${step.zone === 'Z1' || step.zone === 'Z2' ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                                        {step.zone}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={idx} className={`p-2 rounded flex justify-between items-center ${block.type === 'main' ? 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30' : 'bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800'}`}>
                                                <div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest mr-2 ${block.type === 'main' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                                                        {block.type === 'warmup' ? 'CALENT.' : block.type === 'cooldown' ? 'SOLTAR' : 'BLOQUE'}
                                                    </span>
                                                    {block.details && <span className="text-xs text-slate-600 dark:text-zinc-300">{block.details}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-slate-500">{block.duration}m</span>
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                                        {block.zone}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 text-xs">
                            <button onClick={(e) => { setViewingPlan(null); handleDeletePlan(e, viewingPlan.id); }} className="px-4 py-2 rounded-lg font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all">Eliminar</button>
                            <button onClick={() => setViewingPlan(null)} className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-200 rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-700 active:scale-95 transition-all">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
