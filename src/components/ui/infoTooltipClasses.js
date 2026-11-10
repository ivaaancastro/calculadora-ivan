/**
 * Receta de InfoTooltip (spec-rediseno-02-c2, 6.2; PR 7): el icono de ayuda de las tarjetas de
 * Rendimiento y su burbuja, que se abre al pasar el ratón por el grupo o, al tocarlo, con `open`.
 */
export const INFO_TOOLTIP = {
  root: 'group relative inline-block ml-1 align-middle cursor-help z-50',
  icon: 'text-ink-4 hover:text-action-2 transition-colors opacity-70',
  bubble:
    'invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-tooltip-info backdrop-blur-md text-tooltip-info-ink text-[10px] leading-snug rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-left border border-tooltip-info-edge',
  arrow: 'absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-tooltip-info-arrow',
};

/** Burbuja abierta por un toque (D4 d): `visible` y `opacity-100` en lugar de `invisible` y `opacity-0`. */
export const infoBubbleClass = (open) =>
  open ? INFO_TOOLTIP.bubble.replace('invisible ', 'visible ').replace(' opacity-0 ', ' opacity-100 ') : INFO_TOOLTIP.bubble;
