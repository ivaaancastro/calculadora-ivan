import { describe, it, expect } from 'vitest';
import {
    totalTss, loadByDay, rollingLoad, weeklyLoads, acwr, acwrZone, rampAt, fitnessTrend,
    monotonyStrain, STREAMS_WINDOW_DAYS, streamsWindowStart,
} from '../../utils/load';

const act = (date, tss, type = 'Run', duration = 60) => ({ date, tss, type, duration });

describe('load — totales (D3: todos los deportes, TSS bruto)', () => {
    const acts = [
        act('2026-06-08T07:00:00Z', 40),
        act('2026-06-14T23:30:00Z', 30, 'WeightTraining'),
        act('2026-06-15T08:00:00Z', 20.4, 'Yoga'),
        act('2026-06-15T19:00:00Z', 10.4),
    ];

    it('totalTss suma lo visible y redondea una sola vez', () => {
        expect(totalTss(acts)).toBe(101);
        expect(totalTss([])).toBe(0);
        expect(totalTss([act('2026-06-15', undefined)])).toBe(0);
    });

    it('loadByDay agrupa por el día escrito de la actividad', () => {
        const days = loadByDay(acts);
        expect(days.get('2026-06-14')).toBe(30);
        expect(days.get('2026-06-15')).toBeCloseTo(30.8);
    });

    it('rollingLoad: 7 días que acaban en la fecha dada, incluida', () => {
        expect(rollingLoad(acts, '2026-06-14')).toBe(70); // 8 y 14 de junio
        expect(rollingLoad(acts, '2026-06-15')).toBe(61); // el 8 ya queda fuera
    });

    it('weeklyLoads: semanas de lunes a domingo, en orden', () => {
        expect(weeklyLoads(acts)).toEqual([
            { week: '2026-06-08', tss: 70, hours: 2 },
            { week: '2026-06-15', tss: 31, hours: 2 },
        ]);
    });
});

describe('load — ACWR', () => {
    it('sin 28 días de historia no hay ratio', () => {
        expect(acwr(Array(27).fill(10))).toBeNull();
        expect(acwr([])).toBeNull();
    });

    it('media 7 d / media 28 d', () => {
        expect(acwr(Array(28).fill(10))).toBe(1);
        expect(acwr([...Array(21).fill(0), ...Array(7).fill(20)])).toBe(4);
        expect(acwr([...Array(99).fill(500), ...Array(21).fill(10), ...Array(7).fill(20)])).toBe(1.6);
    });

    it('sin carga en 28 días no hay ratio', () => {
        expect(acwr(Array(40).fill(0))).toBeNull();
    });

    it.each([[null, 'none'], [0, 'none'], [0.79, 'low'], [0.8, 'optimal'], [1.3, 'optimal'], [1.31, 'watch'], [1.5, 'watch'], [1.51, 'risk']])(
        'escala única: %s → %s', (v, key) => expect(acwrZone(v).key).toBe(key));
});

describe('load — rampa, tendencia y monotonía', () => {
    const values = Array.from({ length: 40 }, (_, i) => 10 + i * 0.5);

    it('rampa = CTL(d) − CTL(d − 7)', () => {
        expect(rampAt(values, 10)).toBe(3.5);
        expect(rampAt(values, 6)).toBeNull();
        expect(rampAt([1, 0, 0, 0, 0, 0, 0, 0.64], 7)).toBe(-0.4);
    });

    it('tendencia en % frente a hace 28 días (o al inicio si hay menos)', () => {
        expect(fitnessTrend(values, 38)).toBeCloseTo(((29 - 15) / 15) * 100);
        expect(fitnessTrend(values, 10)).toBeCloseTo(50);
        expect(fitnessTrend([0, 5], 1)).toBe(0);
    });

    it('monotonía y strain de Foster sobre los últimos 7 días', () => {
        expect(monotonyStrain([999, 0, 100, 0, 100, 0, 100, 0])).toEqual({ monotony: 0.87, strain: 260 });
        expect(monotonyStrain(Array(7).fill(10))).toEqual({ monotony: 4, strain: 280 });
        expect(monotonyStrain(Array(7).fill(0))).toEqual({ monotony: 0, strain: 0 });
        expect(monotonyStrain([])).toEqual({ monotony: 0, strain: 0 });
    });
});

describe('load — ventana de streams (D2)', () => {
    it('son los últimos 95 días', () => {
        expect(STREAMS_WINDOW_DAYS).toBe(95);
        expect(streamsWindowStart('2026-06-15')).toBe('2026-03-12');
    });
});
