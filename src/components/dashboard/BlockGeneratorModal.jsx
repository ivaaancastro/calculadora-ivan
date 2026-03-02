import React, { useState, useMemo } from 'react';
import { X, Sparkles, CheckCircle2, TrendingUp, Coffee } from 'lucide-react';

// ============================================================
// TRAINING ENGINE v2 — Periodization with Load Continuity
// ============================================================

const getCtlLevel = (ctl) => {
    if (ctl < 35) return 'beginner';
    if (ctl < 55) return 'intermediate';
    if (ctl < 80) return 'advanced';
    return 'elite';
};

const DAY_ROLE_PATTERNS = {
    1: ['KEY'],
    2: ['KEY', 'BASE_LONG'],
    3: ['KEY', 'BASE', 'KEY2'],
    4: ['KEY', 'BASE', 'KEY2', 'BASE_LONG'],
    5: ['KEY', 'BASE', 'KEY2', 'BASE', 'BASE_LONG'],
    6: ['KEY', 'BASE', 'KEY2', 'BASE', 'BASE_LONG', 'BASE'],
    7: ['KEY', 'BASE', 'KEY2', 'BASE', 'BASE_LONG', 'BASE', 'REC'],
};

const ROLE_LABEL = { KEY: 'Clave', KEY2: '2ª Clave', KEY_VO2: 'VO2Max', KEY_SST: 'SST', BASE_LONG: 'Largo', BASE: 'Base', REC: 'Descanso Activo' };

const WEEK_PROGRESSIONS = {
    3: [1.0, 1.1, 0.6],
    4: [1.0, 1.1, 1.2, 0.6],
    5: [1.0, 1.05, 1.1, 1.15, 0.6],
};

const assignDayRoles = (numDays, goal) => {
    const n = Math.max(1, Math.min(numDays, 7));
    let roles = [...(DAY_ROLE_PATTERNS[n] || DAY_ROLE_PATTERNS[7])];
    if (goal === 'mix') {
        roles = roles.map(r => r === 'KEY' ? 'KEY_VO2' : r === 'KEY2' ? 'KEY_SST' : r);
    }
    return roles;
};

// Returns the average weekly TSS from existing plannedWorkouts in the 3 weeks before startDate
const getExistingWeeklyTss = (plannedWorkouts, startDate) => {
    if (!plannedWorkouts || plannedWorkouts.length === 0) return null;
    const start = new Date(startDate + 'T00:00:00');
    const threeWeeksAgo = new Date(start);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const relevant = plannedWorkouts.filter(w => {
        const d = new Date(w.date + 'T00:00:00');
        return d >= threeWeeksAgo && d < start;
    });
    if (relevant.length === 0) return null;
    const totalTss = relevant.reduce((s, w) => s + (w.tss || 0), 0);
    return Math.round(totalTss / 3); // average per week (3 weeks)
};

