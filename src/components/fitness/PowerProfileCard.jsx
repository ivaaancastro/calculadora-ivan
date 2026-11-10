import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Settings } from 'lucide-react';
import { formatInterval } from '../../hooks/useFitnessAnalytics';
import { useChartTheme } from '../charts/useChartTheme';
import { Card, chartTooltipStyle, InfoTooltip, Segmented } from '../ui';

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
    return (
        <section className="mb-8">
            <Card variant="panel" className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Perfil de Potencia</h3>
                        <InfoTooltip text="Tu potencia máxima comparada con categorías típicas (Coggan)." />
                    </div>
                    <button
                        onClick={() => setShowPowerConfig(!showPowerConfig)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border shadow-sm ${showPowerConfig ? 'bg-surface-2 border-line-2 text-action-bright' : 'bg-surface border-line text-slate-400 hover:text-slate-600'}`}
                    >
                        <Settings size={14} /> {showPowerConfig ? 'Cerrar' : 'Configurar'}
                    </button>
                </div>

                {showPowerConfig && (
                    <div className="mb-10 p-6 bg-sunken-3 rounded-2xl border border-line-soft animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Unidad de Medida</p>
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Periodo Analizado</p>
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
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tiempos Visibles</p>
                                <div className="flex flex-wrap gap-2">
                                    {[5, 60, 300, 1200, 3600, 7200].map(id => (
                                        <button
                                            key={id}
                                            onClick={() => toggleDur(id)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${selectedDurs.has(id) ? 'bg-action-bright border-action-solid text-white shadow-sm' : 'bg-surface-7 border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {formatInterval(id)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <div className="h-[340px] w-full bg-sunken-7 rounded-3xl p-4 border border-line-faint-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ppChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.grid2} opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: ct.anatomy.tick }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: ct.anatomy.tick }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={chartTooltipStyle(ct)} formatter={(v, name) => [`${v} ${powerUnit === 'w' ? 'W' : 'W/kg'}`, name]} isAnimationActive={false} />
                                    {['World Class', 'Cat 1 / Elite', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5', 'Untrained'].map((cat, idx) => (
                                        <Line key={cat} type="monotone" dataKey={cat} stroke={idx === 0 ? ct.series.profileTop : ct.series.profileOther} strokeWidth={1} dot={false} opacity={0.08} isAnimationActive={false} />
                                    ))}
                                    <Line type="monotone" dataKey="Usuario" stroke={ct.series.profileUser} strokeWidth={3} dot={{ r: 4, fill: ct.series.profileUser, strokeWidth: 2, stroke: ct.anatomy.dotRing }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Qualitative Strengths */}
                        {profile && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profile?.strengths?.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-sunken-3 border border-line-soft group">
                                        <div>
                                            <p className="text-[10px] font-bold text-ink-2-soft uppercase tracking-tight mb-0.5">{s.area}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-70 leading-tight">{s.desc}</p>
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm border ${s.level === 'elite' ? 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/30' : s.level === 'good' ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30' : 'text-slate-500 bg-sunken-9 border-slate-200 dark:border-zinc-700'}`}>
                                            {s.level === 'elite' ? 'Élite' : s.level === 'good' ? 'Destacado' : 'Base'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar pr-2 pt-1 border-l border-line-faint-2 pl-6">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mejores Esfuerzos</p>
                        {ppChartData.map(p => (
                            <div key={p.name} className="flex items-center justify-between p-4 rounded-xl bg-sunken-7 border border-slate-100/50 dark:border-zinc-800/50 hover:border-blue-500/20 transition-all cursor-default group">
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.name}</p>
                                    <p className="text-sm font-bold text-ink-2 leading-none">
                                        {powerUnit === 'w' ? p['Usuario'] : Math.round(p['Usuario'] * (powerProfile?.weight || 70))}
                                        <span className="text-[9px] ml-1 opacity-40 font-bold uppercase">W</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-500">{powerUnit === 'wkg' ? p['Usuario'] : (p['Usuario'] / (powerProfile?.weight || 70)).toFixed(2)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">W/kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </section>
    );
};
