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
      className="md:hidden fixed bottom-0 left-0 w-full ios-tab-bar pb-safe px-safe z-50 transition-all duration-300"
    >
      <div className="flex justify-around items-center h-[52px] max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === '/' && currentPath === '');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-0.5 transition-transform active:scale-90 select-none touch-manipulation touch-callout-none relative ${
                isActive
                  ? 'text-[#007AFF] dark:text-[#0A84FF]'
                  : 'text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <div className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200 ${
                isActive ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'bg-transparent'
              }`}>
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 1.8} 
                  className={`transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}
                />
              </div>
              <span className={`text-[10px] tracking-tight transition-all duration-200 mt-0.5 ${
                isActive ? 'font-semibold text-[#007AFF] dark:text-[#0A84FF]' : 'font-medium'
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