import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState } from '../ui';
import { ActivityRouteWrapper } from './ActivityRouteWrapper';

const ProfilePage = React.lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

/**
 * Rutas de subpáginas (/profile y /activity/:id) con ErrorBoundary y Suspense.
 * Extraído de Dashboard.jsx para cumplir SRP.
 */
export function ActivitySubRoutes({
  activities,
  settings,
  fetchActivityStreams,
  deleteActivity,
  currentMetrics,
  updateProfile,
  isDeepSyncing,
  deepSyncProgress,
  handleDeepSync,
  handleClearDb,
  handleBackFromProfile,
  location,
}) {
  return (
    <Routes>
      <Route
        path="/profile"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingState />}>
              <ProfilePage
                currentSettings={settings}
                currentMetrics={currentMetrics}
                onUpdate={updateProfile}
                onBack={handleBackFromProfile}
                activities={activities}
                isDeepSyncing={isDeepSyncing}
                deepSyncProgress={deepSyncProgress}
                onDeepSync={handleDeepSync}
                onClearDb={handleClearDb}
                section={
                  new URLSearchParams(location.search).get('section') || 'general'
                }
              />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="/activity/:id"
        element={
          <ActivityRouteWrapper
            activities={activities}
            settings={settings}
            fetchActivityStreams={fetchActivityStreams}
            deleteActivity={deleteActivity}
          />
        }
      />
    </Routes>
  );
}
