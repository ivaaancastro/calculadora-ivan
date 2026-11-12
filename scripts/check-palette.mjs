#!/usr/bin/env node
/**
 * Validador de la paleta de la piel v2 (spec-rediseno-02-c3-skin-dir, RF5.5).
 *
 *   node scripts/check-palette.mjs
 *
 * Lee los dos bloques `html[data-ui="v2"] …` de `src/styles/tokens.css` (marcados con
 * `@tokens:skin-v2`), resuelve sus valores y comprueba:
 *
 *  1. Contraste WCAG 2.1 de cada texto sobre **todas** las superficies de su tema
 *     (4,5:1). Si el texto más claro de un tema pasa sobre la superficie más oscura,
 *     pasa sobre todas, así que el mínimo es la garantía.
 *  2. Contraste de los colores con significado (estados del Calendario) sobre las mismas
 *     superficies (4,5:1: son texto de 9–11 px).
 *  3. Contraste de las tres series de las gráficas contra la tarjeta (3:1, elementos
 *     gráficos) y separación mínima entre ellas (ΔE ≥ 25 en CIELAB).
 *
 * `--faint` queda fuera a propósito: no es un token de texto, es el de líneas y controles
 * deshabilitados (el equivalente de v1).
 *
 * Sale con código 1 y lista los fallos cuando algo no pasa.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/** '#rrggbb' o "r g b" → [r, g, b]. */
const toRgb = (value) => {
  const v = value.trim();
  if (v.startsWith('#')) {
    const h = v.slice(1);
    const full = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  const [r, g, b] = v.split(/\s+/).map(Number);
  return [r, g, b];
};

const linear = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** Contraste WCAG entre dos colores {rgb}. */
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** CIELAB (D65) para medir separación entre series. */
const lab = ([r, g, b]) => {
  const [lr, lg, lb] = [r, g, b].map((c) => linear(c));
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};
const deltaE = (a, b) => {
  const [A, B] = [lab(a), lab(b)];
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};

// ── Lectura de los bloques de la piel ────────────────────────────────────────────

const css = readFileSync(TOKENS, 'utf8');
const start = css.indexOf('@tokens:skin-v2:start');
const end = css.indexOf('@tokens:skin-v2:end');
if (start < 0 || end < 0) throw new Error('Faltan los marcadores @tokens:skin-v2 en tokens.css');

const section = css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '');
const blocks = [...section.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  dark: m[1].includes('.dark'),
  tokens: Object.fromEntries(
    [...m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
  ),
}));

const skin = {
  light: blocks.find((b) => !b.dark)?.tokens,
  dark: blocks.find((b) => b.dark)?.tokens,
};
if (!skin.light || !skin.dark) throw new Error('La piel v2 necesita un bloque claro y otro oscuro');

// ── Qué se mide ──────────────────────────────────────────────────────────────────

/** Superficies donde se apoya el texto (las tarjetas y fichas de estas pantallas). */
const SURFACES = ['surface', 'surface-2', 'surface-3', 'sunken', 'sunken-6'];

/** Texto: 4,5:1 (AA para texto normal; en la app todo es ≤ 18 px salvo cifras sueltas). */
const TEXT = ['ink', 'ink-2', 'body', 'body-soft', 'ink-3', 'ink-4'];

/** Colores con significado que se pintan como texto (radios y estados del Calendario). */
const STATE = [
  'legacy-ctl-sky',
  'legacy-atl-red',
  'legacy-atl-purple-ink',
  'legacy-tsb-up',
  'legacy-tsb-down',
  'legacy-tsb-low',
  'danger-light',
];

/** Series de las gráficas: 3:1 contra la tarjeta y ΔE ≥ 25 entre ellas. */
const SERIES = ['metric-ctl', 'metric-atl', 'metric-tsb'];
const MIN_DELTA_E = 25;

const failures = [];
const rows = [];

const check = (ok, label, detail) => {
  rows.push(`${ok ? 'ok   ' : 'FALLA'} ${label.padEnd(46)} ${detail}`);
  if (!ok) failures.push(label);
};

for (const mode of ['light', 'dark']) {
  const tokens = skin[mode];
  const color = (name) => {
    if (!(name in tokens)) throw new Error(`Falta --${name} en el bloque ${mode} de la piel v2`);
    return toRgb(tokens[name]);
  };
  const surface = color('surface-card');
  const surfaces = SURFACES.map((name) => ({ name, rgb: color(name) }));

  rows.push(`\n== ${mode}`);

  for (const name of [...TEXT, ...STATE]) {
    const rgb = color(name);
    const worst = surfaces
      .map((s) => ({ s: s.name, ratio: contrast(rgb, s.rgb) }))
      .sort((a, b) => a.ratio - b.ratio)[0];
    check(
      worst.ratio >= 4.5,
      `${mode} --${name}`,
      `${worst.ratio.toFixed(2)}:1 sobre --${worst.s}`,
    );
  }

  for (const name of SERIES) {
    const ratio = contrast(color(name), surface);
    check(ratio >= 3, `${mode} serie --${name}`, `${ratio.toFixed(2)}:1 sobre tarjeta`);
  }

  for (let i = 0; i < SERIES.length; i += 1) {
    for (let j = i + 1; j < SERIES.length; j += 1) {
      const d = deltaE(color(SERIES[i]), color(SERIES[j]));
      check(d >= MIN_DELTA_E, `${mode} ΔE ${SERIES[i]}↔${SERIES[j]}`, d.toFixed(1));
    }
  }
}

console.log(rows.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} comprobaciones fallan`);
  process.exit(1);
}
console.log('\npaleta válida: contraste y separación dentro de los umbrales');
