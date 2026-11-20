/** Puntos [x,y] escalados a un viewBox `w`×`h` con margen `pad`; ignora valores no numéricos. */
export function sparklinePoints(values, w, h, pad = 2) {
  const vals = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (vals.length < 2) return [];
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min || 1;
  return vals.map((v, i) => [pad + (i / (vals.length - 1)) * (w - 2 * pad), h - pad - ((v - min) / span) * (h - 2 * pad)]);
}

