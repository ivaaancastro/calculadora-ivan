import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Segmented } from '../../components/ui/Segmented.jsx';
import { segmentedClass, segmentedOptionClass } from '../../components/ui/segmentedClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Segmented recetas', () => {
  it('pill copia la receta de las pestañas del detalle', () => {
    expect(classes(segmentedOptionClass({ variant: 'pill', active: true }))).toEqual(
      classes('px-3 sm:px-4 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 transition-all duration-200 select-none active:scale-95 bg-surface-4 text-ink shadow-xs font-bold'),
    );
    expect(classes(segmentedOptionClass({ variant: 'pill' }))).toEqual(
      classes('px-3 sm:px-4 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 transition-all duration-200 select-none active:scale-95 text-ink-3 hover:text-ink-2-soft'),
    );
    expect(classes(segmentedClass({ variant: 'pill' }))).toEqual(classes('flex bg-fill-segmented-2 p-0.5 rounded-full gap-0.5 hide-scrollbar'));
  });

  it('card copia las recetas de las tarjetas de Rendimiento por tamaño', () => {
    expect(classes(segmentedOptionClass({ variant: 'card', size: 'md-wide', active: true }))).toEqual(
      classes('text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all bg-surface-3 text-ink-soft shadow-sm'),
    );
    expect(classes(segmentedOptionClass({ variant: 'card', size: 'sm' }))).toEqual(
      classes('text-[8px] font-bold uppercase rounded-lg transition-all text-segmented-off hover:text-segmented-off-hover'),
    );
    expect(segmentedOptionClass({ variant: 'card', active: true, tone: 'run' })).toContain('text-sport-run-ink');
    expect(classes(segmentedClass({ variant: 'card', size: 'xs' }))).toEqual(classes('flex bg-surface-2 p-0.5 rounded-lg text-[8px] font-bold uppercase'));
    expect(segmentedOptionClass({ variant: 'card', size: 'xs', active: true })).toMatch(/shadow-xs/);
  });

  it('mini copia la receta de los conmutadores del Calendario', () => {
    expect(classes(segmentedOptionClass({ variant: 'mini', active: true, tone: 'hr' }))).toEqual(
      classes('px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 bg-surface-3 text-legacy-hr-red shadow-sm'),
    );
    expect(segmentedOptionClass({ variant: 'mini' })).toMatch(/text-ink-4-fixed hover:text-body-soft-fixed$/);
    expect(segmentedClass({ variant: 'mini' })).toBe('flex bg-fill-5 rounded-full p-0.5');
  });

  it('rechaza variantes, tamaños y tonos que no existían', () => {
    expect(() => segmentedClass({ variant: 'otra' })).toThrow();
    expect(() => segmentedClass({ variant: 'mini', size: 'sm' })).toThrow();
    expect(() => segmentedOptionClass({ variant: 'pill', tone: 'power' })).toThrow();
    expect(() => segmentedOptionClass({ variant: 'mini', tone: 'run' })).toThrow();
  });
});

describe('ui/Segmented', () => {
  it('pinta las opciones como botones con aria-pressed y sin type', () => {
    const html = renderToStaticMarkup(
      <Segmented
        variant="card"
        className="w-fit"
        optionClassName="px-4 py-1.5"
        value="b"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', tone: 'action' },
        ]}
      />,
    );
    expect(html).toMatch(/^<div class="flex bg-fill p-1 rounded-xl w-fit">/);
    expect(html).toContain('aria-pressed="false">A</button>');
    expect(html).toMatch(/class="[^"]*text-action[^"]* px-4 py-1\.5" aria-pressed="true">B<\/button>/);
    expect(html).not.toContain('type=');
  });

  it('Segmented.Option hereda la variante del contenedor', () => {
    const html = renderToStaticMarkup(
      <Segmented variant="mini" className="shrink-0">
        <Segmented.Option active tone="power">W</Segmented.Option>
      </Segmented>,
    );
    expect(html).toBe(
      `<div class="flex bg-fill-5 rounded-full p-0.5 shrink-0"><button class="${segmentedOptionClass({ variant: 'mini', active: true, tone: 'power' })}" aria-pressed="true">W</button></div>`,
    );
  });
});
