/**
 * Recetas de MetricTooltip (spec-tarjetas-explicativas-detalle).
 *
 *  - `trigger`: zona táctil del elemento que dispara la tarjeta (≥ 44 px en v2, vía skin-v2.css).
 *  - `popover`: tarjeta flotante anclada al disparador en escritorio.
 *  - `popoverContent`: contenido interno del popover.
 *  - `popoverArrow`: flecha que apunta al disparador.
 *
 * Sin hex sueltos: solo tokens de Tailwind/tokens.css.
 */

export const METRIC_TOOLTIP = {
  /** Disparador: no altera el layout de v1; los 44 px mínimos los pone skin-v2.css (`data-metric-trigger`). */
  trigger: 'block cursor-pointer',
  /** Popover flotante (escritorio): anclado al disparador, sobre todo lo demás. */
  popover: 'z-popover absolute w-72 p-3 bg-surface-8 backdrop-blur-md border border-line-soft rounded-2xl shadow-2xl text-[11px] leading-snug text-ink-3',
  /** Título de la métrica dentro del popover. */
  title: 'text-xs font-bold text-ink mb-1 uppercase tracking-wider',
  /** Texto explicativo. */
  description: 'text-[10px] text-ink-4 leading-snug',
  /** Flecha del popover. */
  arrow: 'absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-t-transparent border-b-line-soft',
};
