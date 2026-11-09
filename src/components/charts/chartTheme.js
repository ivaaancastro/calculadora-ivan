/**
 * Tema de gráficas (Recharts, SVG propio y Leaflet), spec-rediseno-02-c1.
 *
 * Recharts recibe los colores como atributos y no puede leer clases de Tailwind, así que
 * aquí viven en hex, con los MISMOS valores que src/styles/tokens.css (lo comprueba
 * src/__tests__/unit/chartTheme.test.js). Los valores son los actuales: no cambia el aspecto.
 *
 * Estructura según los parámetros de la skill `dataviz`:
 * - series: identidad de cada serie (categórico, orden fijo).
 * - anatomy: rejilla, ejes, cursor, referencias y anillo del punto activo (recesivos).
 * - status, surfaces…: se añaden con la familia de gráficas (PR 6).
 *
 * Cada clave lleva `token`: el nombre de la variable CSS de la que sale.
 */

const SERIES = {
  ctl: { token: 'metric-ctl', color: '#3b82f6', label: 'CTL' },
  atl: { token: 'metric-atl', color: '#f43f5e', label: 'ATL' },
  tsb: { token: 'metric-tsb', color: '#eab308', label: 'TSB' },
};

const ANATOMY = {
  grid: { token: 'chart-grid', color: '#cbd5e1', opacity: 0.3 },
  axis: { token: 'chart-axis', color: '#64748b' },
  cursor: { token: 'chart-cursor', color: '#94a3b8' },
  reference: { token: 'chart-cursor', color: '#94a3b8', label: '#64748b' },
  dotRing: { token: 'chart-dot-ring', color: '#ffffff' },
};

/** Hoy las gráficas usan los mismos valores en claro y oscuro. */
export const chartTheme = {
  light: { series: SERIES, anatomy: ANATOMY },
  dark: { series: SERIES, anatomy: ANATOMY },
};

/** Tema de gráficas para 'light' | 'dark'. */
export const getChartTheme = (theme) => (theme === 'dark' ? chartTheme.dark : chartTheme.light);
