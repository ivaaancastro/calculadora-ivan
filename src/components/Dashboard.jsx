import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

// Componentes siempre cargados (shell de la app)
import { Navbar } from './dashboard/Navbar';
import { BottomNav } from './layout/BottomNav';
import { MobileSwipePager } from './layout/MobileSwipePager';

// Subcomponentes extraídos (SRP)
import { UploadStatusBanner } from './dashboard/UploadStatusBanner';
import { EmptyState } from './dashboard/EmptyState';
import { MobileTabsView } from './dashboard/MobileTabsView';
import { DesktopRoutesView } from './dashboard/DesktopRoutesView';
import { ActivitySubRoutes } from './dashboard/ActivitySubRoutes';
import { AdvancedAnalytics } from './dashboard/AdvancedAnalytics';
import { HistoryList } from './dashboard/HistoryList';
import AddActivityModal from './modals/AddActivityModal';
import { ErrorBoundary } from './common/ErrorBoundary';

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
 * extraídos (SRP): Navbar, UploadStatusBanner, MobileTabsView, DesktopRoutesView,
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

  const TAB_PATHS = useMemo(() => ['/', '/stats', '/calendar', '/health', '/history'], []);
  const isSubPage = location.pathname.startsWith('/activity/') || location.pathname === '/profile';
  const currentTabIndex = TAB_PATHS.indexOf(location.pathname);
  const activeTabIndex = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleMobileTabChange = useCallback(
    (newIndex, customPath) => {
      const targetPath = customPath || TAB_PATHS[newIndex] || '/';
      if (location.pathname !== targetPath) {
        navigate(targetPath);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [TAB_PATHS, location.pathname, navigate],
  );

  if (loading && !uploading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 gap-4 transition-colors">
        <span className="animate-spin text-blue-500">Cargando...</span>
        <p className="text-[10px] text-ink-3 font-bold uppercase tracking-widest animate-pulse">
          Cargando métricas...
        </p>
      </div>
    );
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
      <HealthPage activities={activities} settings={settings} chartData={chartData} />
    </ErrorBoundary>
  );

  const renderHistory = (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleOpenModal}
          className="py-1.5 px-3 bg-white dark:bg-zinc-900 text-ink-2-soft border border-line-2 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs active:scale-95"
        >
          <span className="text-[14px]">+</span> Añadir Manual
        </button>
      </div>
      <div className="h-[calc(100dvh-170px)] sm:h-[calc(100vh-250px)]">
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-ink-2-soft font-sans md:pb-12 transition-colors duration-300 selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar
        activities={activities}
        settings={settings}
        uploading={uploading}
        handleClearDb={handleClearDb}
        onAddClick={handleOpenModal}
        isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      <UploadStatusBanner uploadStatus={uploadStatus} />

      <main className={`w-full max-w-[1800px] mx-auto ${isActivityPage ? 'px-2 sm:px-4 py-0 sm:py-2' : 'px-0 sm:px-6 py-2 sm:py-6'}`}>
        {activities.length === 0 ? (
          <EmptyState />
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
            handleBackFromProfile={handleBackFromProfile}
            location={location}
          />
        ) : (
          <>
            <MobileTabsView
              activeIndex={activeTabIndex}
              onChangeTab={handleMobileTabChange}
              renderAdvancedAnalytics={renderAdvancedAnalytics}
              renderFitnessStats={renderFitnessStats}
              renderCalendar={renderCalendar}
              renderHealth={renderHealth}
              renderHistory={renderHistory}
            />
            <DesktopRoutesView
              renderAdvancedAnalytics={renderAdvancedAnalytics}
              renderFitnessStats={renderFitnessStats}
              renderCalendar={renderCalendar}
              renderHealth={renderHealth}
              renderHistory={renderHistory}
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
