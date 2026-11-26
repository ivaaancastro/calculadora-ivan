import React from 'react';
import {
    ChevronRight
} from 'lucide-react';
import { SectionHeader } from '../ui';

export const DailyLog = ({ currentSelectedDay, historyReversed, setSelectedDate }) => (
    <>
        <div>
            <SectionHeader as="p">Registros Diarios Detallados</SectionHeader>
            <div className="bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card transition-paint overflow-hidden divide-y divide-line-soft-3 p-0">
                {historyReversed.map((day) => {
                    const isSelected = currentSelectedDay?.date === day.date;
                    return (
                        <button
                            key={day.date}
                            data-health="log-row"
                            type="button"
                            onClick={() => setSelectedDate(day.date)}
                            className={`w-full min-h-[60px] p-3.5 sm:p-4 text-left flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${day.recoveryInfo.dot}`} />
                                <div className="min-w-0">
                                    <p className="text-xs sm:leading-5 font-bold text-ink capitalize truncate">
                                        {day.dateLabelFull}
                                    </p>
                                    <p className="text-2xs text-ink-4">
                                        {day.recoveryInfo.label} • {day.sleep ? `${day.sleep}h sueño` : 'Sin sueño registrado'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <span className={`text-sm sm:text-base font-bold font-mono tabular-nums ${day.recoveryInfo.color}`}>
                                        {day.readinessScore}%
                                    </span>
                                    <div className="flex items-center gap-2 text-2xs text-slate-400 tabular-nums">
                                        {day.rhr > 0 && <span>{day.rhr} lpm</span>}
                                        {day.hrv > 0 && <span>{day.hrv} ms</span>}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-faint" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    </>
);
