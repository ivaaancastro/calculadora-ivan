/**
 * Recetas de Card y SectionHeader (spec-rediseno-02-c2, 6.2; PR 1).
 *
 * Cada variante copia exactamente una receta que ya existía:
 *  - `grouped`: la tarjeta agrupada que definía index.css (Ajustes, Salud, Dashboard, detalle).
 *  - `panel`:   las tarjetas de Rendimiento (`bg-surface-5 … shadow-sm`).
 * `pressable` es la compresión al tocar que siempre acompañaba a la tarjeta agrupada; como
 * entonces, su `transition-transform` sustituye al `transition-all` de la tarjeta.
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
  grouped: 'bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card dark:shadow-none',
  panel: 'bg-surface-5 rounded-2xl border border-line-muted shadow-sm',
};

const PRESSABLE = 'active:scale-[0.97] transition-transform duration-150 ease-out select-none touch-manipulation';

export function cardClass({ variant = 'grouped', pressable = false, divided = false } = {}) {
  if (!SURFACE[variant]) throw new Error(`Card: variante desconocida "${variant}"`);
  if (variant === 'panel' && pressable) throw new Error('Card: `pressable` solo existe en la variante grouped');
  return cx(
    SURFACE[variant],
    variant === 'grouped' && (pressable ? PRESSABLE : 'transition-all'),
    divided && 'divide-y divide-hairline',
  );
}

/** Título de sección fuera de la tarjeta. `section-header` solo pinta en la piel v2. */
export const SECTION_HEADER = 'section-header text-[12px] font-semibold text-ink-3 uppercase tracking-wider px-0.5 mb-2';
