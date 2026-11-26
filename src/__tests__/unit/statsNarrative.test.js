import { describe, it, expect } from 'vitest';
import { buildStatsNarrative } from '../../utils/statsNarrative';

const ts = { status: 'Productivo', desc: 'Carga en aumento.', load7: 320, tsb: -14, color: '#000' };

describe('buildStatsNarrative', () => {
    it('sin datos devuelve texto vacío, sin cifra y sin KPI', () => {
        expect(buildStatsNarrative({})).toEqual({ text: '', figure: null, chip: null, sub: '', kpis: [] });
        expect(buildStatsNarrative().kpis).toEqual([]);
    });
    it('datos completos: TSB protagonista, chip de forma y KPI sin repetir', () => {
        const r = buildStatsNarrative({ trainingStatus: ts, hrv: { rmssd: 52, baseline: 48, state: 'Equilibrado', stress: 30 } });
        expect(r.figure).toEqual({ label: 'Forma (TSB)', value: '-14', metric: 'tsb' });
        expect(r.chip).toEqual({ label: 'Sobrecarga', tone: 'overload' });
        expect(r.kpis.map(k => k.id)).toEqual(['load', 'hrv', 'stress']);
        expect(r.kpis.map(k => k.metric).filter(Boolean)).toEqual(['load7', 'hrv']);
        expect(r.text).toContain('productivo');
        expect(r.text).toContain('fatiga');
        expect(r.text).toContain('por encima');
        expect(r.sub).toBe('Carga en aumento.');
        expect(r.kpis[1].delta).toBe(4);
        expect(r.kpis[1].sub).toBe('Equilibrado · base 48 ms');
        expect(r.kpis[2].sub).toBe('Cuerpo listo para entrenar');
    });
    it('parcial: solo lo disponible, sin rellenos', () => {
        const r = buildStatsNarrative({ hrv: { rmssd: 40, baseline: 48 } });
        expect(r.figure).toBeNull();
        expect(r.kpis).toHaveLength(1);
        expect(r.kpis[0].delta).toBe(-8);
    });
});
