/** EmptyState (Fase Premium B, EST-2): icono, título, una línea y acción opcional. Recetas en stateClasses.js. */
import { cx } from './cx.js';
import { stateClass } from './stateClasses.js';

export function EmptyState({ icon: Icon, title, description, children, className, ...rest }) {
  return (
    <div className={cx(stateClass.root, className)} {...rest}>
      {Icon && (
        <span className={stateClass.chip}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <h3 className={stateClass.title}>{title}</h3>
      {description && <p className={stateClass.description}>{description}</p>}
      {children && <div className={stateClass.actions}>{children}</div>}
    </div>
  );
}
