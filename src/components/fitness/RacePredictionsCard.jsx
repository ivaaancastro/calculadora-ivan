import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';

export const RacePredictionsCard = ({ racePredictions }) => {
    if (!racePredictions) return null;

    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Pronóstico de Carrera</h3>
                    <InfoTooltip text="Predicción teórica basada en tu VO2max actual." />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {racePredictions.map(r => (
                        <div key={r.name} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50 group relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{r.name}</span>
                                    <div className="mt-1 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.preparation > 80 ? '#10b981' : r.preparation > 50 ? '#f59e0b' : '#ef4444' }} />
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{r.preparation}% Prep.</span>
                                    </div>
                                </div>
                                <Trophy size={14} className={`${r.preparation > 80 ? 'text-blue-500' : 'text-slate-300'} transition-colors`} />
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">{r.time}</p>
                            <div className="flex items-center gap-1.5 mt-2.5 opacity-60">
                                <Clock size={10} className="text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{r.pace} <span className="text-[8px] opacity-70">m/km</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
