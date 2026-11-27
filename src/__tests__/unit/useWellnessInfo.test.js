/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

const DAYS = Array.from({ length: 10 }, (_, i) => ({ date: `2026-06-${String(i + 1).padStart(2, '0')}`, hrv: 60, rhr: 50, sleep: 7.5 }));
vi.mock('../../hooks/useWellnessData', () => ({
    useWellnessData: () => ({ wellnessData: DAYS, loading: false, error: null, dailyTSS: new Map() }),
}));

const insights = (metrics) => renderHook(() => useWellnessInfo([], {}, metrics)).result.current.wellnessMetrics;
const tsbAlerts = (metrics) => insights(metrics).insights.filter((i) => /TSB|Desentrenamiento/.test(i.label)).map((i) => i.type);

describe('useWellnessInfo — TSB de hoy y estados de formState', () => {
    it('usa el TSB de las métricas de hoy', () => {
        expect(insights({ ctl: 50, tsb: -12 }).currentTsb).toBe(-12);
        expect(insights(undefined).currentTsb).toBeNull();
    });
    it('fatiga crítica por debajo de −30', () => {
        expect(tsbAlerts({ ctl: 50, tsb: -31 })).toEqual(['danger']);
        expect(tsbAlerts({ ctl: 50, tsb: -30 })).toEqual([]);
    });
    it('transición por encima de +25; el pico de forma no alerta', () => {
        expect(tsbAlerts({ ctl: 50, tsb: 15 })).toEqual([]);
        expect(tsbAlerts({ ctl: 50, tsb: 26 })).toEqual(['warning']);
    });
    it('sin fitness no hay alerta', () => {
        expect(tsbAlerts({ ctl: 0, tsb: -40 })).toEqual([]);
    });
});
