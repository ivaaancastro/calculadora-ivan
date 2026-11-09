import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { transform, tokensCss, resolveColor } from '../../../scripts/codemods/lib.mjs';
import { PROPS, FAMILY, loadDefs, tableFrom } from '../../../scripts/codemods/borders.mjs';

const TABLE = {
  'slate-200|zinc-800': 'line',
  'slate-300|zinc-700': 'line-strong',
  'black/[0.04]|white/[0.06]': 'hairline',
  'slate-100|zinc-800/50': 'line-soft',
};
const run = (src) => transform(src, PROPS, TABLE);

describe('codemod de bordes', () => {
  it('sustituye un par exacto y quita la clase dark', () => {
    const { code, replaced } = run(`<div className="p-2 border border-slate-200 dark:border-zinc-800 rounded" />`);
    expect(code).toBe(`<div className="p-2 border border-line rounded" />`);
    expect(replaced).toBe(1);
  });

  it('conserva variantes y lados, y admite dark: antes o después', () => {
    const { code } = run(
      `const a = 'border-b-slate-200 dark:border-b-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700';\nconst b = 'dark:border-zinc-800 border-slate-200';`,
    );
    expect(code).toBe(`const a = 'border-b-line hover:border-line-strong';\nconst b = 'border-line';`);
  });

  it('admite opacidades arbitrarias y divide/ring', () => {
    const { code } = run(`x = "border-black/[0.04] dark:border-white/[0.06] divide-slate-100 dark:divide-zinc-800/50"`);
    expect(code).toBe(`x = "border-hairline divide-line-soft"`);
  });

  it('no toca pares sin token ni valores parecidos', () => {
    const src = `x = "border-slate-200 dark:border-zinc-700/80 border-slate-200/50"`;
    expect(run(src).code).toBe(src);
  });

  it('descarta el par si otra clase de la misma propiedad no tiene pareja (precedencia)', () => {
    const src = `x = "border-slate-200 dark:border-zinc-800 focus:border-blue-500"`;
    const r = run(src);
    expect(r.code).toBe(src);
    expect(r.skipped[0].reason).toMatch(/precedencia/);
  });

  it('migra todos los pares de una propiedad o ninguno (grupo incompleto)', () => {
    const src = `x = "border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-500"`;
    const r = run(src);
    expect(r.code).toBe(src);
    expect(r.skipped[0].reason).toMatch(/precedencia/);
  });

  it('considera juntos los literales de una misma expresión de clases', () => {
    const src = 'x = <div className={`border border-slate-200 dark:border-zinc-800 ${on ? "hover:border-blue-300" : ""}`} />;';
    const r = run(src);
    expect(r.code).toBe(src);
    expect(r.skipped[0].reason).toMatch(/misma expresión/);
  });

  it('migra ternarios cuyos dos lados tienen token', () => {
    const { code } = run('x = <div className={on ? "border-slate-200 dark:border-zinc-800" : "border-slate-300 dark:border-zinc-700"} />;');
    expect(code).toBe('x = <div className={on ? "border-line" : "border-line-strong"} />;');
  });

  it('no mezcla literales distintos ni clases cortadas por ${…}', () => {
    const src = 'x = cond ? "border-slate-200" : "dark:border-zinc-800"; y = `border-slate-200 dark:border-zinc-800 border-${c}`;';
    expect(run(src).code).toBe(src);
  });

  it('ignora otras propiedades del mismo literal', () => {
    const { code } = run(`x = "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500"`);
    expect(code).toBe(`x = "bg-white dark:bg-zinc-900 border-line text-slate-500"`);
  });

  it('resuelve colores de la paleta con opacidad', () => {
    expect(resolveColor('zinc-800/50')).toEqual({ rgb: '39 39 42', a: 0.5 });
    expect(resolveColor('black/[0.04]')).toEqual({ rgb: '0 0 0', a: 0.04 });
    expect(resolveColor('white')).toEqual({ rgb: '255 255 255', a: 1 });
  });
});

describe('tokens de bordes', () => {
  it('el bloque de tokens.css coincide con borders.json', () => {
    const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
    expect(css).toContain(tokensCss(FAMILY, loadDefs()));
  });

  it('cada token corresponde a un par distinto', () => {
    const defs = loadDefs();
    expect(Object.keys(tableFrom(defs))).toHaveLength(Object.keys(defs).length);
  });
});
