import { describe, it, expect } from 'vitest';
import { buildMonthSummary, formatMinutes } from '../../utils/monthSummary';

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
        expect(s.sentence).toMatch(/20 % más que el anterior/);
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
    it('formatMinutes', () => {
        expect(formatMinutes(125)).toBe('2h05m');
        expect(formatMinutes(45)).toBe('45m');
    });
});
