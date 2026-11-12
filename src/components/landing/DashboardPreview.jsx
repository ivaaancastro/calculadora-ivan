import React from 'react';

/**
 * Maqueta del Dashboard para el hero de la landing v2 (spec-rediseno-02-c4, D3).
 * Datos de ejemplo escritos aquí a propósito: nunca datos de una persona real. Usa los
 * mismos tokens de métrica que la app (CTL cobalto, ATL carmín, TSB ámbar).
 */
const CTL = [38, 40, 43, 45, 48, 50, 53, 55, 58, 60, 62, 64];
const ATL = [44, 50, 41, 56, 48, 62, 52, 66, 55, 70, 58, 63];
const W = 320;
const H = 120;
const MAX = 80;

const path = (data) =>
  data.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (data.length - 1)) * W).toFixed(1)},${(H - (v / MAX) * H).toFixed(1)}`).join(' ');

const TILES = [
  { label: 'Forma', code: 'TSB', value: '+4', tone: 'text-metric-tsb-ink', dot: 'bg-metric-tsb' },
  { label: 'Fitness', code: 'CTL', value: '64', tone: 'text-metric-ctl-ink', dot: 'bg-metric-ctl' },
  { label: 'Fatiga', code: 'ATL', value: '63', tone: 'text-metric-atl-ink', dot: 'bg-metric-atl' },
];

export const DashboardPreview = () => (
  <figure
    className="w-full max-w-md lg:max-w-none rounded-2xl border border-line bg-surface-card p-4 sm:p-5 shadow-sm dark:shadow-none"
    aria-label="Vista de ejemplo del Dashboard de Forma"
  >
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {TILES.map((t) => (
        <div key={t.label} className="rounded-xl border border-line-soft bg-sunken p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            <span className={`h-2 w-2 rounded-full ${t.dot}`} aria-hidden="true" />
            <span className="truncate">{t.label}<span className="hidden sm:inline"> ({t.code})</span></span>
          </div>
          <div className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${t.tone}`}>{t.value}</div>
        </div>
      ))}
    </div>
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label="Evolución de ejemplo de fitness y fatiga">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="stroke-line-soft" strokeWidth="1" />
      ))}
      <path d={path(ATL)} fill="none" className="stroke-metric-atl" strokeWidth="2" strokeLinejoin="round" />
      <path d={path(CTL)} fill="none" className="stroke-metric-ctl" strokeWidth="2" strokeLinejoin="round" />
    </svg>
    <figcaption className="mt-3 text-[11px] font-medium text-ink-4">Datos de ejemplo</figcaption>
  </figure>
);
