import React, { useState } from 'react';
import { Loader2, FileText, Plus } from 'lucide-react';
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

const Dashboard = () => {
  const { 
    activities, loading, uploading, uploadStatus, timeRange, settings,
    setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, 
    analyzeHistory, filteredData, currentMetrics, chartData, distribution, summary,
    isStravaConnected, handleStravaSync, deleteActivity // <--- IMPORTAMOS FUNCIÓN BORRAR
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ESTADO PARA NAVEGACIÓN MÓVIL
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
    // FONDO GENERAL CON SOPORTE DARK MODE
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans pb-24 md:pb-12 transition-colors duration-300">
      
      {/* NAVBAR */}
      <Navbar 
        activities={activities} uploading={uploading} handleClearDb={handleClearDb}
        onFileUpload={processFile} onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)} isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      {/* BARRA DE ESTADO DE CARGA */}
      {uploadStatus && (
        <div className="bg-blue-600 dark:bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase animate-in slide-in-from-top sticky top-[60px] z-30 shadow-md">
          {uploadStatus}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
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
            {/* FILTROS DE TIEMPO */}
            {(activeTab === 'overview' || activeTab === 'analytics') && (
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {['30d', '90d', '1y', 'all'].map(r => (
                        <button key={r} onClick={() => setTimeRange(r)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap uppercase tracking-wider ${timeRange === r ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-md transform scale-105' : 'bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}>
                            {r === 'all' ? 'Todo' : r.replace('d', ' Días').replace('y', ' Año')}
                        </button>
                    ))}
                </div>
            )}

            {/* --- LAYOUT MÓVIL (PESTAÑAS) --- */}
            <div className="md:hidden space-y-6">
                
                {/* PESTAÑA 1: INICIO */}
                <div className={activeTab === 'overview' ? 'block space-y-6' : 'hidden'}>
                    <FitnessStatus metrics={currentMetrics} />
                    <SmartCoach metrics={currentMetrics} />
                    <KpiGrid metrics={currentMetrics} summary={summary} timeRange={timeRange} />
                </div>

                {/* PESTAÑA 2: ANÁLISIS */}
                <div className={activeTab === 'analytics' ? 'block space-y-6' : 'hidden'}>
                    <div className="h-[300px]"><EvolutionChart data={chartData} /></div>
                    <div className="h-[300px]"><DistributionChart distribution={distribution} total={summary.count} /></div>
                    <div className="h-[350px]"><ActivityCalendar activities={activities} /></div>
                </div>

                {/* PESTAÑA 3: DIARIO */}
                <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        <Plus size={18} /> Añadir Actividad Manual
                    </button>
                    <div className="h-[calc(100vh-200px)]">
                        {/* AÑADIDO: onDelete */}
                        <HistoryList activities={filteredData} onDelete={deleteActivity} />
                    </div>
                </div>
                {/* PESTAÑA 4: PLANIFICADOR */}
                <div className={activeTab === 'planner' ? 'block' : 'hidden'}>
                    <SeasonPlanner currentMetrics={currentMetrics} 
                      activities={activities} // Necesario para el Oráculo
                    />
                </div>
            </div>

            {/* --- LAYOUT ESCRITORIO --- */}
            <div className="hidden md:block space-y-6">
                <FitnessStatus metrics={currentMetrics} />
                <KpiGrid metrics={currentMetrics} summary={summary} timeRange={timeRange} />
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8 h-[300px]"><EvolutionChart data={chartData} /></div>
                    <div className="col-span-4 h-[300px]"><DistributionChart distribution={distribution} total={summary.count} /></div>
                </div>
                <div className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-8 grid grid-cols-2 gap-6">
                        <div className="min-h-[350px]"><SmartCoach metrics={currentMetrics} /></div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 min-h-[350px] transition-colors">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Calendario</h3>
                            <ActivityCalendar activities={activities} />
                        </div>
                    </div>
                    <div className="col-span-4 h-[607px]">
                         {/* AÑADIDO: onDelete */}
                        <HistoryList activities={filteredData} onDelete={deleteActivity} />
                    </div>
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Planificador de Temporada</h2>
                    <SeasonPlanner currentMetrics={currentMetrics} 
                      activities={activities} // Necesario para el Oráculo
                    />
                </div>
            </div>

          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <AddActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchActivities} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onUpdate={fetchProfile} currentSettings={settings} onAnalyze={analyzeHistory} />

    </div>
  );
};

export default Dashboard;