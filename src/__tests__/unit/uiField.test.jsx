/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { Input, Select } from '../../components/ui/Field.jsx';
import { inputClass, selectClass } from '../../components/ui/fieldClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Field recetas', () => {
  it('filled copia la receta del modal de añadir, con y sin mono', () => {
    const base = 'bg-sunken-5 border border-line-muted-2 rounded-xl text-sm font-semibold text-body-3 focus:ring-2 focus:ring-action-bright outline-none';
    expect(classes(inputClass({ variant: 'filled' }))).toEqual(classes(base));
    expect(classes(inputClass({ variant: 'filled', mono: true }))).toEqual(classes(`${base} font-mono`));
    expect(selectClass({ variant: 'filled' })).toBe(inputClass({ variant: 'filled' }));
  });

  it('search copia el buscador y los selectores del historial', () => {
    expect(classes(inputClass({ variant: 'search' }))).toEqual(
      classes('bg-fill-6 border-0 rounded-xl text-sm font-medium text-ink-soft placeholder-ink-4-fixed focus:outline-none focus:ring-2 focus:ring-action-bright/40 transition-all'),
    );
    expect(classes(selectClass({ variant: 'search' }))).toEqual(
      classes('bg-fill-6 border-0 rounded-xl text-xs sm:text-sm font-semibold text-ink-2-soft focus:outline-none focus:ring-2 focus:ring-action-bright/40 appearance-none cursor-pointer transition-all'),
    );
  });

  it('cell y cell-bare copian los campos de los bloques del Calendario', () => {
    expect(classes(inputClass({ variant: 'cell', mono: true }))).toEqual(classes('bg-sunken text-[13px] font-mono rounded-lg outline-none no-spinner text-body'));
    expect(classes(inputClass({ variant: 'cell', size: 'sm' }))).toEqual(classes('bg-sunken rounded-lg text-[11px] outline-none no-spinner text-body'));
    expect(classes(selectClass({ variant: 'cell' }))).toEqual(classes('bg-sunken text-[11px] font-medium text-body rounded-lg outline-none cursor-pointer'));
    expect(classes(selectClass({ variant: 'cell-bare' }))).toEqual(classes('bg-transparent text-[10px] text-ink-4 outline-none cursor-pointer'));
  });

  it('inline copia los valores de Ajustes y elige el anillo con ringTone', () => {
    expect(classes(inputClass({ variant: 'inline', mono: true, ringTone: 'hr' }))).toEqual(
      classes('font-mono font-bold text-xs sm:text-sm text-ink bg-fill-3 rounded-lg outline-none focus:ring-1 focus:ring-hr'),
    );
    expect(inputClass({ variant: 'inline' })).toMatch(/focus:ring-action-bright$/);
    expect(classes(inputClass({ variant: 'inline', size: 'sm', mono: true }))).toEqual(
      classes('bg-surface-2 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-action-bright'),
    );
  });

  it('rechaza variantes, tamaños y anillos que no existían', () => {
    expect(() => inputClass({ variant: 'otra' })).toThrow();
    expect(() => inputClass({ variant: 'cell-bare' })).toThrow();
    expect(() => selectClass({ variant: 'inline' })).toThrow();
    expect(() => inputClass({ variant: 'filled', size: 'sm' })).toThrow();
    expect(() => inputClass({ variant: 'filled', ringTone: 'hr' })).toThrow();
    expect(() => inputClass({ variant: 'inline', ringTone: 'power' })).toThrow();
  });
});

describe('ui/Field', () => {
  it('Input reenvía las props nativas y añade className al final', () => {
    const html = renderToStaticMarkup(
      <Input variant="cell" size="sm" className="w-12 shrink-0 px-1.5 py-0.5 text-center" type="number" id="x" aria-label="Valor" value="3" readOnly />,
    );
    expect(html).toBe(`<input class="${inputClass({ variant: 'cell', size: 'sm' })} w-12 shrink-0 px-1.5 py-0.5 text-center" type="number" id="x" aria-label="Valor" readOnly="" value="3"/>`);
  });

  it('Select pinta sus opciones', () => {
    const html = renderToStaticMarkup(
      <Select variant="search" className="w-full pl-9 pr-3 py-2" value="b" onChange={() => {}}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(html).toMatch(/^<select class="[^"]* w-full pl-9 pr-3 py-2">/);
    expect(html).toContain('<option value="b" selected="">B</option>');
  });

  it('reenvía ref al elemento nativo', () => {
    const inputRef = createRef();
    const selectRef = createRef();
    render(
      <>
        <Input ref={inputRef} readOnly value="" />
        <Select ref={selectRef}><option>A</option></Select>
      </>,
    );
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(selectRef.current).toBeInstanceOf(HTMLSelectElement);
  });
});
