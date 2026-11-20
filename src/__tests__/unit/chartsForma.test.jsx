import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { summarizeSeries } from '../../components/charts/chartA11y';
import { ChartFigure } from '../../components/charts/ChartFigure.jsx';
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

describe('charts/ChartFigure y ChartSkeleton', () => {
  it('ChartFigure expone role="img" con el resumen', () => {
    const html = renderToStaticMarkup(<ChartFigure label="Título" summary="resumen">x</ChartFigure>);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Título. resumen"');
  });
  it('ChartSkeleton es un estado accesible', () => {
    expect(renderToStaticMarkup(<ChartSkeleton />)).toContain('role="status"');
  });
});
