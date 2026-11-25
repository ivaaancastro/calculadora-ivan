import { describe, it, expect } from 'vitest';
import { weekStartKey, groupByWeek, summarizeActivities, weeklyTss } from '../../utils/activityGroups';

const act = (id, date, extra = {}) => ({ id, date, duration: 60, distance: 10000, tss: 50, ...extra });

describe('activityGroups', () => {
    it('el domingo pertenece a la semana que empieza el lunes anterior', () => {
        expect(weekStartKey('2026-03-01T12:00:00')).toBe('2026-02-23'); // domingo
        expect(weekStartKey('2026-03-02T12:00:00')).toBe('2026-03-02'); // lunes
    });

    it('cambio de año', () => {
        expect(weekStartKey('2026-01-01T12:00:00')).toBe('2025-12-29');
    });

    it('fecha inválida → null y se ignora al agrupar', () => {
        expect(weekStartKey('x')).toBeNull();
        expect(groupByWeek([act('a', 'x')])).toEqual([]);
    });

    it('agrupa de reciente a antigua y suma totales; sin semanas vacías', () => {
        const groups = groupByWeek([
            act('a', '2026-03-10T10:00:00'),
            act('b', '2026-03-11T10:00:00', { tss: 30, duration: 30 }),
            act('c', '2026-02-20T10:00:00'),
        ]);
        expect(groups.map((g) => g.key)).toEqual(['2026-03-09', '2026-02-16']);
        expect(groups[0].totals).toEqual({ count: 2, minutes: 90, meters: 20000, tss: 80 });
    });

    it('summarizeActivities tolera campos ausentes', () => {
        expect(summarizeActivities([{ id: 1 }])).toEqual({ count: 1, minutes: 0, meters: 0, tss: 0 });
        expect(summarizeActivities()).toEqual({ count: 0, minutes: 0, meters: 0, tss: 0 });
    });

    it('weeklyTss va de antigua a reciente y recorta a n', () => {
        const list = [act('a', '2026-03-10T10:00:00'), act('b', '2026-03-03T10:00:00', { tss: 20 }), act('c', '2026-02-24T10:00:00', { tss: 10 })];
        expect(weeklyTss(list, 2)).toEqual([20, 50]);
    });
});

import { sportOf, breakdownBySport } from '../../utils/activityGroups';

describe('deportes', () => {
    it('sportOf normaliza tipos en inglés y español', () => {
        expect(['Run', 'Carrera', 'Ride', 'Ciclismo', 'Swim', 'Natación', 'Gym', 'Fuerza', 'Walk', 'Yoga'].map(sportOf))
            .toEqual(['run', 'run', 'bike', 'bike', 'swim', 'swim', 'strength', 'strength', 'walk', 'other']);
    });
    it('breakdownBySport ordena por tiempo y calcula cuotas', () => {
        const r = breakdownBySport([
            { type: 'Run', duration: 30 }, { type: 'Ride', duration: 90 }, { type: 'Ride', duration: 30 },
        ]);
        expect(r.map((x) => x.sport)).toEqual(['bike', 'run']);
        expect(r[0]).toMatchObject({ minutes: 120, count: 2 });
        expect(r[0].share).toBeCloseTo(0.8);
        expect(breakdownBySport([])).toEqual([]);
    });
});
