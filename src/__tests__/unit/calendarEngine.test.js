import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    loadSavedCalendarDate, getWeekDays, groupActivitiesByDate, indexPmcByDate, 
    getComplianceForDay, buildCalendarGrid, estimateBlocksMinutes, 
    parsePasteText, stampTemplateBlocks, appendBlock, appendStep, updateStepIn, removeStepFrom,
    updateBlockIn, removeBlockFrom, reorderBlocks, parsePlanBlocks, planToFormState,
    buildPlanPayload, computeWeekStats, findWeekPmc, getWeekNumber, EMPTY_PLAN,
} from '../../utils/calendarEngine';
import { WORKOUT_TEMPLATES } from '../../utils/calendarTemplates';

const key = (d) => d.toLocaleDateString('en-CA');
afterEach(() => vi.useRealTimers());

describe('loadSavedCalendarDate', () => {
    it('devuelve la fecha guardada si es válida', () => {
        const storage = { getItem: () => '2026-03-10T00:00:00.000Z' };
        expect(loadSavedCalendarDate(storage).toISOString()).toBe('2026-03-10T00:00:00.000Z');
    });
    it('cae a "ahora" si no hay valor o es inválido', () => {
        vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
        expect(loadSavedCalendarDate({ getItem: () => null }).toISOString()).toBe('2026-06-15T10:00:00.000Z');
        expect(loadSavedCalendarDate({ getItem: () => 'basura' }).toISOString()).toBe('2026-06-15T10:00:00.000Z');
    });
});

describe('getWeekDays / buildCalendarGrid', () => {
    it('la semana empieza en lunes (también si la fecha es domingo)', () => {
        const wed = getWeekDays(new Date(2026, 5, 17));
        expect(key(wed[0])).toBe('2026-06-15');
        expect(key(wed[6])).toBe('2026-06-21');
        expect(key(getWeekDays(new Date(2026, 5, 21))[0])).toBe('2026-06-15');
    });
    it('la cuadrícula de junio 2026 tiene 5 semanas de 7 días con relleno de otros meses', () => {
        const weeks = buildCalendarGrid(2026, 5);
        expect(weeks).toHaveLength(5);
        weeks.forEach(w => expect(w).toHaveLength(7));
        expect(key(weeks[0][0].date)).toBe('2026-06-01');
        expect(weeks[0][0].isCurrentMonth).toBe(true);
        expect(key(weeks[4][6].date)).toBe('2026-07-05');
        expect(weeks[4][6].isCurrentMonth).toBe(false);
    });
    it('rellena con días del mes anterior cuando el 1 no es lunes', () => {
        const weeks = buildCalendarGrid(2026, 6); // julio 2026 empieza en miércoles
        expect(key(weeks[0][0].date)).toBe('2026-06-29');
        expect(weeks[0][0].isCurrentMonth).toBe(false);
        expect(weeks[0][2].isCurrentMonth).toBe(true);
    });
});

describe('agrupación y PMC', () => {
    it('agrupa reales y planificadas por día marcando isPlanned', () => {
        const map = groupActivitiesByDate(
            [{ id: 1, date: '2026-06-15T08:00:00' }],
            [{ id: 2, date: '2026-06-15T18:00:00' }, { id: 3, date: '2026-06-16T08:00:00' }],
        );
        expect(map['2026-06-15'].map(a => [a.id, a.isPlanned])).toEqual([[1, false], [2, true]]);
        expect(map['2026-06-16']).toHaveLength(1);
        expect(groupActivitiesByDate(undefined, undefined)).toEqual({});
    });
    it('indexa el PMC por fecha', () => {
        expect(indexPmcByDate([{ date: 'a', ctl: 1 }, { date: 'b', ctl: 2 }]).b.ctl).toBe(2);
        expect(indexPmcByDate(null)).toEqual({});
    });
});

