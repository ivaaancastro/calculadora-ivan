import { useCallback, useRef, useState } from 'react';

/**
 * Estado de la confirmación de borrado de una actividad (spec-detalle-borrar-actividad).
 * `request(activity)` abre el diálogo; `confirm()` llama a `deleteActivity(id)` (que devuelve
 * `true`/`false` y muestra sus propios avisos). Si sale bien cierra y llama a `onDeleted`; si falla,
 * el diálogo sigue abierto para reintentar. Un segundo `confirm()` mientras `busy` se ignora.
 */
export function useConfirmDeleteActivity(deleteActivity, onDeleted) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const request = useCallback((activity) => setPending(activity), []);
  const cancel = useCallback(() => {
    if (!busyRef.current) setPending(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!pending || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    let ok = false;
    try {
      ok = (await deleteActivity?.(pending.id)) === true;
    } catch {
      ok = false;
    }
    busyRef.current = false;
    setBusy(false);
    if (ok) {
      setPending(null);
      onDeleted?.(pending);
    }
    return ok;
  }, [pending, deleteActivity, onDeleted]);

  return { pending, busy, request, cancel, confirm };
}
