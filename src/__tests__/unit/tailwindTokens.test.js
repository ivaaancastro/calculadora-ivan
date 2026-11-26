import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';

const require = createRequire(import.meta.url);
const { token } = require('../../styles/tailwindTokens.cjs');
// tailwind.config.js es CommonJS en un paquete ESM: se carga como lo hace Tailwind (jiti).
const config = loadConfig(require.resolve('../../../tailwind.config.js'));

const build = async (classes) => {
  const result = await postcss([
    tailwindcss({ ...config, content: [{ raw: `<div class="${classes}"></div>` }], corePlugins: { preflight: false } }),
  ]).process('@tailwind utilities;', { from: undefined });
  return result.css;
};

describe('tokens en el tema de Tailwind', () => {
  it('genera colores con opacidad a partir de variables CSS', async () => {
    const css = await build('bg-metric-ctl text-metric-atl/50 stroke-chart-grid');
    expect(css).toContain('background-color: rgb(var(--metric-ctl) / var(--tw-bg-opacity, 1))');
    expect(css).toContain('color: rgb(var(--metric-atl) / 0.5)');
    expect(css).toContain('stroke: rgb(var(--chart-grid) / 1)');
  });

  it('la variante con opacidad propia multiplica `--x-a` por el modificador', async () => {
    expect(token('x', true)).toBe('rgb(var(--x) / calc(var(--x-a, 1) * <alpha-value>))');
    expect(token('x')).toBe('rgb(var(--x) / <alpha-value>)');
  });
});
