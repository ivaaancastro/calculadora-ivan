/** ChartTooltip (spec-rediseno-02-c2, 6.2; PR 7): el marco del tooltip de gráfica. Recetas en chartTooltipClasses.js. */
import { useChartTheme } from '../charts/useChartTheme';
import { cx } from './cx.js';
import { chartTooltipClass, chartTooltipStyle } from './chartTooltipClasses.js';

/** Marco con el contenido propio de cada tooltip como `children`. `card` toma sus colores del tema de gráficas. */
export function ChartTooltip({ variant, className, children }) {
  const ct = useChartTheme();
  return (
    <div style={variant === 'card' ? chartTooltipStyle(ct) : undefined} className={cx(chartTooltipClass(variant), className)}>
      {children}
    </div>
  );
}
