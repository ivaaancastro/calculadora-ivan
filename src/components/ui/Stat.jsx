/** Stat y Delta (Capa 6, PR 14; DUP-5). Recetas en statClasses.js; reglas en docs/design/forma.md. */
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cx } from './cx.js';
import { deltaClass, deltaDirection, deltaIconSize, statClass } from './statClasses.js';
import { formatNumber } from '../../utils/formatters.js';

const ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

/**
 * Variación con signo, flecha y color por significado. Sin `value` numérico no pinta nada.
 * `text` sustituye al texto por defecto (`+3,2` + `unit`); `label` es el contexto para lectores
 * de pantalla («en 28 días»).
 */
export function Delta({ value, text, unit = '', digits, flat = 0, inverse = false, tone, label, size = 'md', className, ...rest }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const d = deltaDirection(value, { flat, inverse, tone });
  const Icon = ICON[d.dir];
  const shown = text ?? `${value > 0 ? '+' : ''}${formatNumber(value, digits ?? (Number.isInteger(value) ? 0 : 1))}${unit}`;
  return (
    <span data-delta={d.tone} className={cx(deltaClass({ tone: d.tone, size }), className)} {...rest}>
      <Icon size={deltaIconSize(size)} strokeWidth={2.5} aria-hidden="true" />
      {shown}
      {label && <span className="sr-only">{` ${label}`}</span>}
    </span>
  );
}

/**
 * Cifra con etiqueta: `label` (eyebrow, opcional), `value` ya formateado, `unit`, `delta`
 * (normalmente un `<Delta>`), `sub` (una línea de contexto), `size` sm | md | lg y `mono`
 * (JetBrains Mono, para cifras secundarias). `metric` marca la cifra con `data-metric` (RF-D1).
 * Si falta el dato, no se pinta un Stat con «--»: la pantalla muestra un EmptyState (RF-D6).
 */
export function Stat({ as: Tag = 'div', label, value, unit, delta, sub, size = 'md', mono = false, metric, className, ...rest }) {
  const c = statClass({ size, mono });
  return (
    <Tag className={className} {...rest}>
      {label && <div className={c.label}>{label}</div>}
      <div className={cx(c.row, label && 'mt-1')}>
        <span data-stat="value" data-metric={metric} className={c.value}>
          {value}
          {unit && <span className={c.unit}>{unit}</span>}
        </span>
        {delta}
      </div>
      {sub && <div className={c.sub}>{sub}</div>}
    </Tag>
  );
}
