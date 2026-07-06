import { describe, it, expect } from 'vitest';
import { formatDuration, formatBlockDuration } from '../../../src/utils/formatDuration';

describe('formatDuration', () => {
    it('debería formatear correctamente la duración en minutos', () => {
        expect(formatDuration(0)).toBe('0m');
        expect(formatDuration(-10)).toBe('0m');
        expect(formatDuration(45)).toBe('45m');
        expect(formatDuration(60)).toBe('1h');
        expect(formatDuration(76)).toBe('1h 16m');
        expect(formatDuration(120)).toBe('2h');
        expect(formatDuration(121)).toBe('2h 1m');
    });

    it('debería manejar correctamente strings numéricos', () => {
        expect(formatDuration('90')).toBe('1h 30m');
        expect(formatDuration(null)).toBe('0m');
        expect(formatDuration(undefined)).toBe('0m');
    });
});

describe('formatBlockDuration', () => {
    it('debería formatear correctamente duraciones con segundos', () => {
        expect(formatBlockDuration(0)).toBe('0s');
        expect(formatBlockDuration(-1)).toBe('0s');
        expect(formatBlockDuration(15)).toBe('15m');
        expect(formatBlockDuration(0.3333)).toBe('20s'); // 1/3 de minuto
        expect(formatBlockDuration(1.5)).toBe('1m 30s');
        expect(formatBlockDuration(60.25)).toBe('60m 15s');
    });
});
