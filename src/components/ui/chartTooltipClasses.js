/**
 * Marcos del tooltip de gráfica (spec-rediseno-02-c2, 6.2; PR 7). Solo el marco: las filas de
 * cada tooltip son distintas y se quedan en su archivo hasta la Capa 3.
 *  - `glass`: evolución de forma del Dashboard.
 *  - `dark`: zonas del detalle de actividad.
 *  - `dark-history`: historial de Salud.
 *  - `card`: tarjetas de Rendimiento. Lleva `chartTooltipStyle(ct)` en línea, como antes.
 */
const FRAME = {
  glass:
    'bg-surface-8 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-line-muted-3 shadow-xl min-w-[140px] pointer-events-none select-none z-50',
  dark: 'bg-tooltip-dark border border-tooltip-dark-edge p-2 rounded-lg shadow-2xl text-[10px] font-bold text-tooltip-dark-ink min-w-[90px] backdrop-blur-sm',
  'dark-history':
    'bg-tooltip-dark-2 backdrop-blur-md border border-tooltip-dark-edge-2 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]',
  card: 'shadow-xl',
};

export function chartTooltipClass(variant) {
  const r = FRAME[variant];
  if (r === undefined) throw new Error(`ChartTooltip: variante desconocida "${variant}"`);
  return r;
}

/**
 * Estilo del tooltip de las tarjetas de Rendimiento (antes en `fitness/`): para el
 * `contentStyle` del tooltip de Recharts y para el marco `card`. Colores de `useChartTheme()`.
 */
export const chartTooltipStyle = (ct) => ({
  backgroundColor: ct.tooltip.bg,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${ct.tooltip.edge}`,
  borderRadius: '12px',
  color: ct.tooltip.ink,
  fontSize: '11px',
  fontWeight: '600',
  padding: '10px 14px',
  zIndex: 1000,
  pointerEvents: 'none',
  boxShadow: 'var(--shadow-chart-tooltip)',
});
