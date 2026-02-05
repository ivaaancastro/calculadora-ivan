import React from 'react';
import { Info } from 'lucide-react';

export const InfoTooltip = ({ text }) => {
  return (
    <div className="group relative inline-block ml-1.5 align-middle cursor-help z-10">
      <Info size={14} className="text-slate-300 hover:text-blue-500 transition-colors" />
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] leading-tight rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
        {text}
        {/* Triangulito abajo */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};