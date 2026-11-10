import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChartTooltip } from '../../components/ui/ChartTooltip.jsx';
import { chartTooltipClass, chartTooltipStyle } from '../../components/ui/chartTooltipClasses.js';
import { getChartTheme } from '../../components/charts/chartTheme';

const classes = (s) => s.split(' ').sort();

describe('ui/ChartTooltip recetas', () => {
  it('copia los marcos de hoy', () => {
    expect(classes(chartTooltipClass('glass'))).toEqual(
      classes('bg-surface-8 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-line-muted-3 shadow-xl min-w-[140px] pointer-events-none select-none z-50'),
    );
    expect(classes(chartTooltipClass('dark'))).toEqual(
      classes('bg-tooltip-dark border border-tooltip-dark-edge p-2 rounded-lg shadow-2xl text-[10px] font-bold text-tooltip-dark-ink min-w-[90px] backdrop-blur-sm'),
    );
    expect(classes(chartTooltipClass('dark-history'))).toEqual(
      classes('bg-tooltip-dark-2 backdrop-blur-md border border-tooltip-dark-edge-2 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]'),
    );
    expect(chartTooltipClass('card')).toBe('shadow-xl');
  });

  it('rechaza variantes que no existían', () => {
    expect(() => chartTooltipClass('light')).toThrow();
  });

  it('chartTooltipStyle conserva el estilo de las tarjetas de Rendimiento', () => {
    const ct = getChartTheme('light');
    expect(chartTooltipStyle(ct)).toEqual({
      backgroundColor: ct.tooltip.bg,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${ct.tooltip.edge}`,
      borderRadius: '12px',
      color: ct.tooltip.ink,
      fontSize: '11px',
      fontWeight: '600',
      padding: '10px 14px',
      zIndex: 1000,
      pointerEvents: 'none',
      boxShadow: 'var(--shadow-chart-tooltip)',
    });
  });
});

describe('ui/ChartTooltip', () => {
  it('pinta solo el marco con su contenido, sin estilo en línea salvo en card', () => {
    expect(renderToStaticMarkup(<ChartTooltip variant="dark"><p>x</p></ChartTooltip>)).toBe(`<div class="${chartTooltipClass('dark')}"><p>x</p></div>`);
    const card = renderToStaticMarkup(<ChartTooltip variant="card" className="w-48 z-[200]">x</ChartTooltip>);
    expect(card).toMatch(/^<div style="[^"]*backdrop-filter:blur\(20px\)[^"]*" class="shadow-xl w-48 z-\[200\]">x<\/div>$/);
  });
});
