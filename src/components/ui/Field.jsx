/** Input y Select (spec-rediseno-02-c2, 6.2; PR 4). Las recetas están en fieldClasses.js. */
import { cx } from './cx.js';
import { inputClass, selectClass } from './fieldClasses.js';

/**
 * `<input>` con una receta. El resto de props (`ref` incluida, que en React 19 es una prop más)
 * llega tal cual al elemento: `id`, `type`, `value`, `onChange`, `aria-*`…
 */
export function Input({ variant = 'filled', size, mono, ringTone, className, ...rest }) {
  return <input className={cx(inputClass({ variant, size, mono, ringTone }), className)} {...rest} />;
}

/** `<select>` con una receta; las opciones van como hijos. */
export function Select({ variant = 'filled', size, mono, className, children, ...rest }) {
  return (
    <select className={cx(selectClass({ variant, size, mono }), className)} {...rest}>
      {children}
    </select>
  );
}
