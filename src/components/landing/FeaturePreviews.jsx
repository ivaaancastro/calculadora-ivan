import React from 'react';

/**
 * Maquetas de la landing v2 (spec-rediseno-02-c4-pr3, D3). Datos de ejemplo escritos aquí a
 * propósito: nunca datos de una persona real. Solo tokens (sin hex), así siguen el tema.
 */
const Frame = ({ label, children }) => (
  <figure
    className="w-full rounded-2xl border border-line bg-surface-card p-4 shadow-sm sm:p-5 dark:shadow-none"
    aria-label={label}
  >
    {children}
    <figcaption className="mt-3 text-[11px] font-medium text-ink-4">Datos de ejemplo</figcaption>
  </figure>
);

// Z1–Z7 de FC (% de LTHR, Friel): minutos de ejemplo por zona.
const ZONES = [
  { z: 'Z1', min: 42 }, { z: 'Z2', min: 118 }, { z: 'Z3', min: 36 }, { z: 'Z4', min: 24 },
  { z: 'Z5', min: 12 }, { z: 'Z6', min: 6 }, { z: 'Z7', min: 2 },
];
const ZMAX = 118;

export const ZonesPreview = () => (
  <Frame label="Vista de ejemplo de zonas de frecuencia cardiaca y métricas de potencia">
    <div className="grid grid-cols-3 gap-2">
      {[['NP', '218 W'], ['IF', '0,84'], ['TSS', '96']].map(([k, v]) => (
        <div key={k} className="rounded-xl border border-line-soft bg-sunken p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{k}</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-ink">{v}</div>
        </div>
      ))}
    </div>
    <ul className="mt-4 space-y-1.5" aria-label="Minutos por zona de FC">
      {ZONES.map(({ z, min }) => (
        <li key={z} className="flex items-center gap-2 text-[11px] font-semibold text-ink-3">
          <span className="w-6">{z}</span>
          <span className="h-3 flex-1 rounded-sm bg-sunken">
            <span className="block h-3 rounded-sm bg-action" style={{ width: `${(min / ZMAX) * 100}%` }} />
          </span>
          <span className="w-14 whitespace-nowrap text-right tabular-nums">{min} min</span>
        </li>
      ))}
    </ul>
  </Frame>
);

const LOAD = [
  0, 1, 0, 2, 0, 3, 1,
  0, 2, 1, 0, 3, 0, 0,
  1, 0, 2, 2, 0, 3, 1,
  0, 1, 0, 3, 0, 2, 0,
];
const TINT = ['bg-sunken', 'bg-action/15', 'bg-action/35', 'bg-action/60'];
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const CalendarPreview = () => (
  <Frame label="Vista de ejemplo del calendario con la carga diaria">
    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-ink-3">
      {DAYS.map((d) => <span key={d}>{d}</span>)}
      {LOAD.map((l, i) => (
        <span
          key={i}
          className={`flex aspect-square items-center justify-center rounded-lg border border-line-soft tabular-nums ${TINT[l]} ${l ? 'text-ink' : 'text-ink-3'}`}
        >
          {i + 1}
        </span>
      ))}
    </div>
    <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-ink-3">
      <span className="flex gap-1" aria-hidden="true">
        {TINT.map((t) => <span key={t} className={`h-3 w-3 rounded-sm border border-line-soft ${t}`} />)}
      </span>
      Menos carga → más carga
    </p>
  </Frame>
);

const ROUTE = 'M12,92 C40,20 80,110 120,56 S190,10 228,52 S290,96 308,30';
const PROFILE = 'M0,70 L30,62 L60,40 L90,48 L120,24 L150,36 L180,56 L210,30 L240,44 L270,18 L320,34';

export const MapPreview = () => (
  <Frame label="Vista de ejemplo de un recorrido y su gráfica de altitud">
    <svg viewBox="0 0 320 120" className="h-auto w-full rounded-xl bg-sunken" role="img" aria-label="Recorrido de ejemplo">
      <path d={ROUTE} fill="none" className="stroke-action" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="92" r="4" className="fill-metric-ctl" />
      <circle cx="308" cy="30" r="4" className="fill-metric-atl" />
    </svg>
    <svg viewBox="0 0 320 80" className="mt-3 h-auto w-full" role="img" aria-label="Altitud de ejemplo">
      <path d={`${PROFILE} L320,80 L0,80 Z`} className="fill-action/15" />
      <path d={PROFILE} fill="none" className="stroke-action" strokeWidth="2" strokeLinejoin="round" />
      <line x1="150" x2="150" y1="0" y2="80" className="stroke-ink-4" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  </Frame>
);

const HRV = [52, 55, 49, 58, 61, 57, 63];
const spark = (d, w = 120, h = 36) => {
  const min = Math.min(...d);
  const max = Math.max(...d);
  return d.map((v, i) => `${i ? 'L' : 'M'}${((i / (d.length - 1)) * w).toFixed(1)},${(h - ((v - min) / (max - min)) * h).toFixed(1)}`).join(' ');
};

export const HealthPreview = () => (
  <Frame label="Vista de ejemplo de salud y recuperación">
    <div className="grid grid-cols-3 gap-2">
      {[['Sueño', '7 h 40'], ['VFC', '63 ms'], ['FC reposo', '48']].map(([k, v]) => (
        <div key={k} className="rounded-xl border border-line-soft bg-sunken p-2.5">
          <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-3">{k}</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-ink">{v}</div>
        </div>
      ))}
    </div>
    <svg viewBox="0 0 120 36" preserveAspectRatio="none" className="mt-4 h-24 w-full" role="img" aria-label="Evolución de ejemplo de la VFC">
      <path d={spark(HRV)} fill="none" className="stroke-metric-ctl" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  </Frame>
);
