import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArrowLeft, X } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button.jsx';
import { buttonClass, iconButtonClass } from '../../components/ui/buttonClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Button recetas', () => {
  it('copia los chips, el enlace atenuado y el borrar del planificador', () => {
    expect(classes(buttonClass({ variant: 'ghost' }))).toEqual(classes('text-ink-3 rounded-full text-[12px] font-medium hover:bg-surface-2 active:scale-press transition-paint'));
    expect(classes(buttonClass({ variant: 'inverse' }))).toEqual(
      classes('bg-inverse text-ink-inverse rounded-full text-[12px] font-medium hover:bg-inverse-2 active:scale-press transition-paint shadow-sm'),
    );
    expect(classes(buttonClass({ variant: 'link-muted' }))).toEqual(classes('text-2xs text-ink-4-fixed hover:text-body-soft-fixed font-medium transition-colors'));
    expect(classes(buttonClass({ variant: 'danger-text' }))).toEqual(classes('text-faint-fixed hover:text-danger transition-colors'));
  });

  it('incluye secundario y peligro de ≥ 44 px', () => {
    expect(buttonClass({ variant: 'secondary' })).toContain('min-h-[44px]');
    expect(buttonClass({ variant: 'danger' })).toContain('bg-danger-solid');
  });

  it('los botones con fondo se comprimen al pulsar y nunca animan todas las propiedades (RF-D5)', () => {
    for (const variant of ['ghost', 'inverse', 'primary', 'secondary', 'danger']) {
      expect(buttonClass({ variant }).split(' ')).toContain('active:scale-press');
    }
    for (const variant of ['soft', 'ghost', 'quiet']) expect(iconButtonClass({ variant }).split(' ')).toContain('active:scale-press');
    for (const v of ['ghost', 'inverse', 'link-muted', 'primary', 'link', 'danger-text', 'secondary', 'danger']) {
      expect(buttonClass({ variant: v })).not.toMatch(/transition-all/);
    }
  });

  it('copia los botones de icono', () => {
    expect(classes(iconButtonClass({ variant: 'soft' }))).toEqual(
      classes('flex items-center justify-center bg-fill hover:bg-fill-hover active:scale-press rounded-full transition-paint text-body-soft-2'),
    );
    expect(iconButtonClass({ variant: 'ghost' })).toContain('hover:bg-surface-2 active:scale-press');
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
