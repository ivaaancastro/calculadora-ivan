/**
 * Geometría del heatmap de contribuciones (Fase Premium C, PR 5): últimas `weeks` semanas
 * (lunes a domingo) hasta la semana de `today`. `byDate` = { 'YYYY-MM-DD': TSS }.
 * Devuelve columnas de 7 celdas: { key, value, level (0-4), future }.
 */
import { toDateKey } from './dates';
const iso = toDateKey;

export function heatmapLevel(value, max) {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
}

export function buildHeatmap(byDate, today = new Date(), weeks = 26) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = (end.getDay() + 6) % 7; // lunes = 0
  const start = new Date(end);
  start.setDate(end.getDate() - dow - (weeks - 1) * 7);
  const cols = [];
  let max = 0;
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const key = iso(day);
      const value = day > end ? 0 : byDate[key] || 0;
      if (value > max) max = value;
      col.push({ key, value, future: day > end });
    }
    cols.push(col);
  }
  return { cols: cols.map((c) => c.map((cell) => ({ ...cell, level: heatmapLevel(cell.value, max) }))), max };
}
