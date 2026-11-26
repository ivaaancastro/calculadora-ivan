import React, { useLayoutEffect, useRef } from 'react';

/**
 * Tira de días del periodo; va dentro del bloque de tendencia, bajo el gráfico. Arranca
 * desplazada al final para que el día de hoy se vea sin tener que deslizar.
 */
export const HistoryDayStrip = ({ currentSelectedDay, historySeries, setSelectedDate }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
    }, [historySeries.length]);
    return (
    <div ref={ref} role="group" aria-label="Día" className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-0.5">
        {historySeries.map((d) => {
            const isSelected = currentSelectedDay?.date === d.date;
            return (
                <button
                    key={d.date}
                    data-health="day"
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(d.date)}
                    className={`shrink-0 md:shrink md:flex-1 flex flex-col items-center justify-between w-12 md:w-auto md:min-w-[48px] min-h-[64px] py-2 rounded-xl transition-paint select-none active:scale-press ${
                        isSelected ? 'bg-ink text-surface' : 'bg-sunken shadow-inset-line text-body hover:text-ink'
                    }`}
                >
                    <span className={`text-2xs font-bold uppercase tracking-[0.05em] ${isSelected ? 'opacity-70' : 'text-ink-4'}`}>{d.weekday}</span>
                    <span className="text-base font-semibold tracking-[-0.02em] tabular-nums">{d.dayNum}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${d.recoveryInfo.dot}`} aria-hidden="true" />
                </button>
            );
        })}
    </div>
    );
};
