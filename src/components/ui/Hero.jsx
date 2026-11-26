/** Hero (Capa 6, PR 14; DUP-5). Recetas en heroClasses.js; reglas en docs/design/forma.md. */
import { cx } from './cx.js';
import { heroClass, heroChipClass, HERO_ACCENT } from './heroClasses.js';

/**
 * Héroe de pantalla, sin caja.
 * - `eyebrow`: contexto corto en mayúsculas espaciadas; `chip` = { label, tone } (estado).
 * - `label`, `value`, `unit`, `delta`: la cifra protagonista (`value` ya formateado; `delta`,
 *   normalmente un `<Delta>`). `metric` pone `data-metric` en la cifra (RF-D1).
 * - `line`: la frase narrativa; `sub`: una línea secundaria (consejo, fecha).
 * - `aside`: algo que acompaña a la cifra (p. ej. un enlace); los controles van junto a lo que
 *   cambian (RF-D3), no aquí.
 * - `layout`: `split` (texto | cifra) o `stack` (cifra primero, frase debajo).
 * - `accent`: color del filete; por defecto, el del tono del chip.
 * - `size` (`lg` | `xl`) y `tone` (`ink` | `ctl` | `atl` | `tsb`): tamaño y color de la cifra; `xl` y el
 *   color de la métrica, para la cifra que responde a la pregunta de la pantalla (RF-D2).
 */
export function Hero({
  as: Tag = 'section',
  layout = 'split',
  size = 'lg',
  tone = 'ink',
  eyebrow,
  chip,
  label,
  value,
  unit,
  delta,
  metric,
  line,
  sub,
  aside,
  accent,
  className,
  style,
  children,
  ...rest
}) {
  const c = heroClass({ layout, size, tone });
  const rule = accent ?? (chip ? HERO_ACCENT[chip.tone ?? 'neutral'] : undefined);

  const head = (eyebrow || chip) && (
    <p data-hero="eyebrow" className={c.eyebrow}>
      {eyebrow && <span>{eyebrow}</span>}
      {chip && <span className={cx(c.chip, heroChipClass(chip.tone ?? 'neutral'))}>{chip.label}</span>}
    </p>
  );
  const sentence = line && <p data-hero="sentence" className={c.line}>{line}</p>;
  const second = sub && <p data-hero="advice" className={c.sub}>{sub}</p>;
  const figure = (
    <div className={c.figureCol}>
      {value != null && (
        <div data-hero="figure" className={c.figure}>
          {label && <div className={c.label}>{label}</div>}
          <div className={c.row}>
            <span data-hero="value" data-metric={metric} className={c.value}>
              {value}
              {unit && <span className={c.unit}>{unit}</span>}
            </span>
            {delta}
          </div>
        </div>
      )}
      {aside}
    </div>
  );

  return (
    <Tag style={rule ? { '--hero-accent': rule, ...style } : style} className={cx(c.root, className)} {...rest}>
      {layout === 'split' ? (
        <>
          <div className={c.text}>
            {head}
            {sentence}
            {second}
          </div>
          {figure}
        </>
      ) : (
        <>
          {head}
          {figure}
          {sentence}
          {second}
        </>
      )}
      {children}
    </Tag>
  );
}
