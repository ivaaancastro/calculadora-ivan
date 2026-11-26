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
    parts.push(`${label}: de ${fmt(vals[0])}${u} a ${fmt(vals[vals.length - 1])}${u}, mín ${fmt(vals.reduce((a, b) => Math.min(a, b)))}, máx ${fmt(vals.reduce((a, b) => Math.max(a, b)))}`);
  }
  return parts.join('. ');
}

/**
 * Resume una gráfica por categorías (A11Y-5): «5 s: 900 W, 1 min: 420 W, 5 min: 310 W».
 * Ignora valores no numéricos y recorta a `max` categorías. Devuelve '' sin datos.
 */
export function summarizeCategories(data, labelKey, valueKey, unit = '', { max = 8 } = {}) {
  if (!Array.isArray(data)) return '';
  const u = unit ? ` ${unit}` : '';
  return data
    .filter((d) => typeof d?.[valueKey] === 'number' && Number.isFinite(d[valueKey]))
    .slice(0, max)
    .map((d) => `${d[labelKey]}: ${fmt(d[valueKey])}${u}`)
    .join(', ');
}

/**
 * Props a esparcir sobre el contenedor de una gráfica (sin añadir nodos al DOM): `role="img"`
 * con el nombre y el resumen como `aria-label`.
 */
export const chartFigureProps = (label, summary) => ({ role: 'img', 'aria-label': summary ? `${label}. ${summary}` : label });
