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
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 px-2">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-transparent'}`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};