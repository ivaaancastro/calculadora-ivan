// Lógica pura del Calendario (extraída de CalendarPage.jsx, PR 8a). Sin React: testeable.
import { getEffectiveTSS, getSportCategory, SPORT_LOAD_CONFIG } from './tssEngine';
import { ZONE_PACE } from './calendarTemplates';
import { toDateKey } from './dates';

/** Fecha guardada en sessionStorage o ahora. */
export const loadSavedCalendarDate = (storage = sessionStorage) => {
    const savedDate = storage.getItem('forma_calendar_date');
    if (savedDate) {
        const d = new Date(savedDate);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
};

/** Los 7 días (lunes a domingo) de la semana de `date`. */
export const getWeekDays = (date) => {
    const today = new Date(date);
    const dow = today.getDay() || 7; // Monday = 1
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + 1);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
};

/** Reales + planificadas agrupadas por día (YYYY-MM-DD). */
export const groupActivitiesByDate = (activities, plannedWorkouts) => {
    const map = {};
    if (activities) {
        activities.forEach(act => {
            const dateKey = toDateKey(act.date);
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push({ ...act, isPlanned: false });
        });
    }
    if (plannedWorkouts) {
        plannedWorkouts.forEach(pAct => {
            const dateKey = toDateKey(pAct.date);
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push({ ...pAct, isPlanned: true });
        });
    }
    return map;
};

/** Datos PMC indexados por fecha. */
export const indexPmcByDate = (chartData) => {
    const map = {};
    (chartData || []).forEach(d => { map[d.date] = d; });
    return map;
};

/** Proyección PMC hacia delante (90 días) con el TSS de los entrenos planificados. */
export const projectPmc = (pmcByDate, plannedWorkouts, today = toDateKey(new Date())) => {
    const map = {};

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
        const dk = toDateKey(p.date);
        plannedTssByDate[dk] = (plannedTssByDate[dk] || 0) + getEffectiveTSS(p);
    });

    // Project forward day by day from today up to 90 days out
    let ctl = lastPmc.ctl;
    let atl = lastPmc.atl;
    const startDate = new Date(lastDate + 'T00:00:00');
    for (let i = 1; i <= 90; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dk = toDateKey(d);
        const dayTSS = plannedTssByDate[dk] || 0;
        ctl = ctl + (dayTSS - ctl) / 42;
        atl = atl + (dayTSS - atl) / 7;
        map[dk] = { date: dk, ctl, atl, tcb: ctl - atl, projected: true };
    }
    return map;
};

