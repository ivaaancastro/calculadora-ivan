import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

/** Cifras = hechos del código: 7 zonas (tssEngine LTHR_ZONE_PCT), PMC, NP/IF/TSS, Strava y CSV. */
const FACTS = [
  { value: '7', label: 'zonas de FC' },
  { value: 'CTL · ATL · TSB', label: 'forma y fatiga' },
  { value: 'NP · IF · TSS', label: 'carga por sesión' },
  { value: 'Strava y CSV', label: 'tus actividades' },
];

export const FactsV2 = () => (
  <section aria-label="Datos clave" className="border-y border-line bg-sunken">
    <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
      {FACTS.map(({ value, label }) => (
        <div key={label} className="flex flex-col">
          <dt className="order-2 mt-1 text-xs font-semibold uppercase tracking-wider text-ink-3">{label}</dt>
          <dd className="order-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export const CtaV2 = ({ onOpenAuth }) => (
  <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-24">
    <Reveal>
      <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">¿Listo para analizar tu rendimiento?</h2>
      <p className="mx-auto mt-4 max-w-lg text-base text-ink-3">
        Crea tu cuenta, conecta Strava o importa tus actividades y mira tu progreso.
      </p>
      <button
        onClick={onOpenAuth}
        className="group mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-action-solid px-8 text-sm font-bold text-on-action transition-colors hover:bg-action-hover active:scale-[0.98]"
      >
        Crear cuenta
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </Reveal>
  </section>
);

export const FooterV2 = ({ onFeatures }) => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs font-medium text-ink-3 sm:flex-row sm:px-6">
      <span className="flex items-center gap-2">
        <Activity size={14} className="text-action" aria-hidden="true" />
        <span className="font-bold uppercase tracking-wider text-ink">Forma</span>
      </span>
      <button onClick={onFeatures} className="min-h-[44px] px-2 hover:text-ink">Funciones</button>
      <span>© {new Date().getFullYear()} Forma</span>
    </div>
  </footer>
);
