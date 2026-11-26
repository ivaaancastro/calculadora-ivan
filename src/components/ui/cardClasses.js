/**
 * Recetas de Card y SectionHeader (spec-rediseno-02-c2, 6.2; PR 1).
 *
 * Cada variante copia exactamente una receta que ya existía:
 *  - `grouped`: la tarjeta agrupada que definía index.css (Ajustes, Salud, Dashboard, detalle).
 *  - `panel`:   las tarjetas de Rendimiento (`bg-surface-5 … shadow-sm`).
 * `pressable` es la compresión al tocar que siempre acompañaba a la tarjeta agrupada; como
 * entonces, su `transition-transform` sustituye a la transición de todas las propiedades.
 * `divided` es `divide-y divide-hairline` (las listas de Ajustes).
 * La tarjeta no tiene relleno propio: el relleno sigue en `className`, como antes.
 *
 * Las clases antiguas de index.css estaban en `@layer utilities` y se emitían después de las de
 * Tailwind, así que ganaban a cualquier clase del mismo atributo puesta a su lado. Por eso no hay
 * `tone`: el `border-danger-edge-2` y el `text-danger-ink-2` de "Zona de peligro" y el `mb-3` de
 * los títulos de Salud nunca se veían, y se retiran en la sustitución.
 */
import { cx } from './cx.js';

const SURFACE = {
  grouped: 'bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card',
  panel: 'bg-surface-5 rounded-2xl border border-line-muted shadow-sm',
  /** Bloques del detalle (gráficas): radio 20 y filete del token. */
  detail: 'bg-surface-card rounded-3xl border border-line shadow-card',
  /** Zona de peligro de Ajustes: transparente, sin sombra y con borde rojo suave. */
  danger: 'bg-transparent rounded-2xl sm:rounded-3xl border border-danger/20 shadow-none',
  /** Pilares de Salud: en oscuro, degradado de la superficie al hundido. */
  pillar: 'bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card dark:bg-[linear-gradient(180deg,rgb(var(--surface)),rgb(var(--sunken)))]',
  /** Biomarcadores de Salud; `attention` resalta el que pide atención. */
  biomarker: 'bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card',
  'biomarker-attention': 'bg-surface-card rounded-2xl sm:rounded-3xl border border-warning/55 shadow-card bg-[linear-gradient(180deg,rgb(var(--warning)/0.07),transparent_60%)]',
};

/** Cifras tabulares con las variantes de Inter (`tnum`, `cv11` y, en los héroes, `ss03`). */
const FIGURES = {
  tnum: "[font-feature-settings:'tnum'_1,'cv11'_1]",
  ss03: "[font-feature-settings:'tnum'_1,'cv11'_1,'ss03'_1]",
};

/** Biomarcadores: se elevan 2 px al pasar el ratón (sin movimiento reducido). */
const LIFT = 'motion-safe:[transition:transform_0.2s_ease,box-shadow_0.2s_ease] motion-safe:hover:-translate-y-0.5';

const PRESSABLE = 'active:scale-press transition-transform duration-fast ease-forma select-none touch-manipulation';

export function cardClass({ variant = 'grouped', pressable = false, divided = false, figures } = {}) {
  if (!SURFACE[variant]) throw new Error(`Card: variante desconocida "${variant}"`);
  if (variant !== 'grouped' && pressable) throw new Error('Card: `pressable` solo existe en la variante grouped');
  return cx(
    SURFACE[variant],
    variant.startsWith('biomarker') ? `transition-paint ${LIFT}` : variant !== 'panel' && (pressable ? PRESSABLE : 'transition-paint'),
    figures && FIGURES[figures],
    divided && 'divide-y divide-hairline',
  );
}

/** Título de sección fuera de la tarjeta. `section-header` solo pinta en la piel v2. */
export const SECTION_HEADER = 'section-header text-[12px] font-semibold text-ink-3 uppercase tracking-[0.05em] px-0.5 mb-2';
