import { describe, it, expect } from 'vitest';
import { formatDuration, formatMinutes, formatBlockDuration, formatNumber } from '../../utils/formatters';

describe('formatDuration (segundos → reloj)', () => {
    it('sin horas da m:ss', () => {
        expect(formatDuration(0)).toBe('0:00');
        expect(formatDuration(5)).toBe('0:05');
        expect(formatDuration(303)).toBe('5:03');
        expect(formatDuration(3599)).toBe('59:59');
    });
    it('con horas da h:mm:ss', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
        expect(formatDuration(3903)).toBe('1:05:03');
        expect(formatDuration(36000)).toBe('10:00:00');
    });
    it('redondea los segundos fraccionarios sin dar «:60»', () => {
        expect(formatDuration(59.6)).toBe('1:00');
        expect(formatDuration('90')).toBe('1:30');
    });
    it('sin valor da --:--', () => {
        [null, undefined, NaN, -1, 'x'].forEach((v) => expect(formatDuration(v)).toBe('--:--'));
    });
});

describe('formatMinutes (minutos → «1h 16m»)', () => {
    it('formatea minutos y horas', () => {
        expect(formatMinutes(0)).toBe('0m');
        expect(formatMinutes(-10)).toBe('0m');
        expect(formatMinutes(45)).toBe('45m');
        expect(formatMinutes(60)).toBe('1h');
        expect(formatMinutes(76)).toBe('1h 16m');
        expect(formatMinutes(121)).toBe('2h 1m');
    });
    it('acepta strings numéricos, decimales y vacíos', () => {
        expect(formatMinutes('90')).toBe('1h 30m');
        expect(formatMinutes(45.6)).toBe('46m');
        expect(formatMinutes(null)).toBe('0m');
        expect(formatMinutes(undefined)).toBe('0m');
    });
    it('compact quita el espacio para las celdas del calendario', () => {
        expect(formatMinutes(125, { compact: true })).toBe('2h5m');
        expect(formatMinutes(120, { compact: true })).toBe('2h');
        expect(formatMinutes(40, { compact: true })).toBe('40m');
    });
});

describe('formatBlockDuration', () => {
    it('formatea duraciones con segundos', () => {
        expect(formatBlockDuration(0)).toBe('0s');
        expect(formatBlockDuration(-1)).toBe('0s');
        expect(formatBlockDuration(15)).toBe('15m');
        expect(formatBlockDuration(0.3333)).toBe('20s');
        expect(formatBlockDuration(1.5)).toBe('1m 30s');
        expect(formatBlockDuration(60.25)).toBe('60m 15s');
    });
});

describe('formatNumber (es-ES)', () => {
    it('usa coma decimal y decimales fijos', () => {
        expect(formatNumber(19.1, 1)).toBe('19,1');
        expect(formatNumber(0.38, 2)).toBe('0,38');
        expect(formatNumber(5, 1)).toBe('5,0');
        expect(formatNumber(2.345, 0)).toBe('2');
    });
    it('negativos y cero negativo', () => {
        expect(formatNumber(-3.25, 1)).toMatch(/^-3,[23]$/);
        expect(formatNumber(-0.01, 1)).toBe('0,0');
    });
    it('agrupa miles a partir de 5 cifras (norma es-ES)', () => {
        expect(formatNumber(12345)).toBe('12.345');
    });
    it('sin valor devuelve el fallback', () => {
        expect(formatNumber(null)).toBe('--');
        expect(formatNumber(undefined, 1)).toBe('--');
        expect(formatNumber('abc', 1, '—')).toBe('—');
    });
});
