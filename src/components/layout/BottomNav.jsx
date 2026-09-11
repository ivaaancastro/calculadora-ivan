import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Calendar, HeartPulse, Search } from 'lucide-react';

export const BottomNav = ({ activeIndex, onTabChange }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // En la vista de detalle de actividad no mostramos la barra flotante para dar 100% de pantalla a los gráficos y mapa
  if (currentPath.startsWith('/activity/')) {
    return null;
  }

  // Las 4 pestañas de navegación contenidas en la cápsula principal Liquid Glass
  const capsuleTabs = [
    { path: '/', icon: Home, label: 'Inicio', index: 0 },
    { path: '/stats', icon: BarChart3, label: 'Forma', index: 1 },
    { path: '/calendar', icon: Calendar, label: 'Calendario', index: 2 },
    { path: '/health', icon: HeartPulse, label: 'Salud', index: 3 },
  ];

  // Pestaña satélite independiente (Búsqueda / Registro de Actividades)
  const isSearchActive = activeIndex !== undefined ? activeIndex === 4 : currentPath === '/history';

  const handleTabClick = (e, path, index) => {
    if (onTabChange) {
      e.preventDefault();
      onTabChange(index, path);
    }
  };

  return (
    <nav
      aria-label="Navegación móvil flotante estilo Apple"
      className="md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 flex items-center justify-center pointer-events-none px-3 select-none"
    >
      <div className="flex items-center gap-2 pointer-events-auto max-w-full">
        {/* CÁPSULA PRINCIPAL LIQUID GLASS */}
        <div className="liquid-glass rounded-full h-[54px] p-1 flex items-center gap-0.5 shadow-2xl transition-all duration-300">
          {capsuleTabs.map((tab) => {
            const isActive = activeIndex !== undefined
              ? activeIndex === tab.index
              : currentPath === tab.path || (tab.path === '/' && currentPath === '');
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={(e) => handleTabClick(e, tab.path, tab.index)}
                className={`flex flex-col items-center justify-center h-[46px] px-3.5 rounded-full transition-all duration-200 select-none touch-manipulation touch-callout-none active:scale-95 ${
                  isActive
                    ? 'liquid-glass-active text-[#007AFF] dark:text-[#0A84FF]'
                    : 'text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.6 : 1.9}
                  className={`transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}
                />
                <span
                  className={`text-[9.5px] tracking-tight leading-none mt-1 transition-all ${
                    isActive
                      ? 'font-bold text-[#007AFF] dark:text-[#0A84FF]'
                      : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* BOTÓN SATÉLITE FLOTANTE LIQUID GLASS (BÚSQUEDA) */}
        <Link
          to="/history"
          aria-label="Buscar actividades"
          onClick={(e) => handleTabClick(e, '/history', 4)}
          className={`liquid-glass w-[54px] h-[54px] rounded-full flex items-center justify-center shrink-0 shadow-2xl transition-transform active:scale-90 select-none touch-manipulation touch-callout-none ${
            isSearchActive
              ? 'liquid-glass-active text-[#007AFF] dark:text-[#0A84FF]'
              : 'text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'
          }`}
        >
          <Search
            size={21}
            strokeWidth={isSearchActive ? 2.7 : 2}
            className={`transition-transform duration-200 ${isSearchActive ? 'scale-110' : ''}`}
          />
        </Link>
      </div>
    </nav>
  );
};