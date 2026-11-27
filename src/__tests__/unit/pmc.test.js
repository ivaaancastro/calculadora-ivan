import { describe, it, expect, afterEach, vi } from 'vitest';
import { calculatePMC } from '../../utils/tssEngine';
import { addDays } from '../../utils/dates';

const TODAY = '2026-06-15';
const K = (tau) => Math.exp(-1 / tau);
const step = (prev, load, tau) => prev * K(tau) + load * (1 - K(tau));
const run = (date, tss, type = 'Run') => ({ date, tss, type });
const pmc = (acts, settings = {}, plans = []) => calculatePMC(acts, settings, plans, { today: TODAY });
const at = (r, date) => r.fullSeries.find((p) => p.date === date);

describe('calculatePMC — serie', () => {
    it('sin actividades no hay serie', () => {
        expect(pmc([])).toEqual({ fullSeries: [], metrics: null, loadHistory: [] });
    });

    it('va del primer día con actividad a hoy + 90', () => {
        const r = pmc([run('2026-06-14T10:00:00Z', 100)]);
        expect(r.fullSeries[0].date).toBe('2026-06-14');
        expect(r.fullSeries.at(-1).date).toBe(addDays(TODAY, 90));
        expect(at(r, TODAY).projected).toBe(false);
        expect(at(r, addDays(TODAY, 1)).projected).toBe(true);
    });

    it('EWMA exponencial: valores calculados a mano', () => {
        const p = at(pmc([run('2026-06-15T10:00:00Z', 100)]), TODAY);
        expect(p.ctlRaw).toBeCloseTo(2.3528, 4);
        expect(p.atlRaw).toBeCloseTo(13.3122, 4);
        expect([p.ctl, p.atl, p.tsb]).toEqual([2, 13, -11]);
    });

    it('D1: TSB es la resta de los enteros que se ven (50,4 y 40,6 → 50, 41 y 9)', () => {
        const r = pmc([run('2026-06-15T10:00:00Z', 305)], { offsetCtl: 43.22 });
        const p = at(r, TODAY);
        expect(p.ctlRaw).toBeCloseTo(50.4, 1);
        expect(p.atlRaw).toBeCloseTo(40.6, 1);
        expect([p.ctl, p.atl, p.tsb]).toEqual([50, 41, 9]);
        expect([r.metrics.ctl, r.metrics.atl, r.metrics.tsb]).toEqual([50, 41, 9]);
        for (const q of r.fullSeries) expect(q.tsb).toBe(q.ctl - q.atl);
        expect(r.fullSeries.some((q) => Object.is(q.tsb, -0))).toBe(false);
    });

    it('respeta ta y tf', () => {
        const p = at(pmc([run('2026-06-15', 100)], { ta: 20, tf: 5 }), TODAY);
        expect(p.ctlRaw).toBeCloseTo(step(0, 100, 20), 6);
        expect(p.atlRaw).toBeCloseTo(step(0, 100, 5), 6);
    });

    it('pesos por deporte: la fuerza cansa pero no suma fitness', () => {
        const p = at(pmc([run('2026-06-15', 100, 'WeightTraining')]), TODAY);
        expect(p.ctlRaw).toBe(0);
        expect(p.atlRaw).toBeCloseTo(step(0, 100, 7), 6);
        expect(p.dailyTss).toBe(100);
    });
});

