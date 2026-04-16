import React from 'react';
import { LayoutDashboard, Calendar, List, HeartPulse, BarChart3 } from 'lucide-react';
export const BottomNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Inicio' },
    { id: 'stats', icon: BarChart3, label: 'Rendimiento' },
    { id: 'calendar', icon: Calendar, label: 'Calendario' },
    { id: 'health', icon: HeartPulse, label: 'Salud' },
    { id: 'history', icon: List, label: 'Lista' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full glass-nav border-t border-b-0 pb-safe z-50 px-2">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
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