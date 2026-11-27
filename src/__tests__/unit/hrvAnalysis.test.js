import { describe, it, expect } from 'vitest';
import { getHRVAnalysis } from '../../utils/fitnessStatsEngine';

const today = new Date().toISOString().slice(0, 10);
const acts = Array.from({ length: 6 }, () => ({ date: today, type: 'Run', tss: 50 }));

describe('getHRVAnalysis (D5: sin dato real no hay VFC)', () => {
    it('sin VFC medida devuelve null: nada estimado', () => {
        expect(getHRVAnalysis(acts)).toBeNull();
        expect(getHRVAnalysis(acts, { latestHrv: '--' })).toBeNull();
    });
    it('el bienestar simulado no cuenta como dato real', () => {
        expect(getHRVAnalysis(acts, { latestHrv: 55, baselineHrv: 50, isSimulated: true })).toBeNull();
    });
    it('dato del dispositivo con línea base', () => {
        expect(getHRVAnalysis(acts, { latestHrv: 52, baselineHrv: 48 }))
            .toMatchObject({ rmssd: 52, baseline: 48, state: 'Equilibrado', source: 'garmin', stress: 32 });
    });
    it('sin línea base no se inventa estado ni estrés', () => {
        expect(getHRVAnalysis(acts, { latestHrv: 52 })).toMatchObject({ rmssd: 52, baseline: null, state: null, stress: null });
    });
    it('muy por debajo de la base es «No equilibrado»', () => {
        expect(getHRVAnalysis(acts, { latestHrv: 30, baselineHrv: 50 }).state).toBe('No equilibrado');
        expect(getHRVAnalysis(acts, { latestHrv: 40, baselineHrv: 50 }).state).toBe('Bajo');
    });
    it('VFC registrada en actividades', () => {
        expect(getHRVAnalysis([{ date: today, hrv_rmssd: 60 }])).toMatchObject({ rmssd: 60, baseline: 60, source: 'activities' });
    });
});