describe('calculatePMC — proyección', () => {
    const acts = [run('2026-06-15T08:00:00Z', 100)];
    const tomorrow = addDays(TODAY, 1);
    const planAt = (key, tss, type = 'Run') => ({ date: new Date(`${key}T00:00:00`).toISOString(), tss, type });

    it('aplica los planes futuros con la misma fórmula y los mismos pesos', () => {
        const r = pmc(acts, {}, [planAt(tomorrow, 80), planAt(addDays(TODAY, 2), 50, 'WeightTraining')]);
        const t = at(r, TODAY);
        const d1 = at(r, tomorrow);
        const d2 = at(r, addDays(TODAY, 2));
        expect(d1.ctlRaw).toBeCloseTo(step(t.ctlRaw, 80, 42), 6);
        expect(d1.atlRaw).toBeCloseTo(step(t.atlRaw, 80, 7), 6);
        expect(d2.ctlRaw).toBeCloseTo(step(d1.ctlRaw, 0, 42), 6);
        expect(d2.atlRaw).toBeCloseTo(step(d1.atlRaw, 50, 7), 6);
        expect(d1.dailyTss).toBe(80);
    });

    it('un plan de hoy o pasado no cuenta como carga hecha', () => {
        const r = pmc(acts, {}, [planAt(TODAY, 500), planAt('2026-06-14', 500)]);
        expect(at(r, TODAY).dailyTss).toBe(100);
        expect(r.metrics.atl).toBe(13);
    });

    it('el ajuste manual de CTL se suma después y no decae', () => {
        const base = pmc(acts);
        const adjusted = pmc(acts, { offsetCtl: 10 });
        const last = base.fullSeries.length - 1;
        expect(adjusted.fullSeries[last].ctlRaw - base.fullSeries[last].ctlRaw).toBeCloseTo(10, 6);
    });
});

describe('calculatePMC — métricas de hoy', () => {
    const acts = Array.from({ length: 60 }, (_, i) => run(`${addDays(TODAY, -i)}T07:00:00Z`, i < 7 ? 60 : 40));
    const r = pmc(acts, { offsetCtl: 5 });
    const idx = r.fullSeries.findIndex((p) => p.date === TODAY);

    it('rampa, tendencia, carga 7 d y ACWR', () => {
        const s = r.fullSeries;
        expect(r.metrics.rampRate).toBe(Number((s[idx].ctlRaw - s[idx - 7].ctlRaw).toFixed(1)));
        expect(s[idx].ramp).toBe(r.metrics.rampRate);
        expect(r.metrics.loadTrend).toBeCloseTo(((s[idx].ctlRaw - s[idx - 28].ctlRaw) / s[idx - 28].ctlRaw) * 100, 6);
        expect(r.metrics.load7).toBe(420);
        expect(r.metrics.acwr).toBe(1.33);
        expect(r.metrics.monotony).toBe(4);
        expect(r.metrics.strain).toBe(1680);
    });

    it('rawCtl es el CTL sin ajuste ni redondeo (calibración del Perfil)', () => {
        expect(r.metrics.rawCtl).toBeCloseTo(r.fullSeries[idx].ctlRaw - 5, 6);
    });

    const daysAgo = (n) => run(addDays(TODAY, -n), 80);

    it('con menos de 7 días de historia no hay monotonía ni strain', () => {
        for (const n of [0, 5]) {
            expect(pmc([daysAgo(n)]).metrics).toMatchObject({ monotony: null, strain: null });
        }
        const week = pmc([daysAgo(6)]).metrics; // 80 TSS y seis días de descanso
        expect(week.monotony).toBeCloseTo(0.41, 2);
        expect(week.strain).toBe(33);
    });

    it('con menos de 8 días de serie no hay rampa', () => {
        expect(pmc([daysAgo(6)]).metrics.rampRate).toBeNull();
        expect(pmc([daysAgo(7)]).metrics.rampRate).toEqual(expect.any(Number));
    });

    it('con menos de 28 días no hay ACWR', () => {
        expect(pmc([run('2026-06-10', 50)]).metrics.acwr).toBe(0);
    });
});

describe.each(['Europe/Madrid', 'America/Los_Angeles', 'UTC'])('calculatePMC en %s', (tz) => {
    afterEach(() => vi.unstubAllEnvs());

    it('una actividad a las 23:30 y un plan caen en su día', () => {
        vi.stubEnv('TZ', tz);
        const plan = { date: new Date(2026, 5, 16).toISOString(), tss: 70, type: 'Run' };
        const r = calculatePMC([run('2026-06-14T23:30:00Z', 90)], {}, [plan], { today: TODAY });
        expect(at(r, '2026-06-14').dailyTss).toBe(90);
        expect(at(r, '2026-06-16').dailyTss).toBe(70);
        expect(at(r, '2026-06-15').dailyTss).toBe(0);
    });
});
