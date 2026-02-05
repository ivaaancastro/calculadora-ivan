import React, { useRef } from 'react';
import { Upload, Trash2, UserCircle, Plus, RefreshCw, Activity } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';

export const Navbar = ({ 
  activities, 
  uploading, 
  handleClearDb, 
  onFileUpload, 
  onAddClick, 
  onProfileClick, 
  isStravaConnected, 
  onSync 
}) => {
  const fileInputRef = useRef(null);

  return (
    <nav className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4 md:gap-0 shadow-sm">
      
      {/* LOGOTIPO / TÍTULO */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-900 text-white p-2 rounded-xl">
            <Activity size={20} />
        </div>
        <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">FORMA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Analytics</p>
        </div>
      </div>
      
      {/* BOTONERA DE ACCIONES */}
      <div className="flex items-center gap-3">
        
        {/* 1. BOTÓN STRAVA (INTELIGENTE) */}
        {isStravaConnected ? (
            <button 
                onClick={onSync}
                disabled={uploading}
                className="bg-orange-50 text-[#FC4C02] hover:bg-orange-100 border border-orange-100 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition text-sm shadow-sm"
            >
                <RefreshCw size={18} className={uploading ? "animate-spin" : ""} />
                {uploading ? 'Sync...' : 'Sincronizar'}
            </button>
        ) : (
            <StravaConnect />
        )}

        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

        {/* 2. SUBIR CSV (LEGACY) */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} 
            accept=".csv" 
            className="hidden" 
        />
        <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
            title="Importar CSV Manual"
        >
            <Upload size={20}/>
        </button>

        {/* 3. AÑADIR MANUAL */}
        <button 
            onClick={onAddClick} 
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Añadir Actividad Manual"
        >
            <Plus size={20}/>
        </button>

        {/* 4. BORRAR DATOS */}
        <button 
            onClick={handleClearDb} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Borrar Base de Datos"
        >
            <Trash2 size={20}/>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

        {/* 5. PERFIL DE USUARIO */}
        <button 
            onClick={onProfileClick} 
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition"
        >
            <div className="bg-white p-1 rounded-full shadow-sm">
                <UserCircle size={20} className="text-slate-700"/>
            </div>
            <span className="text-xs font-bold text-slate-700 pr-1">Perfil</span>
        </button>
      </div>
    </nav>
  );
};