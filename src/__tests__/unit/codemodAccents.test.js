import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { transform, tokensCss } from '../../../scripts/codemods/lib.mjs';
import { PROPS, FAMILY, COLORS, ALLOW, loadDefs, tableFrom } from '../../../scripts/codemods/accents.mjs';

const TABLE = {
  'red-500|red-500': 'danger',
  'red-600|red-400': 'danger-ink',
  'blue-600|blue-600': 'action-solid',
  'blue-700|blue-700': 'action-hover',
  '[#007AFF]|[#0A84FF]': 'action-ios',
};
const all = { singles: true };
const run = (src, opts = all) => transform(src, PROPS, TABLE, COLORS, 'x.jsx', opts);

describe('codemod de acentos (estados)', () => {
  it('migra clases sueltas a un token con el mismo valor en ambos modos', () => {
    expect(run(`x = "w-full bg-blue-600 hover:bg-blue-700 text-white"`).code).toBe(`x = "w-full bg-action-solid hover:bg-action-hover text-white"`);
  });

  it('una clase suelta con opacidad usa el token con el mismo modificador', () => {
    expect(run(`x = "hover:text-red-500 hover:bg-red-500/10"`).code).toBe(`x = "hover:text-danger hover:bg-danger/10"`);
  });

  it('migra pares y los azules iOS en hex', () => {
    expect(run(`x = "text-red-600 dark:text-red-400 font-bold"; y = "text-[#007AFF] dark:text-[#0A84FF]"`).code).toBe(
      `x = "text-danger-ink font-bold"; y = "text-action-ios"`,
    );
  });

  it('sin `singles`, una clase suelta no se toca', () => {
    const src = `x = "text-red-500"`;
    expect(run(src, {}).code).toBe(src);
  });

  it('un literal excluido no se migra y bloquea lo que coexiste con él', () => {
    const src = 'x = <i className={`text-red-500 ${on ? "font-bold" : "text-red-500"}`} />;';
    const skip = (file, lit) => lit.text.includes('font-bold');
    // La rama excluida no tiene color; la otra coexiste con la base y ambas se migran.
    expect(run(src, { singles: true, skip }).code).toBe('x = <i className={`text-danger ${on ? "font-bold" : "text-danger"}`} />;');
    const skipBase = (file, lit) => lit.text.startsWith('text-red-500 ');
    expect(run(src, { singles: true, skip: skipBase }).code).toBe(src);
  });
});

describe('tokens de acentos', () => {
  it('el bloque de tokens.css coincide con accents.json', () => {
    const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
    expect(css).toContain(tokensCss(FAMILY, loadDefs()));
  });

  it('cada token corresponde a un par distinto', () => {
    const defs = loadDefs();
    expect(Object.keys(tableFrom(defs))).toHaveLength(Object.keys(defs).length);
  });

  it('la lista de inclusión solo nombra archivos del ámbito', () => {
    for (const f of Object.keys(ALLOW)) expect(f).toMatch(/^src\/components\//);
  });
});
