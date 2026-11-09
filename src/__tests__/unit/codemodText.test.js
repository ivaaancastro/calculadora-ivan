import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { transform, tokensCss, findLiterals, canCoexist } from '../../../scripts/codemods/lib.mjs';
import { PROPS, FAMILY, loadDefs, tableFrom } from '../../../scripts/codemods/text.mjs';

const TABLE = {
  'slate-900|white': 'ink',
  'slate-500|zinc-400': 'ink-3',
  'slate-400|zinc-500': 'ink-4',
};
const run = (src) => transform(src, PROPS, TABLE);

describe('codemod de texto', () => {
  it('sustituye pares de texto y conserva variantes como placeholder: y group-hover:', () => {
    const { code } = run(
      `x = "text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 group-hover:text-slate-500 dark:group-hover:text-zinc-400"`,
    );
    expect(code).toBe(`x = "text-sm text-ink placeholder:text-ink-4 group-hover:text-ink-3"`);
  });

  it('no confunde tamaños ni alineaciones con colores', () => {
    const { code } = run(`x = "text-xs text-center text-[11px] text-slate-500 dark:text-zinc-400"`);
    expect(code).toBe(`x = "text-xs text-center text-[11px] text-ink-3"`);
  });

  it('las ramas opuestas de un ternario no se bloquean entre sí', () => {
    const { code } = run('x = <a className={on ? "text-blue-600" : "text-slate-500 dark:text-zinc-400"} />;');
    expect(code).toBe('x = <a className={on ? "text-blue-600" : "text-ink-3"} />;');
  });

  it('pero sí lo que coexiste con la rama (plantilla fuera del ternario)', () => {
    const src = 'x = <a className={`text-slate-500 dark:text-zinc-400 ${on ? "text-blue-600" : ""}`} />;';
    const r = run(src);
    expect(r.code).toBe(src);
    expect(r.skipped[0].reason).toMatch(/misma expresión/);
  });

  it('el bloqueo se propaga: si la base no se migra, la otra rama tampoco', () => {
    const src =
      'x = <i className={`text-slate-400 dark:text-zinc-500 ${open ? "text-blue-500" : "group-hover:text-slate-500 dark:group-hover:text-zinc-400"}`} />;';
    expect(run(src).code).toBe(src);
  });

  it('en ternarios anidados solo coexisten las ramas compatibles', () => {
    const src = 'x = a ? "text-blue-600" : b ? "text-slate-900 dark:text-white" : "text-red-500";';
    expect(run(src).code).toBe('x = a ? "text-blue-600" : b ? "text-ink" : "text-red-500";');
  });

  it('canCoexist: misma rama, rama opuesta y fuera del ternario', () => {
    const [outer, c, a] = findLiterals('x = `p ${on ? "c" : "a"}`;').filter((l) => l.text.trim());
    expect(canCoexist(outer, c)).toBe(true);
    expect(canCoexist(c, a)).toBe(false);
    expect(canCoexist(a, a)).toBe(true);
  });
});

describe('tokens de texto', () => {
  it('el bloque de tokens.css coincide con text.json', () => {
    const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
    expect(css).toContain(tokensCss(FAMILY, loadDefs()));
  });

  it('cada token corresponde a un par distinto', () => {
    const defs = loadDefs();
    expect(Object.keys(tableFrom(defs))).toHaveLength(Object.keys(defs).length);
  });
});
