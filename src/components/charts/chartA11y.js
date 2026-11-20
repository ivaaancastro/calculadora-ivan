/** Alternativa textual de las gráficas (GRA-10): resumen legible para `aria-label`. */

const fmt = (n) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString('es-ES');

/**
 * Resume series numéricas: «Fitness (CTL): de 40 a 52, mín 38, máx 60».
 * `series` = [{ key, label }]; ignora valores no numéricos. Devuelve '' sin datos.
 */
export function summarizeSeries(data, series, { unit = '' } = {}) {
  if (!Array.isArray(data) || data.length === 0) return '';
  const parts = [];
  for (const { key, label } of series) {
    const vals = data.map((d) => d?.[key]).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (vals.length === 0) continue;
    const u = unit ? ` ${unit}` : '';
    parts.push(`${label}: de ${fmt(vals[0])}${u} a ${fmt(vals[vals.length - 1])}${u}, mín ${fmt(Math.min(...vals))}, máx ${fmt(Math.max(...vals))}`);
  }
  return parts.join('. ');
}
