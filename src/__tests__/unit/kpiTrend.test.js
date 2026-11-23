import { describe, it, expect } from 'vitest';
import { seriesValues, deltaOver, acwrZone } from '../../utils/kpiTrend';

describe('seriesValues', () => {
  it('toma los últimos n valores numéricos', () => {
    const s = Array.from({ length: 40 }, (_, i) => ({ atl: i }));
    const v = seriesValues(s, 'atl', 28);
    expect(v).toHaveLength(28);
    expect(v[27]).toBe(39);
  });
  it('ignora huecos y entradas inválidas', () => {
    expect(seriesValues([{ a: 1 }, { a: null }, {}, { a: 3 }], 'a')).toEqual([1, 3]);
    expect(seriesValues(undefined, 'a')).toEqual([]);
  });
});

describe('deltaOver', () => {
  it('compara con el valor de hace `lag` días', () => {
    expect(deltaOver([1, 2, 3, 4, 5, 6, 7, 8, 10], 7)).toBe(10 - 2);
  });
  it('se acorta con series cortas y devuelve null con < 2 puntos', () => {
    expect(deltaOver([4, 6], 7)).toBe(2);
    expect(deltaOver([4])).toBeNull();
  });
});

describe('acwrZone', () => {
  it.each([[0, 'none'], [0.5, 'low'], [1, 'optimal'], [1.4, 'watch'], [1.8, 'risk']])('%s → %s', (v, k) =>
    expect(acwrZone(v).key).toBe(k));
});
