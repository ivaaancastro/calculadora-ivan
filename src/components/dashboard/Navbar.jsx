import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity, Settings, Moon, Sun, LogOut, LayoutDashboard, Calendar, List, HeartPulse, BarChart3 } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../supabase';

export const Navbar = ({
  activities, uploading, handleClearDb, onFileUpload,
  onAddClick, onProfileClick, isStravaConnected, onSync,
  activeTab, onTabChange
}) => {
  const fileInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stats', label: 'Rendimiento', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'history', label: 'Actividades', icon: List },
    { id: 'health', label: 'Salud', icon: HeartPulse },
  ];

  return (
    <nav className="glass-nav px-4 sm:px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 sticky top-0 z-40 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto mt-1 md:mt-0">

        {/* LOGO */}
        <button onClick={() => onTabChange('overview')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center text-left">
            <h1 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight leading-none">Forma<span className="text-blue-500">Lab</span></h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 hidden lg:block mt-0.5">Performance</p>
          </div>
        </button>

        {/* PAGE TABS — Desktop Segmented Control */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-xl p-1 shadow-inner">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow hover:shadow-md'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}>
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          <button onClick={toggleTheme} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isStravaConnected ? (
            <button onClick={onSync} disabled={uploading} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-medium py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-colors text-xs">
              <RefreshCw size={14} className={uploading ? "animate-spin" : ""} />
              <span className={uploading ? "hidden" : "hidden lg:inline"}>Sincronizar</span>
            </button>
          ) : (
            <div className="scale-90 sm:scale-100 origin-right">
              <StravaConnect />
            </div>
          )}

          <div className="hidden md:flex items-center gap-1">
            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5"></div>

            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" title="Importar CSV">
              <Upload size={16} />
            </button>

            <button onClick={onAddClick} className="p-1.5 text-slate-400 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors" title="Añadir Manual">
              <Plus size={16} />
            </button>

            <button onClick={handleClearDb} className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors" title="Borrar DB">
              <Trash2 size={16} />
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5"></div>

            <button onClick={onProfileClick} className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors">
              <UserCircle size={18} className="text-slate-500 dark:text-zinc-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 hidden lg:inline">Perfil</span>
            </button>

            <button onClick={handleLogout} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-400" title="Cerrar Sesión">
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile-only buttons */}
          <button onClick={onProfileClick} className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100">
            <Settings size={18} />
          </button>

          <button onClick={handleLogout} className="md:hidden p-1.5 text-red-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};