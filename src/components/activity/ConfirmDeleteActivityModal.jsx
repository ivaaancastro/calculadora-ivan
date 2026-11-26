import { Modal, Button } from '../ui';

const fmtDate = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Confirmación de borrado de una actividad. `activity` null = cerrado. Cancelar es lo primero
 * del orden de foco (opción segura); no cierra al tocar fuera (D6) y, ocupado, ni Esc ni Cancelar.
 */
export function ConfirmDeleteActivityModal({ activity, busy = false, onConfirm, onCancel }) {
  const date = activity ? fmtDate(activity.date) : '';
  return (
    <Modal open={!!activity} onClose={onCancel} variant="confirm" labelledBy="confirm-delete-title" trapFocus>
      {activity && (
        <div className="flex flex-col gap-4 p-5" aria-busy={busy}>
          <h2 id="confirm-delete-title" className="text-base font-bold text-ink">¿Eliminar actividad?</h2>
          <div id="confirm-delete-desc" className="flex flex-col gap-2 text-sm text-ink-3">
            <p>
              <span className="font-semibold text-ink">{activity.name || 'Actividad sin título'}</span>
              {date ? ` · ${date}` : ''}
            </p>
            <p>Esta acción no se puede deshacer.</p>
            {activity.strava_id ? (
              <p>Si sigue en Strava, podría volver a importarse al sincronizar.</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button>
            <Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Eliminando…' : 'Eliminar'}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
