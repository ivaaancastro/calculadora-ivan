import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { summarizeSeries, summarizeCategories, chartFigureProps } from '../../components/charts/chartA11y';
import { ChartSkeleton } from '../../components/charts/ChartSkeleton.jsx';
import { Sparkline } from '../../components/charts/Sparkline.jsx';
import { sparklinePoints } from '../../components/charts/sparklinePoints';
import { buildHeatmap, heatmapLevel } from '../../utils/heatmapGrid';
import { sliceByRange } from '../../components/charts/sliceRange';

describe('charts/chartA11y', () => {
  it('resume inicio, fin, mínimo y máximo', () => {
    const data = [{ ctl: 40 }, { ctl: 60 }, { ctl: 52 }];
    expect(summarizeSeries(data, [{ key: 'ctl', label: 'Fitness' }])).toBe('Fitness: de 40 a 52, mín 40, máx 60');
  });
  it('devuelve vacío sin datos o sin valores numéricos', () => {
    expect(summarizeSeries([], [{ key: 'a', label: 'A' }])).toBe('');
    expect(summarizeSeries([{ a: null }], [{ key: 'a', label: 'A' }])).toBe('');
  });
  it('series largas sin desbordar la pila', () => {
    const big = Array.from({ length: 200000 }, (_, i) => ({ v: i % 100 }));
    expect(summarizeSeries(big, [{ key: 'v', label: 'V' }])).toBe('V: de 0 a 99, mín 0, máx 99');
  });
  it('A11Y-5: summarizeCategories resume por categoría con coma decimal', () => {
    const data = [{ n: '5 s', w: 900 }, { n: '1 min', w: 42.5 }, { n: '5 min', w: null }];
    expect(summarizeCategories(data, 'n', 'w', 'W')).toBe('5 s: 900 W, 1 min: 42,5 W');
    expect(summarizeCategories(null, 'n', 'w')).toBe('');
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

describe('charts/sliceByRange', () => {
  const data = Array.from({ length: 100 }, (_, i) => i);
  it('devuelve el mismo array sin zoom', () => expect(sliceByRange(data, [0, 100])).toBe(data));
  it('recorta por porcentaje y deja al menos 2 puntos', () => {
    expect(sliceByRange(data, [25, 50])).toHaveLength(25);
    expect(sliceByRange(data, [50, 50]).length).toBeGreaterThanOrEqual(2);
  });
});

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
    expect(cols[3][4].value).toBe(0);
    expect(max).toBe(80);
  });
});
