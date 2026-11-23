import { describe, it, expect } from 'vitest';
import { biomarkerStatus, orderByAttention, lastSeries } from '../../components/health/biomarkerStatus';

describe('biomarkerStatus', () => {
    it('marca atención con FC reposo +5 sobre la base, SpO2 < 95, TSB < -10 y VFC desequilibrada', () => {
        const s = biomarkerStatus({ latestRhr: 60, baselineRhr: 52, latestSpo2: 93, currentTsb: -14, latestHrv: 40, avgHrv7d: 50, hrvStatus: 'unbalanced' });
        expect(s.rhr).toMatchObject({ status: 'attention', delta: 8 });
        expect(s.spo2.status).toBe('attention');
        expect(s.tsb.status).toBe('attention');
        expect(s.hrv).toMatchObject({ status: 'attention', delta: -10 });
    });
    it('ok con valores normales y none sin dato', () => {
        const s = biomarkerStatus({ latestRhr: 52, baselineRhr: 52, latestSleep: '7.5', latestSteps: '--', latestWeight: 70, weightTrend: -0.4 });
        expect(s.rhr.status).toBe('ok');
        expect(s.sleep.status).toBe('ok');
        expect(s.steps.status).toBe('none');
        expect(s.vo2.status).toBe('none');
        expect(s.weight.delta).toBe(-0.4);
    });
    it('orderByAttention sube los de atención y conserva el resto', () => {
        const st = { a: { status: 'ok' }, b: { status: 'attention' }, c: { status: 'none' }, d: { status: 'attention' } };
        expect(orderByAttention(['a', 'b', 'c', 'd'], st)).toEqual(['b', 'd', 'a', 'c']);
    });
    it('lastSeries toma los últimos n valores positivos', () => {
        expect(lastSeries([{ x: 1 }, { x: 0 }, { x: 3 }, { x: 4 }], 'x', 3)).toEqual([3, 4]);
    });
});
