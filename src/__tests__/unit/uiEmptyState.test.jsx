import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Inbox } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { stateClass, stateChipClass } from '../../components/ui/stateClasses.js';

describe('ui/EmptyState recetas', () => {
  it('una ficha por tono', () => {
    expect(stateChipClass()).toContain('bg-fill text-ink-4');
    expect(stateChipClass('info')).toContain('bg-action-tint');
    expect(stateChipClass('warning')).toContain('bg-warning-tint');
    expect(stateChipClass('danger')).toContain('bg-danger-tint-4 text-danger-ink-3');
    expect(() => stateChipClass('success')).toThrow();
  });
});

describe('ui/EmptyState', () => {
  it('neutro: icono, título, descripción, sin role', () => {
    const html = renderToStaticMarkup(<EmptyState icon={Inbox} title="Sin actividades" description="Conecta Strava." />);
    expect(html).toMatch(new RegExp(`^<div class="${stateClass.root}">`));
    expect(html).toContain(`<span class="${stateChipClass('neutral')}"><svg`);
    expect(html).toContain('<h3 class="text-sm font-semibold text-ink">Sin actividades</h3>');
    expect(html).toContain('Conecta Strava.');
    expect(html).not.toContain('role=');
  });

  it('danger es el estado de error: role="alert" y ficha roja', () => {
    const html = renderToStaticMarkup(<EmptyState tone="danger" icon={Inbox} title="Algo se ha roto" />);
    expect(html).toMatch(/^<div role="alert"/);
    expect(html).toContain(stateChipClass('danger'));
  });

  it('la acción va en `action` o en children, dentro del hueco de acciones', () => {
    const viaProp = renderToStaticMarkup(<EmptyState title="Vacío" action={<button>Añadir</button>} />);
    const viaChildren = renderToStaticMarkup(<EmptyState title="Vacío"><button>Añadir</button></EmptyState>);
    expect(viaProp).toBe(viaChildren);
    expect(viaProp).toContain(`<div class="${stateClass.actions}"><button>Añadir</button></div>`);
    expect(renderToStaticMarkup(<EmptyState title="Vacío" />)).not.toContain(stateClass.actions);
  });

  it('surface y className se suman a la raíz', () => {
    expect(renderToStaticMarkup(<EmptyState title="x" surface className="h-64" />)).toContain(`class="${stateClass.root} bg-surface h-64"`);
  });
});
