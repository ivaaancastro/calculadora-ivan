import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Plus, RefreshCw, Activity, Moon, Sun, LogOut, ChevronDown, User } from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../supabase';
import { Button } from '../ui/Button';

export const Navbar = ({
  settings, uploading, handleClearDb, onFileUpload,
  onAddClick, isStravaConnected, onSync
}) => {
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await supabase.auth.signOut();
  };

  const tabs = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
    { path: '/stats', label: 'Rendimiento', icon: BarChart3Icon },
    { path: '/calendar', label: 'Calendario', icon: CalendarIcon },
    { path: '/history', label: 'Actividades', icon: ListIcon },
    { path: '/health', label: 'Salud', icon: HeartPulseIcon },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[10] border-b border-slate-200 dark:border-zinc-800/60 bg-[#eef0f3]/85 dark:bg-[#0b0c0e]/85" aria-label="Navegación principal">
      <div className="wrap flex items-center justify-between h-[72px] px-6">
        {/* Marca (izquierda) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(prev => !prev)}
          className="flex items-center gap-3 text-left"
          aria-label="Menú de configuración y perfil"
          aria-expanded={isMenuOpen}
        >
          <div className="bg-[#1f2de6] text-white p-1.5 rounded-[8px]">
            <Activity size={16} strokeWidth={2} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#0b0c0e] dark:text-zinc-100 tracking-tight">Forma<span className="text-[#1f2de6]">Lab</span></span>
              <ChevronDown size={13} className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 truncate max-w-[160px]">
              {settings?.fullName || 'Ajustes'}
            </p>
          </div>
        </button>

        {/* Tabs de página (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '');
            return (
              <Link key={tab.path} to={tab.path} className="link text-xs font-medium px-3 py-1.5 rounded-[8px] transition-colors" onClick={() => setIsMenuOpen(false)}>
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Acciones (derecha) */}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-500 hover:text-[#0b0c0e] dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-200 dark:bg-zinc-800/60 transition-colors" title="Cambiar tema">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isStravaConnected ? (
            <button onClick={onSync} disabled={uploading} className="text-xs font-medium px-3 py-1.5 rounded-[8px] bg-[#1f2de6]/10 text-[#1f2de6] dark:text-blue-400 hover:bg-[#1f2de6]/20 transition-colors flex items-center gap-1.5">
              <RefreshCw size={13} className={uploading ? "animate-spin" : ""} />
              <span className={uploading ? "hidden" : "hidden sm:inline"}>Sincronizar</span>
            </button>
          ) : (
            <StravaConnect />
          )}

          <button onClick={onAddClick} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-500 hover:text-[#0b0c0e] dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-200 dark:bg-zinc-800/60 transition-colors" title="Añadir manual">
            <Plus size={16} />
          </button>

          <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Cerrar sesión">
            <LogOut size={16} />
          </button>

          <button onClick={() => setIsMenuOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-[8px] text-slate-500 hover:text-[#0b0c0e] dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-200 dark:bg-zinc-800/60 transition-colors" title="Perfil">
            <User size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

// Iconos locales para evitar importar todo lucide
const LayoutDashboardIcon = ({ size = 14, ...props }) => (
  <svg size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect width="3" height="3" x="3" y="3" rx="1" /><rect width="3" height="3" x="17" y="3" rx="1" /><rect width="3" height="3" x="17" y="17" rx="1" /><rect width="3" height="3" x="3" y="17" rx="1" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);
const BarChart3Icon = ({ size = 14, ...props }) => (
  <svg size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const CalendarIcon = ({ size = 14, ...props }) => (
  <svg size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ListIcon = ({ size = 14, ...props }) => (
  <svg size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const HeartPulseIcon = ({ size = 14, ...props }) => (
  <svg size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M21 12.79A9 9 0 0 1 11 21 5 5 0 0 1 3 11a5 5 0 0 1 6.17-2.17L9 12l4 4 4.42-4.42a2 2 0 0 1 2.58-.39M5 13l4 4 4-4" />
  </svg>
);
