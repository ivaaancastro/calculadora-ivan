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

    it('Ride usa las zonas de FC de bici, no las de carrera', () => {
        const zonesFrom = (base) => Array.from({ length: 7 }, (_, i) => ({ min: i ? base + i * 10 : 0, max: base + i * 10 + 9 }));
        const s = { run: { zones: zonesFrom(150) }, bike: { ftp: 200, zones: zonesFrom(100) } };
        const streams = { time, heartrate: { data: Array(N).fill(165) } };
        const { result } = renderHook(() => useActivityMetrics({ type: 'Ride' }, streams, s));
        expect(result.current.exactZoneAnalysis[6].pct).toBe(100);
    });

    it('un valor entre dos rangos cuenta en la zona inferior', () => {
        const s = { run: { zones: [0, 137, 151, 158, 168, 173, 178].map((min, i) => ({ min, max: [136, 150, 156, 166, 171, 178, 200][i] })) }, bike: {} };
        const streams = { time, heartrate: { data: Array(N).fill(157) } };
        const { result } = renderHook(() => useActivityMetrics({ type: 'Run' }, streams, s));
        expect(result.current.exactZoneAnalysis[2].pct).toBe(100);
    });
});
