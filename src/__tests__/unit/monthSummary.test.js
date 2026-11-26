import { describe, it, expect } from 'vitest';
import { buildMonthSummary } from '../../utils/monthSummary';

const act = (date, o = {}) => ({ date, type: 'Run', tss: 50, duration: 60, ...o });
const base = { year: 2026, month: 5, today: new Date(2026, 5, 15, 12) };

describe('buildMonthSummary', () => {
    it('mes vacío dice qué falta', () => {
        const s = buildMonthSummary({ ...base });
        expect(s.empty).toBe(true);
        expect(s.sentence).toMatch(/Sin sesiones/);
        expect(s.compliance).toBeNull();
    });
    it('solo planificadas futuras', () => {
        const s = buildMonthSummary({ ...base, plannedWorkouts: [act('2026-06-20T10:00:00')] });
        expect(s.empty).toBe(false);
        expect(s.pending).toBe(1);
        expect(s.sentence).toMatch(/1 planificada\./);
    });
    it('suma TSS/tiempo y delta frente al mes anterior', () => {
        const s = buildMonthSummary({
            ...base,
            activities: [act('2026-06-02T10:00:00'), act('2026-06-05T10:00:00', { tss: 70 }), act('2026-05-10T10:00:00', { tss: 100 })],
        });
        expect(s.sessions).toBe(2);
        expect(s.tss).toBe(120);
        expect(s.tssPrev).toBe(100);
        expect(s.deltaPct).toBe(20);
        expect(s.minutes).toBe(120);
        expect(s.sentence).toMatch(/20 % más que en los mismos días del mes anterior/);
    });
    it('BUG-2: «sesiones» bien escrito y «sesión» en singular', () => {
        const dos = buildMonthSummary({ ...base, activities: [act('2026-06-02T10:00:00'), act('2026-06-03T10:00:00')] });
        expect(dos.sentence).toMatch(/Llevas 2 sesiones /);
        expect(dos.sentence).not.toMatch(/sesiónes/);
        const una = buildMonthSummary({ ...base, activities: [act('2026-06-02T10:00:00')] });
        expect(una.sentence).toMatch(/Llevas 1 sesión /);
    });
    it('BUG-2 / D2: el mes en curso se compara con los mismos días del mes anterior', () => {
        // Hoy 15 de junio: cuenta el 10 de mayo, no el 20 de mayo.
        const s = buildMonthSummary({
            ...base,
            activities: [act('2026-06-02T10:00:00', { tss: 100 }), act('2026-05-10T10:00:00', { tss: 100 }), act('2026-05-20T10:00:00', { tss: 300 })],
        });
        expect(s.tssPrev).toBe(100);
        expect(s.deltaPct).toBe(0);
        expect(s.comparedDays).toBe(15);
    });
    it('un mes pasado se compara completo con el anterior', () => {
        const s = buildMonthSummary({
            year: 2026, month: 4, today: new Date(2026, 5, 15, 12),
            activities: [act('2026-05-02T10:00:00', { tss: 200 }), act('2026-04-28T10:00:00', { tss: 100 })],
        });
        expect(s.tssPrev).toBe(100);
        expect(s.deltaPct).toBe(100);
        expect(s.comparedDays).toBeNull();
        expect(s.sentence).toMatch(/100 % más que el mes anterior/);
    });
    it('mes en curso el 31 frente a un mes anterior de 30 días: compara el mes completo', () => {
        const s = buildMonthSummary({
            year: 2026, month: 6, today: new Date(2026, 6, 31, 12),
            activities: [act('2026-07-02T10:00:00'), act('2026-06-30T10:00:00', { tss: 80 })],
        });
        expect(s.tssPrev).toBe(80);
        expect(s.comparedDays).toBe(30);
    });
    it('BUG-7: las fechas YYYY-MM-DD son locales (el 1 y el último día caen en su mes)', () => {
        const s = buildMonthSummary({
            ...base,
            activities: [act('2026-06-01'), act('2026-05-31', { tss: 999 }), act('2026-06-30', { tss: 10 })],
        });
        expect(s.sessions).toBe(2);
        expect(s.tss).toBe(60);
    });
    it('delta nulo sin mes anterior', () => {
        const s = buildMonthSummary({ ...base, activities: [act('2026-06-02T10:00:00')] });
        expect(s.deltaPct).toBeNull();
        expect(s.sentence).not.toMatch(/anterior/);
    });
    it('cumplimiento: plan cumplido el mismo día y deporte', () => {
        const s = buildMonthSummary({
            ...base,
            activities: [act('2026-06-02T10:00:00')],
            plannedWorkouts: [act('2026-06-02T07:00:00'), act('2026-06-03T07:00:00')],
        });
        expect(s.planned).toBe(2);
        expect(s.done).toBe(1);
        expect(s.compliance).toBe(50);
        expect(s.sentence).toMatch(/50 %/);
    });
});
