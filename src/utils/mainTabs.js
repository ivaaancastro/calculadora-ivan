/**
 * Pestañas principales de la app — fuente única de rutas (D17).
 * El orden es el del carrusel móvil, el de las rutas de escritorio y el de los gestos.
 * `view` es la clave de la vista en el mapa que recibe MainTabsView.
 */
export const MAIN_TABS = [
  { path: '/', view: 'analytics' },
  { path: '/stats', view: 'stats' },
  { path: '/calendar', view: 'calendar' },
  { path: '/health', view: 'health' },
  { path: '/history', view: 'history' },
];

export const MAIN_TAB_PATHS = MAIN_TABS.map((t) => t.path);
