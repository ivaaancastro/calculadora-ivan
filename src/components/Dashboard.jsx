import React, { useState } from 'react';
import { Loader2, FileText, Plus } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';

// Componentes
import { Navbar } from './dashboard/Navbar';
import { BottomNav } from './layout/BottomNav'; // <--- IMPORTANTE: Asegúrate de la ruta correcta
import { KpiGrid } from './dashboard/KpiGrid';
import { EvolutionChart } from './dashboard/EvolutionChart';
import { DistributionChart } from './dashboard/DistributionChart';
import { HistoryList } from './dashboard/HistoryList';
import { SmartCoach } from './dashboard/SmartCoach';
import ActivityCalendar from './dashboard/ActivityCalendar';
import { FitnessStatus } from './dashboard/FitnessStatus';
import AddActivityModal from './modals/AddActivityModal';
import ProfileModal from './modals/ProfileModal';

const Dashboard = () => {
  const { 
    activities, loading, uploading, uploadStatus, timeRange, settings,
    setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, 
    analyzeHistory, filteredData, currentMetrics, chartData, distribution, summary,
    isStravaConnected, handleStravaSync 
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ESTADO PARA NAVEGACIÓN MÓVIL
  const [activeTab, setActiveTab] = useState('overview'); // overview | analytics | history | profile

  // MANEJADOR DE CAMBIO DE PESTAÑA (Incluye lógica para abrir perfil)
  const handleTabChange = (tab) => {
      if (tab === 'profile') {
          setIsProfileOpen(true);
      } else {
          setActiveTab(tab);
          // Scroll al top suave al cambiar de pestaña
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  if (loading && !uploading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40}/>
      <p className="text-slate-400 font-medium text-sm animate-pulse">Cargando métricas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24 md:pb-12">
      
      {/* NAVBAR SUPERIOR */}
      <Navbar 
        activities={activities} uploading={uploading} handleClearDb={handleClearDb}
        onFileUpload={processFile} onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)} isStravaConnected={isStravaConnected}
        onSync={handleStravaSync}
      />

      {/* BARRA DE ESTADO */}
      {uploadStatus && (
        <div className="bg-blue-600 text-white text-center py-2 text-xs font-bold uppercase animate-in slide-in-from-top sticky top-[60px] z-30 shadow-md">
          {uploadStatus}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        
        {activities.length === 0 ? (
           <div className="text-center py-20 px-4">
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 max-w-md mx-auto">
                <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Empieza tu viaje</h2>
                <p className="text-slate-500 text-sm mb-6">Conecta Strava para ver tu rendimiento.</p>
              </div>
           </div>
        ) : (
          <>
            {/* FILTROS DE TIEMPO (Visible en Overview y Analytics) */}
            {(activeTab === 'overview' || activeTab === 'analytics') && (
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {['30d', '90d', '1y', 'all'].map(r => (
                        <button key={r} onClick={() => setTimeRange(r)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap uppercase tracking-wider ${timeRange === r ? 'bg-slate-900 text-white shadow-md transform scale-105' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            {r === 'all' ? 'Todo' : r.replace('d', ' Días').replace('y', ' Año')}
                        </button>
                    ))}
                </div>
            )}

            {/* --- LAYOUT MÓVIL (PESTAÑAS) --- */}
            <div className="md:hidden space-y-6">
                
                {/* PESTAÑA 1: INICIO (Resumen + Coach) */}
                <div className={activeTab === 'overview' ? 'block space-y-6' : 'hidden'}>
                    <FitnessStatus metrics={currentMetrics} />
                    <SmartCoach metrics={currentMetrics} />
                    <KpiGrid metrics={currentMetrics} summary={summary} timeRange={timeRange} />
                </div>

                {/* PESTAÑA 2: ANÁLISIS (Gráficas) */}
                <div className={activeTab === 'analytics' ? 'block space-y-6' : 'hidden'}>
                    <div className="h-[300px]"><EvolutionChart data={chartData} /></div>
                    <div className="h-[300px]"><DistributionChart distribution={distribution} total={summary.count} /></div>
                    <div className="h-[350px]"><ActivityCalendar activities={activities} /></div>
                </div>

                {/* PESTAÑA 3: DIARIO (Historial) */}
                <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                    {/* Botón Flotante para añadir manual en la vista de lista */}
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-3 mb-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-sm flex items-center justify-center gap-2">
                        <Plus size={18} /> Añadir Actividad Manual
                    </button>
                    <div className="h-[calc(100vh-200px)]">
                        <HistoryList activities={filteredData} />
                    </div>
                </div>
            </div>

            {/* --- LAYOUT ESCRITORIO (GRID COMPLETO) --- */}
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
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 min-h-[350px]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Calendario</h3>
                            <ActivityCalendar activities={activities} />
                        </div>
                    </div>
                    <div className="col-span-4 h-[725px]">
                        <HistoryList activities={filteredData} />
                    </div>
                </div>
            </div>

          </>
        )}
      </main>

      {/* BARRA INFERIOR MÓVIL */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* MODALES */}
      <AddActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchActivities} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onUpdate={fetchProfile} currentSettings={settings} onAnalyze={analyzeHistory} />

    </div>
  );
};

export default Dashboard;