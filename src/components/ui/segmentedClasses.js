/**
 * Recetas del control segmentado (spec-rediseno-02-c2, 6.2; PR 3).
 *
 * Cada variante copia exactamente una receta que ya existía:
 *  - `pill`: las pestañas del detalle de actividad en escritorio (la antigua opción de `ActivitySharedUI` y su contenedor).
 *    El resto de la familia "píldora iOS" no entra: son 8 recetas distintas entre sí (radio, negrita,
 *    hover, duración, compresión, tamaño) y se unifican en la Capa 3 (alcance acordado el 2026-11-09).
 *  - `card`: los selectores de las tarjetas de Rendimiento. `size`: `md-wide` (9 px con
 *    `tracking-widest`), `md` (9 px), `sm` (8 px) y `xs` (Periodo/Histórico de MMP: la letra está en el
 *    contenedor, el radio es `rounded` y la sombra `shadow-xs`).
 *  - `mini`: los conmutadores de los bloques del Calendario (KM/MIN, FC/W).
 * El relleno de las opciones `card` cambia de un sitio a otro y va en `optionClassName`.
 * `tone` es el color de la opción activa: una lista cerrada con los que ya se usaban en cada variante.
 */
import { cx } from './cx.js';

const TONE_CLASS = {
  ink: 'text-ink',
  'ink-soft': 'text-ink-soft',
  'ink-2': 'text-ink-2',
  action: 'text-action',
  'action-bright': 'text-action-bright',
  run: 'text-sport-run-ink',
  power: 'text-power',
  hr: 'text-legacy-hr-red',
};

const CARD_OFF = 'text-segmented-off hover:text-segmented-off-hover';
const CARD_CONTAINER = 'flex bg-fill p-1 rounded-xl';

/** variant → size → { container, option, on, off }. */
const RECIPES = {
  pill: {
    md: {
      container: 'flex bg-fill-segmented-2 p-0.5 rounded-full gap-0.5 hide-scrollbar',
      option: 'px-3 sm:px-4 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 transition-all duration-200 select-none active:scale-95',
      on: 'bg-surface-4 shadow-xs font-bold',
      off: 'text-ink-3 hover:text-ink-2-soft',
    },
  },
  card: {
    'md-wide': {
      container: CARD_CONTAINER,
      option: 'text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all',
      on: 'bg-surface-3 shadow-sm',
      off: CARD_OFF,
    },
    md: {
      container: CARD_CONTAINER,
      option: 'text-[9px] font-bold uppercase rounded-lg transition-all',
      on: 'bg-surface-3 shadow-sm',
      off: CARD_OFF,
    },
    sm: {
      container: CARD_CONTAINER,
      option: 'text-[8px] font-bold uppercase rounded-lg transition-all',
      on: 'bg-surface-3 shadow-sm',
      off: CARD_OFF,
    },
    xs: {
      container: 'flex bg-surface-2 p-0.5 rounded-lg text-[8px] font-bold uppercase',
      option: 'rounded transition-all',
      on: 'bg-surface-3 shadow-xs',
      off: CARD_OFF,
    },
  },
  mini: {
    md: {
      container: 'flex bg-fill-5 rounded-full p-0.5',
      option: 'px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200',
      on: 'bg-surface-3 shadow-sm',
      off: 'text-segmented-mini-off hover:text-segmented-mini-off-hover',
    },
  },
};

/** Tonos permitidos por variante; el primero es el de por defecto. */
const TONES = {
  pill: ['ink'],
  card: ['ink-soft', 'action-bright', 'action', 'run'],
  mini: ['ink-2', 'hr', 'power'],
};

export const DEFAULT_SIZE = { pill: 'md', card: 'md', mini: 'md' };

function recipe(variant, size) {
  const byVariant = RECIPES[variant];
  if (!byVariant) throw new Error(`Segmented: variante desconocida "${variant}"`);
  const r = byVariant[size ?? DEFAULT_SIZE[variant]];
  if (!r) throw new Error(`Segmented: la variante "${variant}" no tiene tamaño "${size}"`);
  return r;
}

export function segmentedClass({ variant = 'pill', size } = {}) {
  return recipe(variant, size).container;
}

export function segmentedOptionClass({ variant = 'pill', size, active = false, tone } = {}) {
  const r = recipe(variant, size);
  const t = tone ?? TONES[variant][0];
  if (!TONES[variant].includes(t)) throw new Error(`Segmented: la variante "${variant}" no tiene tono "${t}"`);
  return cx(r.option, active ? cx(r.on, TONE_CLASS[t]) : r.off);
}
