import React, { useRef, useEffect } from 'react';

/**
 * MobileSwipePager — Contenedor táctil ultra fluido estilo iOS
 * Permite deslizar las vistas principales acompañando directamente al dedo en tiempo real (1:1),
 * con física elástica de rebote (rubber-banding), transición elástica al soltar y scroll vertical independiente.
 */
export const MobileSwipePager = ({ activeIndex, onChangeTab, children }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const isTrackingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const directionLockedRef = useRef(null); // 'horizontal' | 'vertical' | null
  const currentDxRef = useRef(0);
  const hasSwipedRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  const totalTabs = React.Children.count(children);
  const totalTabsRef = useRef(totalTabs);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    totalTabsRef.current = totalTabs;
  }, [activeIndex, totalTabs]);

  // Sincronizar posición del track cuando activeIndex cambia externamente
  useEffect(() => {
    if (trackRef.current && !isTrackingRef.current) {
      trackRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
      trackRef.current.style.transform = `translateX(-${activeIndex * 100}%)`;
    }
  }, [activeIndex]);

  // Manejo de eventos táctiles nativos NO pasivos para control total y 1:1 en iOS Safari
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = e.target;

      // Ignorar componentes con su propio gesto horizontal o scrub
      if (
        target.closest('.leaflet-container') ||
        target.closest('.recharts-wrapper') ||
        target.closest('input[type="range"]') ||
        target.closest('[data-no-swipe]')
      ) {
        isTrackingRef.current = false;
        return;
      }

      isTrackingRef.current = true;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();
      directionLockedRef.current = null;
      currentDxRef.current = 0;
      hasSwipedRef.current = false;
    };

    const onTouchMove = (e) => {
      if (!isTrackingRef.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Detección inicial de dirección
      if (directionLockedRef.current === null) {
        if (absY > 7 && absY > absX) {
          // Desplazamiento vertical: liberar para scroll nativo fluido
          directionLockedRef.current = 'vertical';
          isTrackingRef.current = false;
          return;
        }

        if (absX > 6 && absX >= absY) {
          directionLockedRef.current = 'horizontal';
        }
      }

      if (directionLockedRef.current === 'horizontal') {
        // En iOS, evitar que Safari cancele el toque o navegue el historial
        if (e.cancelable) {
          e.preventDefault();
        }

        hasSwipedRef.current = true;

        // Resistencia elástica en los extremos (rubber-banding iOS auténtico)
        let effectiveDx = dx;
        const currIndex = activeIndexRef.current;
        const total = totalTabsRef.current;
        if ((currIndex === 0 && dx > 0) || (currIndex === total - 1 && dx < 0)) {
          effectiveDx = dx * 0.28;
        }

        currentDxRef.current = effectiveDx;

        // Manipulación directa del DOM a 120Hz ProMotion sin ciclos de render React
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(calc(${-currIndex * 100}% + ${effectiveDx}px))`;
        }
      }
    };

    const onTouchEnd = () => {
      if (!isTrackingRef.current && !hasSwipedRef.current) return;

      const wasHorizontal = directionLockedRef.current === 'horizontal';
      isTrackingRef.current = false;
      directionLockedRef.current = null;

      if (!wasHorizontal) return;

      const dx = currentDxRef.current;
      const duration = Date.now() - startTimeRef.current;
      const velocity = Math.abs(dx) / Math.max(duration, 1);
      const currIndex = activeIndexRef.current;
      const total = totalTabsRef.current;
      let newIndex = currIndex;

      // Umbral: arrastre mayor a 45px o golpe rápido con > 20px
      if ((dx < -45 || (velocity > 0.25 && dx < -20)) && currIndex < total - 1) {
        newIndex = currIndex + 1;
      } else if ((dx > 45 || (velocity > 0.25 && dx > 20)) && currIndex > 0) {
        newIndex = currIndex - 1;
      }

      // Animación con resorte suave iOS
      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)';
        trackRef.current.style.transform = `translateX(-${newIndex * 100}%)`;
      }

      if (newIndex !== currIndex) {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          try { window.navigator.vibrate(8); } catch { /* ignore */ }
        }
        onChangeTab(newIndex);
      }

      // Limpiar bandera de swipe tras breve delay para bloquear clicks accidentales
      setTimeout(() => {
        hasSwipedRef.current = false;
      }, 50);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onChangeTab]);

  // Prevenir click accidental si se estaba realizando un gesto de arrastre
  const handleCaptureClick = (e) => {
    if (hasSwipedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      onClickCapture={handleCaptureClick}
      className="w-full overflow-hidden relative select-none"
    >
      <div
        ref={trackRef}
        className="flex w-full will-change-transform"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
          transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            className="w-full min-w-full shrink-0 h-[calc(100dvh-56px)] overflow-y-auto overscroll-y-contain custom-scrollbar px-3 sm:px-6 pt-2 pb-32"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
