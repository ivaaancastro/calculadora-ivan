import React from 'react';
import { LayoutDashboard, BarChart2, History, User, Calendar } from 'lucide-react';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
    { id: 'analytics', label: 'Análisis', icon: BarChart2 },
    { id: 'history', label: 'Diario', icon: History },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'planner', label: 'Plan', icon: Calendar },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-2 pb-safe md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center gap-1 p-2 transition-all duration-300 relative"
            >
              {/* Indicador activo animado */}
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-800 dark:bg-white rounded-b-full transition-all" />
              )}
              
              <div className={`${isActive ? 'text-slate-800 dark:text-white -translate-y-1' : 'text-slate-400 dark:text-slate-600'} transition-transform duration-300`}>
                <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-slate-800 dark:text-white opacity-100' : 'text-slate-400 dark:text-slate-600 opacity-0 hidden'} transition-all duration-300`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};