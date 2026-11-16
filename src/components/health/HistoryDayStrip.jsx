import React from 'react';
import { Card } from '../ui';

export const HistoryDayStrip = ({ currentSelectedDay, historySeries, setSelectedDate }) => (
    <>
        <Card className="p-3 sm:p-4 overflow-hidden">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-0.5">
                {historySeries.map((d) => {
                    const isSelected = currentSelectedDay?.date === d.date;
                    return (
                        <button
                            key={d.date}
                            type="button"
                            onClick={() => setSelectedDate(d.date)}
                            className={`shrink-0 flex flex-col items-center justify-between w-14 sm:w-16 py-2.5 px-1 rounded-2xl transition-all select-none active:scale-95 ${
                                isSelected
                                    ? 'bg-action-solid text-white shadow-md'
                                    : 'bg-slate-100/80 dark:bg-zinc-800/60 hover:bg-slate-200/80 dark:hover:bg-zinc-700/60 text-body'
                            }`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-ink-4'}`}>
                                {d.weekday}
                            </span>
                            <span className="text-base sm:text-lg font-black font-mono tabular-nums my-0.5">
                                {d.dayNum}
                            </span>
                            {/* Punto indicador de recuperación */}
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : d.recoveryInfo.dot}`} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    </>
);
