import React from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useChartTheme } from '../charts/useChartTheme';
import { useChartMotion } from '../charts/useChartMotion';
import { chartTooltipStyle, InfoTooltip, Segmented } from '../ui';
import { StatsCard } from './StatsCard';
import { chartFigureProps, summarizeSeries } from '../charts/chartA11y';
import { axisProps } from '../charts/axisProps.js';

export const WeeklyVolumeAndFocusCard = ({
    weeklyChart,
    focusChart,
    zonesChart,
    intensityTimeframe,
    setIntensityTimeframe
}) => {
    const ct = useChartTheme();
    const motion = useChartMotion();
    const enter = motion.active ? motion.props : {};
    const focusInfo = (name) => {
        const n = String(name).toLowerCase();
        if (n.startsWith('aer')) return 'Zonas 1 y 2. Base de resistencia.';
        if (n.startsWith('tempo')) return 'Zonas 3 y 4. Ritmos de carrera sostenidos.';
        return 'Zonas 5 y superiores. Potencia explosiva y series cortas.';
    };
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <StatsCard
                id="volume"
                title="Volumen semanal"
                info="Carga de entrenamiento (TSS) y horas totales acumuladas cada semana. Las barras indican el estrés (TSS) y la línea el tiempo."
                className="lg:col-span-2 flex flex-col"
            >
                <div className="flex-1 min-h-[240px]" {...chartFigureProps('Volumen semanal', summarizeSeries(weeklyChart, [{ key: 'tss', label: 'TSS' }, { key: 'hours', label: 'Horas' }]))}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={weeklyChart}>
                            <CartesianGrid strokeDasharray="2 2" stroke={ct.anatomy.gridZinc} opacity={0.1} vertical={false} />
                            <XAxis dataKey="dateLabel" {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: null })} minTickGap={15} />
                            <YAxis yAxisId="left" {...axisProps(ct, { fill: ct.series.tss, fontWeight: null })} />
                            <RechartsTooltip contentStyle={chartTooltipStyle(ct)} itemStyle={{ color: ct.tooltip.ink }} isAnimationActive={false} cursor={{ stroke: ct.anatomy.cursorZinc, strokeWidth: 1 }} />
                            <Bar yAxisId="left" dataKey="tss" name="TSS" fill={ct.series.tss} opacity={1} radius={[4, 4, 0, 0]} barSize={20} {...enter} />
                            <Line yAxisId="left" type="monotone" dataKey="hours" name="Horas" stroke={ct.series.hours} strokeWidth={3} dot={false} {...enter} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </StatsCard>

            <StatsCard
                id="focus"
                title="Distribución de foco"
                actions={
                    <Segmented
                        variant="card"
                        size="sm"
                        aria-label="Periodo de la distribución"
                        optionClassName="px-3 py-1"
                        value={intensityTimeframe}
                        onChange={setIntensityTimeframe}
                        options={['28d', '90d'].map((t) => ({ value: t, label: t.toUpperCase() }))}
                    />
                }
            >
                <div className="flex flex-col gap-6">
                    <ul className="m-0 p-0 list-none flex flex-col gap-4">
                        {focusChart.map((focus) => (
                            <li key={focus.name} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1 text-ink">
                                        {focus.name}
                                        <InfoTooltip text={focusInfo(focus.name)} />
                                    </span>
                                    <span className="font-mono text-[12px] text-ink-3 tabular-nums">{focus.value} %</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${focus.value}%`, backgroundColor: focus.color }} />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="pt-4 border-t border-line">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Horas por zona</p>
                        <ul className="m-0 p-0 list-none grid grid-cols-2 gap-x-4 gap-y-2">
                            {zonesChart.filter((z) => z.hours > 0).map((z) => (
                                <li key={z.name} className="flex justify-between items-center text-[12px]">
                                    <span className="flex items-center gap-1.5 text-ink-3 min-w-0">
                                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: z.fill }} />
                                        <span className="truncate">{z.name.split(' ')[0]}</span>
                                    </span>
                                    <span className="font-mono text-ink-2 tabular-nums">{z.hours} h</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </StatsCard>
        </div>
    );
};
