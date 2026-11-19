/**
 * Recetas de Skeleton, EmptyState y ErrorState (Fase Premium B, EST-1/2/3).
 * Un solo patrón para vacío, error y carga: icono en ficha, título en frase, una línea de ayuda y,
 * si procede, una acción. Sin MAYÚSCULAS ni tracking en el cuerpo (TIP-3).
 */
export const skeletonClass = 'rounded-lg bg-fill motion-safe:animate-pulse';

export const stateClass = {
  root: 'flex flex-col items-center justify-center text-center gap-3 px-6 py-10',
  chip: 'w-12 h-12 rounded-xl bg-fill flex items-center justify-center text-ink-4',
  chipError: 'w-12 h-12 rounded-xl bg-danger-tint-4 flex items-center justify-center text-danger-ink-3',
  title: 'text-sm font-semibold text-ink',
  description: 'text-xs text-ink-4 max-w-xs text-pretty',
  actions: 'flex flex-col sm:flex-row items-center gap-2 mt-1',
};
