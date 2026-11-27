import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    toDateKey, parseDateKey, toLocalDate,
    activityDayKey, planDayKey, todayKey, addDays, startOfWeekKey, formatDayShort,
} from '../../utils/dates';

describe('utils/dates', () => {
    it('parseDateKey crea la fecha a las 00:00 locales (no UTC)', () => {
        const d = parseDateKey('2026-06-01');
        expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 5, 1, 0]);
    });

    it('parseDateKey rechaza textos que no son claves válidas', () => {
        expect(parseDateKey('2026-02-30')).toBeNull();
        expect(parseDateKey('2026-6-1')).toBeNull();
        expect(parseDateKey(null)).toBeNull();
    });

    it('toDateKey usa los componentes locales de un Date', () => {
        expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
        expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
    });

    it('toDateKey deja igual una clave YYYY-MM-DD (sin pasar por UTC)', () => {
        expect(toDateKey('2026-06-01')).toBe('2026-06-01');
        expect(toDateKey('2026-12-31')).toBe('2026-12-31');
    });

    it('toDateKey acepta timestamps y ISO con hora', () => {
        const local = new Date(2026, 5, 15, 8, 30);
        expect(toDateKey(local.getTime())).toBe('2026-06-15');
        expect(toDateKey('2026-06-15T08:30:00')).toBe('2026-06-15');
    });

    it('toDateKey devuelve cadena vacía si la fecha no es válida', () => {
        expect(toDateKey('no es fecha')).toBe('');
        expect(toDateKey(undefined)).toBe('');
    });

    it('toLocalDate respeta los Date y convierte claves a hora local', () => {
        const d = new Date(2026, 1, 2);
        expect(toLocalDate(d)).toBe(d);
        expect(toLocalDate('2026-02-02').getDate()).toBe(2);
    });
});

describe.each(['Europe/Madrid', 'America/Los_Angeles', 'UTC'])('claves de día en %s', (tz) => {
    afterEach(() => vi.unstubAllEnvs());
    const inZone = (fn) => () => { vi.stubEnv('TZ', tz); fn(); };

    it('una actividad cae en el día escrito en su fecha, aunque lleve Z (hora local de Strava)', inZone(() => {
        expect(activityDayKey('2026-06-15T23:30:00Z')).toBe('2026-06-15');
        expect(activityDayKey('2026-06-15T00:15:00+00:00')).toBe('2026-06-15');
        expect(activityDayKey('2026-06-15')).toBe('2026-06-15');
    }));

    it('un plan guardado como instante vuelve al día local en que se creó', inZone(() => {
        const saved = new Date(2026, 5, 15).toISOString();
        expect(planDayKey(saved)).toBe('2026-06-15');
        expect(planDayKey('2026-06-15')).toBe('2026-06-15');
    }));

    it('hoy es el día local', inZone(() => {
        expect(todayKey(new Date(2026, 5, 15, 23, 59))).toBe('2026-06-15');
        expect(todayKey(new Date(2026, 5, 15, 0, 1))).toBe('2026-06-15');
    }));

    it('addDays cruza cambios de hora, de mes y de año sin saltar días', inZone(() => {
        expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
        expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
        expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    }));

    it('la semana empieza el lunes', inZone(() => {
        expect(startOfWeekKey('2026-06-15')).toBe('2026-06-15'); // lunes
        expect(startOfWeekKey('2026-06-21')).toBe('2026-06-15'); // domingo
        expect(startOfWeekKey('2026-06-01')).toBe('2026-06-01');
    }));

    it('formatDayShort: día abreviado, sin comas ni puntos', inZone(() => {
        expect(formatDayShort('2026-06-15')).toBe('lun 15 jun');
        expect(formatDayShort('2026-09-06T23:30:00Z')).toBe('dom 6 sep');
        expect(formatDayShort(new Date(2026, 0, 3, 12))).toBe('sáb 3 ene');
        expect(formatDayShort('2026-06-17', { year: true })).toBe('mié 17 jun 2026');
    }));
});

describe('claves de día con entradas no válidas', () => {
    it('devuelven cadena vacía', () => {
        for (const bad of [undefined, null, '', 'no es fecha', '2026-02-30']) {
            expect(activityDayKey(bad)).toBe('');
            expect(formatDayShort(bad)).toBe('');
        }
        expect(addDays('mal', 1)).toBe('');
        expect(startOfWeekKey('mal')).toBe('');
    });
});
