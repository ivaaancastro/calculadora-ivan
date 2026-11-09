/**
 * Recetas de Stat y StatTile (spec-rediseno-02-c2, 6.2; PR 2).
 *
 *  - `Stat`: la tarjeta de cifra que vivía en `ActivitySharedUI` (detalle de actividad, 26 usos). Su borde
 *    (`black/[0.04]`, `white/[0.07]`) pasa al token `hairline-5`.
 *  - `StatTile`: las fichas de métricas del Dashboard (`AdvancedAnalytics`), sobre `Card pressable`.
 *    `lg` = "Fisiología y Carga" (4), `sm` = "Tendencia y Capacidad" (4). Las fichas de Salud no
 *    entran: cada una tiene un pie distinto (alcance acordado el 2026-11-09).
 * `iconTone` es una lista cerrada con los pares fondo/icono que ya existían.
 */
export const STAT = {
  root: 'flex flex-col py-2 px-2.5 sm:px-3 bg-surface-card rounded-xl sm:rounded-2xl border border-hairline-5 shadow-xs select-none transition-all justify-between',
  label: 'text-[9px] font-semibold text-ink-4 uppercase tracking-wider truncate',
  row: 'flex items-baseline gap-1 truncate mt-0.5',
  value: 'text-sm sm:text-base font-bold tracking-tight tabular-nums truncate',
  unit: 'text-[9px] font-medium text-ink-4 shrink-0',
};

export const ICON_TONES = {
  ctl: 'bg-metric-ctl/10 text-metric-ctl-ink',
  atl: 'bg-metric-atl-tile/10 text-metric-atl-tile',
  tsb: 'bg-metric-tsb-tile/10 text-metric-tsb-tile',
  acwr: 'bg-metric-acwr-tile/10 text-metric-acwr-tile',
  ramp: 'bg-metric-ramp-tile/10 text-metric-ramp-tile',
  monotony: 'bg-metric-monotony-tile/10 text-metric-monotony-tile',
  volume: 'bg-metric-volume-tile/10 text-metric-volume-tile',
  vo2: 'bg-vo2/10 text-vo2',
};

export const TILE = {
  lg: {
    card: 'p-3.5 sm:p-4 flex flex-col justify-between',
    head: 'flex items-center justify-between mb-2',
    label: 'text-[11px] font-semibold text-ink-3',
    icon: 'w-7 h-7 rounded-xl flex items-center justify-center',
    iconSize: 15,
    iconStroke: 2.3,
    value: { tag: 'div', className: 'text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums' },
    sub: { tag: 'span', className: 'text-[10px] font-medium text-ink-4' },
  },
  sm: {
    card: 'p-3 sm:p-3.5 flex flex-col justify-between',
    head: 'flex items-center justify-between mb-1.5',
    label: 'text-[10px] font-semibold text-ink-3',
    icon: 'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
    iconSize: 13,
    iconStroke: 2.2,
    value: { tag: 'span', className: 'text-lg sm:text-xl font-bold tracking-tight text-ink tabular-nums' },
    sub: { tag: 'p', className: 'text-[9px] font-medium text-ink-4 truncate' },
  },
};

export function tileRecipe(size, iconTone) {
  if (!TILE[size]) throw new Error(`StatTile: tamaño desconocido "${size}"`);
  if (!ICON_TONES[iconTone]) throw new Error(`StatTile: iconTone desconocido "${iconTone}"`);
  return TILE[size];
}
