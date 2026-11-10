import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Trash2, Plus, RefreshCw, Activity, Moon, Sun, LogOut, 
  LayoutDashboard, Calendar, List, HeartPulse, BarChart3, 
  Heart, Link2, Lock, ChevronDown, ChevronRight, User 
} from 'lucide-react';
import StravaConnect from '../common/StravaConnect';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../supabase';

export const Navbar = ({
   settings, uploading, handleClearDb, onFileUpload,
   onAddClick, isStravaConnected, onSync
}) => {
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cierre del menú al hacer clic fuera o presionar escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

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

  const handleNavigateSection = (sectionId) => {
    setIsMenuOpen(false);
    navigate(`/profile?section=${sectionId}`);
  };

  const configOptions = [
    { id: 'general', label: 'General', desc: 'Perfil, peso, FC reposo y CTL', icon: Activity, color: 'text-section-general bg-section-general/15' },
    { id: 'zones', label: 'Zonas y Umbrales', desc: 'Carrera, ciclismo, FC y ritmos', icon: Heart, color: 'text-section-zones bg-section-zones/15' },
    { id: 'integrations', label: 'Cuentas Conectadas', desc: 'Intervals.icu y sincronización', icon: Link2, color: 'text-section-integrations bg-section-integrations/15' },
    { id: 'security', label: 'Seguridad y Datos', desc: 'Contraseña y Deep Sync', icon: Lock, color: 'text-section-security bg-section-security/15' },
  ];

  const tabs = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/stats', label: 'Rendimiento', icon: BarChart3 },
    { path: '/calendar', label: 'Calendario', icon: Calendar },
    { path: '/history', label: 'Actividades', icon: List },
    { path: '/health', label: 'Salud', icon: HeartPulse },
  ];

  return (
    <nav className="glass-nav px-3.5 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2.5 sm:pb-3 sticky top-0 z-nav transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1800px] mx-auto mt-0.5 md:mt-0">

        {/* FOTO DE PERFIL / TRIGGER MENÚ CONFIGURACIÓN */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 active:scale-95 transition-all group select-none touch-manipulation text-left"
            aria-label="Menú de configuración y perfil"
            aria-expanded={isMenuOpen}
          >
            {/* AVATAR CIRCULAR CON BORDE APPLE */}
            <div 
              className="rounded-full overflow-hidden bg-surface-2 border-2 border-surface-3 shadow-xs flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-blue-500/40 transition-all"
              style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
            >
              {settings?.avatarUrl ? (
                <img 
                  src={settings.avatarUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover rounded-full block pointer-events-none" 
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <User size={19} className="text-body-soft-2" />
              )}
            </div>

            {/* MARCA / NOMBRE Y CHEVRON */}
            <div className="flex flex-col justify-center text-left">
              <div className="flex items-center gap-1">
                <h1 className="text-sm sm:text-base font-bold text-ink tracking-tight leading-none">
                  Forma
                </h1>
                <ChevronDown 
                  size={13} 
                  className={`text-ink-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-action-bright' : 'group-hover:text-body'}`} 
                />
              </div>
              <p className="text-[10px] font-medium text-ink-4 truncate max-w-[110px] sm:max-w-[160px] leading-tight mt-0.5">
                {settings?.fullName || 'Ajustes'}
              </p>
            </div>
          </button>

          {/* LIQUID GLASS APPLE CONFIGURATION POPOVER */}
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2.5 w-72 sm:w-80 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden z-nav-menu animate-in fade-in zoom-in-95 duration-150">
              {/* CABECERA CON PERFIL */}
              <div className="p-3.5 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center gap-3">
                <div 
                  className="rounded-full overflow-hidden bg-surface-2 border border-black/10 dark:border-white/10 shrink-0"
                  style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px' }}
                >
                  {settings?.avatarUrl ? (
                    <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full block" />
                  ) : (
                    <User size={22} className="text-slate-500 w-full h-full p-2" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-ink truncate leading-tight">
                    {settings?.fullName || 'Atleta Forma'}
                  </p>
                  <p className="text-[11px] text-ink-4 truncate mt-0.5">
                    {settings?.email || 'Ajustes del perfil'}
                  </p>
                </div>
              </div>

              {/* OPCIONES DE CONFIGURACIÓN */}
              <div className="p-1.5 space-y-0.5">
                <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold text-ink-4 uppercase tracking-wider">
                  Vistas de Configuración
                </div>
                {configOptions.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleNavigateSection(opt.id)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-fill active:scale-[0.98] transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-[8px] ${opt.color} flex items-center justify-center shrink-0`}>
                          <Icon size={15} strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-soft group-hover:text-action transition-colors">
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-ink-4 truncate">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-faint group-hover:text-ink-3 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>

              {/* PIE CON CERRAR SESIÓN */}
              <div className="p-1.5 border-t border-black/[0.05] dark:border-white/[0.08]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-danger-ink hover:bg-danger-tint-2 active:scale-[0.98] transition-all text-left text-xs font-semibold"
                >
                  <div className="w-7 h-7 rounded-[8px] bg-danger/10 text-danger-ink flex items-center justify-center shrink-0">
                    <LogOut size={15} strokeWidth={2.3} />
                  </div>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PAGE TABS — Desktop Segmented Control */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-full p-1 shadow-inner">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '');
              return (
                <Link key={tab.path} to={tab.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive
                    ? 'bg-surface-4 text-ink shadow-xs'
                    : 'text-ink-3 hover:text-ink-2-soft'
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

          <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full text-ink-3 hover:text-ink-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 active:scale-90 transition-all" title="Cambiar tema">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isStravaConnected ? (
            <button onClick={onSync} disabled={uploading} className="bg-action-bright/10 text-action hover:bg-action-bright/20 active:scale-95 font-semibold py-1.5 px-3 rounded-full flex items-center gap-1.5 transition-all text-xs">
              <RefreshCw size={13} className={uploading ? "animate-spin" : ""} />
              <span className={uploading ? "hidden" : "hidden sm:inline"}>Sincronizar</span>
            </button>
          ) : (
            <div className="scale-90 sm:scale-100 origin-right">
              <StravaConnect />
            </div>
          )}

          {/* Desktop utility buttons */}
          <div className="hidden md:flex items-center gap-1">
            <div className="h-4 w-px bg-fill-2 mx-1"></div>

            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && onFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-fill-8 transition-colors" title="Importar CSV">
              <Upload size={16} />
            </button>

            <button onClick={onAddClick} className="p-2 text-ink-4-flat hover:text-action-2 rounded-full hover:bg-fill-8 transition-colors" title="Añadir Manual">
              <Plus size={16} />
            </button>

            <button onClick={handleClearDb} className="p-2 text-ink-4-flat hover:text-danger-ink-2 rounded-full hover:bg-fill-8 transition-colors" title="Borrar DB">
              <Trash2 size={16} />
            </button>

            <div className="h-4 w-px bg-fill-2 mx-1"></div>

            <button onClick={handleLogout} className="p-2 hover:bg-danger-tint rounded-full transition-colors text-danger-light" title="Cerrar Sesión">
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile logout button (the settings wheel button has been removed as requested) */}
          <button onClick={handleLogout} className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-danger/80 hover:text-danger bg-danger/10 hover:bg-danger/20 active:scale-90 transition-all" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};