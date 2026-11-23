import { describe, it, expect } from 'vitest';
import { buildStatsNarrative } from '../../utils/statsNarrative';

const ts = { status: 'Productivo', load7: 320, tsb: -14, color: '#000' };

describe('buildStatsNarrative', () => {
    it('sin datos devuelve texto vacío y sin KPI', () => {
        expect(buildStatsNarrative({})).toEqual({ text: '', kpis: [] });
        expect(buildStatsNarrative()).toEqual({ text: '', kpis: [] });
    });
    it('datos completos: 4 KPI y narrativa coherente', () => {
        const r = buildStatsNarrative({ trainingStatus: ts, hrv: { rmssd: 52, baseline: 48 }, ftpDiff: 8, eFTP: 258 });
        expect(r.kpis.map(k => k.id)).toEqual(['load', 'tsb', 'hrv', 'eftp']);
        expect(r.text).toContain('productivo');
        expect(r.text).toContain('fatiga');
        expect(r.text).toContain('por encima');
        expect(r.text).toContain('8 W superior');
        expect(r.kpis[1].tone).toBe('down');
        expect(r.kpis[2].tone).toBe('up');
    });
    it('parcial: solo lo disponible, sin rellenos', () => {
        const r = buildStatsNarrative({ hrv: { rmssd: 40, baseline: 48 } });
        expect(r.kpis).toHaveLength(1);
        expect(r.kpis[0].context).toBe('-8 ms vs base');
        expect(r.kpis[0].tone).toBe('down');
    });
    it('eFTP sin diferencia → en línea', () => {
        const r = buildStatsNarrative({ eFTP: 250, ftpDiff: 0 });
        expect(r.kpis[0].context).toBe('En línea con tu FTP');
    });
});
