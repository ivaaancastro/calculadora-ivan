import { useEffect, useState } from 'react';

/** Duración de la animación de entrada de las gráficas (ms). */
export const CHART_ENTER_MS = 700;

const reducedQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

/**
 * Animación de entrada de las gráficas (GRA-2); desactivada con
 * `prefers-reduced-motion` y en navegadores automatizados (`navigator.webdriver`: E2E y capturas
 * deterministas). Devuelve las props de animación para `Area`/`Line`/`Bar` de Recharts.
 */
export const useChartMotion = () => {
  const [reduced, setReduced] = useState(() => reducedQuery()?.matches ?? false);

  useEffect(() => {
    const mq = reducedQuery();
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const automated = typeof navigator !== 'undefined' && navigator.webdriver === true;
  const active = !reduced && !automated;
  return { active, props: { isAnimationActive: active, animationDuration: CHART_ENTER_MS, animationEasing: 'ease-out' } };
};
