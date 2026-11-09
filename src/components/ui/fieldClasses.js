/**
 * Recetas de los campos (spec-rediseno-02-c2, 6.2; PR 4).
 *
 * Cada variante copia exactamente una receta que ya existía:
 *  - `filled`: los campos del modal de añadir actividad (Input y Select comparten receta).
 *  - `search`: los filtros del historial (el buscador y los dos selectores, cada uno con la suya).
 *  - `cell`: los campos de los bloques del Calendario. En Input, `size` `md` (13 px) y `sm` (11 px).
 *  - `cell-bare` (solo Select): el selector de objetivo de los bloques, sin fondo.
 *  - `inline` (solo Input): los valores de Ajustes. `size` `md` (fisiología: peso, FC en reposo,
 *    CTL) y `sm` (mínimo y máximo de cada zona). `ringTone` es el color del anillo de foco.
 * El relleno, el ancho y la alineación del texto cambian de un sitio a otro y van en `className`.
 * `mono` añade la fuente monoespaciada, que en `filled` y `cell` llevan solo algunos campos.
 * Los campos de acceso (`LoginPage`, landing) no entran (D-08).
 */
import { cx } from './cx.js';

const FILLED = 'bg-sunken-5 border border-line-muted-2 rounded-xl text-sm font-semibold text-body-3 focus:ring-2 focus:ring-action-bright outline-none';

/** variant → size → receta. */
const INPUT = {
  filled: { md: FILLED },
  search: {
    md: 'bg-fill-6 border-0 rounded-xl text-sm font-medium text-ink-soft placeholder-ink-4-fixed focus:outline-none focus:ring-2 focus:ring-action-bright/40 transition-all',
  },
  cell: {
    md: 'bg-sunken text-[13px] rounded-lg outline-none no-spinner text-body',
    sm: 'bg-sunken rounded-lg text-[11px] outline-none no-spinner text-body',
  },
  inline: {
    md: 'font-bold text-xs sm:text-sm text-ink bg-fill-3 rounded-lg outline-none focus:ring-1',
    sm: 'bg-surface-2 rounded text-xs outline-none focus:ring-1',
  },
};

const SELECT = {
  filled: { md: FILLED },
  search: {
    md: 'bg-fill-6 border-0 rounded-xl text-xs sm:text-sm font-semibold text-ink-2-soft focus:outline-none focus:ring-2 focus:ring-action-bright/40 appearance-none cursor-pointer transition-all',
  },
  cell: { md: 'bg-sunken text-[11px] font-medium text-body rounded-lg outline-none cursor-pointer' },
  'cell-bare': { md: 'bg-transparent text-[10px] text-ink-4 outline-none cursor-pointer' },
};

/** Anillos de foco de `inline`: una lista cerrada con los que ya se usaban; el primero es el de por defecto. */
const RING = {
  'action-bright': 'focus:ring-action-bright',
  hr: 'focus:ring-hr',
  positive: 'focus:ring-positive',
};
const RING_VARIANTS = ['inline'];

function build(kind, table, { variant = 'filled', size = 'md', mono = false, ringTone } = {}) {
  const byVariant = table[variant];
  if (!byVariant) throw new Error(`${kind}: variante desconocida "${variant}"`);
  const r = byVariant[size];
  if (!r) throw new Error(`${kind}: la variante "${variant}" no tiene tamaño "${size}"`);
  let ring;
  if (RING_VARIANTS.includes(variant)) {
    const t = ringTone ?? Object.keys(RING)[0];
    ring = RING[t];
    if (!ring) throw new Error(`${kind}: tono de anillo desconocido "${t}"`);
  } else if (ringTone) {
    throw new Error(`${kind}: la variante "${variant}" no admite ringTone`);
  }
  return cx(r, mono && 'font-mono', ring);
}

export const inputClass = (opts) => build('Input', INPUT, opts);
export const selectClass = (opts) => build('Select', SELECT, opts);
