const fs = require('fs');
const dashboardPath = 'src/components/Dashboard.jsx';

let content = fs.readFileSync(dashboardPath, 'utf8');

// 1. Imports
content = content.replace(
  'import React, { useState, useCallback, Suspense, lazy } from "react";',
  'import React, { useState, useCallback, Suspense, lazy } from "react";\nimport { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";'
);

// 2. ActivityRouteWrapper
const wrapperCode = `
// Wrapper para inyectar la actividad basada en el ID de la URL
const ActivityRouteWrapper = ({ activities, settings, fetchActivityStreams, deleteActivity }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = activities.find(a => a.id === id);

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
            navigate(-1);
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
`;
content = content.replace(
  'const LazyFallback = () => (',
  wrapperCode + '\nconst LazyFallback = () => ('
);

// 3. Remove states
content = content.replace(
  'const [activeTab, setActiveTab]         = useState("overview");\n  const [activeActivity, setActiveActivity] = useState(null);\n',
  ''
);

// 4. Remove handleTabChange, handleSelectActivity, handleBackFromActivity, handleBackFromProfile
content = content.replace(
  /const handleTabChange = useCallback\(\(tab\) => \{[\s\S]*?\}, \[\]\);\n\n  const handleSelectActivity = useCallback\(\(act\) => setActiveActivity\(act\), \[\]\);\n  const handleBackFromActivity = useCallback\(\(\) => setActiveActivity\(null\), \[\]\);\n/,
  'const navigate = useNavigate();\n  const handleTabChange = useCallback((path) => navigate(path), [navigate]);\n  const handleSelectActivity = useCallback((act) => navigate(`/activity/${act.id}`), [navigate]);\n'
);

content = content.replace(
  /const handleBackFromProfile = useCallback\(\(\) => setActiveTab\("overview"\), \[\]\);\n/,
  'const handleBackFromProfile = useCallback(() => navigate("/"), [navigate]);\n'
);

// 5. Replace renderActiveView
const routesCode = `
  const renderActiveView = () => {
    if (activities.length === 0) {
      return (
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
      );
    }

    return (
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
    );
  };
`;
content = content.replace(/const renderActiveView = \(\) => \{[\s\S]*?default:\n        return null;\n    \}\n  \};\n/, routesCode);

// 6. Update main wrapper to handle activeActivity px-4 properly based on URL
// Wait, we don't have activeActivity anymore. We can use useLocation.
content = content.replace(
  '<main className={`w-full max-w-[1800px] mx-auto ${activeActivity ? \'px-4\' : \'px-4 sm:px-6 py-4 sm:py-6 space-y-4\'}`}>',
  'const isActivityPage = location.pathname.startsWith("/activity/");\n      <main className={`w-full max-w-[1800px] mx-auto ${isActivityPage ? "px-4" : "px-4 sm:px-6 py-4 sm:py-6 space-y-4"}`}>'
);
content = content.replace(
  'const {',
  'const location = useLocation();\n  const {'
);

fs.writeFileSync(dashboardPath, content);
console.log("Dashboard refactored successfully.");
