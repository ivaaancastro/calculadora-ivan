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

import { Sparkline } from '../../components/charts/Sparkline.jsx';
import { sparklinePoints } from '../../components/charts/sparklinePoints';

describe('charts/Sparkline', () => {
  it('escala puntos dentro del viewBox e ignora no numéricos', () => {
    const pts = sparklinePoints([1, null, 3, 2], 100, 20, 2);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual([2, 18]);
    expect(pts[1][1]).toBe(2);
  });
  it('sin datos suficientes no pinta nada; con datos expone role="img"', () => {
    expect(renderToStaticMarkup(<Sparkline values={[1]} color="red" />)).toBe('');
    const html = renderToStaticMarkup(<Sparkline values={[1, 2, 3]} color="red" label="VFC" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="VFC. de 1 a 3"');
  });
});