const generateSession = (sport, role, goal, ctl, weekMultiplier = 1.0) => {
    const level = getCtlLevel(ctl);
    const sportLabel = sport === 'Ride' ? 'Bici' : 'Rodaje';
    const scale = (base, begMod = -1, advMod = 1) => {
        if (level === 'beginner') return Math.max(1, base + begMod);
        if (level === 'advanced' || level === 'elite') return base + advMod;
        return base;
    };
    const isRecovery = weekMultiplier < 0.75;

    if (isRecovery) {
        if (role === 'KEY' || role === 'KEY_VO2') {
            return {
                role, name: `Activación corta — ${sportLabel}`, tss: 35, duration: 45,
                blocks: [
                    { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: 'Calentamiento muy suave', unit: 'time' },
                    {
                        id: 2, type: 'repeat', repeats: 4, steps: [
                            { id: 1, type: 'active', duration: 0.5, zone: 'Z4', unit: 'time' },
                            { id: 2, type: 'recovery', duration: 2, zone: 'Z1', unit: 'time' }
                        ]
                    },
                    { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Vuelta a la calma', unit: 'time' }
                ]
            };
        }
        if (role === 'KEY2' || role === 'KEY_SST') {
            return {
                role, name: `Fondo técnico Z2 — ${sportLabel}`, tss: 40, duration: 55,
                blocks: [
                    { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: 'Calentamiento', unit: 'time' },
                    { id: 2, type: 'main', duration: 35, zone: 'Z2', details: 'Z2 controlado — enfocarte en técnica y fluidez', unit: 'time' },
                    { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
                ]
            };
        }
        if (role === 'BASE_LONG') {
            return {
                role, name: `Fondo largo suave — ${sportLabel}`, tss: 55, duration: 90,
                blocks: [
                    { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: 'Salida muy suave', unit: 'time' },
                    { id: 2, type: 'main', duration: 70, zone: 'Z2', details: 'Aeróbico suave — recuperar manteniendo el volumen', unit: 'time' },
                    { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
                ]
            };
        }
        return {
            role, name: `Descarga activa — ${sportLabel}`, tss: 20, duration: 35,
            blocks: [{ id: 1, type: 'main', duration: 35, zone: 'Z1', details: 'Muy suave — limpiar piernas y recuperar', unit: 'time' }]
        };
    }

    // KEY / base goal
    if ((role === 'KEY' || role === 'KEY2') && goal === 'base') {
        const mainDur = level === 'beginner' ? 50 : level === 'advanced' ? 90 : 65;
        const tempoDur = level === 'beginner' ? 10 : 15;
        return {
            role, name: `${sportLabel} Base Progresivo`,
            tss: Math.round((mainDur * 0.8 + tempoDur * 1.1) * weekMultiplier),
            duration: 15 + mainDur + tempoDur + 10,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: 'Calentamiento suave', unit: 'time' },
                { id: 2, type: 'main', duration: mainDur, zone: 'Z2', details: 'Ritmo aeróbico — deberías poder hablar con comodidad', unit: 'time' },
                { id: 3, type: 'main', duration: tempoDur, zone: 'Z3', details: 'Acabado progresivo — sube el ritmo gradualmente', unit: 'time' },
                { id: 4, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Vuelta a la calma', unit: 'time' },
            ]
        };
    }

    // KEY / umbral goal — Sweet Spot
    if (role === 'KEY' && goal === 'umbral') {
        const repeats = scale(2, -1, 1);
        const intDur = level === 'beginner' ? 12 : 20;
        return {
            role, name: `Sweet Spot ${repeats}×${intDur}' @Z3`,
            tss: Math.round((60 + repeats * 12) * weekMultiplier),
            duration: 15 + repeats * (intDur + 5) + 10,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: 'Calentamiento gradual', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats, steps: [
                        { id: 1, type: 'active', duration: intDur, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 5, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
            ]
        };
    }

    // KEY2 / umbral — Tempo
    if (role === 'KEY2' && goal === 'umbral') {
        const tempoDur = level === 'beginner' ? 20 : level === 'advanced' ? 40 : 30;
        return {
            role, name: `Tempo ${tempoDur}' @Umbral`,
            tss: Math.round((55 + tempoDur * 1.0) * weekMultiplier),
            duration: 15 + tempoDur + 10,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: 'Calentamiento', unit: 'time' },
                { id: 2, type: 'main', duration: tempoDur, zone: 'Z3', details: 'Ritmo tempo sostenido', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Trote de vuelta a la calma', unit: 'time' }
            ]
        };
    }

    // KEY / vo2 — Classic VO2 intervals
    if ((role === 'KEY' || role === 'KEY_VO2') && (goal === 'vo2' || role === 'KEY_VO2')) {
        const repeats = scale(4, -1, 2);
        return {
            role, name: `VO2 ${repeats}×4' @Z5`,
            tss: Math.round((65 + repeats * 6) * weekMultiplier),
            duration: 15 + repeats * 8 + 15,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: 'Cal. + 3×20" de activación a Z4', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats, steps: [
                        { id: 1, type: 'active', duration: 4, zone: 'Z5', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 4, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 15, zone: 'Z1', details: 'Enfriamiento lento', unit: 'time' }
            ]
        };
    }

    // KEY2 / vo2 — Micros
    if ((role === 'KEY2') && goal === 'vo2') {
        const repeats = scale(6, -2, 2);
        return {
            role, name: `Micros ${repeats}×30" @Z6`,
            tss: Math.round((55 + repeats * 5) * weekMultiplier),
            duration: 15 + Math.round(repeats * 1.5) + 15,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: 'Cal. + strides', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats, steps: [
                        { id: 1, type: 'active', duration: 0.5, zone: 'Z6', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 1, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 15, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
            ]
        };
    }

    // KEY_SST (mix goal)
    if (role === 'KEY_SST') {
        const repeats = scale(2, 0, 1);
        return {
            role, name: `SST ${repeats}×20' @Z3`,
            tss: Math.round((65 + repeats * 10) * weekMultiplier),
            duration: 15 + repeats * 25 + 10,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z2', details: 'Calentamiento', unit: 'time' },
                {
                    id: 2, type: 'repeat', repeats, steps: [
                        { id: 1, type: 'active', duration: 20, zone: 'Z3', unit: 'time' },
                        { id: 2, type: 'recovery', duration: 5, zone: 'Z1', unit: 'time' }
                    ]
                },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
            ]
        };
    }

    // BASE_LONG — easy long
    if (role === 'BASE_LONG') {
        const mainDur = level === 'beginner' ? 75 : level === 'advanced' ? 180 : 120;
        const capped = Math.round(mainDur * weekMultiplier);
        return {
            role, name: `${sportLabel} Largo Z2`,
            tss: Math.round(capped * 0.6),
            duration: capped + 25,
            blocks: [
                { id: 1, type: 'warmup', duration: 15, zone: 'Z1', details: 'Salida muy suave', unit: 'time' },
                { id: 2, type: 'main', duration: capped, zone: 'Z2', details: 'Fondo aeróbico constante — tienes que poder hablar con frases completas', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 10, zone: 'Z1', details: 'Vuelta a la calma', unit: 'time' }
            ]
        };
    }

    // BASE — easy support day
    if (role === 'BASE') {
        const mainDur = level === 'beginner' ? 30 : level === 'advanced' ? 50 : 40;
        return {
            role, name: `${sportLabel} Suave Z2`,
            tss: Math.round(mainDur * 0.65),
            duration: mainDur + 15,
            blocks: [
                { id: 1, type: 'warmup', duration: 10, zone: 'Z1', details: 'Calentamiento', unit: 'time' },
                { id: 2, type: 'main', duration: mainDur, zone: 'Z2', details: 'Recuperación activa entre sesiones duras', unit: 'time' },
                { id: 3, type: 'cooldown', duration: 5, zone: 'Z1', details: 'Enfriamiento', unit: 'time' }
            ]
        };
    }

    // REC
    return {
        role, name: 'Recuperación Activa',
        tss: 20, duration: 35,
        blocks: [{ id: 1, type: 'main', duration: 35, zone: 'Z1', details: 'Ultra suave — activar sin fatigar', unit: 'time' }]
    };
};

const buildPlan = ({ weeks, startDate, daysAvailable, goal, sport, ctl, maxHoursWeek, baseWeeklyTss }) => {
    const progTable = WEEK_PROGRESSIONS[Math.min(weeks, 5)] || WEEK_PROGRESSIONS[4];
    const sortedDays = [...daysAvailable].sort((a, b) => Number(a) - Number(b));
    const roles = assignDayRoles(sortedDays.length, goal);

    const plan = [];
    let currentDate = new Date(startDate + 'T00:00:00');

    for (let w = 0; w < weeks; w++) {
        const mult = progTable[w] ?? 0.6;
        const weekSessions = [];
        let roleIndex = 0;

        for (let d = 0; d < 7; d++) {
            const dow = currentDate.getDay().toString();
            const dateStr = currentDate.toLocaleDateString('en-CA');

            if (sortedDays.includes(dow)) {
                const role = roles[roleIndex % roles.length];
                const session = generateSession(sport, role, goal, ctl, mult);
                const maxMinutes = maxHoursWeek * 60 * 0.7;
                weekSessions.push({
                    date: dateStr,
                    ...session,
                    duration: Math.round(Math.min(session.duration, maxMinutes)),
                    tss: Math.round(session.tss),
                });
                roleIndex++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const weeklyTss = weekSessions.reduce((s, s2) => s + s2.tss, 0);
        plan.push({
            week: w + 1,
            isRecovery: mult < 0.75,
            weeklyTss,
            weeklyHours: Number((weekSessions.reduce((s, s2) => s + s2.duration, 0) / 60).toFixed(1)),
            sessions: weekSessions,
        });
    }
    return plan;
};

// ============================================================
// MODAL COMPONENT
// ============================================================

export const BlockGeneratorModal = ({ isOpen, onClose, onGenerate, currentPmcData, plannedWorkouts }) => {
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('base');
    const [sport, setSport] = useState('Ride');
    const [weeks, setWeeks] = useState(4);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('en-CA');
    });
    const [daysAvailable, setDaysAvailable] = useState(['1', '3', '6']);
    const [maxHoursWeek, setMaxHoursWeek] = useState(8);

    // CTL at start date from projected PMC
    const startingCtl = useMemo(() => {
        if (!currentPmcData || currentPmcData.length === 0) return 45;
        const sorted = [...currentPmcData].filter(d => d.ctl != null).sort((a, b) => a.date > b.date ? 1 : -1);
        const past = sorted.filter(d => d.date <= startDate);
        if (past.length > 0) return Math.round(past[past.length - 1].ctl);
        if (sorted.length > 0) return Math.round(sorted[0].ctl);
        return 45;
    }, [currentPmcData, startDate]);

    // Average TSS/week from existing planned workouts in the 3 weeks BEFORE startDate
    const existingWeeklyTss = useMemo(() => getExistingWeeklyTss(plannedWorkouts, startDate), [plannedWorkouts, startDate]);

    // Base weekly TSS: use existing load if available (continuity), else CTL-based
    const baseWeeklyTss = useMemo(() => {
        const ctlBase = startingCtl * 7;
        if (existingWeeklyTss && existingWeeklyTss > ctlBase * 0.7) {
            // Existing load is significant — use it as base for continuity
            return Math.max(ctlBase, existingWeeklyTss);
        }
        return ctlBase;
    }, [startingCtl, existingWeeklyTss]);

    // Day roles preview
    const dayRoles = useMemo(() => assignDayRoles(daysAvailable.length, goal), [daysAvailable, goal]);

    // Full plan projection (only when on step 3)
    const projection = useMemo(() => {
        if (step !== 3 || daysAvailable.length === 0) return null;
        return buildPlan({ weeks, startDate, daysAvailable, goal, sport, ctl: startingCtl, maxHoursWeek, baseWeeklyTss });
    }, [step, weeks, startDate, daysAvailable, goal, sport, startingCtl, maxHoursWeek, baseWeeklyTss]);

    const resetAndClose = () => { setStep(1); onClose(); };

    const toggleDay = (dayStr) => {
        setDaysAvailable(prev =>
            prev.includes(dayStr) ? prev.filter(d => d !== dayStr) : [...prev, dayStr]
        );
    };

    const handleFinalGenerate = () => {
        if (!projection) return;
        onGenerate({ goal, sport, weeks, startDate, daysAvailable, maxHoursWeek, projection });
        resetAndClose();
    };

    if (!isOpen) return null;

    const GOALS = [
        { id: 'base', label: 'Base aeróbica (Z2)', desc: 'Volumen fácil. Fondo en Z2 con acabado progresivo.' },
        { id: 'umbral', label: 'Umbral / Medio Fondo', desc: 'Sweet Spot (Z3-Z4) y Tempo. Para mejorar FTP.' },
        { id: 'vo2', label: 'VO2Max', desc: 'Intervalos cortos muy intensos @Z5. Para elevar el techo aeróbico.' },
        { id: 'mix', label: 'Polarizado 80/20', desc: '2 sesiones muy duras (VO2 + SST), el resto en Z1-Z2 estricto.' },
    ];

    const DAYS = [
        { val: '1', label: 'Lu' }, { val: '2', label: 'Ma' }, { val: '3', label: 'Mi' },
        { val: '4', label: 'Ju' }, { val: '5', label: 'Vi' }, { val: '6', label: 'Sa' }, { val: '0', label: 'Do' }
    ];

    const fmtHours = (min) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={resetAndClose} />

            {/* Side Panel */}
            <div className="relative h-full w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-zinc-100 text-base tracking-tight">Generador de Bloques</h2>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            Paso {step} de 3 — {step === 1 ? 'Objetivo' : step === 2 ? 'Disponibilidad' : 'Plan generado'}
                        </p>
                    </div>
                    <button onClick={resetAndClose} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress */}
                <div className="h-0.5 bg-slate-100 dark:bg-zinc-900 flex">
                    {[1, 2, 3].map(s => <div key={s} className={`h-full flex-1 transition-all duration-300 ${step >= s ? 'bg-indigo-500' : ''}`} />)}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* ===== STEP 1 ===== */}
                    {step === 1 && (
                        <div className="p-6 space-y-6">
                            {/* Sport */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Deporte</label>
                                <div className="flex gap-3">
                                    {[{ id: 'Ride', label: 'Ciclismo' }, { id: 'Run', label: 'Running' }].map(s => (
                                        <button key={s.id} onClick={() => setSport(s.id)}
                                            className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${sport === s.id ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-slate-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-400'}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Goal */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Foco del bloque</label>
                                <div className="space-y-2">
                                    {GOALS.map(g => (
                                        <button key={g.id} onClick={() => setGoal(g.id)}
                                            className={`w-full p-4 rounded-lg border text-left transition-all ${goal === g.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'}`}>
                                            <div className={`font-bold text-sm mb-0.5 ${goal === g.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-zinc-300'}`}>{g.label}</div>
                                            <div className="text-[11px] text-slate-400 dark:text-zinc-500">{g.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors">
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* ===== STEP 2 ===== */}
                    {step === 2 && (
                        <div className="p-6 space-y-6">
                            {/* Duration & Start */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Semanas</label>
                                    <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-sm font-medium">
                                        <option value={3}>3 sem (2+1)</option>
                                        <option value={4}>4 sem (3+1)</option>
                                        <option value={5}>5 sem (4+1)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Inicio</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-sm font-mono" />
                                </div>
                            </div>

                            {/* Load context box */}
                            <div className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-4 border border-slate-200 dark:border-zinc-800 space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Contexto de carga</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">CTL en esa fecha</p>
                                        <p className="text-xl font-black font-mono text-slate-800 dark:text-zinc-100">{startingCtl}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">Carga/sem previa</p>
                                        {existingWeeklyTss
                                            ? <p className="text-xl font-black font-mono text-slate-800 dark:text-zinc-100">{existingWeeklyTss} TSS</p>
                                            : <p className="text-sm text-slate-400 dark:text-zinc-500 font-medium mt-1">Sin datos previos</p>
                                        }
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                        Base semanal del bloque: <span className="font-black text-slate-700 dark:text-zinc-200">{baseWeeklyTss} TSS</span>
                                        {existingWeeklyTss && existingWeeklyTss > startingCtl * 7 * 0.7 &&
                                            <span className="ml-1 text-indigo-500 font-bold">(ajustado por carga previa)</span>
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Training days */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Días disponibles</label>
                                <div className="flex gap-1.5 mb-3">
                                    {DAYS.map(({ val, label }) => {
                                        const selected = daysAvailable.includes(val);
                                        return (
                                            <button key={val} onClick={() => toggleDay(val)}
                                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${selected ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {daysAvailable.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap">
                                        {dayRoles.map((role, i) => (
                                            <span key={i} className="text-[10px] px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-slate-600 dark:text-zinc-400 font-bold">
                                                {ROLE_LABEL[role]}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Max hours */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 flex justify-between">
                                    <span>Horas máx / semana</span>
                                    <span className="text-slate-700 dark:text-zinc-300">{maxHoursWeek}h</span>
                                </label>
                                <input type="range" min="3" max="25" step="0.5" value={maxHoursWeek} onChange={e => setMaxHoursWeek(Number(e.target.value))}
                                    className="w-full accent-indigo-500" />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1"><span>3h</span><span>10h</span><span>15h</span><span>25h</span></div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="w-1/3 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg font-bold text-sm transition-colors hover:bg-slate-200">Volver</button>
                                <button onClick={() => setStep(3)} disabled={daysAvailable.length === 0}
                                    className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                    Ver plan <Sparkles size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3 ===== */}
                    {step === 3 && projection && (
                        <div className="p-6 space-y-5">
                            {/* Summary row */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'CTL Inicio', val: startingCtl },
                                    { label: 'TSS base/sem', val: baseWeeklyTss },
                                    { label: 'Nivel', val: getCtlLevel(startingCtl).charAt(0).toUpperCase() + getCtlLevel(startingCtl).slice(1) },
                                ].map(({ label, val }) => (
                                    <div key={label} className="bg-slate-50 dark:bg-zinc-900 rounded-lg p-3 border border-slate-100 dark:border-zinc-800">
                                        <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
                                        <p className="text-lg font-black font-mono text-slate-800 dark:text-zinc-100">{val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Week × Session table */}
                            {projection.map((week) => (
                                <div key={week.week} className={`rounded-lg border overflow-hidden ${week.isRecovery ? 'border-slate-200 dark:border-zinc-800 opacity-75' : 'border-slate-200 dark:border-zinc-800'}`}>
                                    {/* Week header */}
                                    <div className={`px-4 py-2 flex items-center justify-between ${week.isRecovery ? 'bg-slate-50 dark:bg-zinc-900' : 'bg-slate-50 dark:bg-zinc-900'}`}>
                                        <div className="flex items-center gap-2">
                                            {week.isRecovery ? <Coffee size={13} className="text-slate-400" /> : <TrendingUp size={13} className="text-indigo-500" />}
                                            <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Semana {week.week}</span>
                                            {week.isRecovery && <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">— Descarga</span>}
                                        </div>
                                        <div className="flex gap-4 text-right">
                                            <span className="text-[10px] font-mono font-black text-slate-500 dark:text-zinc-400">{week.weeklyTss} TSS</span>
                                            <span className="text-[10px] font-mono font-black text-slate-500 dark:text-zinc-400">{week.weeklyHours}h</span>
                                        </div>
                                    </div>

                                    {/* Sessions list */}
                                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                        {week.sessions.map((sess, i) => {
                                            const dayName = new Date(sess.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                                            const isHard = ['KEY', 'KEY2', 'KEY_VO2', 'KEY_SST'].includes(sess.role);
                                            return (
                                                <div key={i} className="flex items-center justify-between px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isHard ? 'bg-indigo-500' : sess.role === 'BASE_LONG' ? 'bg-slate-400 dark:bg-zinc-500' : 'bg-slate-200 dark:bg-zinc-700'}`} />
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold capitalize">{dayName}</p>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{sess.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs font-black font-mono text-slate-600 dark:text-zinc-300">{sess.tss} TSS</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{fmtHours(sess.duration)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(2)} className="w-1/3 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg font-bold text-sm transition-colors hover:bg-slate-200">Volver</button>
                                <button onClick={handleFinalGenerate} className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                    Inyectar al Calendario <CheckCircle2 size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
