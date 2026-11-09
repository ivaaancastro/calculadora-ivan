import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { chartTheme, getChartTheme } from '../../components/charts/chartTheme';

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

/** '#rgb' | '#rrggbb' | 'rgba(r, g, b, a)' → { rgb: 'r g b', a }. */
const parseColor = (s) => {
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) return { rgb: `${m[1]} ${m[2]} ${m[3]}`, a: m[4] === undefined ? 1 : Number(m[4]) };
  const h = s.replace('#', '');
  const full = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  return { rgb: [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' '), a: 1 };
};

/** Todas las entradas { token, color } del tema, con su ruta. */
const entries = (node, path = []) => {
  if (node && typeof node.token === 'string') return [[path.join('.'), node]];
  return Object.entries(node).flatMap(([k, v]) => entries(v, [...path, k]));
};

describe('chartTheme ↔ tokens.css', () => {
  const tokens = readTokens();

  for (const mode of ['light', 'dark']) {
    it(`cada color de ${mode} coincide con su token`, () => {
      const list = entries(chartTheme[mode]);
      expect(list.length).toBeGreaterThan(50);
      for (const [path, def] of list) {
        expect(tokens[mode], `token --${def.token} (${path})`).toHaveProperty(def.token);
        const { rgb, a } = parseColor(def.color);
        expect(rgb, `${mode}.${path}`).toBe(tokens[mode][def.token]);
        expect(a, `${mode}.${path} (opacidad)`).toBe(Number(tokens[mode][`${def.token}-a`] ?? 1));
      }
    });
  }

  it('claro y oscuro declaran los mismos tokens', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual(Object.keys(tokens.light).sort());
  });

  it('getChartTheme devuelve solo colores, con la misma forma que el tema', () => {
    const t = getChartTheme('dark');
    expect(t.series.ctl).toBe('#3b82f6');
    expect(t.zones.hr).toHaveLength(5);
    expect(t.zones.all).toHaveLength(7);
    expect(t.tooltip.bg).toBe('rgba(0, 0, 0, 0.8)');
    expect(getChartTheme('light')).toEqual(getChartTheme('dark'));
    expect(getChartTheme(undefined)).toBe(getChartTheme('light'));
    for (const [path, def] of entries(chartTheme.light)) {
      expect(path.split('.').reduce((o, k) => o[k], getChartTheme('light'))).toBe(def.color);
    }
  });
});
