/**
 * Heatmap de contribuciones Forma (Fase Premium C, PR 5): carga (TSS) por día de las últimas
 * semanas. SVG propio; color único de la serie `tss` con 4 niveles de opacidad. Inspirado en
 * bklit-ui (MIT). Accesible: `role="img"` con resumen y `<title>` por celda.
 */
import { useMemo } from 'react';
import { useChartTheme } from './useChartTheme';
import { buildHeatmap } from '../../utils/heatmapGrid';
import { chartFigureProps } from './chartA11y';
import { toDateKey } from '../../utils/dates';

const CELL = 11;
const GAP = 3;
const OPACITY = [0, 0.28, 0.5, 0.75, 1];

export function ActivityHeatmap({ activities, weeks = 26 }) {
  const ct = useChartTheme();
  const { cols, total, days } = useMemo(() => {
    const byDate = {};
    (activities || []).forEach((a) => {
      if (!(a.tss > 0) || a.isPlanned) return;
      const k = toDateKey(a.date);
      byDate[k] = (byDate[k] || 0) + a.tss;
    });
    const grid = buildHeatmap(byDate, new Date(), weeks);
    const flat = grid.cols.flat();
    return { cols: grid.cols, total: Math.round(flat.reduce((s, c) => s + c.value, 0)), days: flat.filter((c) => c.value > 0).length };
  }, [activities, weeks]);

  const w = weeks * (CELL + GAP) - GAP;
  const h = 7 * (CELL + GAP) - GAP;
  return (
    <div data-chart="heatmap" className="px-3 sm:px-5 py-3 border-b border-line-soft-5 overflow-x-auto">
      <p className="text-2xs font-bold text-ink-4 uppercase tracking-widest mb-2">Constancia · últimas {weeks} semanas</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        className="block max-w-full"
        {...chartFigureProps('Mapa de constancia', `${days} días con actividad, ${total} TSS en total`)}
      >
        {cols.map((col, x) =>
          col.map((cell, y) => (
            <rect
              key={cell.key}
              x={x * (CELL + GAP)}
              y={y * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx="3"
              fill={cell.level ? ct.series.tss : ct.anatomy.gridSoft}
              fillOpacity={cell.level ? OPACITY[cell.level] : cell.future ? 0.4 : 1}
            >
              <title>{`${cell.key}: ${Math.round(cell.value)} TSS`}</title>
            </rect>
          )),
        )}
      </svg>
    </div>
  );
}
