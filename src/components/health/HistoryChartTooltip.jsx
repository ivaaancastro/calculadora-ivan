import React from 'react';
import { ChartTooltip } from '../ui';

export const HistoryChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <ChartTooltip variant="dark-history">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4 border-b border-slate-800 dark:border-zinc-800 pb-1">
                    {d.dateLabelFull || d.dateLabel}
                </p>
                <div className="flex justify-between items-center text-emerald-400 font-bold tabular-nums">
                    <span>Recuperación:</span>
                    <span>{d.readinessScore}%</span>
                </div>
                {d.sleep > 0 && (
                    <div className="flex justify-between items-center text-blue-400 font-bold tabular-nums">
                        <span>Sueño:</span>
                        <span>{d.sleep}h</span>
                    </div>
                )}
                {d.rhr > 0 && (
                    <div className="flex justify-between items-center text-rose-400 font-bold tabular-nums">
                        <span>FC Reposo:</span>
                        <span>{d.rhr} lpm</span>
                    </div>
                )}
                {d.hrv > 0 && (
                    <div className="flex justify-between items-center text-indigo-400 font-bold tabular-nums">
                        <span>VFC:</span>
                        <span>{d.hrv} ms</span>
                    </div>
                )}
            </ChartTooltip>
        );
    }
    return null;
};
