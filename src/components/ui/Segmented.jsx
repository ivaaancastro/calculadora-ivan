/** Segmented y Segmented.Option (spec-rediseno-02-c2, 6.2; PR 3). Las recetas están en segmentedClasses.js. */
import { createContext, useContext } from 'react';
import { cx } from './cx.js';
import { segmentedClass, segmentedOptionClass } from './segmentedClasses.js';

const SegmentedContext = createContext({ variant: 'pill', size: undefined });

/**
 * Contenedor del control. Con `options`, `value` y `onChange` pinta las opciones; si no, recibe
 * `Segmented.Option` como hijos (opciones condicionales o con contenido propio).
 */
export function Segmented({ variant = 'pill', size, options, value, onChange, optionClassName, className, children, ...rest }) {
  return (
    <SegmentedContext.Provider value={{ variant, size }}>
      <div className={cx(segmentedClass({ variant, size }), className)} {...rest}>
        {options
          ? options.map((o) => (
              <SegmentedOption key={o.value} active={o.value === value} tone={o.tone} className={optionClassName} onClick={() => onChange(o.value)}>
                {o.label}
              </SegmentedOption>
            ))
          : children}
      </div>
    </SegmentedContext.Provider>
  );
}

/** Una opción: un `<button>` con `aria-pressed`. Como antes, no fija `type`. */
function SegmentedOption({ active = false, tone, className, children, ...rest }) {
  const { variant, size } = useContext(SegmentedContext);
  return (
    <button className={cx(segmentedOptionClass({ variant, size, active, tone }), className)} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}

Segmented.Option = SegmentedOption;
