import { useEffect, useState } from 'react';

/**
 * Contador animado de cifras (Capa 5, PR 6b).
 * Con `prefers-reduced-motion` o sin valor numérico devuelve el valor tal cual y no programa nada.
 */
const DURATION_MS = 1200;
const DELAY_MS = 150;

const canAnimate = () =>
    typeof document !== 'undefined'
    && !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function useCountUp(target) {
    const [animate] = useState(canAnimate);
    const valid = typeof target === 'number' && Number.isFinite(target);
    const [shown, setShown] = useState(animate && valid ? 0 : target);

    useEffect(() => {
        if (!animate || !valid) return undefined;
        let raf;
        let start;
        const timer = setTimeout(() => {
            const tick = (now) => {
                if (start === undefined) start = now;
                const t = Math.min(1, (now - start) / DURATION_MS);
                const eased = 1 - Math.pow(1 - t, 3);
                setShown(target * eased);
                if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        }, DELAY_MS);
        return () => {
            clearTimeout(timer);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [animate, valid, target]);

    return animate && valid ? shown : target;
}
