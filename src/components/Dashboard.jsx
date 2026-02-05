import React, { useState } from 'react';
import { Loader2, FileText } from 'lucide-react';

// Subimos un nivel para encontrar el hook
import { useActivities } from '../hooks/useActivities';

// Componentes del Dashboard
import { Navbar } from './dashboard/Navbar';
import { KpiGrid } from './dashboard/KpiGrid';
import { EvolutionChart } from './dashboard/EvolutionChart';
import { DistributionChart } from './dashboard/DistributionChart';
import { HistoryList } from './dashboard/HistoryList';
import { SmartCoach } from './dashboard/SmartCoach';
import ActivityCalendar from './dashboard/ActivityCalendar';
import { FitnessStatus } from './dashboard/FitnessStatus';

// Modales
import AddActivityModal from './modals/AddActivityModal';
import ProfileModal from './modals/ProfileModal';

const Dashboard = () => {
  const { 
    activities, loading, uploading, uploadStatus, timeRange, settings,
    setTimeRange, handleClearDb, processFile, fetchActivities, fetchProfile, 
    analyzeHistory,
    filteredData, currentMetrics, chartData, distribution, summary,
    // Nuevas props de Strava
    isStravaConnected, handleStravaSync 
  } = useActivities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Pantalla de carga inicial
  if (loading && !uploading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40}/>
      <p className="text-slate-400 font-medium text-sm animate-pulse">Cargando métricas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      
      {/* NAVBAR: Le pasamos el estado de Strava */}
      <Navbar 
        activities={activities}
        uploading={uploading}
        handleClearDb={handleClearDb}
        onFileUpload={processFile}
        onAddClick={() => setIsModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
        isStravaConnected={isStravaConnected} // <--- Nuevo
        onSync={handleStravaSync}             // <--- Nuevo
      />

      {/* STATUS BAR (Notificaciones de carga) */}
      {uploadStatus && (
        <div className="bg-blue-600 text-white text-center py-2 text-xs font-bold uppercase animate-in slide-in-from-top sticky top-[73px] z-40">
          {uploadStatus}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {activities.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-2xl mx-auto mt-10">
              <FileText size={60} className="mx-auto text-slate-300 mb-4"/>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Sin datos</h2>
              <p className="text-slate-500 mb-6">Conecta Strava, importa un CSV o añade un entreno manual para empezar.</p>
           </div>
        ) : (
          <>
            {/* 1. FILTROS DE TIEMPO */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                {['30d', '90d', '1y', 'all'].map(r => (
                    <button 
                      key={r} 
                      onClick={() => setTimeRange(r)} 
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition whitespace-nowrap uppercase tracking-wider ${timeRange === r ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                    >
                        {r === 'all' ? 'Todo' : r.replace('d', ' Días').replace('y', ' Año')}
                    </button>
                ))}
            </div>

            {/* 2. ANÁLISIS PERSONAL (Coach IA & Niveles) */}
            <FitnessStatus metrics={currentMetrics} />

            {/* 3. KPIs GLOBALES */}
            <KpiGrid metrics={currentMetrics} summary={summary} timeRange={timeRange} />
            
            {/* 4. GRÁFICOS SUPERIORES (Evolución y Distribución) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Evolución (Más ancho) */}
                <div className="lg:col-span-8 min-h-[250px]">
                    <EvolutionChart data={chartData} />
                </div>
                {/* Distribución (Más estrecho) */}
                <div className="lg:col-span-4 min-h-[250px]">
                    <DistributionChart distribution={distribution} total={summary.count} />
                </div>
            </div>

            {/* 5. ZONA INFERIOR DE ANÁLISIS DETALLADO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMNA IZQUIERDA (Análisis Visual) */}
                <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 gap-6">
                    
                    {/* Fila: Mapa de Esfuerzo + Calendario */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                        
                        {/* SMART COACH (Consejos) */}
                        <div className="min-h-[350px]"> 
                            <SmartCoach metrics={currentMetrics} />
                        </div>
                        
                        {/* CALENDARIO DE ACTIVIDAD */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col min-h-[350px]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Calendario de Actividad</h3>
                            <div className="flex-1">
                                <ActivityCalendar activities={activities} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA (Lista Vertical Historial) */}
                <div className="lg:col-span-5 xl:col-span-4 h-full">
                    <div className="h-[725px] lg:h-full lg:max-h-[725px]"> 
                        <HistoryList activities={filteredData} />
                    </div>
                </div>
            </div>
          </>
        )}
      </main>

      {/* --- MODALES --- */}
      <AddActivityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchActivities} 
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpdate={fetchProfile} 
        currentSettings={settings}
        onAnalyze={analyzeHistory} 
      />

    </div>
  );
};

export default Dashboard;