import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card, SectionHeader } from '../../components/ui/Card.jsx';
import { cardClass, SECTION_HEADER } from '../../components/ui/cardClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Card', () => {
  it('grouped copia la receta de la tarjeta agrupada de index.css', () => {
    expect(classes(cardClass())).toEqual(
      classes('bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card dark:shadow-none transition-all'),
    );
  });

  it('pressable cambia transition-all por la transición de la compresión al tocar', () => {
    const c = classes(cardClass({ pressable: true }));
    expect(c).not.toContain('transition-all');
    expect(c).toEqual(
      expect.arrayContaining(['active:scale-[0.97]', 'transition-transform', 'duration-150', 'ease-out', 'select-none', 'touch-manipulation']),
    );
  });

  it('panel copia la receta de las tarjetas de Rendimiento', () => {
    expect(classes(cardClass({ variant: 'panel' }))).toEqual(classes('bg-surface-5 rounded-2xl border border-line-muted shadow-sm'));
  });

  it('divided añade el separador de las listas de Ajustes', () => {
    expect(cardClass({ divided: true })).toMatch(/divide-y divide-hairline$/);
  });

  it('rechaza combinaciones que no existían', () => {
    expect(() => cardClass({ variant: 'otra' })).toThrow();
    expect(() => cardClass({ variant: 'panel', pressable: true })).toThrow();
  });

  it('renderiza un solo elemento con as, className y el resto de props', () => {
    const html = renderToStaticMarkup(
      <Card as="section" className="p-4 sm:p-6" data-x="1">
        hola
      </Card>,
    );
    expect(html).toMatch(/^<section class="[^"]+ p-4 sm:p-6" data-x="1">hola<\/section>$/);
  });
});

describe('ui/SectionHeader', () => {
  it('copia la receta del título de sección de index.css', () => {
    expect(classes(SECTION_HEADER)).toEqual(classes('text-[12px] font-semibold text-ink-3 uppercase tracking-wider px-0.5 mb-2'));
  });

  it('renderiza p o div', () => {
    expect(renderToStaticMarkup(<SectionHeader as="p">Título</SectionHeader>)).toBe(`<p class="${SECTION_HEADER}">Título</p>`);
    expect(renderToStaticMarkup(<SectionHeader>Título</SectionHeader>)).toBe(`<div class="${SECTION_HEADER}">Título</div>`);
  });
});
