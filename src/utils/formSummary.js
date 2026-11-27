/**
 * Resumen narrativo del estado de forma (Fase Premium D2, spec premium-dashboard §3.3).
 * Reglas deterministas sobre CTL/ATL/TSB/ACWR; sin IA ni red. Los umbrales de TSB viven en
 * `formState.js` (fuente única, D3).
 */
import { FORM_STATES as STATES, formStateKey } from './formState';
import { acwrZone } from './load';

export { formStateKey };

const pct = (n) => Math.abs(n).toFixed(1).replace('.', ',');

export function buildFormSummary({ ctl = 0, tsb = 0, acwr = 0, rampRate = 0, loadTrend = 0 } = {}) {
  const state = formStateKey({ ctl, tsb });
  const meta = STATES[state];
  if (state === 'insufficient') {
    return { state, label: meta.label, tone: meta.tone, sentence: `${meta.lead}.`, advice: meta.advice };
  }
  let trend;
  if (loadTrend > 2) trend = `tu fitness sube un ${pct(loadTrend)} % en 28 días`;
  else if (loadTrend < -2) trend = `tu fitness baja un ${pct(loadTrend)} % en 28 días`;
  else trend = 'tu fitness se mantiene estable en 28 días';
  let risk = '';
  const load = acwrZone(acwr).key;
  if (load === 'risk') risk = ' Ojo: la carga reciente supera con mucho a tu base.';
  else if (load === 'low') risk = ' La carga reciente es baja respecto a tu base.';
  else if (rampRate > 8) risk = ' La rampa semanal es alta: vigila la recuperación.';
  return {
    state,
    label: meta.label,
    tone: meta.tone,
    sentence: `${meta.lead} y ${trend}.${risk}`,
    advice: meta.advice,
  };
}
