/**
 * LoadingState (spec-rediseno-02-c2, 6.2; PR 8): los estados de carga, con las recetas actuales.
 * Recetas en loadingStateClasses.js. El texto del girador ("Cargando...") no cambia: los E2E lo usan
 * para esperar a que la pantalla esté lista.
 */
import { cx } from './cx.js';
import { loadingStateClass, loadingStateLabel } from './loadingStateClasses.js';

export function LoadingState({ variant = 'inline', label, className, ...rest }) {
  const recipe = loadingStateClass(variant);
  const text = label ?? loadingStateLabel(variant);
  return (
    <div className={cx(recipe.root, className)} {...rest}>
      {recipe.spinner && <span className={recipe.spinner}>Cargando...</span>}
      {text && <p className={recipe.label}>{text}</p>}
    </div>
  );
}
