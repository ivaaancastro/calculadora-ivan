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

  // La piel v2 es la base (Capa 6, PR 7b): `chartTheme.v2` es lo que pintan las gráficas y debe
  // coincidir con `:root` / `.dark`. `chartTheme.light/dark` (v1) queda como paleta estática para
  // los pocos usos en JS fuera de las gráficas hasta el PR 13.
  for (const mode of ['light', 'dark']) {
    it(`cada color v2 de ${mode} coincide con su token`, () => {
      const list = entries(chartTheme.v2[mode]);
      expect(list.length).toBeGreaterThan(50);
      for (const [path, def] of list) {
        expect(tokens[mode], `token --${def.token} (${path})`).toHaveProperty(def.token);
        const { rgb, a } = parseColor(def.color);
        expect(rgb, `${mode}.${path}`).toBe(tokens[mode][def.token]);
        expect(a, `${mode}.${path} (opacidad)`).toBe(Number(tokens[mode][`${def.token}-a`] ?? 1));
      }
    });
  }

  it('claro y oscuro declaran los mismos tokens de color', () => {
    // La shell (spec-rediseno-02-c3) declara alturas y capas, que no dependen del tema.
    const colorTokens = (mode) => Object.keys(tokens[mode]).filter((k) => !/^(z-|nav-h|bottom-nav-)/.test(k));
    expect(colorTokens('dark').sort()).toEqual(colorTokens('light').sort());
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

  it('getChartTheme(theme, "v1") es el tema v1 y "v2" cambia solo lo que la piel redefine', () => {
    expect(getChartTheme('light', 'v1')).toBe(getChartTheme('light'));
    const v1 = getChartTheme('light');
    const v2 = getChartTheme('light', 'v2');
    expect(v2.series.ctl).not.toBe(v1.series.ctl);
    expect(v2.series.hr).not.toBe(v1.series.hr);
    expect(v2.zones.hr).toHaveLength(5);
    expect(v2.zones.all).toHaveLength(7);
    expect(v2.zones.all[1]).not.toBe(v1.zones.all[1]);
    // D-10: en v2 las series tienen valores propios en oscuro (más claros que en claro).
    for (const g of ['series', 'sports', 'distribution']) {
      expect(getChartTheme('dark', 'v2')[g]).not.toEqual(getChartTheme('light', 'v2')[g]);
    }
    expect(getChartTheme('dark', 'v2')).not.toEqual(getChartTheme('light', 'v2'));
  });
});
