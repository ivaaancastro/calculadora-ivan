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
import { KpiGrid } from "./dashboard/KpiGrid";
import { EvolutionChart } from "./dashboard/EvolutionChart";
import { DistributionChart } from "./dashboard/DistributionChart";
import { HistoryList } from "./dashboard/HistoryList";
import { AdvancedAnalytics } from "./dashboard/AdvancedAnalytics";
import AddActivityModal from "./modals/AddActivityModal";
import { CalendarPage } from "./pages/CalendarPage";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { ProfilePage } from "./pages/ProfilePage";

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
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeActivity, setActiveActivity] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-sans pb-24 md:pb-12 transition-colors duration-300 selection:bg-blue-500/30">
      <Navbar
        activities={activities}
        uploading={uploading}
        handleClearDb={handleClearDb}
        onFileUpload={processFile}
        onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => setActiveTab("profile")}
        isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      {uploadStatus && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top sticky top-[52px] z-30 shadow-sm">
          {uploadStatus}
        </div>
      )}

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {activeActivity ? (
          <ActivityDetailPage
            activity={activeActivity}
            settings={settings}
            fetchStreams={fetchActivityStreams}
            onBack={() => setActiveActivity(null)}
            onDelete={deleteActivity}
          />
        ) : activeTab === "profile" ? (
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
            {/* NAVEGACIÓN SUPERIOR (Selector Segmentado) */}
            <div className="hidden md:flex justify-start mb-6 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                {[
                  { id: "overview", label: "Dashboard" },
                  { id: "calendar", label: "Calendario" },
                  { id: "history", label: "Actividades" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab.id
                      ? "bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-950"
                      : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border-l border-slate-200 dark:border-zinc-700 first:border-l-0"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VISTA: OVERVIEW */}
            <div
              className={
                activeTab === "overview"
                  ? "block space-y-4 animate-in fade-in duration-300"
                  : "hidden"
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase">
                    Panel de Rendimiento
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                    Métricas y Adaptaciones Fisiológicas
                  </p>
                </div>

                {/* SELECTOR DE TIEMPO */}
                <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden self-start sm:self-auto">
                  {[
                    { id: "7d", label: "7D" },
                    { id: "30d", label: "30D" },
                    { id: "90d", label: "3M" },
                    { id: "1y", label: "1A" },
                    { id: "all", label: "Todo" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeRange(t.id)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${timeRange === t.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border-l border-slate-200 dark:border-zinc-700 first:border-l-0"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI GRID */}
              <KpiGrid
                metrics={currentMetrics}
                summary={summary}
                timeRange={timeRange}
              />

              {/* GRÁFICAS BÁSICAS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 h-[300px]">
                  <EvolutionChart data={chartData} />
                </div>
                <div className="lg:col-span-4 h-[300px]">
                  <DistributionChart
                    distribution={distribution}
                    total={summary.count}
                  />
                </div>
              </div>

              {/* SECCIÓN AVANZADA */}
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 mt-4">
                <AdvancedAnalytics
                  activities={activities}
                  settings={settings}
                  onSelectActivity={(act) => setActiveActivity(act)}
                />
              </div>
            </div>

            {/* VISTA: CALENDARIO */}
            <div
              className={
                activeTab === "calendar" ? "block animate-in fade-in" : "hidden"
              }
            >
              <CalendarPage
                activities={activities}
                plannedWorkouts={plannedWorkouts}
                addPlannedWorkout={addPlannedWorkout}
                deletePlannedWorkout={deletePlannedWorkout}
                currentMetrics={currentMetrics}
                onDelete={deleteActivity}
                onSelectActivity={(act) => setActiveActivity(act)}
              />
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
                <HistoryList
                  activities={activities}
                  onDelete={deleteActivity}
                  onSelectActivity={(act) => setActiveActivity(act)}
                />
              </div>
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
