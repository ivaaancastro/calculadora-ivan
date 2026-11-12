import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
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
export function ActivityRouteWrapper({ activities, settings, fetchActivityStreams, deleteActivity }) {
  const { id } = useParams();
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
          fetchActivityStreams={fetchActivityStreams}
          deleteActivity={deleteActivity}
        />
        </AutoChartSkin>
      </Suspense>
    </ErrorBoundary>
  );
}
