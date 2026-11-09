import React from 'react';
import { formatMinsToHMM } from '../../utils/formatters';

export const PillTab = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 transition-all duration-200 select-none active:scale-95 ${active 
            ? 'bg-surface-4 text-ink shadow-xs font-bold' 
            : 'text-ink-3 hover:text-ink-2-soft'}`}
    >
        {label}
    </button>
);

export const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;
        let displayValue = payload[0].value;
        let displayUnit = unit;

        if (unit.trim() === "min") {
            displayValue = formatMinsToHMM(payload[0].value);
            displayUnit = "";
        }
        
        return (
            <div className="bg-zinc-900/95 border border-zinc-700/80 p-2 rounded-lg shadow-2xl text-[10px] font-bold text-zinc-100 min-w-[90px] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 uppercase tracking-widest text-[8px]">{label || 'Métrica'}</span>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-white text-xs">{displayValue}</span>
                        <span className="text-[8px] text-zinc-500 font-medium">{displayUnit}</span>
                    </div>
                </div>
                {data?.range && (
                    <p className="mt-1 text-[8px] text-zinc-400 font-medium opacity-60 italic">{data.range}</p>
                )}
            </div>
        );
    }
    return null;
};
