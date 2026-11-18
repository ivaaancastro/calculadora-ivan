import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricTooltip } from '../../components/ui/MetricTooltip.jsx';

const FakeChild = () => <span data-testid="stat">Carga</span>;

describe('ui/MetricTooltip', () => {
  it('renderiza el hijo dentro de un disparador con role="button", zona táctil y rayita inferior', () => {
    const html = renderToStaticMarkup(
      <MetricTooltip metricId="tss">
        <FakeChild />
      </MetricTooltip>
    );
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Más información sobre Carga (TSS)"');
    expect(html).toContain('data-testid="stat"');
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('min-w-[44px]');
  });

  it('no renderiza ningún ícono de ayuda (el disparador es solo el hijo)', () => {
    const html = renderToStaticMarkup(
      <MetricTooltip metricId="tss">
        <FakeChild />
      </MetricTooltip>
    );
    // Solo hay un svg si el hijo lo trae; HelpCircle ya no se inyecta.
    const svgCount = (html.match(/<svg/g) || []).length;
    expect(svgCount).toBe(0);
  });

  it('no renderiza el popover ni el bottom-sheet cerrado', () => {
    const html = renderToStaticMarkup(
      <MetricTooltip metricId="tss">
        <FakeChild />
      </MetricTooltip>
    );
    expect(html).not.toContain('Carga (TSS) como título del popover');
    expect(html).not.toContain('role="tooltip"');
    expect(html).not.toContain('role="dialog"');
  });

  it('acepta label y description directos sin metricId', () => {
    const html = renderToStaticMarkup(
      <MetricTooltip label="Mi métrica" description="Explicación directa.">
        <FakeChild />
      </MetricTooltip>
    );
    expect(html).toContain('aria-label="Más información sobre Mi métrica"');
  });
});
