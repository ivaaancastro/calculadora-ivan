import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from '../../components/ui/Modal.jsx';
import { modalRecipe } from '../../components/ui/modalClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/Modal recetas', () => {
  it('copia el fondo y el panel de los 4 modales', () => {
    expect(classes(modalRecipe('sheet').backdrop)).toEqual(
      classes('fixed inset-0 z-sheet flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim backdrop-blur-sm overscroll-contain animate-in fade-in duration-200'),
    );
    expect(modalRecipe('sheet').panel).toContain('rounded-t-3xl sm:rounded-2xl');
    expect(modalRecipe('auth').layer).toBe('absolute inset-0 bg-scrim-2 backdrop-blur-sm');
    expect(modalRecipe('planner').backdrop).toContain('bg-scrim-3 backdrop-blur-sm z-sheet');
    expect(modalRecipe('viewer').backdrop).toContain('bg-scrim-4 backdrop-blur-sm z-modal');
    expect(modalRecipe('viewer').style).toEqual({ overscrollBehavior: 'contain' });
  });

  it('rechaza variantes que no existían', () => {
    expect(() => modalRecipe('drawer')).toThrow();
  });
});

describe('ui/Modal', () => {
  it('no pinta nada cerrado', () => {
    expect(renderToStaticMarkup(<Modal open={false} onClose={vi.fn()} variant="planner">x</Modal>)).toBe('');
  });

  it('pinta fondo y panel con role="dialog", aria-modal y aria-labelledby, sin envoltorios', () => {
    const r = modalRecipe('planner');
    expect(renderToStaticMarkup(<Modal open onClose={vi.fn()} variant="planner" labelledBy="t"><h3 id="t">Hola</h3></Modal>)).toBe(
      `<div class="${r.backdrop}"><div role="dialog" aria-modal="true" aria-labelledby="t" class="${r.panel}"><h3 id="t">Hola</h3></div></div>`,
    );
  });

  it('auth lleva el velo como capa aparte antes del panel', () => {
    const r = modalRecipe('auth');
    expect(renderToStaticMarkup(<Modal open onClose={vi.fn()} variant="auth">x</Modal>)).toBe(
      `<div class="${r.backdrop}"><div class="${r.layer}"></div><div role="dialog" aria-modal="true" class="${r.panel}">x</div></div>`,
    );
  });

  it('viewer conserva el estilo en línea del fondo', () => {
    expect(renderToStaticMarkup(<Modal open onClose={vi.fn()} variant="viewer">x</Modal>)).toContain('style="overscroll-behavior:contain"');
  });
});
