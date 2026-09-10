import React from 'react';
import { Info } from 'lucide-react';
import { formatMinsToHMM } from '../../utils/formatters';

export const MetricCard = ({ label, value, unit, accent, className = '' }) => (
    <div className={`flex flex-col py-2 px-2.5 sm:px-3 bg-white dark:bg-[#1c1c1e] rounded-xl sm:rounded-2xl border border-black/[0.04] dark:border-white/[0.07] shadow-xs select-none transition-all justify-between ${className}`}>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">{label}</span>
        <div className="flex items-baseline gap-1 truncate mt-0.5">
            <span className={`text-sm sm:text-base font-bold tracking-tight tabular-nums truncate ${accent || 'text-slate-900 dark:text-white'}`}>{value}</span>
            {unit && <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 shrink-0">{unit}</span>}
        </div>
    </div>
);

export const PillTab = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 sm:px-4 py-1 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 transition-all duration-200 select-none active:scale-95 ${active 
            ? 'bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs font-bold' 
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
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

export const MetricHelp = ({ title, text, optimal }) => (
    <div className="group relative inline-block ml-1 align-middle">
        <Info size={10} className="text-slate-300 dark:text-zinc-600 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
            <p className="text-[9px] font-bold text-zinc-100 mb-1 uppercase tracking-widest">{title}</p>
            <p className="text-[9px] leading-relaxed text-zinc-400 mb-1.5">{text}</p>
            {optimal && (
                <div className="pt-1 border-t border-zinc-800 flex items-center gap-1">
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Óptimo:</span>
                    <span className="text-[8px] text-zinc-300">{optimal}</span>
                </div>
            )}
        </div>
    </div>
);
