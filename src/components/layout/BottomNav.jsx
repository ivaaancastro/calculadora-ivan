import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, HeartPulse, BarChart3 } from 'lucide-react';
export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // En la vista de detalle de actividad no mostramos la barra inferior para dar 100% de pantalla a los gráficos y mapa
  if (currentPath.startsWith('/activity/')) {
    return null;
  }

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/stats', icon: BarChart3, label: 'Rendimiento' },
    { path: '/calendar', icon: Calendar, label: 'Calendario' },
    { path: '/health', icon: HeartPulse, label: 'Salud' },
    { path: '/history', icon: List, label: 'Lista' }
  ];

  return (
    <nav 
      aria-label="Navegación principal móvil"
      className="md:hidden fixed bottom-0 left-0 w-full glass-nav border-t border-slate-200/60 dark:border-zinc-800/80 pb-safe px-safe z-50 transition-transform duration-300"
    >
      <div className="flex justify-around items-center h-14 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === '/' && currentPath === '');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-90 select-none touch-manipulation touch-callout-none relative ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                isActive ? 'bg-blue-50 dark:bg-blue-500/15' : 'bg-transparent'
              }`}>
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} 
                />
              </div>
              <span className={`text-[10px] tracking-tight transition-all ${
                isActive ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};