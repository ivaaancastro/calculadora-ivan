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

// Lee los bloques `@tokens:skin-v2` (piel v2): mismo formato, con el selector `html[data-ui="v2"]`.
const readSkinV2Tokens = () => {
  const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
  const area = css.slice(css.indexOf('@tokens:skin-v2:start'), css.indexOf('@tokens:skin-v2:end')).replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector) => {
    const start = area.indexOf(selector);
    if (start < 0) throw new Error(`Falta el bloque ${selector} en tokens.css`);
    const body = area.slice(area.indexOf('{', start) + 1, area.indexOf('}', start));
    return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
  };
  return { light: block('html[data-ui="v2"] [data-skin="dashboard"]'), dark: block('html[data-ui="v2"].dark [data-skin="dashboard"]') };
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
    expect(v2.series.hr).toBe(v1.series.hr);
    expect(v2.zones).toEqual(v1.zones);
    expect(getChartTheme('dark', 'v2')).not.toEqual(getChartTheme('light', 'v2'));
  });
});

describe('chartTheme.v2 ↔ bloques @tokens:skin-v2', () => {
  const tokens = readSkinV2Tokens();

  for (const mode of ['light', 'dark']) {
    it(`cada color v2 de ${mode} coincide con su token de la piel`, () => {
      const changed = entries(chartTheme.v2[mode]).filter(([path, def]) => def !== path.split('.').reduce((o, k) => o?.[k], chartTheme[mode]));
      expect(changed.length).toBeGreaterThan(20);
      for (const [path, def] of changed) {
        expect(tokens[mode], `token --${def.token} (${path})`).toHaveProperty(def.token);
        const { rgb, a } = parseColor(def.color);
        expect(rgb, `v2.${mode}.${path}`).toBe(tokens[mode][def.token]);
        expect(a, `v2.${mode}.${path} (opacidad)`).toBe(Number(tokens[mode][`${def.token}-a`] ?? 1));
      }
    });
  }
});
