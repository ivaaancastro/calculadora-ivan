/** Stat y StatTile (spec-rediseno-02-c2, 6.2; PR 2). Las recetas están en statClasses.js. */
import { cx } from './cx.js';
import { Card } from './Card.jsx';
import { STAT, ICON_TONES, tileRecipe } from './statClasses.js';

/** Cifra compacta con etiqueta y unidad. `accent` es la clase de color del valor (por defecto `text-ink`). */
export function Stat({ label, value, unit, accent, className }) {
  return (
    <div className={cx(STAT.root, className)}>
      <span className={STAT.label}>{label}</span>
      <div className={STAT.row}>
        <span className={cx(STAT.value, accent || 'text-ink')}>{value}</span>
        {unit && <span className={STAT.unit}>{unit}</span>}
      </div>
    </div>
  );
}

/** Ficha de métrica con icono (Dashboard). */
export function StatTile({ size = 'lg', label, icon: Icon, iconTone, value, sub, className }) {
  const r = tileRecipe(size, iconTone);
  const Value = r.value.tag;
  const Sub = r.sub.tag;
  return (
    <Card pressable className={cx(r.card, className)}>
      <div className={r.head}>
        <span className={r.label}>{label}</span>
        <div className={cx(r.icon, ICON_TONES[iconTone])}>
          <Icon size={r.iconSize} strokeWidth={r.iconStroke} />
        </div>
      </div>
      <div>
        <Value className={r.value.className}>{value}</Value>
        {sub ? <Sub className={r.sub.className}>{sub}</Sub> : null}
      </div>
    </Card>
  );
}
