import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, HeartPulse, BarChart3 } from 'lucide-react';
export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/stats', icon: BarChart3, label: 'Rendimiento' },
    { path: '/calendar', icon: Calendar, label: 'Calendario' },
    { path: '/health', icon: HeartPulse, label: 'Salud' },
    { path: '/history', icon: List, label: 'Lista' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full glass-nav border-t border-b-0 pb-safe z-50 px-2">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path === '/' && currentPath === '');
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                  ? 'text-blue-600 dark:text-blue-500'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600 dark:text-blue-500' : ''} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};