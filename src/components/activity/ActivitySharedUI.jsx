import React from 'react';
import { formatMinutes } from '../../utils/formatters';
import { ChartTooltip } from '../ui';

export const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;
        let displayValue = payload[0].value;
        let displayUnit = unit;

        if (unit.trim() === "min") {
            displayValue = formatMinutes(payload[0].value);
            displayUnit = "";
        }
        
        return (
            <ChartTooltip variant="dark">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 uppercase tracking-[0.08em] text-2xs">{label || 'Métrica'}</span>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-white text-xs">{displayValue}</span>
                        <span className="text-2xs text-zinc-500 font-medium">{displayUnit}</span>
                    </div>
                </div>
                {data?.range && (
                    <p className="mt-1 text-2xs text-zinc-400 font-medium opacity-60 italic">{data.range}</p>
                )}
            </ChartTooltip>
        );
    }
    return null;
};
