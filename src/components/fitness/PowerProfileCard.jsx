import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Settings } from 'lucide-react';
import { formatInterval } from '../../hooks/useFitnessAnalytics';
import { useChartTheme } from '../charts/useChartTheme';
import { useChartMotion } from '../charts/useChartMotion';
import { Button, chartTooltipStyle, Segmented } from '../ui';
import { StatsCard } from './StatsCard';
import { formatNumber } from '../../utils/formatters';
import { chartFigureProps, summarizeCategories } from '../charts/chartA11y';
import { axisProps } from '../charts/axisProps.js';

export const PowerProfileCard = ({
    showPowerConfig,
    setShowPowerConfig,
    powerUnit,
    setPowerUnit,
    powerProfileTimeframe = '90d',
    setPowerProfileTimeframe,
    selectedDurs,
    toggleDur,
    ppChartData,
    profile,
    powerProfile
}) => {
    const ct = useChartTheme();
    const motion = useChartMotion();
    const enter = motion.active ? motion.props : {};
    return (
        <StatsCard
            id="power-profile"
            title="Perfil de potencia"
            info="Tu potencia máxima comparada con categorías típicas (Coggan)."
            actions={
                <Button variant="secondary" aria-expanded={showPowerConfig} onClick={() => setShowPowerConfig(!showPowerConfig)} className="flex items-center gap-2">
                    <Settings size={14} aria-hidden="true" /> {showPowerConfig ? 'Cerrar' : 'Configurar'}
                </Button>
            }
        >
                {showPowerConfig && (
                    <div className="mb-6 pb-6 border-b border-line">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Unidad de Medida</p>
                                <Segmented
                                    variant="card"
                                    size="md-wide"
                                    className="w-fit"
                                    optionClassName="px-4 py-1.5"
                                    value={powerUnit}
                                    onChange={setPowerUnit}
                                    options={[
                                        { value: 'wkg', label: 'W/kg' },
                                        { value: 'w', label: 'Vatios' },
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Periodo Analizado</p>
                                <Segmented
                                    variant="card"
                                    size="md-wide"
                                    className="w-fit"
                                    optionClassName="px-3 py-1.5"
                                    value={powerProfileTimeframe}
                                    onChange={(id) => setPowerProfileTimeframe && setPowerProfileTimeframe(id)}
                                    options={[
                                        { value: '90d', label: '90 Días' },
                                        { value: '1y', label: '1 Año' },
                                        { value: 'all', label: 'Histórico' },
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-3">Tiempos Visibles</p>
                                <div className="flex flex-wrap gap-2">
                                    {[5, 60, 300, 1200, 3600, 7200].map(id => (
                                        <button
                                            key={id}
                                            onClick={() => toggleDur(id)}
                                            className={`px-3 py-1.5 rounded-lg text-2xs font-bold uppercase transition-paint border ${selectedDurs.has(id) ? 'bg-action-bright border-action-solid text-white shadow-sm' : 'bg-surface-7 border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {formatInterval(id)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    <div className="lg:col-span-2">
                        <div className="h-[300px] w-full" {...chartFigureProps('Perfil de potencia frente a categorías', summarizeCategories(ppChartData, 'name', 'Usuario', powerUnit === 'wkg' ? 'W/kg' : 'W'))}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ppChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.grid2} opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: 700 })} />
                                    <YAxis {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: 700 })} />
                                    <RechartsTooltip contentStyle={chartTooltipStyle(ct)} formatter={(v, name) => [`${v} ${powerUnit === 'w' ? 'W' : 'W/kg'}`, name]} isAnimationActive={false} />
                                    {['World Class', 'Cat 1 / Elite', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5', 'Untrained'].map((cat, idx) => (
                                        <Line key={cat} type="monotone" dataKey={cat} stroke={idx === 0 ? ct.series.profileTop : ct.series.profileOther} strokeWidth={1} dot={false} opacity={0.08} isAnimationActive={false} {...enter} />
                                    ))}
                                    <Line type="monotone" dataKey="Usuario" stroke={ct.series.profileUser} strokeWidth={3} dot={{ r: 4, fill: ct.series.profileUser, strokeWidth: 2, stroke: ct.anatomy.dotRing }} isAnimationActive={false} {...enter} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Qualitative Strengths */}
                        {profile && (
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y divide-line sm:divide-y-0">
                                {profile?.strengths?.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-3 min-h-14">
                                        <div>
                                            <p className="text-sm font-medium text-ink">{s.area}</p>
                                            <p className="text-[12px] text-ink-4">{s.desc}</p>
                                        </div>
                                        <span className={`text-2xs font-bold uppercase px-2 py-0.5 rounded-md shadow-sm border ${s.level === 'elite' ? 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/30' : s.level === 'good' ? 'text-emerald-600 bg-positive-tint border-emerald-100 dark:border-emerald-800/30' : 'text-slate-500 bg-sunken-9 border-slate-200 dark:border-zinc-700'}`}>
                                            {s.level === 'elite' ? 'Élite' : s.level === 'good' ? 'Destacado' : 'Base'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="lg:border-l lg:border-line lg:pl-6">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-1">Mejores esfuerzos</p>
                        <ul className="m-0 p-0 list-none divide-y divide-line">
                        {ppChartData.map(p => (
                            <li key={p.name} className="flex items-center justify-between gap-3 min-h-14 py-2">
                                <div>
                                    <p className="text-sm font-medium text-ink">{p.name}</p>
                                    <p className="font-mono text-[12px] text-ink-4 tabular-nums">
                                        {powerUnit === 'w' ? p['Usuario'] : Math.round(p['Usuario'] * (powerProfile?.weight || 70))}
                                        <span className="ml-1">W</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-ink tabular-nums">{powerUnit === 'wkg' ? p['Usuario'] : formatNumber(p['Usuario'] / (powerProfile?.weight || 70), 2)}</p>
                                    <p className="font-mono text-[12px] text-ink-4">W/kg</p>
                                </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
        </StatsCard>
    );
};
