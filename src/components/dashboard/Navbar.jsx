import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity, Settings, Moon, Sun, LogOut, LayoutDashboard, Calendar, List, HeartPulse, BarChart3 } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../supabase';

export const Navbar = ({
   uploading, handleClearDb, onFileUpload,
  onAddClick, isStravaConnected, onSync
}) => {
  const fileInputRef = useRef(null);
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/stats', label: 'Rendimiento', icon: BarChart3 },
    { path: '/calendar', label: 'Calendario', icon: Calendar },
    { path: '/history', label: 'Actividades', icon: List },
    { path: '/health', label: 'Salud', icon: HeartPulse },
  ];

  return (
    <nav className="glass-nav px-3.5 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2.5 sm:pb-3 sticky top-0 z-40 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto mt-0.5 md:mt-0">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 active:scale-95 transition-all">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center text-left">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Forma<span className="text-blue-500">Lab</span></h1>
            <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hidden lg:block mt-0.5">Performance</p>
          </div>
        </Link>

        {/* PAGE TABS — Desktop Segmented Control */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-full p-1 shadow-inner">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '');
              return (
                <Link key={tab.path} to={tab.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive
                    ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}>
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 active:scale-90 transition-all" title="Cambiar tema">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isStravaConnected ? (
            <button onClick={onSync} disabled={uploading} className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 font-semibold py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs">
              <RefreshCw size={13} className={uploading ? "animate-spin" : ""} />
              <span className={uploading ? "hidden" : "hidden sm:inline"}>Sincronizar</span>
            </button>
          ) : (
            <div className="scale-90 sm:scale-100 origin-right">
              <StravaConnect />
            </div>
          )}

          <div className="hidden md:flex items-center gap-1">
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors" title="Importar CSV">
              <Upload size={16} />
            </button>

            <button onClick={onAddClick} className="p-2 text-slate-400 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors" title="Añadir Manual">
              <Plus size={16} />
            </button>

            <button onClick={handleClearDb} className="p-2 text-slate-400 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors" title="Borrar DB">
              <Trash2 size={16} />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>

            <Link to="/profile" className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-full transition-colors">
              <UserCircle size={18} className="text-slate-500 dark:text-zinc-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 hidden lg:inline">Perfil</span>
            </Link>

            <button onClick={handleLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-red-400" title="Cerrar Sesión">
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile-only buttons with Apple round touch targets */}
          <Link to="/profile" className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 active:scale-90 transition-all" title="Ajustes / Perfil">
            <Settings size={18} />
          </Link>

          <button onClick={handleLogout} className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-red-500/80 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 active:scale-90 transition-all" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};