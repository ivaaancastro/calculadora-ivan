import React, { useRef, useEffect } from 'react';

/**
 * Aparición al hacer scroll de la landing v2. A diferencia de `FadeIn` (v1, congelada), el
 * contenido nace visible: solo se oculta, ya montado, si hay IntersectionObserver, el usuario
 * no pidió menos movimiento y el bloque queda bajo la primera pantalla. Así `prefers-reduced-motion`
 * y un script que no llega a ejecutarse muestran la página terminada.
 */
export const Reveal = ({ children, className = '' }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    el.dataset.reveal = 'hidden';
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.dataset.reveal = 'shown'; },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // `data-reveal` lo pone el efecto: sin él (o con movimiento reducido) el bloque se ve terminado.
  return (
    <div
      ref={ref}
      className={`data-[reveal]:transition-all data-[reveal]:duration-700 data-[reveal]:ease-out data-[reveal=hidden]:translate-y-8 data-[reveal=hidden]:opacity-0 ${className}`}
    >
      {children}
    </div>
  );
};
