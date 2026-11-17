import React, { Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState } from '../ui';
import { AutoChartSkin } from '../charts/ChartSkin';

const ActivityDetailPage = React.lazy(() =>
  import('../pages/ActivityDetailPage').then((m) => ({ default: m.ActivityDetailPage }))
);

/**
 * Wrapper para inyectar la actividad basada en el ID de la URL.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function ActivityRouteWrapper({ activities, settings, fetchActivityStreams }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // `key === 'default'`: primera entrada del historial (URL directa/recarga), no hay origen al que volver.
  const handleBack = () => (location.key === 'default' ? navigate('/history') : navigate(-1));
  const activity = activities.find((a) => String(a.id) === id);

  if (!activity) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <AutoChartSkin>
        <ActivityDetailPage
          activity={activity}
          settings={settings}
          fetchStreams={fetchActivityStreams}
          onBack={handleBack}
        />
        </AutoChartSkin>
      </Suspense>
    </ErrorBoundary>
  );
}
