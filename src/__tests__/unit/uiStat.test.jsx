import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Stat, Delta } from '../../components/ui/Stat.jsx';
import { deltaDirection, deltaClass, statClass, DELTA_TONE } from '../../components/ui/statClasses.js';

describe('ui/Delta recetas', () => {
  it('el color sigue al significado: subir es bueno salvo en métricas inversas', () => {
    expect(deltaDirection(3)).toEqual({ dir: 'up', tone: 'good' });
    expect(deltaDirection(-3)).toEqual({ dir: 'down', tone: 'bad' });
    expect(deltaDirection(3, { inverse: true })).toEqual({ dir: 'up', tone: 'bad' });
    expect(deltaDirection(-3, { inverse: true })).toEqual({ dir: 'down', tone: 'good' });
  });

  it('cero y la banda neutra son estables', () => {
    expect(deltaDirection(0)).toEqual({ dir: 'flat', tone: 'flat' });
    expect(deltaDirection(1.9, { flat: 2 })).toEqual({ dir: 'flat', tone: 'flat' });
    expect(deltaDirection(2, { flat: 2 })).toEqual({ dir: 'up', tone: 'good' });
  });

  it('un tono forzado gana; uno desconocido queda neutro', () => {
    expect(deltaDirection(5, { tone: 'warn' })).toEqual({ dir: 'up', tone: 'warn' });
    expect(deltaDirection(5, { tone: 'nope' }).tone).toBe('flat');
  });

  it('clases tabulares por tamaño y tono', () => {
    expect(deltaClass({ tone: 'good' })).toBe(`flex items-center gap-0.5 tabular-nums text-xs font-semibold ${DELTA_TONE.good}`);
    expect(deltaClass({ tone: 'bad', size: 'sm' })).toContain('text-[12px]');
    expect(() => deltaClass({ size: 'xl' })).toThrow();
  });
});

describe('ui/Delta', () => {
  it('pinta signo, unidad, flecha y contexto para lectores de pantalla', () => {
    const html = renderToStaticMarkup(<Delta value={3.25} digits={1} unit="%" label="en 28 días" />);
    expect(html).toContain('data-delta="good"');
    expect(html).toContain('+3,3%');
    expect(html).toContain('<span class="sr-only"> en 28 días</span>');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('negativos sin signo extra y decimales según el valor', () => {
    expect(renderToStaticMarkup(<Delta value={-4} unit="%" />)).toContain('>-4%<');
    expect(renderToStaticMarkup(<Delta value={1.5} />)).toContain('+1,5');
  });

  it('`text` sustituye al texto por defecto y sin valor no pinta nada', () => {
    expect(renderToStaticMarkup(<Delta value={2} text="+2 7d" tone="warn" />)).toContain('+2 7d');
    expect(renderToStaticMarkup(<Delta value={null} />)).toBe('');
    expect(renderToStaticMarkup(<Delta value={NaN} />)).toBe('');
  });
});

describe('ui/Stat', () => {
  it('etiqueta, cifra con unidad, delta, contexto y data-metric', () => {
    const html = renderToStaticMarkup(
      <Stat label="Carga" value="412" unit="TSS" sub="esta semana" metric="load7" delta={<Delta value={5} />} />,
    );
    const c = statClass({ size: 'md' });
    expect(html).toContain(`<div class="${c.label}">Carga</div>`);
    expect(html).toContain(`<div class="${c.row} mt-1">`);
    expect(html).toContain(`data-metric="load7" class="${c.value}">412<span class="${c.unit}">TSS</span></span>`);
    expect(html).toContain('data-delta="good"');
    expect(html).toContain(`<div class="${c.sub}">esta semana</div>`);
  });

  it('sin etiqueta, la fila no lleva margen; mono y tamaños', () => {
    const html = renderToStaticMarkup(<Stat value="7" size="lg" mono className="min-w-0" />);
    expect(html).toMatch(/^<div class="min-w-0"><div class="flex items-baseline gap-2">/);
    expect(statClass({ size: 'lg', mono: true }).value).toContain('font-mono');
    expect(statClass({ size: 'sm' }).value).toContain('text-lg');
    expect(() => statClass({ size: 'xl' })).toThrow();
  });
});
