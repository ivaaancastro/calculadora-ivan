import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { transform, tokensCss, resolveColor, findCssLiterals } from '../../../scripts/codemods/lib.mjs';
import { PROPS, FAMILY, COLORS, loadDefs, tableFrom } from '../../../scripts/codemods/surfaces.mjs';

const TABLE = {
  'white|zinc-900': 'surface',
  'white|[#2c2c2e]': 'surface-4',
  'white/80|[#1c1c1e]/85': 'glass',
};
const run = (src, file) => transform(src, PROPS, TABLE, COLORS, file);

describe('codemod de superficies', () => {
  it('sustituye fondos con grises de iOS en hex', () => {
    expect(run(`x = "p-2 bg-white dark:bg-[#2c2c2e] rounded"`).code).toBe(`x = "p-2 bg-surface-4 rounded"`);
  });

  it('no toca los acentos en hex ni bg-gradient', () => {
    const src = `x = "bg-gradient-to-r bg-white dark:bg-[#0A84FF]/15"`;
    expect(run(src).code).toBe(src);
  });

  it('migra los @apply de un CSS', () => {
    const css = `.a {\n  @apply bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl;\n}\n.b { color: red; }\n`;
    expect(run(css, 'index.css').code).toBe(`.a {\n  @apply bg-glass backdrop-blur-xl;\n}\n.b { color: red; }\n`);
    expect(findCssLiterals(css)).toHaveLength(1);
  });

  it('resuelve hex y arbitrarios con opacidad', () => {
    expect(resolveColor('#f2f2f7')).toEqual({ rgb: '242 242 247', a: 1 });
    expect(resolveColor('[#1c1c1e]/85')).toEqual({ rgb: '28 28 30', a: 0.85 });
    expect(resolveColor('[#1e1e22]/[0.68]')).toEqual({ rgb: '30 30 34', a: 0.68 });
  });
});

describe('tokens de superficies', () => {
  it('el bloque de tokens.css coincide con surfaces.json', () => {
    const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
    expect(css).toContain(tokensCss(FAMILY, loadDefs()));
  });

  it('cada token corresponde a un par distinto', () => {
    const defs = loadDefs();
    expect(Object.keys(tableFrom(defs))).toHaveLength(Object.keys(defs).length);
  });
});
