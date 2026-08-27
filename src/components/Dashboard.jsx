import React, { useState, useCallback, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import {
  Loader2,
  Database,
  Plus,
} from "lucide-react";
import { useActivities } from "../hooks/useActivities";

// Componentes siempre cargados (shell de la app)
import { Navbar } from "./dashboard/Navbar";
import { BottomNav } from "./layout/BottomNav";
import { AdvancedAnalytics } from "./dashboard/AdvancedAnalytics";
import { HistoryList } from "./dashboard/HistoryList";
import AddActivityModal from "./modals/AddActivityModal";
import { ErrorBoundary } from "./common/ErrorBoundary";

// Páginas cargadas bajo demanda (code splitting)
const CalendarPage = lazy(() => import("./pages/CalendarPage").then(m => ({ default: m.CalendarPage })));
const ActivityDetailPage = lazy(() => import("./pages/ActivityDetailPage").then(m => ({ default: m.ActivityDetailPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const HealthPage = lazy(() => import("./pages/HealthPage").then(m => ({ default: m.HealthPage })));
const FitnessStatsPage = lazy(() => import("./pages/FitnessStatsPage").then(m => ({ default: m.FitnessStatsPage })));

// Fallback minimalista para Suspense
const LazyFallback = () => (
  <div className="flex items-center justify-center py-32">
    <Loader2 className="animate-spin text-blue-500" size={24} />
  </div>
);

// Wrapper para inyectar la actividad basada en el ID de la URL
const ActivityRouteWrapper = ({ activities, settings, fetchActivityStreams, deleteActivity }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = activities.find(a => String(a.id) === id);

  if (!activity) {
    return <Navigate to="/history" replace />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LazyFallback />}>
        <ActivityDetailPage
          activity={activity}
          settings={settings}
          fetchStreams={fetchActivityStreams}
          onBack={() => navigate(-1)}
          onDelete={(id) => {
            deleteActivity(id);
            navigate("/history", { replace: true });
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

const Dashboard = () => {
  const {
    activities,
    loading,
    uploading,
    uploadStatus,
    timeRange,
    settings,
    setTimeRange,
    handleClearDb,
    fetchActivities,
    currentMetrics,
    chartData,
    isStravaConnected,
    handleStravaSync,
    deleteActivity,
    fetchActivityStreams,
    isDeepSyncing,
    deepSyncProgress,
    handleDeepSync,
    updateProfile,
    plannedWorkouts,
    addPlannedWorkout,
    deletePlannedWorkout,
    updatePlannedWorkout,
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSelectActivity = useCallback((act) => navigate(`/activity/${act.id}`), [navigate]);
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleBackFromProfile = useCallback(() => navigate("/"), [navigate]);

  if (loading && !uploading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 gap-4 transition-colors">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
          Cargando métricas...
        </p>
      </div>
    );
  }

  const isActivityPage = location.pathname.startsWith("/activity/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-sans pb-24 md:pb-12 transition-colors duration-300 selection:bg-blue-500/30 overflow-hidden">
      <Navbar
        activities={activities}
        uploading={uploading}
        handleClearDb={handleClearDb}
        onAddClick={handleOpenModal}
        isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      {uploadStatus && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top sticky top-[52px] z-30 shadow-sm">
          {uploadStatus}
        </div>
      )}

      <main className={`w-full max-w-[1800px] mx-auto ${isActivityPage ? 'px-4' : 'px-4 sm:px-6 py-4 sm:py-6 space-y-4'}`}>
        {activities.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-8 max-w-md mx-auto">
              <Database
                size={32}
                className="mx-auto text-slate-400 dark:text-zinc-600 mb-4"
              />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-100 mb-2">
                Base de datos vacía
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-6">
                Conecta Strava para iniciar el análisis.
              </p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={
              <div className="space-y-4 animate-in fade-in duration-300">
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
            } />
            
            <Route path="/stats" element={
              <ErrorBoundary>
                <Suspense fallback={<LazyFallback />}>
                  <FitnessStatsPage
                    activities={activities}
                    settings={settings}
                    chartData={chartData}
                    onSelectActivity={handleSelectActivity}
                  />
                </Suspense>
              </ErrorBoundary>
            } />
            
            <Route path="/calendar" element={
              <ErrorBoundary>
                <Suspense fallback={<LazyFallback />}>
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
                </Suspense>
              </ErrorBoundary>
            } />
            
            <Route path="/history" element={
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleOpenModal}
                    className="py-1.5 px-3 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus size={14} /> Añadir Manual
                  </button>
                </div>
                <div className="h-[calc(100vh-250px)]">
                  <ErrorBoundary>
                    <HistoryList
                      activities={activities}
                      onDelete={deleteActivity}
                      onSelectActivity={handleSelectActivity}
                    />
                  </ErrorBoundary>
                </div>
              </>
            } />
            
            <Route path="/health" element={
              <ErrorBoundary>
                <Suspense fallback={<LazyFallback />}>
                  <HealthPage activities={activities} settings={settings} chartData={chartData} />
                </Suspense>
              </ErrorBoundary>
            } />
            
            <Route path="/profile" element={
              <ErrorBoundary>
                <Suspense fallback={<LazyFallback />}>
                  <ProfilePage
                    currentSettings={settings}
                    currentMetrics={currentMetrics}
                    onUpdate={updateProfile}
                    onBack={handleBackFromProfile}
                    activities={activities}
                    isDeepSyncing={isDeepSyncing}
                    deepSyncProgress={deepSyncProgress}
                    onDeepSync={handleDeepSync}
                  />
                </Suspense>
              </ErrorBoundary>
            } />
            
            <Route path="/activity/:id" element={
              <ActivityRouteWrapper 
                activities={activities}
                settings={settings}
                fetchActivityStreams={fetchActivityStreams}
                deleteActivity={deleteActivity}
              />
            } />
          </Routes>
        )}
      </main>

      {/* BOTTOM NAV PARA MÓVIL */}
      <BottomNav />

      {/* MODAL PARA AÑADIR MANUALMENTE */}
      <AddActivityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={fetchActivities}
      />
    </div>
  );
};

export default Dashboard;
