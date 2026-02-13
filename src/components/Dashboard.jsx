import React, { useState } from 'react';
import { Loader2, FileText, Plus, Calendar as CalIcon } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

// Componentes
import { Navbar } from './dashboard/Navbar';
import { BottomNav } from './layout/BottomNav';
import { KpiGrid } from './dashboard/KpiGrid';
import { EvolutionChart } from './dashboard/EvolutionChart';
import { DistributionChart } from './dashboard/DistributionChart';
import { HistoryList } from './dashboard/HistoryList';
import { SmartCoach } from './dashboard/SmartCoach';
import ActivityCalendar from './dashboard/ActivityCalendar';
import { FitnessStatus } from './dashboard/FitnessStatus';
import AddActivityModal from './modals/AddActivityModal';
import ProfileModal from './modals/ProfileModal';
import { SeasonPlanner } from './dashboard/SeasonPlanner';
import { CalendarPage } from './pages/CalendarPage';

const Dashboard = () => {
  const { 
    activities, loading, uploading, uploadStatus, timeRange, settings,
    setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, 
    analyzeHistory, filteredData, currentMetrics, chartData, distribution, summary,
    isStravaConnected, handleStravaSync, deleteActivity 
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ESTADO PARA NAVEGACIÓN
  const [activeTab, setActiveTab] = useState('overview'); 

  const handleTabChange = (tab) => {
      if (tab === 'profile') {
          setIsProfileOpen(true);
      } else {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  if (loading && !uploading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 transition-colors">
      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40}/>
      <p className="text-slate-400 font-medium text-sm animate-pulse">Cargando métricas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans pb-24 md:pb-12 transition-colors duration-300">
      
      <Navbar 
        activities={activities} uploading={uploading} handleClearDb={handleClearDb}
        onFileUpload={processFile} onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)} isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      {uploadStatus && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase animate-in slide-in-from-top sticky top-[60px] z-30 shadow-md">
          {uploadStatus}
        </div>
      )}

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        
        {activities.length === 0 ? (
           <div className="text-center py-20 px-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto transition-colors">
                <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Empieza tu viaje</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Conecta Strava para ver tu rendimiento.</p>
              </div>
           </div>
        ) : (
          <>
            {/* NAVEGACIÓN SUPERIOR (TIPO TRAINING PEAKS) */}
            <div className="flex justify-center md:justify-start gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-1">
                {[
                    { id: 'overview', label: 'Dashboard' },
                    { id: 'calendar', label: 'Calendario' },
                    { id: 'analytics', label: 'Análisis' },
                    { id: 'history', label: 'Actividades' },
                    { id: 'planner', label: 'Temporada' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all ${
                            activeTab === tab.id 
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* VISTA DASHBOARD (OVERVIEW) */}
            <div className={activeTab === 'overview' ? 'block space-y-6 animate-in fade-in' : 'hidden'}>
                <FitnessStatus metrics={currentMetrics} />
                <KpiGrid metrics={currentMetrics} summary={summary} timeRange={timeRange} />
                
                {/* En móvil ponemos un resumen compacto, en desktop el completo */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 h-[300px]"><EvolutionChart data={chartData} /></div>
                    <div className="lg:col-span-4 h-[300px]"><DistributionChart distribution={distribution} total={summary.count} /></div>
                </div>
            </div>

            {/* VISTA CALENDARIO COMPLETO (NUEVA) */}
            <div className={activeTab === 'calendar' ? 'block animate-in fade-in' : 'hidden'}>
                <CalendarPage activities={activities} />
            </div>

            {/* VISTA ANÁLISIS */}
            <div className={activeTab === 'analytics' ? 'block space-y-6 animate-in fade-in' : 'hidden'}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[350px]"><EvolutionChart data={chartData} /></div>
                    <div className="h-[350px]"><DistributionChart distribution={distribution} total={summary.count} /></div>
                </div>
                {/* Aquí podríamos meter más gráficas de zonas, etc */}
            </div>

            {/* VISTA HISTORIAL (LISTA) */}
            <div className={activeTab === 'history' ? 'block animate-in fade-in' : 'hidden'}>
                 <div className="flex justify-end mb-4">
                    <button onClick={() => setIsModalOpen(true)} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition">
                        <Plus size={18} /> Añadir Manual
                    </button>
                 </div>
                 <div className="h-[calc(100vh-250px)]">
                    <HistoryList activities={filteredData} onDelete={deleteActivity} />
                 </div>
            </div>

            {/* VISTA PLANIFICADOR */}
            <div className={activeTab === 'planner' ? 'block animate-in fade-in' : 'hidden'}>
                <SeasonPlanner currentMetrics={currentMetrics} activities={activities} />
            </div>

          </>
        )}
      </main>

      {/* BOTTOM NAV PARA MÓVIL */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <AddActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchActivities} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onUpdate={fetchProfile} currentSettings={settings} onAnalyze={analyzeHistory} />

    </div>
  );
};

export default Dashboard;