import { describe, it, expect } from 'vitest';
import { buildDayLoadLevels, getSessionState, planProgress } from '../../utils/calendarLoad';

const grid = [[1, 2, 3].map((d) => ({ date: new Date(2026, 5, d) }))];

describe('buildDayLoadLevels', () => {
    it('sin actividad no hay niveles', () => {
        expect(buildDayLoadLevels({}, grid)).toEqual({});
    });
    it('el día más cargado es nivel 4 y el resto es proporcional', () => {
        const byDate = {
            '2026-06-01': [{ tss: 100 }],
            '2026-06-02': [{ tss: 50 }, { tss: 0 }],
            '2026-06-03': [{ tss: 200, isPlanned: true }],
        };
        expect(buildDayLoadLevels(byDate, grid)).toEqual({ '2026-06-01': 4, '2026-06-02': 2 });
    });
});

describe('getSessionState', () => {
    const base = { dateKey: '2026-06-10', todayKey: '2026-06-15' };
    it('realizada y cumplida', () => {
        expect(getSessionState({}, base)).toBe('done');
        expect(getSessionState({}, { ...base, fulfilled: true })).toBe('fulfilled');
    });
    it('plan pasado sin sesión es omitido; hoy y futuro, planificado', () => {
        expect(getSessionState({ isPlanned: true }, base)).toBe('omitted');
        expect(getSessionState({ isPlanned: true }, { ...base, dateKey: '2026-06-15' })).toBe('planned');
        expect(getSessionState({ isPlanned: true }, { ...base, dateKey: '2026-06-20' })).toBe('planned');
    });
});

describe('planProgress (BUG-9)', () => {
    it('sin plan no hay barra ni «195/0»', () => {
        expect(planProgress(195, 0)).toEqual({ hasPlan: false, realized: 195, planned: 0, pct: 0, level: null });
        expect(planProgress(0, null).hasPlan).toBe(false);
    });
    it('con plan: porcentaje acotado a 100 y nivel', () => {
        expect(planProgress(95, 100)).toMatchObject({ hasPlan: true, pct: 95, level: 'high' });
        expect(planProgress(75, 100).level).toBe('mid');
        expect(planProgress(30, 100).level).toBe('low');
        expect(planProgress(300, 100).pct).toBe(100);
    });
});

describe('buildDayLoadLevels con claves locales (BUG-7)', () => {
    it('la clave del día 1 de la cuadrícula es la local', () => {
        expect(buildDayLoadLevels({ '2026-06-01': [{ tss: 50 }] }, grid)).toEqual({ '2026-06-01': 4 });
    });
});
