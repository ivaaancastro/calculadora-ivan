/** Modal (spec-rediseno-02-c2, 6.2; PR 6). Las recetas están en modalClasses.js. Sin portal (RF5). */
import { modalRecipe } from './modalClasses.js';

/**
 * Fondo fijo y panel con `role="dialog"`, `aria-modal` y `aria-labelledby` (el `id` del título).
 * Con `closeOnBackdrop`, tocar fuera del panel llama a `onClose`, como ya hacían el acceso y el visor.
 */
export function Modal({ open, onClose, variant, labelledBy, closeOnBackdrop = false, children }) {
  const r = modalRecipe(variant);
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
