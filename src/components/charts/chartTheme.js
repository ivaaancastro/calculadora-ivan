/**
 * Tema de gráficas (Recharts, SVG propio y Leaflet).
 *
 * Recharts y Leaflet reciben los colores como atributos y no pueden leer clases de Tailwind. Para
 * que haya UNA sola fuente de color (spec-capa6-v2-premium, PR 13), aquí solo se declara qué token
 * usa cada pieza; el valor sale de `:root` (claro) y `.dark` (oscuro) de src/styles/tokens.css,
 * que se lee como texto al compilar. Cambiar la paleta es cambiar tokens.css.
 *
 * Estructura según los parámetros de la skill `dataviz`:
 * - series:       identidad de cada métrica (CTL, ATL, FC, potencia…).
 * - sports:       color de cada deporte en el detalle de actividad; distribution, en el reparto.
 * - zones:        escalas ordinales de zonas (FC y potencia/ritmo).
 * - anatomy:      rejilla, ejes, cursor, referencias y anillo del punto activo (recesivos).
 * - tooltip:      superficie, borde y texto del tooltip oscuro de las tarjetas.
 * - map:          ruta, halo e inicio/fin del mapa (Leaflet).
 * - pmc:          SVG de la PMC del Calendario (vista "Forma").
 *
 * Los componentes no leen este objeto: usan `useChartTheme()`, que devuelve solo los colores.
 */
import tokensCss from '../../styles/tokens.css?raw';

/** Lee los bloques `:root` y `.dark` de tokens.css → { light: { token: 'r g b' }, dark: {…} }. */
const parseTokens = (css) => {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const read = (selector) => {
    const re = new RegExp(`(^|\\n)\\s*${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'g');
    return Object.fromEntries(
      [...clean.matchAll(re)].flatMap((m) => [...m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()])),
    );
  };
  return { light: read(':root'), dark: read('.dark') };
};

const TOKENS = parseTokens(tokensCss);

/** 'r g b' (+ opacidad `--x-a`) → '#rrggbb' o 'rgba(r, g, b, a)'. */
const colorOf = (mode, token) => {
  const rgb = TOKENS[mode][token];
  if (!rgb) throw new Error(`chartTheme: falta el token --${token} en tokens.css (${mode})`);
  const [r, g, b] = rgb.split(/\s+/).map(Number);
  const a = Number(TOKENS[mode][`${token}-a`] ?? 1);
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};

const c = (token) => ({ token });

const Z1 = c('chart-zone-1');
const Z2 = c('chart-zone-2');
const Z3 = c('chart-zone-3');

/** Qué token pinta cada pieza (igual en claro y oscuro; cambia el valor del token). */
export const CHART_TOKENS = {
  series: {
    ctl: c('metric-ctl'),
    atl: c('metric-atl'),
    tsb: c('metric-tsb'),
    hr: c('hr'),
    pace: c('pace'),
    power: c('power'),
    cadence: c('cadence'),
    altitude: c('chart-altitude'),
    ef: c('ef'),
    sleep: c('sleep'),
    readiness: c('chart-readiness'),
    strain: c('chart-strain'),
    tss: c('chart-tss'),
    hours: c('chart-hours'),
    /** Perfil de potencia: curva del usuario y curvas de referencia por nivel. */
    profileUser: c('chart-profile-user'),
    profileTop: c('chart-profile-top'),
    profileOther: c('chart-profile-other'),
  },
  sports: {
    run: c('chart-sport-run'),
    walk: c('chart-sport-walk'),
    bike: c('chart-sport-bike'),
    strength: c('chart-sport-strength'),
    other: c('chart-sport-other'),
    fallback: c('chart-sport-fallback'),
  },
  distribution: {
    bike: c('sport-bike'),
    run: c('sport-run'),
    strength: c('chart-dist-strength'),
    walk: c('chart-dist-walk'),
    workout: c('chart-dist-workout'),
    other: c('chart-dist-other'),
  },
  zones: {
    /** Zonas de FC del detalle de actividad (5). */
    hr: [Z1, Z2, Z3, c('chart-zone-hr-4'), c('chart-zone-hr-5')],
    /** Zonas de potencia/ritmo del detalle de actividad (7). */
    all: [Z1, Z2, Z3, c('chart-zone-4'), c('chart-zone-5'), c('chart-zone-6'), c('chart-zone-7')],
  },
  anatomy: {
    grid: c('chart-grid'),
    gridSoft: c('chart-grid-soft'),
    grid2: c('chart-grid-2'),
    gridZinc: c('chart-grid-zinc'),
    axis: c('chart-axis'),
    tick: c('chart-tick'),
    tickZinc: c('chart-tick-zinc'),
    cursor: c('chart-cursor'),
    cursorZinc: c('chart-cursor-zinc'),
    cursorFill: c('chart-cursor-fill'),
    dotRing: c('chart-dot-ring'),
  },
  tooltip: {
    bg: c('chart-tooltip'),
    edge: c('chart-tooltip-edge'),
    ink: c('chart-tooltip-ink'),
  },
  map: {
    haloLight: c('chart-map-halo-light'),
    haloDark: c('chart-map-halo-dark'),
    route: c('chart-map-route'),
    start: c('chart-map-start'),
    end: c('chart-map-end'),
    ring: c('chart-map-ring'),
  },
  pmc: {
    ctl: c('chart-pmc-ctl'),
    atl: c('chart-pmc-atl'),
    tsb: c('chart-pmc-tsb'),
    ramp: c('chart-pmc-ramp'),
    /** Rampa proyectada (discontinua). */
    rampProj: c('chart-pmc-ramp-proj'),
    ctlInk: c('chart-pmc-ctl-ink'),
    atlInk: c('chart-pmc-atl-ink'),
    tsbInk: c('chart-pmc-tsb-ink'),
    rampInk: c('chart-pmc-ramp-ink'),
    band: c('chart-pmc-band'),
    bandUp: c('chart-pmc-band-up'),
    bandDown: c('chart-pmc-band-down'),
    today: c('chart-pmc-today'),
  },
};

/** Sustituye cada { token } por su color en `mode`, conservando la forma (objetos y listas). */
const resolve = (node, mode) => {
  if (Array.isArray(node)) return node.map((n) => resolve(n, mode));
  if (node && typeof node.token === 'string') return colorOf(mode, node.token);
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolve(v, mode)]));
};

const COLORS = { light: resolve(CHART_TOKENS, 'light'), dark: resolve(CHART_TOKENS, 'dark') };

/** Colores de gráficas para 'light' | 'dark' (p. ej. `getChartTheme('dark').series.hr`). */
export const getChartTheme = (theme) => (theme === 'dark' ? COLORS.dark : COLORS.light);
