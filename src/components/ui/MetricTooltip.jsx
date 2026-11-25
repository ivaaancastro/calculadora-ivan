/** MetricTooltip (spec-tarjetas-explicativas-detalle).
 *
 * Tarjeta explicativa de una métrica. Envuelve su elemento hijo (por ejemplo
 * un `Stat`) y lo vuelve pulsable con zona táctil ≥ 44 px. Al pulsarlo
 * se abre una tarjeta explicativa: popover anclado en escritorio, bottom-sheet
 * en móvil (< sm) mediante `Modal` (variante `sheet`). Accesible por teclado:
 * foco al abrir, Escape para cerrar, clic fuera para cerrar, Enter/Space para
 * activar el disparador.
 *
 * Recibe `metricId` para buscar el texto en `ACTIVITY_METRIC_DESCRIPTIONS`,
 * o bien `label`/`description` directamente.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Modal } from './Modal.jsx';
import { METRIC_TOOLTIP } from './metricTooltipClasses.js';
import { getActivityMetricDescription } from '../../utils/activityMetricDescriptions.js';

export function MetricTooltip({ metricId, label, description, children }) {
  const text = metricId ? getActivityMetricDescription(metricId) : null;
  const finalLabel = label || (text ? text.label : '');
  const finalDescription = description || (text ? text.description : '');

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const uid = useId();
  const describedById = `metric-tooltip-${metricId || label || uid.replaceAll(':', '')}`;

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  // Posicionar el popover debajo del disparador (escritorio).
  const placePopover = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({ top: rect.bottom + 6, left: rect.left });
  }, []);

  // Abrir: mover el foco a la tarjeta y posicionar el popover.
  useEffect(() => {
    if (!open) return undefined;
    placePopover();
    const el = popoverRef.current;
    if (el) {
      el.setAttribute('tabindex', '-1');
      el.focus();
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, placePopover]);

  // Cerrar al hacer clic fuera (escritorio, popover).
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const mq = useRef(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(max-width: 639px)');
    mq.current = media;
    const handler = (e) => setIsMobile(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Activar el disparador con Enter o Space (accesibilidad teclado).
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <>
      {/* Disparador: el hijo (p. ej. un Stat) envuelto en una zona táctil accesible. */}
      <div
        ref={triggerRef}
        role="button"
        data-metric-trigger=""
        tabIndex={0}
        aria-label={`Más información sobre ${finalLabel}`}
        aria-describedby={open ? describedById : undefined}
        aria-expanded={open}
        className={METRIC_TOOLTIP.trigger}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>

      {/* Escritorio: popover anclado. */}
      {!isMobile && open && (
        <div
          ref={popoverRef}
          role="tooltip"
          id={describedById}
          className={METRIC_TOOLTIP.popover}
          style={{ top: position.top, left: position.left }}
        >
          <div className={METRIC_TOOLTIP.title}>{finalLabel}</div>
          <div className={METRIC_TOOLTIP.description}>{finalDescription}</div>
          <div className={METRIC_TOOLTIP.arrow} />
        </div>
      )}

      {/* Móvil: bottom-sheet mediante Modal (variante "sheet"). */}
      {isMobile && (
        <Modal open={open} onClose={close} variant="sheet" closeOnBackdrop labelledBy={describedById}>
          <div className="p-4 sm:p-6">
            <h3 id={describedById} className="text-sm font-bold text-ink mb-2 uppercase tracking-wider">
              {finalLabel}
            </h3>
            <p className="text-[11px] text-ink-4 leading-snug">{finalDescription}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
