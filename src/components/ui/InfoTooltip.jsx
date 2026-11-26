/** InfoTooltip (spec-rediseno-02-c2, 6.2; PR 7; A11Y-2 en Capa 6). La receta está en infoTooltipClasses.js. */
import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { INFO_TOOLTIP as C, infoBubbleClass } from './infoTooltipClasses.js';

/**
 * Botón de ayuda con una burbuja de texto encima (A11Y-2). Es un `<button>` con nombre accesible
 * y `aria-describedby` hacia la burbuja. Se abre al pasar el ratón, al tocarlo o al llegar con el
 * teclado; otro toque, tocar fuera, salir con Tab o Escape la cierran.
 */
export function InfoTooltip({ text, label = 'Más información' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pointerRef = useRef(false);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={ref} className={C.root}>
      <button
        type="button"
        className={C.trigger}
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onPointerDown={() => { pointerRef.current = true; }}
        // Con teclado el foco abre la burbuja; con puntero decide el clic (si no, abriría y cerraría a la vez).
        onFocus={() => { if (!pointerRef.current) setOpen(true); }}
        onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget)) setOpen(false); }}
        onClick={() => { pointerRef.current = false; setOpen((o) => !o); }}
      >
        <HelpCircle size={14} className={C.icon} aria-hidden="true" />
      </button>
      <span role="tooltip" id={id} className={infoBubbleClass(open)}>
        {text}
        <span className={C.arrow}></span>
      </span>
    </span>
  );
}
