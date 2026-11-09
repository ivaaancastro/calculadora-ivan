import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Stat, StatTile } from '../../components/ui/Stat.jsx';
import { STAT, ICON_TONES, tileRecipe } from '../../components/ui/statClasses.js';

const Icon = ({ size, strokeWidth }) => <svg data-size={size} data-stroke={strokeWidth} />;

describe('ui/Stat', () => {
  it('copia la estructura de la antigua tarjeta de cifra, con text-ink si no hay accent', () => {
    const html = renderToStaticMarkup(<Stat label="Distancia" value="12.40" unit="km" />);
    expect(html).toBe(
      `<div class="${STAT.root}"><span class="${STAT.label}">Distancia</span>` +
        `<div class="${STAT.row}"><span class="${STAT.value} text-ink">12.40</span><span class="${STAT.unit}">km</span></div></div>`,
    );
  });

  it('usa el accent y omite la unidad vacía', () => {
    const html = renderToStaticMarkup(<Stat label="IF" value="0.85" accent="text-power" />);
    expect(html).toContain(`<span class="${STAT.value} text-power">0.85</span></div>`);
    expect(html).not.toContain(STAT.unit);
  });

  it('el borde sale del token hairline-5', () => {
    expect(STAT.root).toContain('border-hairline-5');
    expect(STAT.root).not.toMatch(/black|white/);
  });
});

describe('ui/StatTile', () => {
  it('lg: valor en div, pie en span, icono 15/2.3', () => {
    const html = renderToStaticMarkup(<StatTile size="lg" label="Fitness (CTL)" icon={Icon} iconTone="ctl" value={62} sub="+3.1% vs 28d" />);
    expect(html).toContain('p-3.5 sm:p-4 flex flex-col justify-between');
    expect(html).toContain(`class="w-7 h-7 rounded-xl flex items-center justify-center ${ICON_TONES.ctl}"`);
    expect(html).toContain('data-size="15" data-stroke="2.3"');
    expect(html).toMatch(/<div class="text-2xl[^"]*">62<\/div><span class="text-\[10px\][^"]*">\+3\.1% vs 28d<\/span>/);
  });

  it('sm: valor en span, pie en p truncado, icono 13/2.2', () => {
    const html = renderToStaticMarkup(<StatTile size="sm" label="Monotonía" icon={Icon} iconTone="monotony" value="1.20" sub="Índice carga" />);
    expect(html).toContain('p-3 sm:p-3.5 flex flex-col justify-between');
    expect(html).toContain('data-size="13" data-stroke="2.2"');
    expect(html).toMatch(/<span class="text-lg[^"]*">1\.20<\/span><p class="text-\[9px\][^"]*truncate">Índice carga<\/p>/);
  });

  it('los tonos de icono son tokens (sin paleta ni hex)', () => {
    for (const c of Object.values(ICON_TONES)) expect(c).not.toMatch(/#|(?:blue|indigo|purple|cyan)-\d/);
  });

  it('rechaza tamaños y tonos que no existían', () => {
    expect(() => tileRecipe('md', 'ctl')).toThrow();
    expect(() => tileRecipe('lg', 'hr')).toThrow();
  });
});
