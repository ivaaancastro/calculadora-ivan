import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InfoTooltip } from '../../components/ui/InfoTooltip.jsx';
import { INFO_TOOLTIP } from '../../components/ui/infoTooltipClasses.js';

describe('ui/InfoTooltip', () => {
  it('copia la receta de la burbuja con tokens exactos', () => {
    expect(INFO_TOOLTIP.bubble).toContain('invisible group-hover:visible');
    expect(INFO_TOOLTIP.bubble).toContain('bg-tooltip-info backdrop-blur-md text-tooltip-info-ink');
    expect(INFO_TOOLTIP.bubble).toContain('border border-tooltip-info-edge');
    expect(INFO_TOOLTIP.arrow).toContain('border-t-tooltip-info-arrow');
  });

  it('pinta el grupo, el icono y la burbuja con el texto y la flecha', () => {
    const html = renderToStaticMarkup(<InfoTooltip text="Hola" />);
    expect(html.startsWith(`<div class="${INFO_TOOLTIP.root}"><svg `)).toBe(true);
    expect(html).toMatch(/<svg[^>]* width="11"/);
    expect(html).toContain(` ${INFO_TOOLTIP.icon}"`);
    expect(html).toContain(`<div class="${INFO_TOOLTIP.bubble}">Hola<div class="${INFO_TOOLTIP.arrow}"></div></div></div>`);
  });
});
