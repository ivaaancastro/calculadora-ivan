/**
 * Resumen de Rendimiento: frase, cifra protagonista y KPI del héroe (Capa 6, PR 18, RF-D1).
 * El héroe absorbe «Estado de entreno» y «Estado de VFC»: Forma (TSB) es la cifra protagonista
 * con el chip del estado de forma; Carga 7 d, VFC y Estrés la acompañan. El eFTP vive en la
 * pestaña Potencia, así que no entra aquí. Función pura sobre datos ya calculados.
 */
import { FORM_STATES, tsbStateKey } from './formState';

const signed = (n) => `${n > 0 ? '+' : ''}${n}`;

export function buildStatsNarrative({ trainingStatus, hrv } = {}) {
    const sentences = [];
    const kpis = [];
    let figure = null;
    let chip = null;

    if (trainingStatus) {
        const tsb = Number(trainingStatus.tsb);
        if (trainingStatus.status) sentences.push(`Tu estado de entreno es ${String(trainingStatus.status).toLowerCase()}.`);
        if (Number.isFinite(tsb)) {
            const state = FORM_STATES[tsbStateKey(tsb)];
            sentences.push(`${state.lead}.`);
            figure = { label: 'Forma (TSB)', value: signed(tsb), metric: 'tsb' };
            chip = { label: state.label, tone: state.tone };
        }
        if (Number.isFinite(Number(trainingStatus.load7))) {
            kpis.push({ id: 'load', metric: 'load7', label: 'Carga 7 d', value: trainingStatus.load7, sub: 'Estrés acumulado de la semana' });
        }
    }

    if (hrv && Number.isFinite(hrv.rmssd)) {
        const base = Number(hrv.baseline);
        const diff = Number.isFinite(base) ? hrv.rmssd - Math.round(base) : null;
        if (diff != null && diff !== 0) {
            sentences.push(`Tu VFC está ${diff > 0 ? 'por encima' : 'por debajo'} de tu línea base.`);
        }
        kpis.push({
            id: 'hrv', metric: 'hrv', label: 'VFC', value: hrv.rmssd, unit: 'ms', delta: diff,
            sub: Number.isFinite(base) ? `${hrv.state ? `${hrv.state} · ` : ''}base ${Math.round(base)} ms` : (hrv.state || ''),
        });
        if (Number.isFinite(hrv.stress)) {
            kpis.push({
                id: 'stress', label: 'Estrés', value: hrv.stress, unit: '/100',
                sub: hrv.stress > 60 ? 'Necesitas recuperación' : 'Cuerpo listo para entrenar',
            });
        }
    }

    return { text: sentences.join(' '), figure, chip, sub: trainingStatus?.desc || '', kpis };
}
