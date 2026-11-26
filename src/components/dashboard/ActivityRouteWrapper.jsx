import React, { Suspense, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState } from '../ui';

const ActivityDetailPage = React.lazy(() =>
  import('../pages/ActivityDetailPage').then((m) => ({ default: m.ActivityDetailPage }))
);

/**
 * Wrapper para inyectar la actividad basada en el ID de la URL.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function ActivityRouteWrapper({ activities, settings, fetchActivityStreams, deleteActivity }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // `key === 'default'`: primera entrada del historial (URL directa/recarga), no hay origen al que volver.
  const handleBack = () => (location.key === 'default' ? navigate('/history') : navigate(-1));
  const found = activities.find((a) => String(a.id) === id);
  // Al borrar, la caché pierde la actividad antes de que se navegue: se conserva la última para
  // no pintar una pantalla en blanco en medio (spec-detalle-borrar-actividad, RF5).
  const [last, setLast] = useState(null);
  const [leaving, setLeaving] = useState(false);
  if (found && found !== last) setLast(found);
  const activity = found ?? (leaving ? last : null);

  const handleDelete = async (activityId) => {
    setLeaving(true);
    const ok = (await deleteActivity?.(activityId)) === true;
    if (!ok) setLeaving(false);
    return ok;
  };

  if (!activity) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <>
        <ActivityDetailPage
          activity={activity}
          settings={settings}
          fetchStreams={fetchActivityStreams}
          onBack={handleBack}
          onDelete={handleDelete}
        />
        </>
      </Suspense>
    </ErrorBoundary>
  );
}
