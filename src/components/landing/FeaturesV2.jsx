import React from 'react';
import { Reveal } from './Reveal';
import { ZonesPreview, CalendarPreview, MapPreview, HealthPreview } from './FeaturePreviews';

/** Cada texto describe algo que existe en la app (ver la tabla de verificación del PR). */
const BLOCKS = [
  {
    title: 'Análisis de cada actividad',
    text: 'Zonas de frecuencia cardiaca en siete tramos, potencia normalizada, factor de intensidad y TSS de cada sesión.',
    Preview: ZonesPreview,
  },
  {
    title: 'Calendario de carga',
    text: 'Vista mensual con la carga diaria y tus entrenos planificados y ejecutados.',
    Preview: CalendarPreview,
  },
  {
    title: 'Recorrido y gráfica juntos',
    text: 'Tus rutas en el mapa junto a la gráfica de la actividad, para ver dónde ocurrió cada esfuerzo.',
    Preview: MapPreview,
  },
  {
    title: 'Salud y recuperación',
    text: 'Sueño, variabilidad cardiaca y pulso en reposo junto a tu carga de entrenamiento.',
    Preview: HealthPreview,
  },
];

export const FeaturesV2 = () => (
  <section id="features" className="mx-auto max-w-6xl scroll-mt-[var(--nav-h)] px-4 py-16 sm:px-6 lg:py-24">
    <Reveal>
      <p className="text-xs font-bold uppercase tracking-widest text-action">Funciones</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Todo lo que necesitas para entrenar con datos
      </h2>
    </Reveal>
    <div className="mt-12 space-y-14 lg:space-y-20">
      {BLOCKS.map(({ title, text, Preview }, i) => (
        <Reveal key={title}>
          <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <h3 className="text-xl font-bold text-ink">{title}</h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-3">{text}</p>
            </div>
            <Preview />
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);
