/**
 * Recetas de Skeleton y EmptyState (Fase Premium B, EST-1/2/3; Capa 6, PR 14).
 * Un solo patrón para vacío, error y carga: icono en ficha, título en frase, una línea de ayuda y,
 * si procede, una acción. Sin MAYÚSCULAS ni tracking en el cuerpo (TIP-3).
 */
export const skeletonClass = 'rounded-lg bg-fill motion-safe:animate-pulse';

export const stateClass = {
  root: 'flex flex-col items-center justify-center text-center gap-3 px-6 py-10',
  title: 'text-sm font-semibold text-ink',
  description: 'text-xs text-ink-4 max-w-xs text-pretty',
  actions: 'flex flex-col sm:flex-row items-center gap-2 mt-1',
};

/** Ficha del icono según el tono: `neutral` (vacío), `info`, `warning` y `danger` (error). */
const CHIP_TONE = {
  neutral: 'bg-fill text-ink-4',
  info: 'bg-action-tint text-action',
  warning: 'bg-warning-tint text-warning-ink',
  danger: 'bg-danger-tint-4 text-danger-ink-3',
};

export function stateChipClass(tone = 'neutral') {
  if (!CHIP_TONE[tone]) throw new Error(`EmptyState: tono desconocido "${tone}"`);
  return `w-12 h-12 rounded-xl flex items-center justify-center ${CHIP_TONE[tone]}`;
}
