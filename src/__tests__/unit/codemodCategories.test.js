import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { transform, tokensCss } from '../../../scripts/codemods/lib.mjs';
import { PROPS, FAMILY, COLORS, ASSIGN, loadDefs, groupDefs, tablesFor } from '../../../scripts/codemods/categories.mjs';

const tables = tablesFor();
/** Aplica el codemod a un fuente de una línea por literal, con el grupo de cada línea. */
const run = (src, groups) =>
  transform(src, PROPS, {}, COLORS, 'x.jsx', {
    singles: true,
    guardStates: true,
    tableOf: (lit) => {
      const g = groups[src.slice(0, lit.start).split('\n').length];
      return g ? tables([].concat(g)) : {};
    },
    skip: (file, lit) => !groups[src.slice(0, lit.start).split('\n').length],
  }).code;

describe('codemod de categorías', () => {
  it('el mismo color va a un token distinto según el grupo de la línea', () => {
    const src = `a = "text-orange-500"\nb = "text-orange-500"`;
    expect(run(src, { 1: 'sport-run', 2: 'legacy-sport-strength' })).toBe(`a = "text-sport-run"\nb = "text-legacy-sport-strength-orange"`);
  });

  it('fuera del grupo `state`, un color de estado no se toma por estado', () => {
    // emerald-500 es `positive` en 5a, pero aquí es cadencia.
    expect(run(`x = "text-emerald-500"`, { 1: 'cadence' })).toBe(`x = "text-cadence"`);
    expect(run(`x = "text-emerald-500"`, { 1: 'state' })).toBe(`x = "text-positive"`);
  });

  it('una línea sin grupo no se toca', () => {
    const src = `x = "text-rose-500"`;
    expect(run(src, {})).toBe(src);
  });

  it('migra el neutro que comparte expresión con el acento (par claro/oscuro)', () => {
    expect(run(`x = "text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400"`, { 1: 'state' })).toBe(
      `x = "text-ink-3 hover:text-danger-ink-2"`,
    );
  });

  it('un neutro suelto no pasa a un token que solo coincide en valor, y bloquea su propiedad', () => {
    const src = `x = "text-slate-300 hover:text-red-500"`;
    expect(run(src, { 1: 'state' })).toBe(src);
  });

  it('no migra un par dark: de base junto a un estado sin dark: de la misma propiedad (D-08)', () => {
    // Hoy en oscuro gana `dark:text-zinc-500` y no hay hover rojo; con tokens ganaría el hover.
    const src = `x = "text-slate-400 dark:text-zinc-500 hover:text-red-500 bg-rose-500"`;
    expect(run(src, { 1: 'state' })).toBe(src);
    // Si el estado tiene su `dark:`, gana igual antes y después: se migra.
    expect(run(`x = "text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400"`, { 1: 'state' })).toBe(
      `x = "text-ink-3 hover:text-danger-ink-2"`,
    );
  });

  it('una clase suelta con opacidad usa el token base del grupo', () => {
    expect(run(`x = "bg-rose-500/10 text-rose-500"`, { 1: 'hr' })).toBe(`x = "bg-hr/10 text-hr"`);
  });
});

describe('tokens de categorías', () => {
  it('el bloque de tokens.css coincide con categories.json', () => {
    const css = readFileSync(fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)), 'utf8');
    expect(css).toContain(tokensCss(FAMILY, loadDefs()));
  });

  it('dentro de cada grupo, cada token corresponde a un par distinto', () => {
    const defs = loadDefs();
    const groups = new Set(Object.values(ASSIGN).flatMap((m) => Object.values(m).flat()));
    for (const g of groups) {
      const vals = Object.values(groupDefs(defs, g)).map((d) => `${d.light}|${d.dark}`);
      expect(new Set(vals).size).toBe(vals.length);
    }
  });

  it('cada token pertenece a algún grupo asignado', () => {
    const groups = [...new Set(Object.values(ASSIGN).flatMap((m) => Object.values(m).flat()))];
    for (const name of Object.keys(loadDefs())) expect(groups.some((g) => name === g || name.startsWith(`${g}-`))).toBe(true);
  });

  it('la asignación solo nombra archivos del ámbito', () => {
    for (const f of Object.keys(ASSIGN)) expect(f).toMatch(/^src\/components\//);
  });
});
