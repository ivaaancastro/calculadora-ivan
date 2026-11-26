/**
 * Estado de forma por TSB: fuente única de umbrales (spec-capa6-v2-premium, RF-C2 / BUG-6, D3).
 * Los umbrales son los de `formSummary` (−30 / −10 / 5 / 25). Dashboard, Rendimiento y
 * Analítica avanzada leen el estado de aquí para que el mismo TSB diga lo mismo en todas partes.
 */

/** Límite inferior (incluido) de cada estado; por encima de `transition` (exclusivo) hay transición. */
export const TSB_THRESHOLDS = Object.freeze({ transition: 25, peak: 5, productive: -10, overload: -30 });

export const FORM_STATES = Object.freeze({
  transition: { label: 'Transición', tone: 'neutral', lead: 'Estás descansado de más y la forma empieza a bajar', advice: 'Retoma carga de forma progresiva.' },
  peak: { label: 'Pico de forma', tone: 'peak', lead: 'Llegas fresco y con la forma en lo alto', advice: 'Buen momento para competir o una sesión clave.' },
  productive: { label: 'Zona productiva', tone: 'productive', lead: 'Estás en zona productiva: carga y adaptación están equilibradas', advice: 'Mantén el ritmo y sube carga con cuidado.' },
  overload: { label: 'Sobrecarga', tone: 'overload', lead: 'Acumulas fatiga alta', advice: 'Programa una o dos jornadas de recuperación.' },
  critical: { label: 'Fatiga crítica', tone: 'critical', lead: 'La fatiga es muy alta y hay riesgo de sobreentrenamiento', advice: 'Descansa y recorta la carga esta semana.' },
  insufficient: { label: 'Sin datos', tone: 'neutral', lead: 'Aún no hay carga suficiente para valorar tu forma', advice: 'Registra unas semanas de entrenamientos para ver tu estado.' },
});

/** Estado a partir solo del TSB (sin comprobar si hay base de CTL). */
export const tsbStateKey = (tsb) => {
  const t = Number(tsb);
  if (!Number.isFinite(t)) return 'insufficient';
  if (t > TSB_THRESHOLDS.transition) return 'transition';
  if (t >= TSB_THRESHOLDS.peak) return 'peak';
  if (t >= TSB_THRESHOLDS.productive) return 'productive';
  if (t >= TSB_THRESHOLDS.overload) return 'overload';
  return 'critical';
};

/** Estado de forma: sin CTL no hay base para valorar ('insufficient'). */
export const formStateKey = ({ ctl, tsb }) => (!ctl || ctl <= 0 ? 'insufficient' : tsbStateKey(tsb));
