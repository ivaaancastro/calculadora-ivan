/* global module */
/**
 * Traduce los tokens de src/styles/tokens.css a colores de Tailwind con soporte de opacidad.
 * `token('x')`       → rgb(var(--x) / <alpha-value>)
 * `token('x', true)` → rgb(var(--x) / calc(var(--x-a, 1) * <alpha-value>)), para tokens cuyo
 *                      valor (normalmente el oscuro) lleva opacidad propia (`--x-a`).
 */
const token = (name, withAlpha = false) =>
  withAlpha
    ? `rgb(var(--${name}) / calc(var(--${name}-a, 1) * <alpha-value>))`
    : `rgb(var(--${name}) / <alpha-value>)`;

const colors = {
  metric: {
    ctl: token('metric-ctl'),
    atl: token('metric-atl'),
    tsb: token('metric-tsb'),
  },
  chart: {
    grid: token('chart-grid'),
    axis: token('chart-axis'),
    cursor: token('chart-cursor'),
    'dot-ring': token('chart-dot-ring'),
  },
};

module.exports = { token, colors };
