import { describe, it, expect } from 'vitest';
import { buildStatsNarrative } from '../../utils/statsNarrative';

const metrics = { ctl: 50, atl: 64, tsb: -14, ctlRaw: 50.2, load7: 320 };

describe('buildStatsNarrative', () => {
    it('sin datos devuelve texto vacío, sin cifra y sin KPI', () => {
        expect(buildStatsNarrative({})).toEqual({ text: '', figure: null, chip: null, sub: '', kpis: [] });
        expect(buildStatsNarrative().kpis).toEqual([]);
        expect(buildStatsNarrative({ metrics: null }).figure).toBeNull();
    });
    it('datos completos: el TSB del PMC protagoniza, con el estado de formState', () => {
        const r = buildStatsNarrative({ metrics, hrv: { rmssd: 52, baseline: 48, state: 'Equilibrado', stress: 30 } });
        expect(r.figure).toEqual({ label: 'Forma (TSB)', value: '-14', metric: 'tsb' });
        expect(r.chip).toEqual({ label: 'Sobrecarga', tone: 'overload' });
        expect(r.kpis.map(k => k.id)).toEqual(['load', 'hrv', 'stress']);
        expect(r.kpis.map(k => k.metric).filter(Boolean)).toEqual(['load7', 'hrv']);
        expect(r.kpis[0]).toMatchObject({ value: 320, sub: 'TSS sumado en los últimos 7 días' });
        expect(r.text).toContain('Acumulas fatiga alta.');
        expect(r.text).toContain('por encima');
        expect(r.sub).toBe('Programa una o dos jornadas de recuperación.');
        expect(r.kpis[1].delta).toBe(4);
        expect(r.kpis[1].sub).toBe('Equilibrado · base 48 ms');
        expect(r.kpis[2].sub).toBe('Cuerpo listo para entrenar');
    });
    it('sin fitness no se valora la forma ni se pinta un cero', () => {
        const r = buildStatsNarrative({ metrics: { ctl: 0, atl: 3, tsb: -3, ctlRaw: 0, load7: 20 } });
        expect(r.figure).toBeNull();
        expect(r.chip).toBeNull();
        expect(r.kpis.map(k => k.id)).toEqual(['load']);
    });
    it('VFC sin línea base: solo la cifra, sin comparación ni estrés', () => {
        const r = buildStatsNarrative({ hrv: { rmssd: 40, baseline: null, state: null, stress: null } });
        expect(r.kpis).toHaveLength(1);
        expect(r.kpis[0]).toMatchObject({ value: 40, delta: null, sub: '' });
        expect(r.text).toBe('');
    });
});
