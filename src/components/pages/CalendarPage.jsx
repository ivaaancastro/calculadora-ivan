import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalIcon,
    Clock, Zap, MapPin, Footprints, Bike, Dumbbell, Activity, Target,
    Plus, Trash2, X, Sparkles
} from 'lucide-react';
import { BlockGeneratorModal } from '../dashboard/BlockGeneratorModal';
import { FuelingPanel } from '../dashboard/FuelingPanel';
import { formatDuration, formatBlockDuration } from '../../utils/formatDuration';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Compact HH:MM:SS input — stores value as decimal minutes, supports seconds for sprints
const DurationInput = ({ value, onChange, className = '' }) => {
    const totalSecs = Math.round((Number(value) || 0) * 60);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const commit = (newH, newM, newS) => {
        const clampH = Math.max(0, Math.min(23, Number(newH) || 0));
        const clampM = Math.max(0, Math.min(59, Number(newM) || 0));
        const clampS = Math.max(0, Math.min(59, Number(newS) || 0));
        onChange((clampH * 3600 + clampM * 60 + clampS) / 60);
    };
    const inCls = 'w-7 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono py-0.5 text-center outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-colors';
    const sep = <span className="text-slate-300 dark:text-zinc-600 text-[10px] select-none">:</span>;
    return (
        <div className={`inline-flex items-center rounded-sm overflow-hidden ${className}`} title="hh:mm:ss">
            <input type="number" value={h} min={0} max={23} tabIndex={-1}
                onChange={e => commit(e.target.value, m, s)}
                className={`${inCls} ${h > 0 ? '' : 'w-0 border-0 p-0 opacity-0 pointer-events-none'}`} />
            {h > 0 && sep}
            <input type="number" value={m} min={0} max={59}
                onChange={e => commit(h, e.target.value, s)}
                className={inCls} />
            {sep}
            <input type="number" value={s} min={0} max={59}
                onChange={e => commit(h, m, e.target.value)}
                className={inCls} />
        </div>
    );
};

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

// --- ESTIMATED PACE PER ZONE (min/km for Run, min/10km for Ride) ---
const ZONE_PACE = {
    Run: { Z1: 7.0, R12: 6.5, Z2: 6.0, R23: 5.6, Z3: 5.2, Z4: 4.5, Z5: 3.8, Z6: 3.2 },
    Ride: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, Z4: 2.0, Z5: 1.7, Z6: 1.5 },
    Swim: { Z1: 3.0, R12: 2.75, Z2: 2.5, R23: 2.35, Z3: 2.2, Z4: 2.0, Z5: 1.7, Z6: 1.5 },
};

