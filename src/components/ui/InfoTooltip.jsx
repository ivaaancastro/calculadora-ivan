/** InfoTooltip (spec-rediseno-02-c2, 6.2; PR 7). La receta está en infoTooltipClasses.js. */
import { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { INFO_TOOLTIP as C, infoBubbleClass } from './infoTooltipClasses.js';

/**
 * Icono de ayuda con una burbuja de texto encima. Se abre al pasar el ratón y, en un teléfono,
 * al tocarlo (D4 d); otro toque, tocar fuera o Escape la cierran.
 */
export function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
    <div ref={ref} className={C.root} onClick={() => setOpen((o) => !o)}>
      <HelpCircle size={11} className={C.icon} />
      <div role="tooltip" className={infoBubbleClass(open)}>
        {text}
        <div className={C.arrow}></div>
      </div>
    </div>
  );
}
