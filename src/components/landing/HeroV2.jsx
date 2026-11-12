import React from 'react';
import { ArrowRight, CalendarDays, Gauge, TrendingUp } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';

/**
 * Hero y fichas de la landing v2, composición «A: panel real» (spec-rediseno-02-c4, D2/D3).
 * Sin canvas (D4) y sin promesas de precio (D5): copy neutro.
 */
const SIGNALS = [
  { icon: Gauge, title: 'Tu forma de hoy', text: 'Fitness, fatiga y forma (CTL, ATL y TSB) calculados con tus actividades.' },
  { icon: TrendingUp, title: 'Tu carga en el tiempo', text: 'Gráficas de evolución, distribución de carga y resúmenes semanales.' },
  { icon: CalendarDays, title: 'Tu calendario', text: 'Vista mensual con la carga diaria, entrenos planificados y ejecutados.' },
];

export const HeroV2 = ({ onOpenAuth, onFeatures }) => (
  <>
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-[calc(var(--nav-h)+2.5rem)] sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pb-24 lg:pt-[calc(var(--nav-h)+4rem)]">
      <div>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Tu rendimiento deportivo, en un panel
        </h1>
        <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-ink-3">
          Analiza tus actividades, sigue tu forma y tu carga de entrenamiento y planifica con datos.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onOpenAuth}
            className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-action-solid px-6 text-sm font-bold text-on-action transition-colors hover:bg-action-hover active:scale-[0.98]"
          >
            Empezar
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onFeatures}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-line px-6 text-sm font-semibold text-body-soft transition-colors hover:border-line-strong-2 hover:text-ink active:scale-[0.98]"
          >
            Ver funciones
          </button>
        </div>
      </div>
      <DashboardPreview />
    </section>

    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="grid gap-4 md:grid-cols-3">
        {SIGNALS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-line bg-surface-card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sunken text-ink-2">
              <Icon size={20} />
            </div>
            <h2 className="text-base font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-3">{text}</p>
          </div>
        ))}
      </div>
    </section>
  </>
);
