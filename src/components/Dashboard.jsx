import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

// Componentes siempre cargados (shell de la app)
import { Navbar } from './dashboard/Navbar';
import { BottomNav } from './layout/BottomNav';
import { MobileSwipePager } from './layout/MobileSwipePager';

// Subcomponentes extraídos (SRP)
import { UploadStatusBanner } from './dashboard/UploadStatusBanner';
import { Database } from 'lucide-react';
import { MainTabsView } from './dashboard/MainTabsView';
import { MAIN_TAB_PATHS } from '../utils/mainTabs';
import { ActivitySubRoutes } from './dashboard/ActivitySubRoutes';
import { AdvancedAnalytics } from './dashboard/AdvancedAnalytics';
import { HistoryList } from './dashboard/HistoryList';
import AddActivityModal from './modals/AddActivityModal';
import { ErrorBoundary } from './common/ErrorBoundary';
import { Card, EmptyState, LoadingState } from './ui';

// Páginas cargadas bajo demanda (code splitting)
const CalendarPage = React.lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const HealthPage = React.lazy(() =>
  import('./pages/HealthPage').then((m) => ({ default: m.HealthPage }))
);
const FitnessStatsPage = React.lazy(() =>
  import('./pages/FitnessStatsPage').then((m) => ({ default: m.FitnessStatsPage }))
);

/**
 * Dashboard — Shell de orquestación.
 *
 * Coordina el estado global (useActivities), la navegación y los subcomponentes
 * extraídos (SRP): Navbar, UploadStatusBanner, MainTabsView,
 * ActivitySubRoutes, BottomNav y AddActivityModal.
 */
