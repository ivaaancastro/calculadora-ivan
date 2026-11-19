/** ErrorState (Fase Premium B, EST-3): error con causa humana y acciones; `role="alert"`. Recetas en stateClasses.js. */
import { cx } from './cx.js';
import { stateClass } from './stateClasses.js';

export function ErrorState({ icon: Icon, title, description, children, className, ...rest }) {
  return (
    <div role="alert" className={cx(stateClass.root, className)} {...rest}>
      {Icon && (
        <span className={stateClass.chipError}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <h3 className={stateClass.title}>{title}</h3>
      {description && <p className={stateClass.description}>{description}</p>}
      {children}
    </div>
  );
}
