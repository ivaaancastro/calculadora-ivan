import { describe, it, expect } from 'vitest';
import { toDateKey, parseDateKey, toLocalDate } from '../../utils/dates';

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
