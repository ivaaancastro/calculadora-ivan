/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePMCMetrics } from '../../hooks/usePMCMetrics';
import { addDays, todayKey } from '../../utils/dates';

const today = todayKey();
const settings = { bike: { ftp: 200, max: 190, lthr: 170 }, run: { max: 190, lthr: 170 }, fcReposo: 50 };
// Una hora a FTP según los streams (100 TSS); según el resumen, 100 W (25 TSS).
const N = 3601;
const streams = { time: { data: Array.from({ length: N }, (_, i) => i) }, watts: { data: Array(N).fill(200) } };
const ride = (daysAgo, extra = {}) => ({
    id: `a${daysAgo}`, type: 'Ride', date: `${addDays(today, -daysAgo)}T08:00:00Z`, duration: 60, watts_avg: 100, distance: 1000, elevation_gain: 10, ...extra,
});
const hook = (activities, over = {}) =>
    renderHook(() => usePMCMetrics({ activities, plannedWorkouts: [], settings, timeRange: '30d', ...over })).result.current;

describe('usePMCMetrics — TSS estable (D2)', () => {
    it('dentro de 95 días usa los streams', () => {
        expect(hook([ride(10, { streams_data: streams })]).activities[0].tss).toBe(100);
    });

    it('antes de 95 días, el resumen, aunque lleguen los streams', () => {
        const without = hook([ride(120)]);
        const withStreams = hook([ride(120, { streams_data: streams })]);
        expect(withStreams.activities[0].tss).toBe(25);
        expect(withStreams.currentMetrics).toEqual(without.currentMetrics);
        // La actividad conserva sus streams para las gráficas.
        expect(withStreams.activities[0].streams_data).toBe(streams);
    });
});

describe('usePMCMetrics — serie y rango', () => {
    const acts = [ride(60), ride(2)];

    it('el rango recorta la gráfica (con 7 días de proyección), no la serie completa', () => {
        const wide = hook(acts, { timeRange: '1y' });
        const narrow = hook(acts, { timeRange: '7d' });
        expect(narrow.pmcSeries).toEqual(wide.pmcSeries);
        expect(narrow.currentMetrics).toEqual(wide.currentMetrics);
        expect(narrow.chartData[0].date).toBe(addDays(today, -6));
        expect(narrow.chartData.at(-1).date).toBe(addDays(today, 7));
        expect(narrow.pmcSeries.at(-1).date).toBe(addDays(today, 90));
        expect(narrow.summary.count).toBe(1);
        expect(narrow.summary.tss).toBe(25);
    });

    it('«7 días» son siete contando hoy', () => {
        const r = hook([ride(7), ride(6)], { timeRange: '7d' });
        expect(r.summary.count).toBe(1);
    });

    it('los planes entran en la proyección', () => {
        const plan = { date: new Date(`${addDays(today, 1)}T00:00:00`).toISOString(), type: 'Ride', tss: 90 };
        const r = hook(acts, { plannedWorkouts: [plan] });
        expect(r.chartData.find((p) => p.date === addDays(today, 1)).dailyTss).toBe(90);
    });

    it('sin actividades', () => {
        const r = hook([]);
        expect(r.pmcSeries).toEqual([]);
        expect(r.currentMetrics).toBeNull();
    });
});
