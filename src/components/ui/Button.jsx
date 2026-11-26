/** Button e IconButton (spec-rediseno-02-c2, 6.2; PR 5). Las recetas están en buttonClasses.js. */
import { cx } from './cx.js';
import { buttonClass, iconButtonClass } from './buttonClasses.js';

/** `type="button"` por defecto; un botón de formulario pasa `type="submit"`. */
export function Button({ variant = 'ghost', type = 'button', className, children, ...rest }) {
  return (
    <button type={type} className={cx(buttonClass({ variant }), className)} {...rest}>
      {children}
    </button>
  );
}

/** Botón solo con icono: `label` es su nombre accesible (`aria-label`) y es obligatorio. */
export function IconButton({ variant = 'ghost', label, icon: Icon, iconSize, type = 'button', className, ...rest }) {
  if (!label) throw new Error('IconButton: falta `label`');
  return (
    <button type={type} aria-label={label} className={cx(iconButtonClass({ variant }), className)} {...rest}>
      <Icon size={iconSize} />
    </button>
  );
}
