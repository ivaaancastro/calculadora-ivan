/**
 * Ejes compartidos de Recharts (spec-capa6-v2-premium, RF-B3 y DUP-4).
 *
 * Una sola receta para los ejes visibles: sin línea ni marcas, y ticks a 11 px (el mínimo de
 * texto de la app, RF-C4) con el color de `useChartTheme()`. Cada gráfica solo indica lo que
 * cambia (color o peso del tick) y lo propio del eje (`dataKey`, `domain`, `yAxisId`…).
 *
 *   <XAxis dataKey="date" {...axisProps(ct)} minTickGap={40} />
 *   <YAxis {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: 700 })} />
 */

/** Tamaño de los ticks y rótulos de las gráficas (px). */
export const AXIS_FONT_SIZE = 11;

/** Estilo del texto de un tick o rótulo: `fill` por defecto es el color de eje del tema. */
export function axisTick(ct, { fill = ct.anatomy.axis, fontWeight = 500 } = {}) {
  // `fontWeight: null` deja el peso heredado.
  return fontWeight === null ? { fontSize: AXIS_FONT_SIZE, fill } : { fontSize: AXIS_FONT_SIZE, fill, fontWeight };
}

/** Props comunes de `<XAxis>` / `<YAxis>` visibles. */
export function axisProps(ct, tick = {}) {
  return { axisLine: false, tickLine: false, tick: axisTick(ct, tick) };
}
