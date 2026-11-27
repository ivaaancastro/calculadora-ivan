/**
 * Tendencia de un KPI a partir de la serie diaria del PMC (Fase Premium D2, PR 2).
 * `seriesValues` devuelve los últimos `n` valores numéricos de `key`; `deltaOver` la variación
 * entre el último valor y el de `lag` días antes (se acorta si la serie es más corta).
 */
export function seriesValues(series, key, n = 28) {
  if (!Array.isArray(series)) return [];
  return series
    .map((d) => d?.[key])
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .slice(-n);
}

export function deltaOver(values, lag = 7) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const idx = Math.max(0, values.length - 1 - lag);
  return values[values.length - 1] - values[idx];
}
