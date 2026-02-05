// En src/components/dashboard/Navbar.jsx
import React, { useRef } from 'react';
import { Activity, Upload, Loader2, Trash2, Plus, UserCircle } from 'lucide-react'; // Importar UserCircle

export const Navbar = ({ activities, uploading, handleClearDb, onFileUpload, onAddClick, onProfileClick }) => {
  const fileRef = useRef(null);
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm/50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Lado Izquierdo: Logo + Perfil */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl"><Activity size={20} /></div>
            <h1 className="text-lg font-bold hidden sm:block">Ivan<span className="text-blue-600">Performance</span></h1>
          </div>
          
          {/* Botón Perfil */}
          <button onClick={onProfileClick} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition border border-slate-200">
            <UserCircle size={16}/>
            <span className="hidden sm:inline">Perfil</span>
          </button>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center gap-3">
          {/* ... resto de botones igual ... */}
          {activities.length > 0 && (
            <button onClick={handleClearDb} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
          )}
          <input type="file" ref={fileRef} onChange={(e) => onFileUpload(e.target.files[0])} className="hidden" accept=".csv"/>
          <button onClick={() => fileRef.current.click()} disabled={uploading} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            {uploading ? <Loader2 className="animate-spin"/> : <Upload size={20}/>}
          </button>
          <button onClick={onAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200">
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>
    </nav>
  );
};