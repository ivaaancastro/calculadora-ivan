import React from 'react';
import { HelpCircle } from 'lucide-react';

export const InfoTooltip = ({ text }) => {
  return (
    <div className="group relative inline-block ml-1 align-middle cursor-help z-50">
      <HelpCircle size={11} className="text-slate-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors opacity-70" />
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white dark:text-zinc-100 text-[10px] leading-snug rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-left border border-white/10">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-900/95 dark:border-t-zinc-800/95"></div>
      </div>
    </div>
  );
};