// --- WORKOUT TEMPLATES BY SPORT ---
const WORKOUT_TEMPLATES = {
    Run: [
        {
            name: 'Rodaje fácil', cat: 'BASE', tss: 40, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 8, zone: 'Z2', details: 'Ritmo cómodo conversacional', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Series 4x1km', cat: 'INT', tss: 70, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 1, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tempo 30\'', cat: 'UMBRAL', tss: 65, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z3', details: 'Ritmo tempo sostenido', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tirada larga', cat: 'FONDO', tss: 90, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 15, zone: 'Z2', details: 'Ritmo constante aeróbico', unit: 'dist' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Fartlek 6x500m', cat: 'MIXTO', tss: 55, duration: 40, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 6, steps: [
                        { id: 1, type: 'active', duration: 0.5, zone: 'Z4', unit: 'dist' },
                        { id: 2, type: 'recovery', duration: 0.5, zone: 'Z2', unit: 'dist' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 6, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Ride: [
        {
            name: 'Base aeróbica', cat: 'BASE', tss: 70, duration: 90, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 65, zone: 'Z2', details: 'Pedaleo suave constante', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Sweet Spot 2x20', cat: 'SST', tss: 85, duration: 75, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 2, steps: [
                        { id: 1, type: 'active', duration: 20, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 5, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Intervalos VO2', cat: 'VO2', tss: 80, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 5, steps: [
                        { id: 1, type: 'active', duration: 3, zone: 'Z5', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 15, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Recuperación', cat: 'REC', tss: 25, duration: 45, blocks: [
                { id: 1, type: 'main', duration: 45, zone: 'Z1', details: 'Pedaleo muy suave regenerativo', unit: 'time' }
            ]
        },
    ],
    WeightTraining: [
        {
            name: 'Tren inferior', cat: 'PIERNA', tss: 50, duration: 55, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 8, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Tren superior', cat: 'TORSO', tss: 45, duration: 50, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 4, steps: [
                        { id: 1, type: 'active', duration: 7, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Full body', cat: 'FULL', tss: 60, duration: 60, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats: 3, steps: [
                        { id: 1, type: 'active', duration: 12, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 3, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
        {
            name: 'Core + estabilidad', cat: 'CORE', tss: 25, duration: 30, blocks: [
                { id: 1, type: 'warmup', duration: 5, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 20, zone: 'Z2', details: 'Plancha, bird-dog, pallof press', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
    Swim: [
        {
            name: 'Técnica + base', cat: 'BASE', tss: 45, duration: 45, blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: '', unit: 'time' },
                { id: 2, type: 'main', duration: 30, zone: 'Z2', details: 'Drills + nado continuo', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: '', unit: 'time' }
            ]
        },
    ],
};

export const CalendarPage = ({ activities, plannedWorkouts = [], addPlannedWorkout, deletePlannedWorkout, updatePlannedWorkout, currentMetrics, settings, chartData = [], onDelete, onSelectActivity }) => {

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

    // --- VIEW MODE ---
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

    // Current week for weekly view
    const currentWeekDays = useMemo(() => {
        const today = new Date(currentDate);
        const dow = today.getDay() || 7; // Monday = 1
        const monday = new Date(today);
        monday.setDate(today.getDate() - dow + 1);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const prevWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
    const nextWeek = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });

    // Using DB instead of localStorage for planned activities

    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isDeleteBlockOpen, setIsDeleteBlockOpen] = useState(false);
    const [deleteBlockFrom, setDeleteBlockFrom] = useState('');
    const [deleteBlockTo, setDeleteBlockTo] = useState('');
    const [deletingBlock, setDeletingBlock] = useState(false);

    const handleDeleteBlock = async () => {
        if (!deleteBlockFrom || !deleteBlockTo) return;
        setDeletingBlock(true);
        const toDelete = plannedWorkouts.filter(w => {
            const d = w.date || (w.dateObj ? w.dateObj.toLocaleDateString('en-CA') : null);
            return d && d >= deleteBlockFrom && d <= deleteBlockTo;
        });
        for (const w of toDelete) {
            await deletePlannedWorkout(w.id);
        }
        setDeletingBlock(false);
        setIsDeleteBlockOpen(false);
        setDeleteBlockFrom('');
        setDeleteBlockTo('');
    };

    const handleGenerateBlock = async (payload) => {
        const { sport, projection } = payload;

        if (!projection || projection.length === 0) return;

        for (const week of projection) {
            for (const session of week.sessions) {
                const newWorkout = {
                    date: session.date,
                    type: sport,
                    name: session.name,
                    tss: session.tss,
                    duration: session.duration,
                    description: JSON.stringify({ blocks: session.blocks })
                };
                await addPlannedWorkout(newWorkout);
            }
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPlan, setViewingPlan] = useState(null);
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [selectedDateForPlan, setSelectedDateForPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        type: 'Run',
        name: '',
        tss: 50,
        duration: 60,
        blocks: []
    });

    // --- DRAG & DROP STATE ---
    const [draggedWorkout, setDraggedWorkout] = useState(null);
    const [dragOverDate, setDragOverDate] = useState(null);

    const handleDragStart = (e, workout) => {
        setDraggedWorkout(workout);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', workout.id);
    };

    const handleDragOver = (e, dateKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDate(dateKey);
    };

    const handleDragLeave = () => setDragOverDate(null);

    const handleDrop = async (e, targetDate) => {
        e.preventDefault();
        setDragOverDate(null);
        if (!draggedWorkout || !updatePlannedWorkout) return;
        const newDateStr = targetDate.toISOString();
        const oldDateKey = new Date(draggedWorkout.date).toLocaleDateString('en-CA');
        const newDateKey = targetDate.toLocaleDateString('en-CA');
        if (oldDateKey === newDateKey) { setDraggedWorkout(null); return; }
        try {
            await updatePlannedWorkout(draggedWorkout.id, { date: newDateStr });
        } catch (err) {
            console.error('Error moving workout:', err);
        }
        setDraggedWorkout(null);
    };

    // --- APPLY TEMPLATE ---
    const applyTemplate = (template) => {
        const stampBlocks = template.blocks.map(b => ({
            ...b,
            id: Date.now() + Math.random(),
            steps: b.steps ? b.steps.map(s => ({ ...s, id: Date.now() + Math.random() })) : undefined
        }));
        setNewPlan(prev => ({
            ...prev,
            name: template.name,
            tss: template.tss,
            duration: template.duration,
            blocks: stampBlocks
        }));
    };

    // --- INTENSITY FACTORS PER ZONE (dynamic from profile, fallback to defaults) ---
    const DEFAULT_ZONE_IF = { Z1: 0.55, Z2: 0.75, Z3: 0.88, Z4: 1.0, Z5: 1.15, Z6: 1.3 };
    const ZONE_IF = useMemo(() => {
        // Try to derive IF from user's configured LTHR zones
        const sportKey = newPlan.type === 'Ride' ? 'ciclismo' : newPlan.type === 'Swim' ? 'natacion' : 'carrera';
        const sportSettings = settings?.[sportKey];
        if (!sportSettings?.lthr || !sportSettings?.zones?.length) return DEFAULT_ZONE_IF;
        const lthr = sportSettings.lthr;
        // Each zone's IF = midpoint HR / LTHR
        const zones = sportSettings.zones;
        const derived = {};
        zones.forEach((z, i) => {
            const mid = (z.min + z.max) / 2;
            derived[`Z${i + 1}`] = Math.round((mid / lthr) * 100) / 100;
        });
        // Z6 if not defined
        if (!derived.Z6) derived.Z6 = 1.3;

        // Ramps (averages between zones for TSS estimation)
        derived.R12 = derived.Z1 && derived.Z2 ? (derived.Z1 + derived.Z2) / 2 : 0.65;
        derived.R23 = derived.Z2 && derived.Z3 ? (derived.Z2 + derived.Z3) / 2 : 0.81;

        return { ...DEFAULT_ZONE_IF, ...derived };
    }, [settings, newPlan.type]);

    // --- AUTO TSS ESTIMATION FROM BLOCKS ---
    const estimatedTSS = useMemo(() => {
        if (newPlan.blocks.length === 0) return null;
        let totalMinutes = 0;
        let weightedIF = 0;
        const sportPace = ZONE_PACE[newPlan.type] || ZONE_PACE.Run;

        const toMinutes = (val, unit, zone) => {
            if (unit === 'dist') {
                const pace = sportPace[zone] || 5.0;
                return (Number(val) || 0) * pace;
            }
            return Number(val) || 0;
        };

        const processBlock = (block) => {
            if (block.type === 'repeat') {
                const reps = block.repeats || 1;
                block.steps.forEach(step => {
                    const mins = toMinutes(step.duration, step.unit, step.zone);
                    const ifVal = ZONE_IF[step.zone] || 0.75;
                    totalMinutes += mins * reps;
                    weightedIF += mins * reps * ifVal * ifVal;
                });
            } else {
                const mins = toMinutes(block.duration, block.unit, block.zone);
                const ifVal = ZONE_IF[block.zone] || 0.75;
                totalMinutes += mins;
                weightedIF += mins * ifVal * ifVal;
            }
        };

        newPlan.blocks.forEach(processBlock);
        if (totalMinutes === 0) return null;
        return Math.round((weightedIF * 100) / 60);
    }, [newPlan.blocks, newPlan.type]);

    // Auto-update TSS and duration when blocks change
    useEffect(() => {
        if (estimatedTSS !== null) {
            const sportPace = ZONE_PACE[newPlan.type] || ZONE_PACE.Run;
            let totalMins = 0;
            newPlan.blocks.forEach(b => {
                if (b.type === 'repeat') {
                    b.steps.forEach(s => {
                        const mins = s.unit === 'dist'
                            ? (Number(s.duration) || 0) * (sportPace[s.zone] || 5)
                            : (Number(s.duration) || 0);
                        totalMins += mins * (b.repeats || 1);
                    });
                } else {
                    totalMins += b.unit === 'dist'
                        ? (Number(b.duration) || 0) * (sportPace[b.zone] || 5)
                        : (Number(b.duration) || 0);
                }
            });
            setNewPlan(prev => ({ ...prev, tss: estimatedTSS, duration: Math.round(totalMins) }));
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
                blocks: [...prev.blocks, { id: Date.now(), type: blockType, duration: 10, zone: 'Z2', details: '', unit: 'time' }]
            }));
        }
    };

    const addStepToRepeat = (blockId, stepType) => {
        setNewPlan(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? {
                ...b,
                steps: [...b.steps, { id: Date.now() + Math.random(), type: stepType, duration: 2, zone: stepType === 'active' ? 'Z4' : 'Z1', unit: 'time' }]
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
        setEditingPlanId(null);
        setNewPlan({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        let blocks = [];
        try {
            const desc = typeof plan.description === 'string' ? JSON.parse(plan.description) : plan.description;
            blocks = desc?.blocks || [];
        } catch (e) { }
        setSelectedDateForPlan(new Date(plan.date));
        setEditingPlanId(plan.id);
        setNewPlan({
            type: plan.type || 'Run',
            name: plan.name || '',
            tss: plan.tss || 50,
            duration: plan.duration || 60,
            blocks: blocks,
        });
        setViewingPlan(null);
        setIsModalOpen(true);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSavePlan = async () => {
        if (!selectedDateForPlan) return;
        setIsSaving(true);
        try {
            const planData = {
                date: selectedDateForPlan.toISOString(),
                type: newPlan.type,
                name: newPlan.name || `Plan ${newPlan.type}`,
                tss: Number(newPlan.tss),
                duration: Number(newPlan.duration),
                description: JSON.stringify({ blocks: newPlan.blocks })
            };
            if (editingPlanId) {
                await updatePlannedWorkout(editingPlanId, planData);
            } else {
                await addPlannedWorkout(planData);
            }
            setIsModalOpen(false);
            setEditingPlanId(null);
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

    const plannedByDate = useMemo(() => {
        const map = {};
        if (plannedWorkouts) {
            plannedWorkouts.forEach(p => {
                const dateKey = new Date(p.date).toLocaleDateString('en-CA');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(p);
            });
        }
        return map;
    }, [plannedWorkouts]);

    // --- PMC data indexed by date ---
    const pmcByDate = useMemo(() => {
        const map = {};
        (chartData || []).forEach(d => { map[d.date] = d; });
        return map;
    }, [chartData]);

    // --- Forward PMC projection using planned workouts ---
    const fullPmcByDate = useMemo(() => {
        const map = {};
        const today = new Date().toLocaleDateString('en-CA');

        // Copy only past/today actual data
        const sortedDates = Object.keys(pmcByDate).sort();
        sortedDates.forEach(dk => {
            if (dk <= today) map[dk] = pmcByDate[dk];
        });

        // Find the last actual PMC entry (up to today)
        const pastDates = sortedDates.filter(dk => dk <= today);
        if (pastDates.length === 0) return map;
        const lastDate = pastDates[pastDates.length - 1];
        const lastPmc = pmcByDate[lastDate];
        if (!lastPmc || lastPmc.ctl == null) return map;

        // Build a map of planned TSS per date
        const plannedTssByDate = {};
        (plannedWorkouts || []).forEach(p => {
            const dk = new Date(p.date).toLocaleDateString('en-CA');
            plannedTssByDate[dk] = (plannedTssByDate[dk] || 0) + (p.tss || 0);
        });

        // Project forward day by day from today up to 90 days out
        let ctl = lastPmc.ctl;
        let atl = lastPmc.atl;
        const startDate = new Date(lastDate + 'T00:00:00');
        for (let i = 1; i <= 90; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dk = d.toLocaleDateString('en-CA');
            const dayTSS = plannedTssByDate[dk] || 0;
            ctl = ctl + (dayTSS - ctl) / 42;
            atl = atl + (dayTSS - atl) / 7;
            map[dk] = { date: dk, ctl, atl, tcb: ctl - atl, projected: true };
        }
        return map;
    }, [pmcByDate, plannedWorkouts]);

    // --- COMPLIANCE: Plan vs Execution ---
    const getComplianceForDay = (dateKey, acts) => {
        const planned = acts.filter(a => a.isPlanned);
        const real = acts.filter(a => !a.isPlanned);
        if (planned.length === 0) return null;
        const plannedTSS = planned.reduce((s, a) => s + (a.tss || 0), 0);
        const realTSS = real.reduce((s, a) => s + (a.tss || 0), 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (dayDate > today) return { status: 'future', pct: 0, plannedTSS, realTSS };
        if (real.length === 0) return { status: 'missed', pct: 0, plannedTSS, realTSS };
        const pct = plannedTSS > 0 ? (realTSS / plannedTSS) * 100 : 100;
        if (pct >= 90) return { status: 'done', pct: Math.round(pct), plannedTSS, realTSS };
        if (pct >= 50) return { status: 'partial', pct: Math.round(pct), plannedTSS, realTSS };
        return { status: 'missed', pct: Math.round(pct), plannedTSS, realTSS };
    };

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
                            {viewMode === 'month'
                                ? new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                                : `${currentWeekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${currentWeekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            }
                        </h2>
                        <button onClick={goToday} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">Hoy</button>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* AI BUILDER BUTTON */}
                        <button onClick={() => setIsGeneratorOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm">
                            <Sparkles size={12} /> Generar Bloque
                        </button>
                        {/* DELETE BLOCK BUTTON */}
                        <button onClick={() => setIsDeleteBlockOpen(prev => !prev)} className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm ${isDeleteBlockOpen ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-400'}`}>
                            <Trash2 size={12} /> Borrar Bloque
                        </button>

                        {/* VIEW MODE TOGGLE */}
                        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden ml-2">
                            <button onClick={() => setViewMode('month')}
                                className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${viewMode === 'month' ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
                            >Mes</button>
                            <button onClick={() => setViewMode('week')}
                                className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${viewMode === 'week' ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'}`}
                            >Semana</button>
                        </div>
                        <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                            <button onClick={viewMode === 'month' ? prevMonth : prevWeek} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronLeft size={18} /></button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700"></div>
                            <button onClick={viewMode === 'month' ? nextMonth : nextWeek} className="p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* DELETE BLOCK PANEL */}
                {isDeleteBlockOpen && (
                    <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 px-4 py-3 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Borrar entrenos planificados:</span>
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
                            <input type="date" value={deleteBlockFrom} onChange={e => setDeleteBlockFrom(e.target.value)} className="px-2 py-1 text-xs border border-slate-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-mono" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
                            <input type="date" value={deleteBlockTo} onChange={e => setDeleteBlockTo(e.target.value)} className="px-2 py-1 text-xs border border-slate-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-mono" />
                        </div>
                        {deleteBlockFrom && deleteBlockTo && (
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                ({plannedWorkouts.filter(w => { const d = w.date || w.dateObj?.toLocaleDateString('en-CA'); return d && d >= deleteBlockFrom && d <= deleteBlockTo; }).length} entrenos)
                            </span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={() => { setIsDeleteBlockOpen(false); setDeleteBlockFrom(''); setDeleteBlockTo(''); }} className="px-3 py-1 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors">Cancelar</button>
                            <button onClick={handleDeleteBlock} disabled={!deleteBlockFrom || !deleteBlockTo || deletingBlock}
                                className="px-3 py-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50">
                                {deletingBlock ? 'Borrando...' : 'Confirmar borrado'}
                            </button>
                        </div>
                    </div>
                )}

                <BlockGeneratorModal
                    isOpen={isGeneratorOpen}
                    onClose={() => setIsGeneratorOpen(false)}
                    onGenerate={handleGenerateBlock}
                    currentPmcData={Object.values(fullPmcByDate)}
                    plannedWorkouts={plannedWorkouts}
                />

                {viewMode === 'month' && (
                    <div className="w-full relative">

                        {/* CABECERA DÍAS DE LA SEMANA — con columna izquierda para panel semanal (Solo Desktop) */}
                        <div className="hidden lg:grid grid-cols-[160px_repeat(7,1fr)] bg-slate-50/95 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-20">
                            <div className="py-2 text-center text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-r border-slate-200 dark:border-zinc-800"></div>
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>

                        {/* CUERPO DEL CALENDARIO */}
                        <div className="pb-2">
                            {calendarGrid.map((week, wIdx) => {
                                let weekTSS = 0; let weekDuration = 0; let weekDist = 0;
                                const weekKey = week[0].date.toLocaleDateString('en-CA');
                                const targetTSS = weeklyTargets[weekKey] || 0;

                                // Calculate per-week stats
                                week.forEach(day => {
                                    const dateKey = day.date.toLocaleDateString('en-CA');
                                    const acts = activitiesByDate[dateKey] || [];
                                    acts.forEach(a => {
                                        weekTSS += (a.tss || 0);
                                        weekDuration += (a.duration || 0);
                                        if (a.isPlanned) {
                                            let planDist = 0;
                                            try {
                                                const desc = typeof a.description === 'string' ? JSON.parse(a.description) : a.description;
                                                (desc?.blocks || []).forEach(b => {
                                                    if (b.type === 'repeat') {
                                                        (b.steps || []).forEach(s => {
                                                            if (s.unit === 'dist') planDist += (Number(s.duration) || 0) * (b.repeats || 1);
                                                        });
                                                    } else if (b.unit === 'dist') {
                                                        planDist += Number(b.duration) || 0;
                                                    }
                                                });
                                            } catch (e) { }
                                            weekDist += planDist * 1000;
                                        } else {
                                            weekDist += (a.distance || 0);
                                        }
                                    });
                                });

                                // Get PMC values — actual or projected
                                const lastDayKey = week[6].date.toLocaleDateString('en-CA');
                                const weekPmc = (() => {
                                    // Scan week days from last to first for PMC data
                                    for (let di = 6; di >= 0; di--) {
                                        const dk = week[di].date.toLocaleDateString('en-CA');
                                        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
                                    }
                                    return {};
                                })();
                                const prevWeekPmc = (() => {
                                    const d = new Date(week[0].date);
                                    d.setDate(d.getDate() - 1);
                                    for (let i = 0; i < 7; i++) {
                                        const dk = d.toLocaleDateString('en-CA');
                                        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
                                        d.setDate(d.getDate() - 1);
                                    }
                                    return {};
                                })();
                                const ramp = weekPmc.ctl && prevWeekPmc.ctl ? (weekPmc.ctl - prevWeekPmc.ctl).toFixed(1) : null;
                                const isProjected = weekPmc.projected;

                                // Week number
                                const weekNum = (() => {
                                    const d = new Date(week[3].date); // Thursday of the week
                                    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
                                    const yearStart = new Date(d.getFullYear(), 0, 1);
                                    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
                                })();

                                const formatDuration = (mins) => {
                                    const h = Math.floor(mins / 60);
                                    const m = mins % 60;
                                    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
                                };

                                return (
                                    <div key={wIdx} className="grid grid-cols-1 lg:grid-cols-[160px_repeat(7,1fr)] border-b border-slate-200 dark:border-zinc-800 last:border-b-0">

                                        {/* ====== PANEL SEMANAL IZQUIERDO (estilo intervals.icu) ====== */}
                                        <div className="hidden lg:flex flex-col border-r border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/50 p-2 text-[10px] relative">
                                            {/* Week number + totals */}
                                            <div className="flex items-baseline justify-between mb-1.5">
                                                <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200">
                                                    #{weekNum}
                                                    {isProjected && <span className="ml-1 text-[8px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-px rounded">PROY.</span>}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                                    total {formatDuration(weekDuration)}
                                                </span>
                                            </div>

                                            {/* PMC metrics grid */}
                                            <div className="space-y-0.5 mb-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400 dark:text-zinc-500 font-semibold">Carga</span>
                                                    <span className="font-black font-mono text-amber-600 dark:text-amber-500">{Math.round(weekTSS)}</span>
                                                </div>
                                                {weekPmc.ctl != null && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Aptitud</span>
                                                            <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{Math.round(weekPmc.ctl)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Fatiga</span>
                                                            <span className="font-bold font-mono text-purple-600 dark:text-purple-400">{Math.round(weekPmc.atl)}</span>
                                                        </div>
                                                        {ramp !== null && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 dark:text-zinc-500 font-semibold">Rampa</span>
                                                                <span className={`font-bold font-mono ${Number(ramp) > 0 ? 'text-emerald-600' : Number(ramp) < -2 ? 'text-red-500' : 'text-slate-500 dark:text-zinc-400'}`}>
                                                                    {Number(ramp) > 0 ? '+' : ''}{ramp}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Forma</span>
                                                            <span className={`font-bold font-mono ${weekPmc.tcb > 5 ? 'text-emerald-600' : weekPmc.tcb < -15 ? 'text-red-500' : 'text-slate-600 dark:text-zinc-300'}`}>
                                                                {weekPmc.tcb > 0 ? '+' : ''}{Math.round(weekPmc.tcb)}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Target TSS */}
                                            <div
                                                onClick={() => handleEditTarget(weekKey)}
                                                className="mt-auto cursor-pointer hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 rounded px-1 py-0.5 transition-colors"
                                            >
                                                {targetTSS > 0 ? (
                                                    <div>
                                                        <div className="flex justify-between text-[9px]">
                                                            <span className="text-slate-400 dark:text-zinc-500 font-semibold">Objetivo</span>
                                                            <span className="font-mono font-bold text-slate-600 dark:text-zinc-300">{Math.round(weekTSS)}/{targetTSS}</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-0.5">
                                                            <div className={`h-full rounded-full transition-all ${Math.min((weekTSS / targetTSS) * 100, 100) >= 90 ? 'bg-emerald-500' : Math.min((weekTSS / targetTSS) * 100, 100) >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${Math.min((weekTSS / targetTSS) * 100, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-400 dark:text-zinc-600 italic">+ Objetivo</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ====== 7 DÍAS ====== */}
                                        {week.map((day, dIdx) => {
                                            const dateKey = day.date.toLocaleDateString('en-CA');
                                            const acts = activitiesByDate[dateKey] || [];
                                            const isToday = new Date().toLocaleDateString('en-CA') === dateKey;

                                            const compliance = getComplianceForDay(dateKey, acts);

                                            // Zone color helper for activity blocks
                                            const zoneBarColor = (zone) => {
                                                const colors = { Z1: '#94a3b8', Z2: '#3b82f6', Z3: '#22c55e', Z4: '#eab308', Z5: '#f97316', Z6: '#ef4444', Z7: '#a855f7' };
                                                return colors[zone] || '#94a3b8';
                                            };

                                            return (
                                                <div key={dIdx}
                                                    onDragOver={(e) => handleDragOver(e, dateKey)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day.date)}
                                                    className={`relative p-1 lg:p-1.5 border-r border-slate-200 dark:border-zinc-800 flex flex-col min-h-[100px] lg:min-h-[130px] overflow-hidden transition-colors group/daycell
                                                        ${!day.isCurrentMonth ? 'bg-slate-50/50 dark:bg-zinc-950/30' : 'bg-white dark:bg-zinc-900'}
                                                        ${isToday ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
                                                        ${dragOverDate === dateKey ? 'bg-blue-100/50 dark:bg-blue-900/30 ring-2 ring-blue-400 ring-inset' : ''}
                                                    `}>
                                                    {/* Day number + add button */}
                                                    <div className="flex justify-between items-start px-0.5 mb-1 shrink-0">
                                                        <span className={`text-[10px] lg:text-[11px] font-bold ${!day.isCurrentMonth ? 'text-slate-300 dark:text-zinc-700' : isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded' : 'text-slate-500 dark:text-zinc-400'}`}>
                                                            {day.date.getDate()}
                                                        </span>
                                                        <button onClick={(e) => handleOpenPlanModal(e, day.date)} className="opacity-0 group-hover/daycell:opacity-100 text-slate-400 hover:text-blue-500 p-0.5 rounded transition-all">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>

                                                    {/* Compliance badge */}
                                                    {compliance && compliance.status !== 'future' && (
                                                        <div className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-black z-10
                                                            ${compliance.status === 'done' ? 'bg-emerald-500 text-white' : compliance.status === 'partial' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}
                                                            title={`${compliance.realTSS}/${compliance.plannedTSS} TSS (${compliance.pct}%)`}
                                                        >
                                                            {compliance.status === 'done' ? '✓' : compliance.status === 'partial' ? '~' : '✗'}
                                                        </div>
                                                    )}

                                                    {/* Activity cards — intervals.icu style */}
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 w-full">
                                                        {acts.map((act, i) => {
                                                            // Parse blocks for zone visualization
                                                            let blocks = [];
                                                            if (act.isPlanned) {
                                                                try {
                                                                    const desc = typeof act.description === 'string' ? JSON.parse(act.description) : act.description;
                                                                    blocks = desc?.blocks || [];
                                                                } catch (e) { }
                                                            }

                                                            // Sport color for card background
                                                            const sportBg = (() => {
                                                                const t = String(act.type).toLowerCase();
                                                                if (t.includes('run') || t.includes('carrera')) return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50';
                                                                if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50';
                                                                if (t.includes('gym') || t.includes('fuerza')) return 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/50';
                                                                if (t.includes('swim') || t.includes('nadar')) return 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-900/50';
                                                                return 'bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700';
                                                            })();

                                                            const formatActDuration = (mins) => {
                                                                const h = Math.floor(mins / 60);
                                                                const m = mins % 60;
                                                                return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') + 'm' : ''}` : `${m}m`;
                                                            };

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    draggable={act.isPlanned}
                                                                    onDragStart={(e) => act.isPlanned && handleDragStart(e, act)}
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
                                                                    className={`rounded cursor-pointer transition-all w-full shrink-0 relative group/act overflow-hidden border
                                                                        ${sportBg}
                                                                        ${act.isPlanned ? 'border-dashed opacity-80 cursor-grab active:cursor-grabbing' : ''}
                                                                        hover:shadow-sm
                                                                    `}
                                                                >
                                                                    {/* Top: icon + duration + carga */}
                                                                    <div className="flex items-center justify-between px-1.5 pt-1 pb-0.5">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="shrink-0 opacity-70">{getSportIcon(act.type)}</span>
                                                                            <span className="text-[11px] font-black text-slate-700 dark:text-zinc-200">
                                                                                {formatActDuration(act.duration || 0)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Carga */}
                                                                    <div className="px-1.5 pb-0.5">
                                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400">
                                                                            Carga <span className="font-black text-slate-700 dark:text-zinc-200">{Math.round(act.tss || 0)}</span>
                                                                        </span>
                                                                    </div>

                                                                    {/* Zone bars — bar chart style for planned workouts only */}
                                                                    {blocks.length > 0 && (
                                                                        <div className="flex items-end h-8 mx-1 mb-1 gap-px">
                                                                            {(() => {
                                                                                const zoneHeight = { Z1: '25%', Z2: '40%', Z3: '55%', Z4: '70%', Z5: '85%', Z6: '100%' };
                                                                                const allBars = [];
                                                                                blocks.forEach((b, bi) => {
                                                                                    if (b.type === 'repeat') {
                                                                                        for (let r = 0; r < (b.repeats || 1); r++) {
                                                                                            (b.steps || []).forEach((s, si) => {
                                                                                                allBars.push({
                                                                                                    key: `${bi}-${r}-${si}`,
                                                                                                    zone: s.zone || 'Z2',
                                                                                                    duration: Number(s.duration) || 1,
                                                                                                    title: `${s.duration}${s.unit === 'dist' ? 'km' : 'min'} ${s.zone}`,
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                    } else {
                                                                                        allBars.push({
                                                                                            key: `${bi}`,
                                                                                            zone: b.zone || 'Z2',
                                                                                            duration: Number(b.duration) || 1,
                                                                                            title: `${b.duration}${b.unit === 'dist' ? 'km' : 'min'} ${b.zone}`,
                                                                                        });
                                                                                    }
                                                                                });
                                                                                return allBars.map(bar => (
                                                                                    <div key={bar.key}
                                                                                        className="rounded-t-sm"
                                                                                        style={{
                                                                                            flex: bar.duration,
                                                                                            height: zoneHeight[bar.zone] || '40%',
                                                                                            backgroundColor: zoneBarColor(bar.zone),
                                                                                            opacity: 0.85,
                                                                                            minWidth: '3px',
                                                                                        }}
                                                                                        title={bar.title}
                                                                                    />
                                                                                ));
                                                                            })()}
                                                                        </div>
                                                                    )}

                                                                    {/* Name */}
                                                                    <div className="px-1.5 pb-1">
                                                                        <span className="text-[8px] lg:text-[9px] font-semibold text-slate-500 dark:text-zinc-400 truncate block leading-tight">
                                                                            {act.isPlanned ? `Plan: ${act.name || act.type}` : (act.name || act.type)}
                                                                        </span>
                                                                    </div>

                                                                    {/* Delete button for planned */}
                                                                    {act.isPlanned && (
                                                                        <button onClick={(e) => handleDeletePlan(e, act.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/act:opacity-100 shadow transition-opacity">
                                                                            <Trash2 size={8} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === WEEKLY VIEW === */}
                {viewMode === 'week' && (
                    <div className="w-full">
                        {/* WEEK DAY HEADERS */}
                        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/95 dark:bg-zinc-950/90">
                            {currentWeekDays.map((d, i) => {
                                const isToday = d.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA');
                                return (
                                    <div key={i} className={`py-2.5 px-2 text-center border-r last:border-r-0 border-slate-200 dark:border-zinc-800 ${isToday ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{WEEKDAYS[i]}</span>
                                        <span className={`block text-lg font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-zinc-200'}`}>{d.getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* WEEK BODY */}
                        <div className="grid grid-cols-7 min-h-[400px]">
                            {currentWeekDays.map((d, i) => {
                                const dateKey = d.toLocaleDateString('en-CA');
                                const isPast = dateKey < new Date().toLocaleDateString('en-CA');
                                const isToday = dateKey === new Date().toLocaleDateString('en-CA');
                                const dayActs = activitiesByDate[dateKey] || [];
                                const dayPlans = plannedByDate[dateKey] || [];

                                const zoneColor = (z) => {
                                    const colors = { Z1: 'bg-slate-300 dark:bg-zinc-600', Z2: 'bg-blue-400 dark:bg-blue-600', Z3: 'bg-emerald-400 dark:bg-emerald-600', Z4: 'bg-amber-400 dark:bg-amber-500', Z5: 'bg-red-400 dark:bg-red-500', Z6: 'bg-rose-600 dark:bg-rose-700' };
                                    return colors[z] || 'bg-slate-300';
                                };

                                return (
                                    <div key={i}
                                        className={`border-r last:border-r-0 border-b border-slate-200 dark:border-zinc-800 p-1.5 flex flex-col gap-1.5
                                        ${isToday ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, dateKey)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, d)}
                                        style={dragOverDate === dateKey ? { outline: '2px dashed #3b82f6', outlineOffset: '-2px' } : {}}
                                    >
                                        {/* PLANNED */}
                                        {dayPlans.map(p => {
                                            let blocks = [];
                                            try {
                                                const desc = typeof p.description === 'string' ? JSON.parse(p.description) : p.description;
                                                blocks = desc?.blocks || [];
                                            } catch (e) { }
                                            return (
                                                <div key={p.id}
                                                    draggable
                                                    onDragStart={() => setDraggedWorkout(p)}
                                                    onClick={() => setViewingPlan(p)}
                                                    className="bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 rounded p-1.5 cursor-pointer hover:border-blue-400 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {getSportIcon(p.type)}
                                                        <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-300 truncate flex-1">{p.name || 'Entreno'}</span>
                                                        <span className="text-[8px] font-mono text-slate-400">{p.tss}tss</span>
                                                    </div>
                                                    {/* Visual blocks */}
                                                    {blocks.length > 0 && (
                                                        <div className="flex gap-px rounded overflow-hidden h-4">
                                                            {blocks.map((b, bi) => {
                                                                if (b.type === 'repeat') {
                                                                    return (b.steps || []).map((s, si) => (
                                                                        <div key={`${bi}-${si}`}
                                                                            className={`flex-1 ${zoneColor(s.zone)} opacity-80`}
                                                                            title={`${b.repeats}x ${s.duration}${s.unit === 'dist' ? 'km' : 'min'} ${s.zone}`}
                                                                        />
                                                                    ));
                                                                }
                                                                return (
                                                                    <div key={bi}
                                                                        className={`${zoneColor(b.zone)} opacity-80`}
                                                                        style={{ flex: Number(b.duration) || 1 }}
                                                                        title={`${b.duration}${b.unit === 'dist' ? 'km' : 'min'} ${b.zone}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* REAL ACTIVITIES */}
                                        {dayActs.map(a => (
                                            <div key={a.id}
                                                onClick={() => onSelectActivity?.(a)}
                                                className="bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded p-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {getSportIcon(a.type)}
                                                    <span className="text-[9px] font-bold text-slate-700 dark:text-zinc-200 truncate flex-1">{a.name}</span>
                                                </div>
                                                <div className="flex gap-2 mt-0.5">
                                                    <span className="text-[8px] font-mono text-amber-600">{a.tss}tss</span>
                                                    <span className="text-[8px] font-mono text-slate-400">{formatDuration(a.duration)}</span>
                                                    {a.distance > 0 && <span className="text-[8px] font-mono text-slate-400">{(a.distance / 1000).toFixed(1)}km</span>}
                                                </div>
                                            </div>
                                        ))}

                                        {/* ADD BUTTON */}
                                        {!isPast && dayPlans.length === 0 && dayActs.length === 0 && (
                                            <button onClick={(e) => handleOpenPlanModal(e, d)}
                                                className="w-full py-4 text-slate-300 dark:text-zinc-700 hover:text-blue-400 dark:hover:text-blue-500 transition-colors flex items-center justify-center">
                                                <Plus size={16} />
                                            </button>
                                        )}
                                        {!isPast && (dayPlans.length > 0 || dayActs.length > 0) && (
                                            <button onClick={(e) => handleOpenPlanModal(e, d)}
                                                className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 hover:text-blue-500 transition-colors mt-auto text-center">
                                                + añadir
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL PLANIFICADOR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-zinc-800">
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={14} className="text-slate-500" /> {editingPlanId ? 'Editar Entreno' : 'Planificar Entreno'}
                                </h3>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
                                    {selectedDateForPlan?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 rounded-md transition-colors"><X size={16} /></button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-900">
                            <div className="space-y-6">

                                {/* SPORT SELECTOR & QUICK TEMPLATES ROW */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Deporte</label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[
                                                { key: 'Run', label: 'Carrera', icon: <Footprints size={14} /> },
                                                { key: 'Ride', label: 'Bici', icon: <Bike size={14} /> },
                                                { key: 'Swim', label: 'Nadar', icon: <Activity size={14} /> },
                                                { key: 'WeightTraining', label: 'Fuerza', icon: <Dumbbell size={14} /> },
                                                { key: 'Workout', label: 'Otro', icon: <Activity size={14} /> },
                                            ].map(s => (
                                                <button key={s.key} onClick={() => setNewPlan(prev => ({ ...prev, type: s.key, blocks: [] }))}
                                                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-md text-[9px] font-medium tracking-wide transition-all border ${newPlan.type === s.key ? 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 shadow-sm' : 'bg-transparent border-transparent text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800/50'}`}>
                                                    {s.icon}<span>{s.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(WORKOUT_TEMPLATES[newPlan.type] || []).length > 0 && (
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Plantillas rápidas</label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {(WORKOUT_TEMPLATES[newPlan.type] || []).map((t, i) => (
                                                    <button key={i} onClick={() => applyTemplate(t)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all border
                                                            ${newPlan.name === t.name
                                                                ? 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-100 shadow-sm'
                                                                : 'bg-white/50 dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                                                    >
                                                        {t.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* TITLE + METRICS ROW */}
                                <div className="flex gap-4 items-end bg-white dark:bg-zinc-900/50 p-4 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Título del entrenamiento</label>
                                        <input type="text" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                            placeholder={newPlan.type === 'Run' ? 'Ej: Series en umbral' : newPlan.type === 'Ride' ? 'Ej: Sweet spot 2x20' : newPlan.type === 'WeightTraining' ? 'Ej: Fuerza tren inferior' : 'Ej: Sesión mixta'}
                                            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 py-1.5 outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-colors placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <div className="text-right">
                                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">TSS</span>
                                            <span className="text-lg font-bold font-mono text-slate-700 dark:text-zinc-300">{newPlan.tss}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800 mx-1 self-center"></div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Duración</span>
                                            <span className="text-lg font-bold font-mono text-slate-700 dark:text-zinc-300">{formatDuration(newPlan.duration)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ESTRUCTURA */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Plan de Entrenamiento</label>
                                        <div className="flex gap-1.5">
                                            {newPlan.type === 'WeightTraining' ? (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Ejercicio</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2 py-1 bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-[9px] font-medium transition-colors shadow-sm">Circuito</button>
                                                <button onClick={() => addBlock('cooldown')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Estirar</button>
                                            </>) : (<>
                                                <button onClick={() => addBlock('warmup')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Calentar</button>
                                                <button onClick={() => addBlock('main')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Bloque</button>
                                                <button onClick={() => addBlock('repeat')} className="px-2 py-1 bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-[9px] font-medium transition-colors shadow-sm">Intervalos</button>
                                                <button onClick={() => addBlock('cooldown')} className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-md text-[9px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm">Soltar</button>
                                            </>)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {newPlan.blocks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg bg-white/50 dark:bg-zinc-900/50">
                                                <Target size={24} className="text-slate-300 dark:text-zinc-600 mb-2" />
                                                <p className="text-slate-500 dark:text-zinc-400 text-xs font-semibold">Diseña tu entrenamiento</p>
                                                <p className="text-slate-400 dark:text-zinc-500 text-[10px] mt-1">Añade bloques de calentamiento o intervalos</p>
                                            </div>
                                        )}
                                        {newPlan.blocks.map((block) => {
                                            const isStr = newPlan.type === 'WeightTraining';
                                            const zones = isStr
                                                ? [{ v: 'Z1', l: 'Ligero' }, { v: 'Z2', l: 'Moderado' }, { v: 'Z3', l: 'Duro' }, { v: 'Z4', l: 'Máximo' }]
                                                : [{ v: 'Z1', l: 'Z1 Rec' }, { v: 'R12', l: 'Rampa Z1-Z2' }, { v: 'Z2', l: 'Z2 Base' }, { v: 'R23', l: 'Rampa Z2-Z3' }, { v: 'Z3', l: 'Z3 Tempo' }, { v: 'Z4', l: 'Z4 Umbral' }, { v: 'Z5', l: 'Z5 VO2' }, { v: 'Z6', l: 'Z6 Sprint' }];

                                            // REPEAT BLOCK
                                            if (block.type === 'repeat') {
                                                return (
                                                    <div key={block.id} className="rounded-md border-l-4 border-l-slate-400 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm group">
                                                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800/50">
                                                            <input type="number" value={block.repeats} min={1} onChange={e => updateBlock(block.id, 'repeats', parseInt(e.target.value) || 1)}
                                                                className="w-12 bg-transparent border-b border-slate-300 dark:border-zinc-600 focus:border-slate-500 text-xs font-mono py-0.5 text-center outline-none transition-colors" />
                                                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">veces (Intervalos)</span>
                                                            <button onClick={() => removeBlock(block.id)} className="ml-auto text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                                                        </div>
                                                        <div className="p-3 pl-6 space-y-2 relative">
                                                            <div className="absolute left-2.5 top-3 bottom-8 w-px bg-slate-200 dark:bg-zinc-800"></div>
                                                            {block.steps.map(step => (
                                                                <div key={step.id} className="flex items-center gap-2 relative z-10 mr-4">
                                                                    <div className="w-2 h-2 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 absolute -left-[23px] top-1/2 -translate-y-1/2"></div>
                                                                    <select value={step.type} onChange={e => updateStep(block.id, step.id, 'type', e.target.value)}
                                                                        className="w-20 bg-transparent text-[10px] font-semibold text-slate-600 dark:text-zinc-400 uppercase outline-none cursor-pointer border-b border-transparent focus:border-slate-200">
                                                                        <option value="active">{isStr ? 'Trabajo' : 'Activo'}</option>
                                                                        <option value="recovery">{isStr ? 'Pausa' : 'Recu'}</option>
                                                                    </select>
                                                                    {step.unit === 'dist' ? (
                                                                        <input type="number" value={step.duration} min={0} onChange={e => updateStep(block.id, step.id, 'duration', e.target.value)}
                                                                            className="w-12 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono p-1 rounded-sm text-center outline-none focus:border-slate-400" />
                                                                    ) : (
                                                                        <DurationInput value={step.duration} onChange={v => updateStep(block.id, step.id, 'duration', v)} />
                                                                    )}
                                                                    {!isStr ? (
                                                                        <button onClick={() => updateStep(block.id, step.id, 'unit', step.unit === 'dist' ? 'time' : 'dist')}
                                                                            className={`text-[9px] font-medium w-8 py-1 rounded-sm transition-colors text-center ${step.unit === 'dist' ? 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
                                                                        >{step.unit === 'dist' ? 'km' : 'min'}</button>
                                                                    ) : <span className="text-[10px] text-slate-400 w-8 text-center">min</span>}
                                                                    <select value={step.zone} onChange={e => updateStep(block.id, step.id, 'zone', e.target.value)}
                                                                        className="flex-1 min-w-[80px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[10px] font-medium p-1 rounded-sm outline-none focus:border-slate-400">
                                                                        {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                                    </select>
                                                                    <button onClick={() => removeStep(block.id, step.id)} className="text-slate-300 hover:text-red-500 ml-1"><X size={12} /></button>
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-2 pt-1 pl-1">
                                                                <button onClick={() => addStepToRepeat(block.id, 'active')} className="text-[9px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 uppercase tracking-widest">+ Activo</button>
                                                                <span className="text-slate-300 dark:text-zinc-700">·</span>
                                                                <button onClick={() => addStepToRepeat(block.id, 'recovery')} className="text-[9px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 uppercase tracking-widest">+ Pausa</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // NORMAL BLOCK (Warmup/Main/Cooldown)
                                            const bLabelStyle = block.type === 'warmup' ? 'text-orange-500' : block.type === 'cooldown' ? 'text-blue-500' : 'text-slate-600 dark:text-zinc-300';
                                            const bLabel = block.type === 'warmup' ? 'Calentamiento' : block.type === 'cooldown' ? 'Vuelta a la calma' : 'Trabajo continuo';

                                            return (
                                                <div key={block.id} className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm relative group">
                                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                        <span className={`text-[10px] font-semibold w-28 uppercase tracking-wider ${bLabelStyle}`}>{bLabel}</span>
                                                        {block.unit === 'dist' ? (
                                                            <input type="number" placeholder="km" value={block.duration} min={0} onChange={e => updateBlock(block.id, 'duration', e.target.value)}
                                                                className="w-14 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-mono p-1 rounded-sm text-center outline-none focus:border-slate-400" />
                                                        ) : (
                                                            <DurationInput value={block.duration} onChange={v => updateBlock(block.id, 'duration', v)} />
                                                        )}
                                                        {!isStr ? (
                                                            <button onClick={() => updateBlock(block.id, 'unit', block.unit === 'dist' ? 'time' : 'dist')}
                                                                className={`text-[9px] font-medium w-8 py-1 rounded-sm transition-colors text-center ${block.unit === 'dist' ? 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
                                                            >{block.unit === 'dist' ? 'km' : 'min'}</button>
                                                        ) : <span className="text-[10px] text-slate-400 w-8 text-center">min</span>}
                                                        <select value={block.zone} onChange={e => updateBlock(block.id, 'zone', e.target.value)}
                                                            className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[10px] font-medium p-1 rounded-sm outline-none focus:border-slate-400 min-w-[80px]">
                                                            {zones.map(z => <option key={z.v} value={z.v}>{z.l}</option>)}
                                                        </select>
                                                        <button onClick={() => removeBlock(block.id)} className="ml-auto text-slate-300 hover:text-red-500"><X size={14} /></button>
                                                    </div>
                                                    {block.type === 'main' && (
                                                        <div className="mt-2 pl-2">
                                                            <input type="text" value={block.details} onChange={e => updateBlock(block.id, 'details', e.target.value)}
                                                                placeholder={isStr ? 'Ej: Sentadilla 4x8, Peso muerto 3x6' : 'Ej: Progresivo suave'}
                                                                className="w-full bg-transparent border-b border-slate-200 dark:border-zinc-700 text-[11px] font-medium py-1 outline-none focus:border-slate-400 dark:focus:border-zinc-500 placeholder-slate-400 dark:placeholder-zinc-600 transition-colors" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/50 flex justify-between items-center">
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
                                {estimatedTSS !== null && <span>TSS Est: <strong className="text-slate-700 dark:text-zinc-300">{estimatedTSS}</strong></span>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                                <button onClick={handleSavePlan} disabled={isSaving} className="px-5 py-2 rounded-md text-[11px] font-bold text-white bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-700 dark:hover:bg-white disabled:opacity-50 transition-colors shadow-sm">
                                    {isSaving ? 'Guardando...' : editingPlanId ? 'Guardar Cambios' : 'Añadir al Plan'}
                                </button>
                            </div>
                        </div>
                    </div >
                </div >
            )}
            {/* MODAL VER ENTRENAMIENTO PLANEADO */}
            {
                viewingPlan && (() => {
                    // Build zone timeline data from blocks
                    const blocks = viewingPlan.descriptionObj?.blocks || [];
                    // Same hex colors as the calendar card zone bars (line ~1048)
                    const KNOWN_ZONES = ['Z1', 'R12', 'Z2', 'R23', 'Z3', 'Z4', 'Z5', 'Z6'];
                    const zoneColors = {
                        Z1: '#94a3b8', R12: '#60a5fa', Z2: '#3b82f6', R23: '#34d399',
                        Z3: '#22c55e', Z4: '#eab308', Z5: '#f97316', Z6: '#ef4444',
                    };
                    const getZoneColor = (z) => zoneColors[z] || '#94a3b8';
                    // Don't normalize — preserve R12/R23 so they show correctly

                    // Flatten all time segments — expand repeats individually so the pattern shows
                    const segments = [];
                    const addSeg = (zone, min) => { const m = Number(min) || 0; if (m > 0) segments.push({ zone, min: m }); };
                    blocks.forEach(b => {
                        if (b.type === 'repeat') {
                            const r = Number(b.repeats) || 1;
                            for (let i = 0; i < r; i++) {
                                (b.steps || []).forEach(s => {
                                    if (s.unit !== 'dist') addSeg(s.zone || 'Z2', Number(s.duration) || 0);
                                });
                            }
                        } else if (b.unit !== 'dist') {
                            addSeg(b.zone || 'Z2', Number(b.duration) || 0);
                        }
                    });
                    const totalMin = segments.reduce((s, x) => s + x.min, 0) || viewingPlan.duration || 1;

                    // Zone totals for legend (aggregate)
                    const zoneTotals = {};
                    segments.forEach(s => { zoneTotals[s.zone] = (zoneTotals[s.zone] || 0) + s.min; });


                    return (
                        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-zinc-800 flex flex-col" style={{ maxHeight: '88vh' }}>

                                {/* ── Header ── */}
                                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                            {getSportIcon(viewingPlan.type)}
                                            {viewingPlan.name || `Entrenamiento de ${viewingPlan.type}`}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wider mt-0.5 capitalize">
                                            {new Date(viewingPlan.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">TSS</p>
                                            <p className="text-xl font-black font-mono text-slate-700 dark:text-zinc-200">{viewingPlan.tss}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 dark:bg-zinc-700" />
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Duración</p>
                                            <p className="text-xl font-black font-mono text-slate-700 dark:text-zinc-200">{formatDuration(viewingPlan.duration)}</p>
                                        </div>
                                        <button onClick={() => setViewingPlan(null)} className="ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Zone Timeline Strip ── */}
                                {segments.length > 0 && (
                                    <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Distribución de zonas</p>
                                        {/* Bar */}
                                        <div className="flex h-5 rounded-full overflow-hidden gap-px">
                                            {segments.map((s, i) => (
                                                <div key={i} title={`${s.zone} — ${s.min}m`}
                                                    style={{ flex: s.min / totalMin, background: getZoneColor(s.zone) }}
                                                    className="dark:opacity-80 transition-all"
                                                />
                                            ))}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {Object.entries(zoneTotals).sort().map(([zone, min]) => (
                                                <span key={zone} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: getZoneColor(zone) }} />
                                                    {zone} <span className="font-mono">{Math.round(min)}m</span>
                                                    <span className="text-slate-300 dark:text-zinc-600">({Math.round(min / totalMin * 100)}%)</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Two columns ── */}
                                <div className="flex flex-1 overflow-hidden min-h-0">

                                    {/* LEFT — Block list */}
                                    <div className="flex-1 overflow-y-auto p-5 border-r border-slate-100 dark:border-zinc-800">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">Estructura</p>

                                        {blocks.length === 0 ? (
                                            <div className="flex items-center justify-center h-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                                                <p className="text-xs text-slate-400 dark:text-zinc-500">Sin estructura definida</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {blocks.map((block, idx) => {
                                                    if (block.type === 'repeat') {
                                                        return (
                                                            <div key={idx} className="rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                                                <div className="flex items-center px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                                                                    <span className="text-xs font-black text-slate-700 dark:text-zinc-300 font-mono mr-1">{block.repeats}×</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Intervalos</span>
                                                                </div>
                                                                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                                                                    {block.steps.map((step, sIdx) => {
                                                                        const isActive = step.type === 'active';
                                                                        return (
                                                                            <div key={sIdx} className="flex items-center justify-between px-3 py-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-1 h-5 rounded-full" style={{ background: isActive ? (zoneColors[step.zone] || '#6366f1') : '#e2e8f0' }} />
                                                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                                                                                        {isActive ? 'Trabajo' : 'Pausa'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-zinc-300">
                                                                                        {formatBlockDuration(step.duration)}<span className="text-[10px] font-normal text-slate-400 ml-px">{step.unit === 'dist' ? 'km' : ''}</span>
                                                                                    </span>
                                                                                    <span className="text-[9px] font-bold px-1.5 py-px rounded border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900">{step.zone}</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    const typeColor = block.type === 'warmup' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : block.type === 'cooldown' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300';
                                                    const typeLabel = block.type === 'warmup' ? 'Cal.' : block.type === 'cooldown' ? 'Vuelta' : 'Trabajo';
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: zoneColors[block.zone] || '#94a3b8' }} />
                                                                <div className="min-w-0">
                                                                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-px rounded mr-1.5 ${typeColor}`}>{typeLabel}</span>
                                                                    {block.details && <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{block.details}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="font-mono text-xs font-bold text-slate-600 dark:text-zinc-300">
                                                                    {formatBlockDuration(block.duration)}<span className="text-[10px] font-normal text-slate-400 ml-px">{block.unit === 'dist' ? 'km' : ''}</span>
                                                                </span>
                                                                <span className="text-[9px] font-bold px-1.5 py-px rounded border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900">{block.zone}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT — Fueling */}
                                    <div className="w-[340px] shrink-0 overflow-y-auto p-5">
                                        <FuelingPanel workout={viewingPlan} />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0 bg-white dark:bg-zinc-900">
                                    <button onClick={(e) => { setViewingPlan(null); handleDeletePlan(e, viewingPlan.id); }} className="px-4 py-2 text-xs rounded-lg font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Eliminar</button>
                                    <button onClick={() => setViewingPlan(null)} className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">Cerrar</button>
                                    <button onClick={() => handleEditPlan(viewingPlan)} className="px-5 py-2 text-xs bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm">Editar</button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            }
        </>
    );
};
