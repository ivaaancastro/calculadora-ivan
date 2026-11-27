/**
 * Resumen de Rendimiento: frase, cifra protagonista y KPI del héroe (Capa 6, PR 18, RF-D1).
 * Forma (TSB) es la del PMC y su chip, el de `formState`; Carga 7 d, VFC y Estrés la acompañan.
 * El eFTP vive en la pestaña Potencia. Función pura sobre datos ya calculados.
 */
import { FORM_STATES, formStateKey } from './formState';

const signed = (n) => `${n > 0 ? '+' : ''}${n}`;

export function buildStatsNarrative({ metrics, hrv } = {}) {
    const sentences = [];
    const kpis = [];
    let figure = null;
    let chip = null;
    let sub = '';

    if (metrics) {
        const key = formStateKey(metrics);
        if (key !== 'insufficient') {
            const state = FORM_STATES[key];
            sentences.push(`${state.lead}.`);
            figure = { label: 'Forma (TSB)', value: signed(metrics.tsb), metric: 'tsb' };
            chip = { label: state.label, tone: state.tone };
            sub = state.advice;
        }
        kpis.push({ id: 'load', metric: 'load7', label: 'Carga 7 d', value: metrics.load7, sub: 'TSS sumado en los últimos 7 días' });
    }

    if (hrv && Number.isFinite(hrv.rmssd)) {
        const base = hrv.baseline ?? null;
        const diff = base != null ? hrv.rmssd - Math.round(base) : null;
        if (diff != null && diff !== 0) {
            sentences.push(`Tu VFC está ${diff > 0 ? 'por encima' : 'por debajo'} de tu línea base.`);
        }
        kpis.push({
            id: 'hrv', metric: 'hrv', label: 'VFC', value: hrv.rmssd, unit: 'ms', delta: diff,
            sub: base != null ? `${hrv.state ? `${hrv.state} · ` : ''}base ${Math.round(base)} ms` : (hrv.state || ''),
        });
        if (Number.isFinite(hrv.stress)) {
            kpis.push({
                id: 'stress', label: 'Estrés', value: hrv.stress, unit: '/100',
                sub: hrv.stress > 60 ? 'Necesitas recuperación' : 'Cuerpo listo para entrenar',
            });
        }
    }

    return { text: sentences.join(' '), figure, chip, sub, kpis };
}
