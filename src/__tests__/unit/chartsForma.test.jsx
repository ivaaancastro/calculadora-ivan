import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { summarizeSeries, chartFigureProps } from '../../components/charts/chartA11y';
import { ChartSkeleton } from '../../components/charts/ChartSkeleton.jsx';

describe('charts/chartA11y', () => {
  it('resume inicio, fin, mínimo y máximo', () => {
    const data = [{ ctl: 40 }, { ctl: 60 }, { ctl: 52 }];
    expect(summarizeSeries(data, [{ key: 'ctl', label: 'Fitness' }])).toBe('Fitness: de 40 a 52, mín 40, máx 60');
  });
  it('devuelve vacío sin datos o sin valores numéricos', () => {
    expect(summarizeSeries([], [{ key: 'a', label: 'A' }])).toBe('');
    expect(summarizeSeries([{ a: null }], [{ key: 'a', label: 'A' }])).toBe('');
  });
});

describe('charts/a11y props y ChartSkeleton', () => {
  it('chartFigureProps da role="img" con el resumen', () => {
    expect(chartFigureProps('Título', 'resumen')).toEqual({ role: 'img', 'aria-label': 'Título. resumen' });
    expect(chartFigureProps('Título', '')['aria-label']).toBe('Título');
  });
  it('ChartSkeleton es un estado accesible', () => {
    expect(renderToStaticMarkup(<ChartSkeleton />)).toContain('role="status"');
  });
});

import { sliceByRange } from '../../components/charts/sliceRange';

describe('charts/sliceByRange', () => {
  const data = Array.from({ length: 100 }, (_, i) => i);
  it('devuelve el mismo array sin zoom', () => expect(sliceByRange(data, [0, 100])).toBe(data));
  it('recorta por porcentaje y deja al menos 2 puntos', () => {
    expect(sliceByRange(data, [25, 50])).toHaveLength(25);
    expect(sliceByRange(data, [50, 50]).length).toBeGreaterThanOrEqual(2);
  });
});
