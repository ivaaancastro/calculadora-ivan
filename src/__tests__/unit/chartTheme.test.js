import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { chartTheme, getChartTheme } from '../../components/charts/chartTheme';

// Lee src/styles/tokens.css y devuelve { light: {token: 'r g b'}, dark: {...} }.
const readTokens = () => {
  const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector) => {
    const m = css.match(new RegExp(`(^|\\n)\\s*${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`));
    if (!m) throw new Error(`Falta el bloque ${selector} en tokens.css`);
    return Object.fromEntries([...m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
  };
  return { light: block(':root'), dark: block('.dark') };
};

const hexToChannels = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
};

describe('chartTheme ↔ tokens.css', () => {
  const tokens = readTokens();

  for (const mode of ['light', 'dark']) {
    it(`cada color de ${mode} coincide con su token`, () => {
      const groups = chartTheme[mode];
      const entries = Object.values(groups).flatMap((g) => Object.entries(g));
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, def] of entries) {
        expect(tokens[mode], `token --${def.token} (${key})`).toHaveProperty(def.token);
        expect(hexToChannels(def.color), `${mode}.${key}`).toBe(tokens[mode][def.token]);
      }
    });
  }

  it('claro y oscuro declaran los mismos tokens', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual(Object.keys(tokens.light).sort());
  });

  it('getChartTheme devuelve el tema del modo pedido', () => {
    expect(getChartTheme('dark')).toBe(chartTheme.dark);
    expect(getChartTheme('light')).toBe(chartTheme.light);
    expect(getChartTheme(undefined)).toBe(chartTheme.light);
  });
});
