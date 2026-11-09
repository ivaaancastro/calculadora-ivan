import { describe, it, expect } from 'vitest';
import { countColors } from '../../../scripts/check-colors.mjs';

describe('check-colors: recuento de colores sueltos', () => {
  it('cuenta clases de la paleta, con variantes y opacidad', () => {
    const c = countColors('className="bg-white dark:bg-zinc-900 hover:text-slate-500 border-blue-500/10 sm:dark:hover:bg-red-50"');
    expect(c.palette).toBe(5);
    expect(c.dark).toBe(2);
  });

  it('separa las clases arbitrarias con hex de los literales hex', () => {
    const c = countColors(`<div className="bg-[#2c2c2e] dark:text-[#0A84FF]/50" /><Line stroke="#3b82f6" fill='#fff' />`);
    expect(c.arbitrary).toBe(2);
    expect(c.hex).toBe(2);
    expect(c.dark).toBe(1);
  });

  it('cuenta rgb()/rgba() numéricos, pero no los que usan variables', () => {
    const c = countColors('a{color:rgba(0, 0, 0, 0.1)} b{color:rgb(var(--ink) / 1)}');
    expect(c.rgb).toBe(1);
  });

  it('no confunde tokens, tamaños ni utilidades parecidas con colores', () => {
    const c = countColors('bg-surface text-ink-3 border-line text-[10px] text-xs border-b bg-metric-ctl/20 to-transparent #root');
    expect(c).toEqual({ palette: 0, arbitrary: 0, hex: 0, rgb: 0, dark: 0 });
  });
});
