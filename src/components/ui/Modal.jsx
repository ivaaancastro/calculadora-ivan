/** Modal (spec-rediseno-02-c2, 6.2; PR 6). Las recetas están en modalClasses.js. Sin portal (RF5). */
import { useEffect, useRef } from 'react';
import { modalRecipe } from './modalClasses.js';

/** Modales abiertos, del más antiguo al más reciente: Escape solo cierra el de arriba. */
const stack = [];
let saved = null;

/**
 * Bloquea el desplazamiento del documento mientras haya un modal abierto (D4 b). Si había barra de
 * desplazamiento, `scrollbar-gutter: stable` conserva su hueco para que el fondo no se mueva.
 */
function lockScroll() {
  const el = document.documentElement;
  const hadScrollbar = window.innerWidth > el.clientWidth;
  saved = { overflow: el.style.overflow, gutter: el.style.scrollbarGutter };
  el.style.overflow = 'hidden';
  if (hadScrollbar) el.style.scrollbarGutter = 'stable';
}

function unlockScroll() {
  const el = document.documentElement;
  el.style.overflow = saved.overflow;
  el.style.scrollbarGutter = saved.gutter;
  saved = null;
}

/**
 * Fondo fijo y panel con `role="dialog"`, `aria-modal` y `aria-labelledby` (el `id` del título).
 * Con `closeOnBackdrop`, tocar fuera del panel llama a `onClose`, como ya hacían el acceso y el visor.
 * Abierto, Escape llama a `onClose` y el fondo no se desplaza (D4 b).
 */
export function Modal({ open, onClose, variant, labelledBy, closeOnBackdrop = false, children }) {
  const r = modalRecipe(variant);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const entry = {};
    if (stack.length === 0) lockScroll();
    stack.push(entry);
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === entry) onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(entry), 1);
      if (stack.length === 0) unlockScroll();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={r.backdrop} style={r.style} onClick={closeOnBackdrop ? onClose : undefined}>
      {r.layer && <div className={r.layer} />}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={r.panel}
        onClick={closeOnBackdrop ? (e) => e.stopPropagation() : undefined}
      >
        {children}
      </div>
    </div>
  );
}
