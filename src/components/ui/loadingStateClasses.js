/**
 * Recetas de LoadingState (spec-rediseno-02-c2, 6.2; PR 8). Cada variante copia una receta actual:
 *  - `inline`: los 2 fallbacks de `Suspense` de las rutas diferidas, idénticos entre sí.
 *  - `screen`: la carga del Dashboard (girador y etiqueta pulsante sobre `h-screen`).
 *  - `boot`: el arranque de `App`, solo etiqueta pulsante sobre `min-h-screen`.
 * `screen` y `boot` no son la misma receta (altura, girador, separación, transición y tono del
 * texto), así que no se unifican: la Capa 3 decide una sola.
 */
const RECIPES = {
  inline: {
    root: 'flex items-center justify-center py-32',
    spinner: 'animate-spin text-action-bright',
    label: '',
  },
  screen: {
    root: 'h-screen flex flex-col items-center justify-center bg-sunken-2 gap-4 transition-colors',
    spinner: 'animate-spin text-action-bright',
    label: 'text-[10px] text-ink-3 font-bold uppercase tracking-widest animate-pulse',
  },
  boot: {
    root: 'min-h-screen bg-sunken-2 flex items-center justify-center',
    spinner: '',
    label: 'text-[10px] font-bold text-ink-3-flat uppercase tracking-widest animate-pulse',
  },
};

/** Etiqueta por defecto de cada variante (la del código actual). `inline` no lleva. */
const DEFAULT_LABEL = {
  screen: 'Cargando métricas...',
  boot: 'Iniciando sistema...',
};

export function loadingStateClass(variant) {
  const r = RECIPES[variant];
  if (r === undefined) throw new Error(`LoadingState: variante desconocida "${variant}"`);
  return r;
}

export const loadingStateLabel = (variant) => DEFAULT_LABEL[variant];
