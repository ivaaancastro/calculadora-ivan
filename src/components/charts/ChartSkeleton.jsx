/** Esqueleto de gráfica (EST-1): ejes y área con la forma de una serie, sin datos. */
import { Skeleton } from '../ui';

const BARS = [38, 52, 44, 66, 58, 74, 62, 80, 70, 88, 76, 92];

export function ChartSkeleton({ className = 'h-full min-h-[160px]', label = 'Cargando gráfica' }) {
  return (
    <div role="status" aria-label={label} className={`flex w-full items-end gap-1.5 px-1 ${className}`}>
      {BARS.map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
