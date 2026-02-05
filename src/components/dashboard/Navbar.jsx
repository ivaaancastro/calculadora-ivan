import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity, Settings, Moon, Sun } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { useTheme } from '../../hooks/useTheme'; // <--- IMPORTAMOS EL HOOK

export const Navbar = ({ 
  activities, uploading, handleClearDb, onFileUpload, 
  onAddClick, onProfileClick, isStravaConnected, onSync 
}) => {
  const fileInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme(); // <--- USAMOS EL HOOK

  return (
    // AÑADIMOS dark:bg-slate-900 dark:border-slate-800
    <nav className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-40 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 dark:bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-slate-200 dark:shadow-none transition-colors">
              <Activity size={20} />
          </div>
          <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none transition-colors">FORMA</h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">Performance Analytics</p>
          </div>
        </div>
        
        {/* ACCIONES */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* BOTÓN DARK MODE */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-yellow-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* BOTÓN STRAVA */}
          {isStravaConnected ? (
              <button 
                  onClick={onSync}
                  disabled={uploading}
                  className="bg-orange-50 dark:bg-orange-900/20 text-[#FC4C02] hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100 dark:border-orange-900/50 font-bold py-2 px-3 sm:px-4 rounded-xl flex items-center gap-2 transition text-xs sm:text-sm shadow-sm active:scale-95"
              >
                  <RefreshCw size={16} className={uploading ? "animate-spin" : ""} />
                  <span className={uploading ? "hidden" : "hidden sm:inline"}>Sincronizar</span>
              </button>
          ) : (
              <div className="scale-90 sm:scale-100 origin-right">
                <StravaConnect />
              </div>
          )}

          {/* HERRAMIENTAS DE ESCRITORIO */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition" title="Importar CSV">
                <Upload size={20}/>
            </button>

            <button onClick={onAddClick} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Añadir Manual">
                <Plus size={20}/>
            </button>

            <button onClick={handleClearDb} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Borrar DB">
                <Trash2 size={20}/>
            </button>
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            
            <button onClick={onProfileClick} className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition">
                <div className="bg-white dark:bg-slate-600 p-1 rounded-full shadow-sm">
                    <UserCircle size={20} className="text-slate-700 dark:text-slate-200"/>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 pr-1">Perfil</span>
            </button>
          </div>

          <button onClick={onProfileClick} className="md:hidden p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
             <Settings size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
};