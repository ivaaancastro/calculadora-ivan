import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Settings } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { tooltipStyle } from './fitnessConstants';
import { formatInterval } from '../../hooks/useFitnessAnalytics';

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
    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Perfil de Potencia</h3>
                        <InfoTooltip text="Tu potencia máxima comparada con categorías típicas (Coggan)." />
                    </div>
                    <button
                        onClick={() => setShowPowerConfig(!showPowerConfig)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border shadow-sm ${showPowerConfig ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-blue-500' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-600'}`}
                    >
                        <Settings size={14} /> {showPowerConfig ? 'Cerrar' : 'Configurar'}
                    </button>
                </div>

                {showPowerConfig && (
                    <div className="mb-10 p-6 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800/50 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Unidad de Medida</p>
                                <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl w-fit">
                                    {['wkg', 'w'].map(unit => (
                                        <button
                                            key={unit}
                                            onClick={() => setPowerUnit(unit)}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${powerUnit === unit ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {unit === 'wkg' ? 'W/kg' : 'Vatios'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Periodo Analizado</p>
                                <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl w-fit">
                                    {[
                                        { id: '90d', label: '90 Días' },
                                        { id: '1y', label: '1 Año' },
                                        { id: 'all', label: 'Histórico' }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setPowerProfileTimeframe && setPowerProfileTimeframe(item.id)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${powerProfileTimeframe === item.id ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tiempos Visibles</p>
                                <div className="flex flex-wrap gap-2">
                                    {[5, 60, 300, 1200, 3600, 7200].map(id => (
                                        <button
                                            key={id}
                                            onClick={() => toggleDur(id)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${selectedDurs.has(id) ? 'bg-blue-500 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'}`}
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
                        <div className="h-[340px] w-full bg-slate-50/30 dark:bg-zinc-800/20 rounded-3xl p-4 border border-slate-100/50 dark:border-zinc-800/50">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ppChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} ${powerUnit === 'w' ? 'W' : 'W/kg'}`, name]} isAnimationActive={false} />
                                    {['World Class', 'Cat 1 / Elite', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5', 'Untrained'].map((cat, idx) => (
                                        <Line key={cat} type="monotone" dataKey={cat} stroke={idx === 0 ? '#fbbf24' : '#94a3b8'} strokeWidth={1} dot={false} opacity={0.08} isAnimationActive={false} />
                                    ))}
                                    <Line type="monotone" dataKey="Usuario" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Qualitative Strengths */}
                        {profile && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profile?.strengths?.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50 group">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-tight mb-0.5">{s.area}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-70 leading-tight">{s.desc}</p>
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm border ${s.level === 'elite' ? 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/30' : s.level === 'good' ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30' : 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                                            {s.level === 'elite' ? 'Élite' : s.level === 'good' ? 'Destacado' : 'Base'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[480px] custom-scrollbar pr-2 pt-1 border-l border-slate-100/50 dark:border-zinc-800/50 pl-6">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mejores Esfuerzos</p>
                        {ppChartData.map(p => (
                            <div key={p.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/30 dark:bg-zinc-800/20 border border-slate-100/50 dark:border-zinc-800/50 hover:border-blue-500/20 transition-all cursor-default group">
                                <div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.name}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-none">
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
            </div>
        </section>
    );
};
