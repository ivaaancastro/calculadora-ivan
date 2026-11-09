import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArrowLeft, X } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { buttonClass, iconButtonClass } from '../../components/ui/buttonClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Button recetas', () => {
  it('copia los chips, el enlace atenuado y el borrar del planificador', () => {
    expect(classes(buttonClass({ variant: 'ghost' }))).toEqual(classes('text-ink-3 rounded-full text-[11px] font-medium hover:bg-surface-2 transition-all'));
    expect(classes(buttonClass({ variant: 'inverse' }))).toEqual(
      classes('bg-inverse text-ink-inverse rounded-full text-[11px] font-medium hover:bg-inverse-2 transition-all shadow-sm'),
    );
    expect(classes(buttonClass({ variant: 'link-muted' }))).toEqual(classes('text-[10px] text-ink-4-fixed hover:text-body-soft-fixed font-medium transition-colors'));
    expect(classes(buttonClass({ variant: 'danger-text' }))).toEqual(classes('text-faint-fixed hover:text-danger transition-colors'));
  });

  it('copia los botones de icono', () => {
    expect(classes(iconButtonClass({ variant: 'soft' }))).toEqual(
      classes('flex items-center justify-center bg-fill hover:bg-fill-hover active:scale-90 rounded-full transition-all text-body-soft-2'),
    );
    expect(iconButtonClass({ variant: 'ghost' })).toContain('hover:bg-surface-2 active:scale-95');
    expect(classes(iconButtonClass({ variant: 'bare' }))).toEqual(classes('text-ink-4-fixed hover:text-body-2 transition-colors'));
  });

  it('rechaza variantes que no existían', () => {
    expect(() => buttonClass({ variant: 'soft' })).toThrow();
    expect(() => iconButtonClass({ variant: 'ghost-danger' })).toThrow();
  });
});

describe('ui/Button', () => {
  it('Button es type="button" por defecto y respeta submit', () => {
    expect(renderToStaticMarkup(<Button variant="inverse" className="px-2.5 py-1">+ Circuito</Button>)).toBe(
      `<button type="button" class="${buttonClass({ variant: 'inverse' })} px-2.5 py-1">+ Circuito</button>`,
    );
    expect(renderToStaticMarkup(<Button type="submit">Ok</Button>)).toContain('type="submit"');
  });

  it('IconButton pone aria-label, pinta el icono y exige label', () => {
    const html = renderToStaticMarkup(<IconButton variant="soft" label="Volver" title="Volver" icon={ArrowLeft} iconSize={16} className="w-8 h-8 shrink-0" />);
    expect(html).toMatch(/^<button type="button" aria-label="Volver" class="[^"]* w-8 h-8 shrink-0" title="Volver"><svg[^>]*width="16"/);
    expect(() => renderToStaticMarkup(<IconButton icon={X} />)).toThrow(/label/);
  });
});
