/* global module, require, __dirname */
/**
 * Traduce los tokens de src/styles/tokens.css a colores de Tailwind con soporte de opacidad.
 * `token('x')`       → rgb(var(--x) / <alpha-value>)
 * `token('x', true)` → rgb(var(--x) / calc(var(--x-a, 1) * <alpha-value>)), para tokens cuyo
 *                      valor (claro u oscuro) lleva opacidad propia (`--x-a`).
 *
 * Los tokens de cada familia migrada viven en src/styles/tokens/<familia>.json
 * ({ token: { light, dark } } con nombres de la paleta de Tailwind); su bloque de tokens.css
 * lo genera el codemod de la familia y un test comprueba que coinciden.
 */
const fs = require('node:fs');
const path = require('node:path');

const token = (name, withAlpha = false) =>
  withAlpha
    ? `rgb(var(--${name}) / calc(var(--${name}-a, 1) * <alpha-value>))`
    : `rgb(var(--${name}) / <alpha-value>)`;

const hasAlpha = (spec) => spec.includes('/');

/** Familias generadas por los codemods (bordes, texto, superficies…). */
const FAMILIES_DIR = path.join(__dirname, 'tokens');
const families = fs.existsSync(FAMILIES_DIR)
  ? fs
      .readdirSync(FAMILIES_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => JSON.parse(fs.readFileSync(path.join(FAMILIES_DIR, f), 'utf8')))
  : [];

const familyColors = Object.fromEntries(
  families.flatMap((defs) =>
    Object.entries(defs).map(([name, d]) => [name, token(name, hasAlpha(d.light) || hasAlpha(d.dark))]),
  ),
);

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
  'on-action': token('on-action'), // texto sobre fondos de acción (landing v2)
  ...familyColors,
};

/** Nombres planos de todos los tokens (`metric-ctl`, `line`, `line-2`…). */
const flatColorNames = () => {
  const out = {};
  const visit = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = prefix ? `${prefix}-${k}` : k;
      if (typeof v === 'string') out[name] = v;
      else visit(v, name);
    }
  };
  visit(colors, '');
  return out;
};

module.exports = { token, colors, flatColorNames };
