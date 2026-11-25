/**
 * Receta de InfoTooltip (spec-rediseno-02-c2, 6.2; PR 7): el icono de ayuda de las tarjetas de
 * Rendimiento y su burbuja, que se abre al pasar el ratón por el grupo o, al tocarlo o enfocarlo, con `open`.
 */
export const INFO_TOOLTIP = {
  root: 'group relative inline-block ml-1 align-middle z-tooltip',
  /**
   * Botón (A11Y-2): 24 px de zona táctil con ratón y 44 px en pantallas táctiles; los márgenes
   * negativos compensan para que el icono de 14 px no mueva el texto que lo rodea.
   */
  trigger:
    'inline-flex items-center justify-center w-6 h-6 -m-[5px] rounded-full align-middle cursor-help text-ink-4 hover:text-action-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-bright [@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:-m-[15px]',
  icon: 'transition-colors opacity-70',
  bubble:
    'invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-tooltip-info backdrop-blur-md text-tooltip-info-ink text-[10px] leading-snug rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-left border border-tooltip-info-edge',
  arrow: 'absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-tooltip-info-arrow',
};

/** Burbuja abierta por un toque (D4 d): `visible` y `opacity-100` en lugar de `invisible` y `opacity-0`. */
export const infoBubbleClass = (open) =>
  open ? INFO_TOOLTIP.bubble.replace('invisible ', 'visible ').replace(' opacity-0 ', ' opacity-100 ') : INFO_TOOLTIP.bubble;
