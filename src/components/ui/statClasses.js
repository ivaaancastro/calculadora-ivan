/**
 * Recetas de Stat y Delta (Capa 6, PR 14; RF-D5, DUP-5). Guía: docs/design/forma.md.
 *
 * Delta: una sola variación para toda la app (sustituye las copias de KpiCard, FormHero y
 * MonthHero). El color depende del significado, no del signo: en una métrica «inversa»
 * (fatiga, FC en reposo) subir es malo.
 * Stat: etiqueta (eyebrow) + cifra tabular + unidad + variación opcional + línea de contexto.
 */
import { cx } from './cx.js';

/** Tono de la variación → color. `good`/`bad`/`warn` usan los colores del estado de forma. */
export const DELTA_TONE = {
  good: 'text-form-peak',
  bad: 'text-form-critical',
  warn: 'text-form-overload',
  flat: 'text-ink-4',
};

const DELTA_SIZE = {
  sm: { root: 'text-[12px] font-medium', icon: 12 },
  md: { root: 'text-xs font-semibold', icon: 14 },
};

/**
 * Dirección y tono de una variación.
 * - `flat`: banda neutra; |value| < flat (o 0) cuenta como estable.
 * - `inverse`: subir es malo (métricas en las que menos es mejor).
 * - `tone`: fuerza el tono (cuando la regla de negocio vive fuera, p. ej. kpiTrend).
 */
export function deltaDirection(value, { flat = 0, inverse = false, tone } = {}) {
  const dir = value === 0 || Math.abs(value) < flat ? 'flat' : value > 0 ? 'up' : 'down';
  const auto = dir === 'flat' ? 'flat' : (dir === 'up') !== inverse ? 'good' : 'bad';
  if (tone === undefined) return { dir, tone: auto };
  return { dir, tone: DELTA_TONE[tone] ? tone : 'flat' };
}

export function deltaClass({ tone = 'flat', size = 'md' } = {}) {
  if (!DELTA_SIZE[size]) throw new Error(`Delta: tamaño desconocido "${size}"`);
  return cx('flex items-center gap-0.5 tabular-nums', DELTA_SIZE[size].root, DELTA_TONE[tone] || DELTA_TONE.flat);
}

export const deltaIconSize = (size = 'md') => DELTA_SIZE[size]?.icon ?? 14;

/** Tamaños de la cifra de Stat: `sm` filas y rejillas densas, `md` KPI de cabecera, `lg` KPI protagonista. */
const STAT_VALUE = {
  sm: 'text-lg leading-tight font-semibold tracking-[-0.02em]',
  md: 'text-[28px] sm:text-[32px] leading-none font-semibold tracking-[-0.03em]',
  lg: 'text-[34px] leading-none font-semibold tracking-[-0.04em]',
};
const STAT_UNIT = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function statClass({ size = 'md', mono = false } = {}) {
  if (!STAT_VALUE[size]) throw new Error(`Stat: tamaño desconocido "${size}"`);
  return {
    label: 'text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3',
    row: 'flex items-baseline gap-2',
    value: cx(STAT_VALUE[size], 'tabular-nums text-ink', mono && 'font-mono'),
    unit: cx(STAT_UNIT[size], 'ml-1 font-medium text-ink-4'),
    sub: 'mt-1.5 text-[12px] text-ink-4',
  };
}
