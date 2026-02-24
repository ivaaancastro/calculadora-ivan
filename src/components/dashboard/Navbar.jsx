import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity, Settings, Moon, Sun } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { useTheme } from '../../hooks/useTheme'; 

export const Navbar = ({ 
  activities, uploading, handleClearDb, onFileUpload, 
  onAddClick, onProfileClick, isStravaConnected, onSync 
}) => {
  const fileInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme(); 

  return (
    <nav className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 sticky top-0 z-40 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto">
        
        {/* LOGO PRO */}
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-1.5 rounded shadow-sm">
              <Activity size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
              <h1 className="text-sm font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none uppercase">FORMA<span className="text-blue-500">LAB</span></h1>
              <p className="text-[8px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest hidden sm:block mt-0.5">Performance Analytics</p>
          </div>
        </div>
        
        {/* ACCIONES */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <button onClick={toggleTheme} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isStravaConnected ? (
              <button onClick={onSync} disabled={uploading} className="bg-[#fc4c02]/10 text-[#fc4c02] hover:bg-[#fc4c02]/20 border border-[#fc4c02]/20 font-bold py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors text-[10px] uppercase tracking-wider">
                  <RefreshCw size={14} className={uploading ? "animate-spin" : ""} />
                  <span className={uploading ? "hidden" : "hidden sm:inline"}>Sync Strava</span>
              </button>
          ) : (
              <div className="scale-90 sm:scale-100 origin-right">
                <StravaConnect />
              </div>
          )}

          <div className="hidden md:flex items-center gap-1.5">
            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>
            
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors" title="Importar CSV">
                <Upload size={18}/>
            </button>

            <button onClick={onAddClick} className="p-1.5 text-slate-400 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors" title="Añadir Manual">
                <Plus size={18}/>
            </button>

            <button onClick={handleClearDb} className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors" title="Borrar DB">
                <Trash2 size={18}/>
            </button>
            
            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-1"></div>
            
            <button onClick={onProfileClick} className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors">
                <UserCircle size={18} className="text-slate-500 dark:text-zinc-400"/>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">Perfil</span>
            </button>
          </div>

          <button onClick={onProfileClick} className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100">
             <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};