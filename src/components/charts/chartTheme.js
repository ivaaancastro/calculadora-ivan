/**
 * Tema de gráficas (Recharts, SVG propio y Leaflet), spec-rediseno-02-c1.
 *
 * Recharts y Leaflet reciben los colores como atributos y no pueden leer clases de Tailwind,
 * así que aquí viven en hex, con los MISMOS valores que src/styles/tokens.css (lo comprueba
 * src/__tests__/unit/chartTheme.test.js). Los valores son los actuales: no cambia el aspecto.
 *
 * Estructura según los parámetros de la skill `dataviz`:
 * - series:       identidad de cada métrica (CTL, ATL, FC, potencia…).
 * - sports:       color de cada deporte en el detalle de actividad; distribution, en el reparto.
 * - zones:        escalas ordinales de zonas (FC y potencia/ritmo).
 * - anatomy:      rejilla, ejes, cursor, referencias y anillo del punto activo (recesivos).
 * - tooltip:      superficie, borde y texto del tooltip oscuro de las tarjetas de Forma.
 * - map:          ruta, halo e inicio/fin del mapa (Leaflet).
 * - pmc:          SVG de la PMC del Calendario (vista "Forma").
 *
 * Hoy varias pantallas usan colores distintos para lo mismo (D-07, D-09 en paridad.md): se
 * conservan con su propio token y se unificarán en la Capa 3 cambiando solo valores.
 *
 * Cada entrada lleva `token` (la variable CSS de la que sale) y `color`. Los componentes no
 * leen este objeto: usan `useChartTheme()`, que devuelve solo los colores.
 */

const c = (token, color) => ({ token, color });

const SERIES = {
  ctl: c('metric-ctl', '#3b82f6'),
  atl: c('metric-atl', '#f43f5e'),
  tsb: c('metric-tsb', '#eab308'),
  /** ATL del gráfico de evolución antiguo (`ChartsSection`, D-07). */
  atlOrange: c('legacy-atl-orange', '#f97316'),
  hr: c('hr', '#f43f5e'),
  pace: c('pace', '#6366f1'),
  power: c('power', '#f59e0b'),
  cadence: c('cadence', '#10b981'),
  altitude: c('chart-altitude', '#64748b'),
  ef: c('ef', '#8b5cf6'),
  sleep: c('sleep', '#3b82f6'),
  readiness: c('chart-readiness', '#10b981'),
  strain: c('chart-strain', '#f43f5e'),
  tss: c('chart-tss', '#8b5cf6'),
  hours: c('chart-hours', '#10b981'),
  /** Perfil de potencia: curva del usuario y curvas de referencia por nivel. */
  profileUser: c('chart-profile-user', '#3b82f6'),
  profileTop: c('chart-profile-top', '#fbbf24'),
  profileOther: c('chart-profile-other', '#94a3b8'),
};

const SPORTS = {
  run: c('chart-sport-run', '#ea580c'),
  walk: c('chart-sport-walk', '#10b981'),
  bike: c('chart-sport-bike', '#2563eb'),
  strength: c('chart-sport-strength', '#7c3aed'),
  other: c('chart-sport-other', '#71717a'),
  fallback: c('chart-sport-fallback', '#6366f1'),
};

const DISTRIBUTION = {
  bike: c('sport-bike', '#3b82f6'),
  run: c('sport-run', '#f97316'),
  strength: c('chart-dist-strength', '#8b5cf6'),
  walk: c('chart-dist-walk', '#10b981'),
  workout: c('chart-dist-workout', '#6366f1'),
  other: c('chart-dist-other', '#cbd5e1'),
};

const Z1 = c('chart-zone-1', '#94a3b8');
const Z2 = c('chart-zone-2', '#3b82f6');
const Z3 = c('chart-zone-3', '#10b981');

const ZONES = {
  /** Zonas de FC del detalle de actividad (5). */
  hr: [Z1, Z2, Z3, c('chart-zone-hr-4', '#eab308'), c('chart-zone-hr-5', '#ef4444')],
  /** Zonas de potencia/ritmo del detalle de actividad (7). */
  all: [Z1, Z2, Z3, c('chart-zone-4', '#f59e0b'), c('chart-zone-5', '#f97316'), c('chart-zone-6', '#ef4444'), c('chart-zone-7', '#7c3aed')],
};

const ANATOMY = {
  grid: c('chart-grid', '#cbd5e1'),
  gridSoft: c('chart-grid-soft', '#f1f5f9'),
  grid2: c('chart-grid-2', '#e2e8f0'),
  gridZinc: c('chart-grid-zinc', '#3f3f46'),
  axis: c('chart-axis', '#64748b'),
  tick: c('chart-tick', '#94a3b8'),
  tickZinc: c('chart-tick-zinc', '#71717a'),
  cursor: c('chart-cursor', '#94a3b8'),
  cursorZinc: c('chart-cursor-zinc', '#71717a'),
  cursorFill: c('chart-cursor-fill', '#f8fafc'),
  dotRing: c('chart-dot-ring', '#ffffff'),
};

const TOOLTIP = {
  bg: c('chart-tooltip', 'rgba(0, 0, 0, 0.8)'),
  edge: c('chart-tooltip-edge', 'rgba(255, 255, 255, 0.1)'),
  ink: c('chart-tooltip-ink', '#ffffff'),
};

const MAP = {
  haloLight: c('chart-map-halo-light', '#ffffff'),
  haloDark: c('chart-map-halo-dark', '#000000'),
  route: c('chart-map-route', '#2563eb'),
  start: c('chart-map-start', '#10b981'),
  end: c('chart-map-end', '#18181b'),
  ring: c('chart-map-ring', '#ffffff'),
};

const PMC = {
  ctl: c('chart-pmc-ctl', '#38bdf8'),
  atl: c('chart-pmc-atl', '#a78bfa'),
  tsb: c('chart-pmc-tsb', '#22c55e'),
  ramp: c('chart-pmc-ramp', '#22c55e'),
  /** Rampa proyectada (discontinua). */
  rampProj: c('chart-pmc-ramp-proj', '#38bdf8'),
  ctlInk: c('chart-pmc-ctl-ink', '#0284c7'),
  atlInk: c('chart-pmc-atl-ink', '#7c3aed'),
  tsbInk: c('chart-pmc-tsb-ink', '#64748b'),
  rampInk: c('chart-pmc-ramp-ink', '#16a34a'),
  band: c('chart-pmc-band', '#f1f5f9'),
  bandUp: c('chart-pmc-band-up', '#10b981'),
  bandDown: c('chart-pmc-band-down', '#f87171'),
  today: c('chart-pmc-today', '#475569'),
};

const THEME = { series: SERIES, sports: SPORTS, distribution: DISTRIBUTION, zones: ZONES, anatomy: ANATOMY, tooltip: TOOLTIP, map: MAP, pmc: PMC };

/** Definiciones { token, color } por modo. Hoy las gráficas usan los mismos valores en claro y oscuro. */
export const chartTheme = { light: THEME, dark: THEME };

/** Sustituye cada { token, color } por su color, conservando la forma (objetos y listas). */
const colorsOf = (node) => {
  if (Array.isArray(node)) return node.map(colorsOf);
  if (node && typeof node.token === 'string') return node.color;
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, colorsOf(v)]));
};

const COLORS = { light: colorsOf(chartTheme.light), dark: colorsOf(chartTheme.dark) };

/** Colores de gráficas para 'light' | 'dark' (p. ej. `getChartTheme('dark').series.hr`). */
export const getChartTheme = (theme) => (theme === 'dark' ? COLORS.dark : COLORS.light);
