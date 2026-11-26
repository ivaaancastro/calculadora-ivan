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
                            data-health="day"
                            type="button"
                            onClick={() => setSelectedDate(d.date)}
                            className={`shrink-0 flex flex-col items-center justify-between w-14 sm:w-16 min-h-[64px] py-2.5 px-1 rounded-xl bg-sunken shadow-inset-line transition-paint select-none active:scale-press motion-safe:animate-rise-slow ${
                                isSelected
                                    ? 'text-white'
                                    : 'text-body'
                            }`}
                        >
                            <span className={`text-2xs font-bold uppercase tracking-[0.05em] ${isSelected ? 'text-blue-100' : 'text-ink-4'}`}>
                                {d.weekday}
                            </span>
                            <span className="text-base sm:text-lg font-semibold tracking-[-0.02em] tabular-nums my-0.5">
                                {d.dayNum}
                            </span>
                            {/* Punto indicador de recuperación */}
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : d.recoveryInfo.dot}`} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </Card>
    </>
);
