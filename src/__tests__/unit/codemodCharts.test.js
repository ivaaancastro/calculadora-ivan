import { describe, it, expect } from 'vitest';
import { transformSource, ASSIGN, loadDefs } from '../../../scripts/codemods/charts.mjs';
import { chartTheme } from '../../components/charts/chartTheme';

const tokensOf = (node) => (node && typeof node.token === 'string' ? [node.token] : Object.values(node).flatMap(tokensOf));

describe('codemod de gráficas', () => {
  it('sustituye atributos JSX, propiedades y valores dentro de expresiones', () => {
    const src = `<Line stroke="#3b82f6" dot={{ stroke: '#fff', fill: '#3b82f6' }} />\nx = c || "#6366f1"`;
    expect(transformSource(src, { 1: ['series.ctl', 'anatomy.dotRing', 'series.ctl'], 2: ['sports.fallback'] })).toBe(
      `<Line stroke={ct.series.ctl} dot={{ stroke: ct.anatomy.dotRing, fill: ct.series.ctl }} />\nx = c || ct.sports.fallback`,
    );
  });

  it('admite "white" y deja los literales marcados con keep', () => {
    expect(transformSource(`<circle fill="#38bdf8" stroke="white" />`, { 1: ['pmc.ctl', 'anatomy.dotRing'] })).toBe(
      `<circle fill={ct.pmc.ctl} stroke={ct.anatomy.dotRing} />`,
    );
    expect(transformSource(`<G a="#f1f5f9" b="#27272a" />`, { 1: ['anatomy.gridSoft', 'keep'] })).toBe(`<G a={ct.anatomy.gridSoft} b="#27272a" />`);
  });

  it('falla si el valor no es el del rol, si sobra o falta un rol, o si el rol no existe', () => {
    expect(() => transformSource(`a="#f43f5e"`, { 1: ['series.ctl'] })).toThrow(/no es series.ctl/);
    expect(() => transformSource(`a="#3b82f6" b="#3b82f6"`, { 1: ['series.ctl'] })).toThrow(/sin rol/);
    expect(() => transformSource(`a="#3b82f6"`, { 1: ['series.ctl', 'series.ctl'] })).toThrow(/2 roles para 1/);
    expect(() => transformSource(`a="#3b82f6"`, { 1: ['series.nope'] })).toThrow(/rol desconocido/);
  });

  it('la asignación solo nombra archivos del ámbito', () => {
    for (const f of Object.keys(ASSIGN)) expect(f).toMatch(/^src\/components\//);
  });

  it('cada token de charts.json lo usa algún rol de chartTheme', () => {
    const used = new Set([...tokensOf(chartTheme.light), ...tokensOf(chartTheme.dark)]);
    for (const name of Object.keys(loadDefs())) expect(used, name).toContain(name);
  });
});