const Dashboard = () => {
  const {
    activities,
    loading,
    uploading,
    uploadStatus,
    handleClearDb,
    settings,
    timeRange,
    setTimeRange,
    isStravaConnected,
    handleStravaSync,
    fetchActivities,
    deleteActivity,
    fetchActivityStreams,
    chartData,
    currentMetrics,
    isDeepSyncing,
    deepSyncProgress,
    handleDeepSync,
    loadHistoricalStreams,
    isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams,
    updateProfile,
    plannedWorkouts,
    addPlannedWorkout,
    deletePlannedWorkout,
    updatePlannedWorkout,
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Gestos táctiles laterales para retroceder desde el borde en subpáginas
  useSwipeNavigation();

  const handleSelectActivity = useCallback((act) => navigate(`/activity/${act.id}`), [
    navigate,
  ]);
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleBackFromProfile = useCallback(() => navigate('/'), [navigate]);

  const isSubPage = location.pathname.startsWith('/activity/') || location.pathname === '/profile';
  const currentTabIndex = MAIN_TAB_PATHS.indexOf(location.pathname);
  const activeTabIndex = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleMobileTabChange = useCallback(
    (newIndex, customPath) => {
      const targetPath = customPath || MAIN_TAB_PATHS[newIndex] || '/';
      if (location.pathname !== targetPath) {
        navigate(targetPath);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [location.pathname, navigate],
  );

  if (loading && !uploading) {
    return <LoadingState variant="screen" />;
  }

  const isActivityPage = location.pathname.startsWith('/activity/');

  // Renderizado de las 5 vistas principales
  const renderAdvancedAnalytics = (
    <div className="space-y-4 animate-in fade-in duration-200">
      <AdvancedAnalytics
        activities={activities}
        settings={settings}
        onSelectActivity={handleSelectActivity}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        chartData={chartData}
        currentMetrics={currentMetrics}
      />
    </div>
  );

  const renderFitnessStats = (
    <ErrorBoundary>
     <>
      <FitnessStatsPage
        activities={activities}
        settings={settings}
        chartData={chartData}
        onSelectActivity={handleSelectActivity}
        loadHistoricalStreams={loadHistoricalStreams}
        isLoadingHistoricalStreams={isLoadingHistoricalStreams}
        hasLoadedHistoricalStreams={hasLoadedHistoricalStreams}
        handleDeepSync={handleDeepSync}
        isDeepSyncing={isDeepSyncing}
        deepSyncProgress={deepSyncProgress}
      />
     </>
    </ErrorBoundary>
  );

  const renderCalendar = (
    <ErrorBoundary>
      <CalendarPage
        activities={activities}
        plannedWorkouts={plannedWorkouts}
        addPlannedWorkout={addPlannedWorkout}
        deletePlannedWorkout={deletePlannedWorkout}
        updatePlannedWorkout={updatePlannedWorkout}
        currentMetrics={currentMetrics}
        settings={settings}
        chartData={chartData}
        onDelete={deleteActivity}
        onSelectActivity={handleSelectActivity}
      />
    </ErrorBoundary>
  );

  const renderHealth = (
    <ErrorBoundary>
      <><HealthPage activities={activities} settings={settings} chartData={chartData} /></>
    </ErrorBoundary>
  );

  const renderHistory = (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleOpenModal}
          data-history="add"
          className="py-1.5 px-3 max-sm:min-h-[44px] bg-surface text-ink-2-soft border border-line-2 rounded-full text-2xs font-bold uppercase flex items-center gap-1.5 hover:bg-sunken-9 transition-colors shadow-2xs active:scale-press"
        >
          <span className="text-[14px]">+</span> Añadir Manual
        </button>
      </div>
      {/* Alto de la lista: la ventana menos la cabecera y el chrome de la página (la fila del
          botón «Añadir Manual» y los márgenes). Se conservan los 170/250 px de antes. */}
      <div className="h-[calc(100dvh-var(--nav-h-total)-7.125rem)] sm:h-[calc(100dvh-var(--nav-h-total)-11.875rem)]">
        <ErrorBoundary>
          <HistoryList
            activities={activities}
            onDelete={deleteActivity}
            onSelectActivity={handleSelectActivity}
          />
        </ErrorBoundary>
      </div>
    </>
  );

  return (
    <div className="tabular-nums min-h-screen bg-sunken-2 text-ink-2-soft font-sans md:pb-12 transition-colors duration-300 selection:bg-action-bright/30 overflow-x-hidden">
      <Navbar
        settings={settings}
        uploading={uploading}
        isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      <UploadStatusBanner uploadStatus={uploadStatus} />

      <main className={`w-full max-w-[1800px] mx-auto ${isActivityPage ? 'px-2 sm:px-4 py-0 sm:py-2' : 'px-0 sm:px-6 py-2 sm:py-6'}`}>
        {activities.length === 0 ? (
          <div className="py-20 px-4">
            <Card className="max-w-md mx-auto">
              <EmptyState icon={Database} title="Aún no hay actividades" description="Conecta Strava para iniciar el análisis." />
            </Card>
          </div>
        ) : isSubPage ? (
          <ActivitySubRoutes
            activities={activities}
            settings={settings}
            fetchActivityStreams={fetchActivityStreams}
            deleteActivity={deleteActivity}
            currentMetrics={currentMetrics}
            updateProfile={updateProfile}
            isDeepSyncing={isDeepSyncing}
            deepSyncProgress={deepSyncProgress}
            handleDeepSync={handleDeepSync}
            handleClearDb={handleClearDb}
            handleBackFromProfile={handleBackFromProfile}
            location={location}
          />
        ) : (
          <>
            <MainTabsView
              activeIndex={activeTabIndex}
              onChangeTab={handleMobileTabChange}
              views={{
                analytics: renderAdvancedAnalytics,
                stats: renderFitnessStats,
                calendar: renderCalendar,
                health: renderHealth,
                history: renderHistory,
              }}
            />
          </>
        )}
      </main>

      <BottomNav
        activeIndex={isSubPage ? undefined : activeTabIndex}
        onTabChange={handleMobileTabChange}
      />

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={fetchActivities}
      />
    </div>
  );
};

export default Dashboard;
