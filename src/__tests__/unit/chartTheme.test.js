import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { CHART_TOKENS, getChartTheme } from '../../components/charts/chartTheme';

// Lee todos los bloques `:root` y `.dark` de src/styles/tokens.css → { light: {token: 'r g b'}, dark: {...} }.
const readTokens = () => {
  const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = (selector) => {
    const re = new RegExp(`(^|\\n)\\s*${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'g');
    const found = [...css.matchAll(re)];
    if (!found.length) throw new Error(`Falta el bloque ${selector} en tokens.css`);
    return Object.fromEntries(found.flatMap((m) => [...m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()])));
  };
  return { light: blocks(':root'), dark: blocks('.dark') };
};

/** '#rrggbb' | 'rgba(r, g, b, a)' → { rgb: 'r g b', a }. */
const parseColor = (s) => {
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) return { rgb: `${m[1]} ${m[2]} ${m[3]}`, a: m[4] === undefined ? 1 : Number(m[4]) };
  const h = s.replace('#', '');
  return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' '), a: 1 };
};

/** Todas las entradas { token } del tema, con su ruta. */
const entries = (node, path = []) => {
  if (node && typeof node.token === 'string') return [[path, node.token]];
  return Object.entries(node).flatMap(([k, v]) => entries(v, [...path, k]));
};

describe('chartTheme: una sola fuente de color (tokens.css)', () => {
  const tokens = readTokens();

  for (const mode of ['light', 'dark']) {
    it(`cada color de ${mode} sale de su token`, () => {
      const list = entries(CHART_TOKENS);
      expect(list.length).toBeGreaterThan(50);
      const theme = getChartTheme(mode);
      for (const [path, token] of list) {
        expect(tokens[mode], `--${token}`).toHaveProperty(token);
        const { rgb, a } = parseColor(path.reduce((o, k) => o[k], theme));
        expect(rgb, `${mode}.${path.join('.')}`).toBe(tokens[mode][token]);
        expect(a, `${mode}.${path.join('.')} (opacidad)`).toBe(Number(tokens[mode][`${token}-a`] ?? 1));
      }
    });
  }

  it('claro y oscuro declaran los mismos tokens de color', () => {
    // La shell (spec-rediseno-02-c3) declara alturas y capas, que no dependen del tema.
    const colorTokens = (mode) => Object.keys(tokens[mode]).filter((k) => !/^(z-|nav-h|bottom-nav-)/.test(k));
    expect(colorTokens('dark').sort()).toEqual(colorTokens('light').sort());
  });

  it('getChartTheme devuelve solo colores, con la forma del tema y valores propios en oscuro', () => {
    const light = getChartTheme('light');
    const dark = getChartTheme('dark');
    expect(light.series.ctl).toMatch(/^#[0-9a-f]{6}$/);
    expect(light.zones.hr).toHaveLength(5);
    expect(light.zones.all).toHaveLength(7);
    expect(getChartTheme(undefined)).toBe(light);
    for (const g of ['series', 'sports', 'distribution', 'pmc']) expect(dark[g]).not.toEqual(light[g]);
  });

  it('las tres métricas de forma tienen colores distintos entre sí', () => {
    for (const mode of ['light', 'dark']) {
      const { ctl, atl, tsb } = getChartTheme(mode).series;
      expect(new Set([ctl, atl, tsb]).size).toBe(3);
    }
  });
});
