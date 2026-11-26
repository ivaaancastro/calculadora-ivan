/**
 * EmptyState (Fase Premium B, EST-2; Capa 6, PR 14): icono, título, una línea y acción opcional.
 * `tone` = neutral | info | warning | danger tiñe la ficha del icono; `danger` es el estado de
 * error (sustituye a la antigua primitiva de error, DUP-6) y anuncia el mensaje con `role="alert"`.
 * La acción (un `Button`) va en `action` o como `children`. Recetas en stateClasses.js.
 */
import { cx } from './cx.js';
import { stateClass, stateChipClass } from './stateClasses.js';

export function EmptyState({ icon: Icon, title, description, tone = 'neutral', surface = false, action, children, className, ...rest }) {
  const actions = action || children;
  return (
    <div role={tone === 'danger' ? 'alert' : undefined} className={cx(stateClass.root, surface && 'bg-surface', className)} {...rest}>
      {Icon && (
        <span className={stateChipClass(tone)}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <h3 className={stateClass.title}>{title}</h3>
      {description && <p className={stateClass.description}>{description}</p>}
      {actions && <div className={stateClass.actions}>{actions}</div>}
    </div>
  );
}
