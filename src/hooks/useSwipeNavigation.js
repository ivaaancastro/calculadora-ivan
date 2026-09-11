import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MAIN_TABS = ['/', '/stats', '/calendar', '/health', '/history'];

/**
 * useSwipeNavigation — Hook de navegación lateral por gestos táctiles estilo iOS
 * Permite deslizar a izquierda y derecha para alternar entre las vistas principales
 * o deslizar desde el borde izquierdo para retroceder en vistas de detalle.
 */
export const useSwipeNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartRef = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Solo un dedo
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = e.target;

      // Ignorar gestos originados en elementos interactivos o scroll horizontal
      if (
        target.closest('.leaflet-container') ||
        target.closest('.recharts-wrapper') ||
        target.closest('input, textarea, select, button') ||
        target.closest('.hide-scrollbar') ||
        target.closest('[data-no-swipe]')
      ) {
        touchStartRef.current = null;
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        isLeftEdge: touch.clientX <= 80,
        isRightEdge: touch.clientX >= window.innerWidth - 80,
      };
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;

      const startData = touchStartRef.current;
      touchStartRef.current = null;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startData.x;
      const deltaY = touch.clientY - startData.y;
      const duration = Date.now() - startData.time;

      // Descarte de movimientos lentos (> 650ms)
      if (duration > 650) return;

      // Debe ser un gesto dominantemente horizontal
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < 45 || absX < absY * 1.5) return;

      const currentPath = location.pathname;
      const isSubPage = currentPath.startsWith('/activity/') || currentPath === '/profile';
      const isRightSwipe = deltaX > 0; // Dedo hacia la derecha -> vista anterior o atrás

      const triggerNavigation = (targetPath, direction) => {
        // Feedback háptico nativo si el dispositivo lo soporta
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          try {
            window.navigator.vibrate(10);
          } catch {
            // Ignorar si no está permitido
          }
        }

        if (document.startViewTransition) {
          document.startViewTransition({
            update: () => {
              if (targetPath === -1) {
                navigate(-1);
              } else {
                navigate(targetPath);
              }
            },
            types: [direction]
          });
        } else {
          if (targetPath === -1) {
            navigate(-1);
          } else {
            navigate(targetPath);
          }
        }
      };

      // En subpáginas (ej: detalle de actividad o perfil): swipe desde el borde izquierdo hacia la derecha retrocede
      if (isSubPage) {
        if (isRightSwipe && (startData.isLeftEdge || absX > 60)) {
          triggerNavigation(-1, 'backward');
        }
        return;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location.pathname, navigate]);
};
