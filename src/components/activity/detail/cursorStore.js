import { createContext, useContext, useSyncExternalStore } from 'react';

/**
 * Cursor compartido del detalle (spec Capa 6, RF-C5 / PERF-1).
 *
 * El punto señalado en las gráficas ya no es estado de la página: vive en este almacén y solo
 * se vuelven a pintar los componentes que lo leen (lecturas de cada pista, picos, marcador del
 * mapa). Las escrituras de `mousemove` se agrupan en un `requestAnimationFrame`: como mucho una
 * notificación por fotograma, con el último punto.
 */
export function createCursorStore() {
    let value = null;
    let pending = null;
    let frame = 0;
    const listeners = new Set();
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;

    const flush = () => {
        frame = 0;
        if (pending === value) return;
        value = pending;
        listeners.forEach((fn) => fn());
    };

    return {
        get: () => value,
        /** `immediate` para clics (picos, «Quitar»): sin esperar al siguiente fotograma. */
        set(next, { immediate = false } = {}) {
            pending = next ?? null;
            if (immediate || !raf) {
                if (frame) cancelAnimationFrame(frame);
                flush();
            } else if (!frame) {
                frame = raf(flush);
            }
        },
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        dispose() {
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
        },
    };
}

const NULL_STORE = { get: () => null, set: () => {}, subscribe: () => () => {} };

export const CursorContext = createContext(NULL_STORE);

/** El almacén del detalle (o uno vacío fuera de él). */
export const useCursorStore = () => useContext(CursorContext);

const identity = (p) => p;

/**
 * Lee el punto señalado. `select` debe devolver un valor estable (primitivo o una referencia
 * que ya está en el punto) para no repintar sin motivo.
 */
export function useCursor(select = identity, store) {
    const fromContext = useContext(CursorContext);
    const s = store || fromContext;
    return useSyncExternalStore(s.subscribe, () => select(s.get()), () => null);
}
