import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingState } from '../../components/ui/LoadingState.jsx';
import { loadingStateClass } from '../../components/ui/loadingStateClasses.js';

const classes = (s) => s.split(' ').sort();

describe('ui/LoadingState recetas', () => {
  it('copia las recetas de hoy', () => {
    expect(classes(loadingStateClass('inline').root)).toEqual(classes('flex items-center justify-center py-32'));
    expect(classes(loadingStateClass('screen').root)).toEqual(
      classes('h-screen flex flex-col items-center justify-center bg-sunken-2 gap-4 transition-colors'),
    );
    expect(classes(loadingStateClass('boot').root)).toEqual(classes('min-h-screen bg-sunken-2 flex items-center justify-center'));
  });

  it('rechaza variantes que no existían', () => {
    expect(() => loadingStateClass('fullscreen')).toThrow();
  });
});

describe('ui/LoadingState', () => {
  it('inline: solo el girador, sin etiqueta', () => {
    expect(renderToStaticMarkup(<LoadingState />)).toBe(
      `<div class="${loadingStateClass('inline').root}"><span class="${loadingStateClass('inline').spinner}">Cargando...</span></div>`,
    );
  });

  it('screen y boot: su etiqueta por defecto, con el mismo marcado que antes', () => {
    expect(renderToStaticMarkup(<LoadingState variant="screen" />)).toBe(
      `<div class="${loadingStateClass('screen').root}"><span class="${loadingStateClass('screen').spinner}">Cargando...</span>` +
        `<p class="${loadingStateClass('screen').label}">Cargando métricas...</p></div>`,
    );
    expect(renderToStaticMarkup(<LoadingState variant="boot" />)).toBe(
      `<div class="${loadingStateClass('boot').root}"><p class="${loadingStateClass('boot').label}">Iniciando sistema...</p></div>`,
    );
  });

  it('admite etiqueta propia, className de colocación y props nativas', () => {
    expect(renderToStaticMarkup(<LoadingState variant="screen" label="Leyendo" className="mt-4" id="carga" />)).toBe(
      `<div class="${loadingStateClass('screen').root} mt-4" id="carga">` +
        `<span class="${loadingStateClass('screen').spinner}">Cargando...</span>` +
        `<p class="${loadingStateClass('screen').label}">Leyendo</p></div>`,
    );
  });
});
