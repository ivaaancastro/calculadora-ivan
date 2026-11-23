/**
 * Resumen narrativo del estado de forma (Fase Premium D2, spec premium-dashboard §3.3).
 * Reglas deterministas sobre CTL/ATL/TSB/ACWR; sin IA ni red. Umbrales de TSB = los de
 * `AdvancedAnalytics` (−30 / −10 / 5 / 25).
 */
const STATES = {
  transition: { label: 'Transición', tone: 'neutral', lead: 'Estás descansado de más y la forma empieza a bajar', advice: 'Retoma carga de forma progresiva.' },
  peak: { label: 'Pico de forma', tone: 'peak', lead: 'Llegas fresco y con la forma en lo alto', advice: 'Buen momento para competir o una sesión clave.' },
  productive: { label: 'Zona productiva', tone: 'productive', lead: 'Estás en zona productiva: carga y adaptación están equilibradas', advice: 'Mantén el ritmo y sube carga con cuidado.' },
  overload: { label: 'Sobrecarga', tone: 'overload', lead: 'Acumulas fatiga alta', advice: 'Programa una o dos jornadas de recuperación.' },
  critical: { label: 'Fatiga crítica', tone: 'critical', lead: 'La fatiga es muy alta y hay riesgo de sobreentrenamiento', advice: 'Descansa y recorta la carga esta semana.' },
  insufficient: { label: 'Sin datos', tone: 'neutral', lead: 'Aún no hay carga suficiente para valorar tu forma', advice: 'Registra unas semanas de entrenamientos para ver tu estado.' },
};

export const formStateKey = ({ ctl, tsb }) => {
  if (!ctl || ctl <= 0) return 'insufficient';
  if (tsb > 25) return 'transition';
  if (tsb >= 5) return 'peak';
  if (tsb >= -10) return 'productive';
  if (tsb >= -30) return 'overload';
  return 'critical';
};

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
  if (acwr > 1.5) risk = ' Ojo: la carga reciente supera con mucho a tu base.';
  else if (acwr > 0 && acwr < 0.8) risk = ' La carga reciente es baja respecto a tu base.';
  else if (rampRate > 8) risk = ' La rampa semanal es alta: vigila la recuperación.';
  return {
    state,
    label: meta.label,
    tone: meta.tone,
    sentence: `${meta.lead} y ${trend}.${risk}`,
    advice: meta.advice,
  };
}