/** Cumplimiento plan vs. ejecución de un día. */
export const getComplianceForDay = (dateKey, acts) => {
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

/** Cuadrícula del mes: semanas de 7 días lunes→domingo. */
export const buildCalendarGrid = (year, month) => {
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
};

/** Minutos totales de una lista de bloques (la distancia se pasa a minutos con el ritmo por zona). */
export const estimateBlocksMinutes = (blocks, planType) => {
    const sportPace = ZONE_PACE[planType] || ZONE_PACE.Run;
    let totalMins = 0;
    blocks.forEach(b => {
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
    return totalMins;
};

/** Recomendación del Smart Coach para un día. */
export const getSmartRecommendation = ({ selectedDateForPlan, activities, plannedWorkouts, currentMetrics }) => {
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
                last7TSS += getEffectiveTSS(a);
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
                weekActualTSS += getEffectiveTSS(a);
                actualDays.add(toDateKey(ad));
            }
        });
    }
    if (plannedWorkouts) {
        plannedWorkouts.forEach(p => {
            const pd = new Date(p.date);
            if (pd >= weekStart && pd < weekEnd && toDateKey(pd) !== toDateKey(selectedDate)) {
                weekPlannedTSS += getEffectiveTSS(p);
                plannedDays.add(toDateKey(pd));
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
    const yesterdayKey = toDateKey(yesterday);
    let yesterdayTSS = 0;
    if (activities) {
        activities.forEach(a => {
            if (toDateKey(a.date) === yesterdayKey) yesterdayTSS += getEffectiveTSS(a);
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

/** Bloques de entrenamiento a partir de texto pegado (parser «magic paste»). */
export const parsePasteText = (pasteText, planType) => {
    const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const newBlocks = [];
    let currentRepeat = null;

    lines.forEach((line) => {
        const lowerLine = line.toLowerCase();
        const id = Date.now() + Math.random();

        // Extract duration
        let duration = 0;
        let durationMatch = lowerLine.match(/^(\d+(?:\.\d+)?)(m|min|s|sec|h)\b/);
        if (durationMatch) {
            const val = parseFloat(durationMatch[1]);
            if (durationMatch[2] === 'm' || durationMatch[2] === 'min') duration = val;
            else if (durationMatch[2] === 's' || durationMatch[2] === 'sec') duration = val / 60;
            else if (durationMatch[2] === 'h') duration = val * 60;
        }

        // Extract Zone
        let zone = planType === 'WeightTraining' ? 'Z3' : 'Z2';
        let zoneMatch = lowerLine.match(/z([1-7])/);
        if (zoneMatch) zone = `Z${zoneMatch[1]}`;

        // Circuit Start ("4x")
        let repeatMatch = lowerLine.match(/^(\d+)\s*x\s*$/) || lowerLine.match(/^(\d+)\s*series\s*$/);
        if (repeatMatch) {
            currentRepeat = {
                id, type: 'repeat', repeats: parseInt(repeatMatch[1]),
                details: 'Circuito Auto-generado', steps: []
            };
            newBlocks.push(currentRepeat);
            return;
        }

        const isRecovery = lowerLine.includes('descanso') || lowerLine.includes('recu') || lowerLine.includes('pausa');

        if (currentRepeat) {
            if (lowerLine.includes('calent') || lowerLine.includes('warmup') || lowerLine.includes('movilidad') || lowerLine.includes('enfri') || lowerLine.includes('estirar') || lowerLine.includes('cooldown') || lowerLine.includes('vuelta a la calma')) {
                currentRepeat = null;
            } else {
                currentRepeat.steps.push({
                    id: Date.now() + Math.random(),
                    type: isRecovery ? 'recovery' : 'active',
                    duration: duration || (isRecovery ? 2 : 5),
                    unit: 'time',
                    zone: zoneMatch ? zone : (isRecovery ? 'Z1' : zone),
                    details: line.replace(/^(\d+(?:\.\d+)?)(m|min|s|sec|h)/i, '').trim(),
                    targetType: 'none',
                    targetValue: ''
                });
                return;
            }
        }

        // Warmup
        if (lowerLine.includes('calent') || lowerLine.includes('warmup') || lowerLine.includes('movilidad')) {
            newBlocks.push({ id, type: 'warmup', duration: duration || 10, unit: 'time', zone: zoneMatch ? zone : 'Z1', details: line, targetType: 'none', targetValue: '' });
        }
        // Cooldown
        else if (lowerLine.includes('enfri') || lowerLine.includes('estirar') || lowerLine.includes('cooldown') || lowerLine.includes('vuelta a la calma')) {
            newBlocks.push({ id, type: 'cooldown', duration: duration || 10, unit: 'time', zone: zoneMatch ? zone : 'Z1', details: line, targetType: 'none', targetValue: '' });
        }
        // Inline Repeat ("3x10 Press Banca")
        else if (lowerLine.match(/(\d+)\s*x/)) {
            const match = lowerLine.match(/(\d+)\s*x/);
            newBlocks.push({
                id, type: 'repeat', repeats: match ? parseInt(match[1]) : 3, details: line,
                steps: [{ id: Date.now() + Math.random(), type: 'active', duration: duration || 5, unit: 'time', zone: zoneMatch ? zone : (planType === 'WeightTraining' ? 'Z3' : 'Z4'), details: line.replace(/^(\d+)\s*x/i, '').trim(), targetType: 'none', targetValue: '' }]
            });
        }
        // Normal Working Set
        else {
            newBlocks.push({ id, type: 'main', duration: duration || 15, unit: 'time', zone: zone, details: line, targetType: 'none', targetValue: '' });
        }
    });
    return newBlocks;
};

// ── Edición de bloques del plan (funciones puras sobre la lista `blocks`) ──

export const EMPTY_PLAN = () => ({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });

/** Copia los bloques de una plantilla con ids nuevos. */
export const stampTemplateBlocks = (template) => template.blocks.map(b => ({
    ...b,
    id: Date.now() + Math.random(),
    steps: b.steps ? b.steps.map(s => ({ ...s, id: Date.now() + Math.random() })) : undefined
}));

/** Añade un bloque (o un circuito `repeat` con su par trabajo/recuperación). */
export const appendBlock = (blocks, blockType) => {
    if (blockType === 'repeat') {
        const ts = Date.now();
        return [...blocks, {
            id: ts, type: 'repeat', repeats: 4,
            steps: [
                { id: ts + 1, type: 'active', unit: 'time', duration: 3, zone: 'Z4', targetType: 'none', targetValue: '', details: '' },
                { id: ts + 2, type: 'recovery', unit: 'time', duration: 2, zone: 'Z1', targetType: 'none', targetValue: '', details: '' },
            ]
        }];
    }
    return [...blocks, { id: Date.now(), type: blockType, duration: 10, zone: 'Z2', details: '', unit: 'time', targetType: 'none', targetValue: '' }];
};

/** Añade un paso (`pair` = trabajo + recuperación) a un bloque `repeat`. */
export const appendStep = (blocks, blockId, type) => {
    if (type === 'pair') {
        const ts = Date.now();
        const workStep = { id: ts + 1, type: 'active', unit: 'time', duration: 3, zone: 'Z4', targetType: 'none', targetValue: '', details: '' };
        const restStep = { id: ts + 2, type: 'recovery', unit: 'time', duration: 2, zone: 'Z1', targetType: 'none', targetValue: '', details: '' };
        return blocks.map(b => b.id === blockId ? { ...b, steps: [...b.steps, workStep, restStep] } : b);
    }
    const newStep = {
        id: Date.now() + Math.random(),
        type,
        unit: 'time',
        duration: type === 'active' ? 3 : 2,
        zone: type === 'active' ? 'Z4' : 'Z1',
        targetType: 'none',
        targetValue: '',
        details: ''
    };
    return blocks.map(b => b.id === blockId ? { ...b, steps: [...b.steps, newStep] } : b);
};

export const updateStepIn = (blocks, blockId, stepId, field, value) => blocks.map(b => b.id === blockId ? {
    ...b,
    steps: b.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s)
} : b);

export const removeStepFrom = (blocks, blockId, stepId) => blocks.map(b => b.id === blockId ? {
    ...b,
    steps: b.steps.filter(s => s.id !== stepId)
} : b);

export const updateBlockIn = (blocks, id, field, value) => blocks.map(b => b.id === id ? { ...b, [field]: value } : b);

export const removeBlockFrom = (blocks, id) => blocks.map(b => b.id === id ? { ...b, isDeleted: true } : b).filter(b => !b.isDeleted);

/** Mueve el bloque `from` a la posición `to`. */
export const reorderBlocks = (blocks, from, to) => {
    const newBlocks = [...blocks];
    const [draggedItem] = newBlocks.splice(from, 1);
    newBlocks.splice(to, 0, draggedItem);
    return newBlocks;
};

/** Bloques guardados en `plan.description` (JSON o ya objeto); [] si no se puede leer. */
export const parsePlanBlocks = (plan) => {
    let blocks = [];
    try {
        const desc = typeof plan.description === 'string' ? JSON.parse(plan.description) : plan.description;
        blocks = desc?.blocks || [];
    } catch { /* descripción no válida: sin bloques */ }
    return blocks;
};

/** Estado del formulario a partir de un plan guardado. */
export const planToFormState = (plan) => ({
    type: plan.type || 'Run',
    name: plan.name || '',
    tss: plan.tss || 50,
    duration: plan.duration || 60,
    blocks: parsePlanBlocks(plan),
});

/** Objeto que se envía a Supabase al guardar el formulario. */
export const buildPlanPayload = (date, newPlan) => ({
    date: date.toISOString(),
    type: newPlan.type,
    name: newPlan.name || `Plan ${newPlan.type}`,
    tss: Number(newPlan.tss),
    duration: Number(newPlan.duration),
    description: JSON.stringify({ blocks: newPlan.blocks })
});

// ── Resumen semanal de la vista de mes ──

/** TSS realizado/planificado, duración y distancia (m) de una semana de la cuadrícula. */
export const computeWeekStats = (week, activitiesByDate) => {
    let weekRealizedTSS = 0; let weekPlannedTSS = 0; let weekDuration = 0; let weekDist = 0;
    week.forEach(day => {
        const dateKey = toDateKey(day.date);
        const acts = activitiesByDate[dateKey] || [];
        acts.forEach(a => {
            const cat = a.sportCategory || getSportCategory(a.type || '');
            const cfg = SPORT_LOAD_CONFIG[cat] || SPORT_LOAD_CONFIG.other;
            if (cfg.countsForWeekly) {
                if (a.isPlanned) weekPlannedTSS += (a.tss || 0);
                else weekRealizedTSS += (a.tss || 0);
            }
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
                } catch { /* descripción no válida: sin distancia */ }
                weekDist += planDist * 1000;
            } else {
                weekDist += (a.distance || 0);
            }
        });
    });
    return { weekRealizedTSS, weekPlannedTSS, weekDuration, weekDist };
};

/** PMC del último día de la semana con datos (real o proyectado); {} si no hay. */
export const findWeekPmc = (week, fullPmcByDate) => {
    for (let di = 6; di >= 0; di--) {
        const dk = toDateKey(week[di].date);
        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
    }
    return {};
};

/** PMC más reciente (hasta 7 días) anterior a la semana; {} si no hay. */
export const findPrevWeekPmc = (week, fullPmcByDate) => {
    const d = new Date(week[0].date);
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 7; i++) {
        const dk = toDateKey(d);
        if (fullPmcByDate[dk]) return fullPmcByDate[dk];
        d.setDate(d.getDate() - 1);
    }
    return {};
};

/** Número de semana ISO a partir del jueves de la semana (`week[3]`). */
export const getWeekNumber = (week) => {
    const d = new Date(week[3].date); // Thursday of the week
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};