describe('getComplianceForDay', () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const past = key(new Date(today.getTime() - 5 * 864e5));
    const future = key(new Date(today.getTime() + 5 * 864e5));
    it('null si no hay plan', () => expect(getComplianceForDay(past, [{ isPlanned: false, tss: 10 }])).toBeNull());
    it('future / missed / partial / done', () => {
        const plan = { isPlanned: true, tss: 100 };
        expect(getComplianceForDay(future, [plan]).status).toBe('future');
        expect(getComplianceForDay(past, [plan]).status).toBe('missed');
        expect(getComplianceForDay(past, [plan, { isPlanned: false, tss: 60 }])).toMatchObject({ status: 'partial', pct: 60 });
        expect(getComplianceForDay(past, [plan, { isPlanned: false, tss: 95 }])).toMatchObject({ status: 'done', pct: 95 });
        expect(getComplianceForDay(past, [plan, { isPlanned: false, tss: 10 }]).status).toBe('missed');
    });
});

describe('bloques', () => {
    const blocks = [
        { id: 1, type: 'warmup', duration: 10, zone: 'Z1', unit: 'time' },
        { id: 2, type: 'repeat', repeats: 4, steps: [{ id: 21, unit: 'dist', duration: 1, zone: 'Z4' }, { id: 22, unit: 'time', duration: 2, zone: 'Z1' }] },
        { id: 3, type: 'main', duration: 2, zone: 'Z2', unit: 'dist' },
    ];
    it('estima minutos usando el ritmo por zona', () => {
        // 10 + 4*(1*4.5 + 2) + 2*6.0
        expect(estimateBlocksMinutes(blocks, 'Run')).toBeCloseTo(10 + 4 * 6.5 + 12, 5);
        expect(estimateBlocksMinutes([], 'Run')).toBe(0);
        // deporte desconocido -> ritmo de Run
        expect(estimateBlocksMinutes(blocks, 'X')).toBe(estimateBlocksMinutes(blocks, 'Run'));
    });
    it('añade bloques simples y circuitos', () => {
        expect(appendBlock([], 'warmup')[0]).toMatchObject({ type: 'warmup', duration: 10, zone: 'Z2' });
        const rep = appendBlock([], 'repeat')[0];
        expect(rep).toMatchObject({ type: 'repeat', repeats: 4 });
        expect(rep.steps.map(s => s.type)).toEqual(['active', 'recovery']);
    });
    it('añade pasos y pares a un repeat sin tocar otros bloques', () => {
        const withPair = appendStep(blocks, 2, 'pair');
        expect(withPair[1].steps).toHaveLength(4);
        expect(withPair[0]).toBe(blocks[0]);
        const active = appendStep(blocks, 2, 'active')[1].steps.at(-1);
        expect(active).toMatchObject({ type: 'active', duration: 3, zone: 'Z4' });
        expect(appendStep(blocks, 2, 'recovery')[1].steps.at(-1)).toMatchObject({ duration: 2, zone: 'Z1' });
    });
    it('actualiza / elimina pasos y bloques', () => {
        expect(updateStepIn(blocks, 2, 21, 'zone', 'Z5')[1].steps[0].zone).toBe('Z5');
        expect(removeStepFrom(blocks, 2, 21)[1].steps).toHaveLength(1);
        expect(updateBlockIn(blocks, 1, 'duration', 99)[0].duration).toBe(99);
        expect(removeBlockFrom(blocks, 1).map(b => b.id)).toEqual([2, 3]);
    });
    it('reordena', () => {
        expect(reorderBlocks(blocks, 0, 2).map(b => b.id)).toEqual([2, 3, 1]);
        expect(blocks.map(b => b.id)).toEqual([1, 2, 3]);
    });
    it('estampa ids nuevos en las plantillas sin mutarlas', () => {
        const tpl = WORKOUT_TEMPLATES.Run.find(t => t.blocks.some(b => b.steps));
        const stamped = stampTemplateBlocks(tpl);
        expect(stamped).toHaveLength(tpl.blocks.length);
        expect(stamped[0].id).not.toBe(1);
        expect(tpl.blocks[0].id).toBe(1);
    });
});

