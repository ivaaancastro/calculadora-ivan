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

import { buildHeatmap, heatmapLevel } from '../../components/charts/heatmapGrid';

describe('charts/heatmapGrid', () => {
  it('niveles 0-4 según la proporción del máximo', () => {
    expect(heatmapLevel(0, 100)).toBe(0);
    expect(heatmapLevel(10, 100)).toBe(1);
    expect(heatmapLevel(100, 100)).toBe(4);
  });
  it('construye N columnas de 7 días terminando en la semana de hoy', () => {
    const today = new Date(2026, 10, 18); // miércoles
    const { cols, max } = buildHeatmap({ '2026-11-17': 80, '2026-11-20': 500 }, today, 4);
    expect(cols).toHaveLength(4);
    expect(cols.every((c) => c.length === 7)).toBe(true);
    expect(cols[3][0].key).toBe('2026-11-16'); // lunes
    expect(cols[3][1].value).toBe(80);
    expect(cols[3][4].future).toBe(true);
    expect(cols[3][4].value).toBe(0); // futuro ignorado
    expect(max).toBe(80);
  });
});
