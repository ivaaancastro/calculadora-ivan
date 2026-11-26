/** Segmented y Segmented.Option (spec-rediseno-02-c2, 6.2; PR 3). Las recetas están en segmentedClasses.js. */
import { createContext, useContext } from 'react';
import { cx } from './cx.js';
import { segmentedClass, segmentedOptionClass, segmentedTabId, segmentedPanelId } from './segmentedClasses.js';

const SegmentedContext = createContext({ variant: 'pill', size: undefined });

/**
 * Contenedor del control. Con `options`, `value` y `onChange` pinta las opciones; si no, recibe
 * `Segmented.Option` como hijos (opciones condicionales o con contenido propio).
 *
 * `tabs` (solo con `options`): el control es una lista de pestañas (`role="tablist"`): cada opción
 * es `role="tab"` con `aria-selected` y `aria-controls` = `segmentedPanelId(idPrefix, value)`;
 * solo la activa entra en el orden de tabulación y las flechas, Inicio y Fin cambian de pestaña.
 */
export function Segmented({ variant = 'pill', size, options, value, onChange, optionClassName, className, children, tabs = false, idPrefix = 'segmented', ...rest }) {
  const onKeyDown = (e) => {
    const i = options.findIndex((o) => o.value === value);
    const last = options.length - 1;
    const next = { ArrowRight: i + 1 > last ? 0 : i + 1, ArrowLeft: i - 1 < 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(options[next].value);
    e.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };
  const tabProps = (o) =>
    tabs
      ? {
          role: 'tab',
          id: segmentedTabId(idPrefix, o.value),
          'aria-selected': o.value === value,
          'aria-pressed': undefined,
          'aria-controls': segmentedPanelId(idPrefix, o.value),
          tabIndex: o.value === value ? 0 : -1,
          type: 'button',
        }
      : {};
  return (
    <SegmentedContext.Provider value={{ variant, size }}>
      <div className={cx(segmentedClass({ variant, size }), className)} {...(tabs && options ? { role: 'tablist', onKeyDown } : {})} {...rest}>
        {options
          ? options.map((o) => (
              <SegmentedOption key={o.value} active={o.value === value} tone={o.tone} className={optionClassName} onClick={() => onChange(o.value)} {...tabProps(o)}>
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
