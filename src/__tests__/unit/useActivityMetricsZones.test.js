/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';

const N = 600;
const time = { data: Array.from({ length: N }, (_, i) => i) };
const settings = {
    run: { thresholdPace: '5:00', zones: Array.from({ length: 7 }, (_, i) => ({ min: i * 20, max: i * 20 + 19 })), paceZones: [{}] },
    bike: { ftp: 200, zones: Array.from({ length: 7 }, (_, i) => ({ min: i * 20, max: i * 20 + 19 })) },
};
const run = (type, streams) => renderHook(() => useActivityMetrics({ type, id: 'x' }, streams, settings)).result.current;

describe('useActivityMetrics por deporte', () => {
    it('isPaceBased: carrera y senderismo sí, bici no', () => {
        expect(run('Carrera', null).isPaceBased).toBe(true);
        expect(run('Hike', null).isPaceBased).toBe(true);
        expect(run('Ciclismo', null).isPaceBased).toBe(false);
    });

    it('carrera: zonas de ritmo con el umbral de ajustes (5:00/km = 3.33 m/s → Z4)', () => {
        const r = run('Carrera', { time, velocity_smooth: { data: Array(N).fill(1000 / 300) } });
        expect(r.exactPaceZoneAnalysis).toHaveLength(7);
        const z4 = r.exactPaceZoneAnalysis[3];
        expect(z4.minutes).toBe(10);
        expect(z4.range).toMatch(/\d:\d\d - \d:\d\d/);
        expect(r.exactPowerZoneAnalysis).toBeNull();
    });

    it('senderismo: sin zonas de ritmo', () => {
        expect(run('Hike', { time, velocity_smooth: { data: Array(N).fill(1.2) } }).exactPaceZoneAnalysis).toBeNull();
    });

    it('bici: zonas de potencia y sin zonas de ritmo', () => {
        const r = run('Ciclismo', { time, watts: { data: Array(N).fill(200) }, velocity_smooth: { data: Array(N).fill(8) } });
        expect(r.exactPowerZoneAnalysis).toHaveLength(7);
        expect(r.exactPaceZoneAnalysis).toBeNull();
    });

    it('avisa de umbral por defecto', () => {
        const r = renderHook(() => useActivityMetrics({ type: 'Carrera' }, null, { run: {}, bike: {} })).result.current;
        expect(r.paceThresholdIsDefault).toBe(true);
    });
});
