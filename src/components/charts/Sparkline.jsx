/**
 * Sparkline Forma (Fase Premium C, PR 2): línea mínima con degradado bajo el área y punto final.
 * SVG propio, sin dependencias. Lenguaje visual inspirado en bklit-ui (MIT). Colores por props
 * (de `useChartTheme()`); entrada con `useChartMotion` (trazo animado solo en v2).
 */
import { useId } from 'react';
import { useChartMotion, CHART_ENTER_MS } from './useChartMotion';
import { chartFigureProps } from './chartA11y';
import { sparklinePoints } from './sparklinePoints';

export function Sparkline({ values, color, width = 96, height = 28, label = 'Tendencia', className }) {
  const id = useId();
  const motion = useChartMotion();
  const pts = sparklinePoints(values, width, height);
  if (pts.length === 0) return null;
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const [lx, ly] = pts[pts.length - 1];
  const first = values.find((v) => typeof v === 'number');
  const last = [...values].reverse().find((v) => typeof v === 'number');
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      {...chartFigureProps(label, `de ${first} a ${last}`)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} style={motion.active ? { animation: `chart-fade ${CHART_ENTER_MS}ms ease-out` } : undefined} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        strokeDasharray="1"
        style={motion.active ? { animation: `chart-draw ${CHART_ENTER_MS}ms ease-out` } : undefined}
      />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}
