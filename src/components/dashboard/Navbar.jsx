import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity, Settings } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';

export const Navbar = ({ 
  activities, uploading, handleClearDb, onFileUpload, 
  onAddClick, onProfileClick, isStravaConnected, onSync 
}) => {
  const fileInputRef = useRef(null);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 sticky top-0 z-40 transition-all">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg shadow-slate-200">
              <Activity size={20} />
          </div>
          <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">FORMA</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Performance Analytics</p>
          </div>
        </div>
        
        {/* ACCIONES */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* BOTÓN STRAVA (Visible siempre, pero compacto en móvil) */}
          {isStravaConnected ? (
              <button 
                  onClick={onSync}
                  disabled={uploading}
                  className="bg-orange-50 text-[#FC4C02] hover:bg-orange-100 border border-orange-100 font-bold py-2 px-3 sm:px-4 rounded-xl flex items-center gap-2 transition text-xs sm:text-sm shadow-sm active:scale-95"
              >
                  <RefreshCw size={16} className={uploading ? "animate-spin" : ""} />
                  <span className={uploading ? "hidden" : "hidden sm:inline"}>Sincronizar</span>
                  {uploading && <span>Sync...</span>}
              </button>
          ) : (
              <div className="scale-90 sm:scale-100 origin-right">
                <StravaConnect />
              </div>
          )}

          {/* HERRAMIENTAS DE ESCRITORIO (Ocultas en móvil 'hidden md:flex') */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition" title="Importar CSV">
                <Upload size={20}/>
            </button>

            <button onClick={onAddClick} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Añadir Manual">
                <Plus size={20}/>
            </button>

            <button onClick={handleClearDb} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Borrar DB">
                <Trash2 size={20}/>
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <button onClick={onProfileClick} className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition">
                <div className="bg-white p-1 rounded-full shadow-sm"><UserCircle size={20} className="text-slate-700"/></div>
                <span className="text-xs font-bold text-slate-700 pr-1">Perfil</span>
            </button>
          </div>

          {/* MENÚ MÓVIL (Solo Settings, el resto va abajo) */}
          <button onClick={onProfileClick} className="md:hidden p-2 text-slate-400 hover:text-slate-700">
             <Settings size={22} />
          </button>

        </div>
      </div>
    </nav>
  );
};