describe('persistencia del plan', () => {
    it('lee bloques de JSON, de objeto y tolera basura', () => {
        const b = [{ id: 1 }];
        expect(parsePlanBlocks({ description: JSON.stringify({ blocks: b }) })).toEqual(b);
        expect(parsePlanBlocks({ description: { blocks: b } })).toEqual(b);
        expect(parsePlanBlocks({ description: '{no json' })).toEqual([]);
        expect(parsePlanBlocks({})).toEqual([]);
    });
    it('rellena el formulario con valores por defecto', () => {
        expect(planToFormState({})).toEqual({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
        expect(planToFormState({ type: 'Ride', name: 'x', tss: 70, duration: 90 })).toMatchObject({ type: 'Ride', tss: 70 });
        expect(EMPTY_PLAN()).toEqual({ type: 'Run', name: '', tss: 50, duration: 60, blocks: [] });
    });
    it('construye el payload', () => {
        const d = new Date('2026-06-15T10:00:00Z');
        const p = buildPlanPayload(d, { type: 'Run', name: '', tss: '40', duration: '30', blocks: [{ id: 1 }] });
        expect(p).toEqual({ date: d.toISOString(), type: 'Run', name: 'Plan Run', tss: 40, duration: 30, description: '{"blocks":[{"id":1}]}' });
    });
});

describe('parsePasteText', () => {
    it('detecta calentamiento, enfriamiento y series', () => {
        const blocks = parsePasteText('10m calentamiento z1\n4x\n3m z4\n2m descanso\nenfriamiento 5m', 'Run');
        expect(blocks.map(b => b.type)).toEqual(['warmup', 'repeat', 'cooldown']);
        expect(blocks[0]).toMatchObject({ duration: 10, zone: 'Z1' });
        expect(blocks[1].repeats).toBe(4);
        expect(blocks[1].steps.map(s => s.type)).toEqual(['active', 'recovery']);
        expect(blocks[1].steps[0]).toMatchObject({ duration: 3, zone: 'Z4' });
    });
    it('repetición en línea y serie principal con zona según deporte', () => {
        const [rep, main] = parsePasteText('3x10 Press Banca\nTrabajo libre', 'WeightTraining');
        expect(rep.type).toBe('repeat');
        expect(rep.steps[0].zone).toBe('Z3');
        expect(main).toMatchObject({ type: 'main', duration: 15, zone: 'Z3' });
    });
    it('texto vacío no genera bloques', () => expect(parsePasteText('  \n', 'Run')).toEqual([]));
});

describe('resumen semanal', () => {
    const week = buildCalendarGrid(2026, 5)[2]; // 15–21 junio
    it('suma TSS, duración y distancia (los planificados convierten bloques `dist` a metros)', () => {
        const byDate = {
            '2026-06-15': [
                { type: 'Run', tss: 50, duration: 40, distance: 8000, isPlanned: false },
                { type: 'Run', tss: 60, duration: 45, isPlanned: true, description: JSON.stringify({ blocks: [{ type: 'main', unit: 'dist', duration: 5 }, { type: 'repeat', repeats: 3, steps: [{ unit: 'dist', duration: 1 }] }] }) },
            ],
        };
        const s = computeWeekStats(week, byDate);
        expect(s.weekRealizedTSS).toBe(50);
        expect(s.weekPlannedTSS).toBe(60);
        expect(s.weekDuration).toBe(85);
        expect(s.weekDist).toBe(8000 + 8000);
    });
    it('suma el TSS de todos los deportes, también fuerza y yoga (D3)', () => {
        const byDate = { '2026-06-15': [{ type: 'WeightTraining', tss: 30 }, { type: 'Yoga', tss: 10 }, { type: 'Run', tss: 50, isPlanned: true }] };
        expect(computeWeekStats(week, byDate)).toMatchObject({ weekRealizedTSS: 40, weekPlannedTSS: 50 });
    });
    it('agrupa cada actividad en el día escrito y cada plan en su día local', () => {
        const grouped = groupActivitiesByDate([{ date: '2026-06-15T23:30:00Z' }], [{ date: new Date(2026, 5, 16).toISOString() }]);
        expect(grouped['2026-06-15']).toHaveLength(1);
        expect(grouped['2026-06-16']).toHaveLength(1);
    });
    it('PMC de la semana', () => {
        const full = { '2026-06-19': { ctl: 5 }, '2026-06-10': { ctl: 3 } };
        expect(findWeekPmc(week, full)).toEqual({ ctl: 5 });
        expect(findWeekPmc(week, {})).toEqual({});
    });
    it('número de semana ISO', () => expect(getWeekNumber(week)).toBe(25));
});
