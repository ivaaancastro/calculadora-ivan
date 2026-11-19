/** Skeleton (Fase Premium B, EST-1): bloque pulsante con la forma del contenido. Recetas en stateClasses.js. */
import { cx } from './cx.js';
import { skeletonClass } from './stateClasses.js';

export function Skeleton({ circle = false, className, ...rest }) {
  return <div aria-hidden="true" className={cx(skeletonClass, circle && 'rounded-full', className)} {...rest} />;
}
