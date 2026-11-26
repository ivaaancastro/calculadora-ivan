import { describe, it, expect } from 'vitest';
import { TSB_THRESHOLDS, FORM_STATES, tsbStateKey, formStateKey } from '../../utils/formState';
import { buildFormSummary } from '../../utils/formSummary';
import { buildStatsNarrative } from '../../utils/statsNarrative';

describe('formState: fuente única de umbrales de TSB (BUG-6, D3)', () => {
    it('umbrales de formSummary: −30 / −10 / 5 / 25', () => {
        expect(TSB_THRESHOLDS).toEqual({ transition: 25, peak: 5, productive: -10, overload: -30 });
    });

    it.each([
        [26, 'transition'], [25, 'peak'], [5, 'peak'], [4.9, 'productive'], [-10, 'productive'],
        [-10.1, 'overload'], [-30, 'overload'], [-31, 'critical'], [NaN, 'insufficient'],
    ])('tsbStateKey(%s) → %s', (tsb, key) => expect(tsbStateKey(tsb)).toBe(key));

    it('sin CTL no hay estado', () => {
        expect(formStateKey({ ctl: 0, tsb: 10 })).toBe('insufficient');
        expect(formStateKey({ ctl: 40, tsb: 10 })).toBe('peak');
    });

    it('con TSB 6, Dashboard y Rendimiento dicen lo mismo', () => {
        const dashboard = buildFormSummary({ ctl: 40, tsb: 6 });
        const stats = buildStatsNarrative({ trainingStatus: { status: 'Productivo', load7: 300, tsb: 6 } });
        expect(dashboard.label).toBe(FORM_STATES.peak.label);
        expect(stats.chip.label).toBe(dashboard.label);
        expect(stats.chip.tone).toBe(dashboard.tone);
        expect(stats.text).toContain(FORM_STATES.peak.lead);
    });
});
