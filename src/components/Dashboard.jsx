import React, { useState } from "react";
import {
  Loader2,
  FileText,
  Plus,
  Database,
  Settings,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useActivities } from "../hooks/useActivities";

// Componentes
import { Navbar } from "./dashboard/Navbar";
import { BottomNav } from "./layout/BottomNav";
import { AdvancedAnalytics } from "./dashboard/AdvancedAnalytics";
import { HistoryList } from "./dashboard/HistoryList";
import AddActivityModal from "./modals/AddActivityModal";
import { CalendarPage } from "./pages/CalendarPage";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { HealthPage } from "./pages/HealthPage";
import { FitnessStatsPage } from "./pages/FitnessStatsPage";
import { ErrorBoundary } from "./common/ErrorBoundary";

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
    processFile,
    fetchActivities,
    fetchProfile,
    analyzeHistory,
    filteredData,
    currentMetrics,
    chartData,
    distribution,
    summary,
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
  const [activeTab, setActiveTab] = useState("overview");
  const [activeActivity, setActiveActivity] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveActivity(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-sans pb-24 md:pb-12 transition-colors duration-300 selection:bg-blue-500/30 overflow-hidden">
      <Navbar
        activities={activities}
        uploading={uploading}
        handleClearDb={handleClearDb}
        onFileUpload={processFile}
        onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => handleTabChange("profile")}
        isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {uploadStatus && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top sticky top-[52px] z-30 shadow-sm">
          {uploadStatus}
        </div>
      )}

      <main className={`w-full max-w-[1800px] mx-auto ${activeActivity ? 'px-4' : 'px-4 sm:px-6 py-4 sm:py-6 space-y-4'}`}>
        {activeActivity ? (
          <ErrorBoundary>
            <ActivityDetailPage
              activity={activeActivity}
              settings={settings}
              fetchStreams={fetchActivityStreams}
              onBack={() => setActiveActivity(null)}
              onDelete={deleteActivity}
            />
          </ErrorBoundary>
        ) : activeTab === "profile" ? (
          <ErrorBoundary>
            <ProfilePage
              currentSettings={settings}
              onUpdate={updateProfile}
              onAnalyze={analyzeHistory}
              onBack={() => setActiveTab("overview")}
              activities={activities}
              isDeepSyncing={isDeepSyncing}
              deepSyncProgress={deepSyncProgress}
              onDeepSync={handleDeepSync}
            />
          </ErrorBoundary>
        ) : activities.length === 0 ? (
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
          <>

            {/* VISTA: OVERVIEW */}
            <div
              className={
                activeTab === "overview"
                  ? "block space-y-4 animate-in fade-in duration-300"
                  : "hidden"
              }
            >


                  <AdvancedAnalytics
                    activities={activities}
                    settings={settings}
                    onSelectActivity={(act) => setActiveActivity(act)}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    chartData={chartData}
                  />
            </div>

            {/* VISTA: RENDIMIENTO */}
            <div
              className={
                activeTab === "stats" ? "block animate-in fade-in" : "hidden"
              }
            >
              <ErrorBoundary>
                <FitnessStatsPage
                  activities={activities}
                  settings={settings}
                  chartData={chartData}
                  onSelectActivity={(act) => setActiveActivity(act)}
                />
              </ErrorBoundary>
            </div>

            {/* VISTA: CALENDARIO */}
            <div
              className={
                activeTab === "calendar" ? "block animate-in fade-in" : "hidden"
              }
            >
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
                  onSelectActivity={(act) => setActiveActivity(act)}
                />
              </ErrorBoundary>
            </div>

            {/* VISTA: HISTORIAL */}
            <div
              className={
                activeTab === "history" ? "block animate-in fade-in" : "hidden"
              }
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsModalOpen(true)}
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
                    onSelectActivity={(act) => setActiveActivity(act)}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* VISTA: SALUD */}
            <div
              className={
                activeTab === "health" ? "block animate-in fade-in" : "hidden"
              }
            >
              <ErrorBoundary>
                <HealthPage activities={activities} settings={settings} chartData={chartData} />
              </ErrorBoundary>
            </div>
          </>
        )}
      </main>

      {/* BOTTOM NAV PARA MÓVIL */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* MODAL PARA AÑADIR MANUALMENTE */}
      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchActivities}
      />
    </div>
  );
};

export default Dashboard;
