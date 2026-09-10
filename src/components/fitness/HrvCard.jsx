import React from 'react';
import { ShieldCheck, Brain } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';

export const HrvCard = ({ hrv }) => {
    if (!hrv) return null;

    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Estado de VFC</h3>
                        <InfoTooltip text="La Variabilidad de Frecuencia Cardíaca (RMSSD) indica tu recuperación real." />
                    </div>
                    {hrv.source === 'garmin' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800/50">
                            <ShieldCheck size={10} className="text-blue-500" />
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Biometría Sincronizada</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-zinc-100">{hrv.rmssd}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">ms</span>
                            <div className="ml-4 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border shadow-sm" style={{ backgroundColor: `${hrv.color}10`, color: hrv.color, borderColor: `${hrv.color}20` }}>
                                {hrv.state}
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed max-w-sm">{hrv.msg}</p>
                        
                        <div className="mt-8 space-y-3">
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (hrv.rmssd / hrv.baseline) * 80)}%` }} />
                            </div>
                            <div className="flex justify-between px-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                                <span>Bajo</span>
                                <span>Personal: {hrv.baseline}ms</span>
                                <span>Alto</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800/50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Stress Score</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">{hrv.stress}</span>
                                    <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                                </div>
                            </div>
                            <Brain size={24} className="text-slate-300 dark:text-zinc-700" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${hrv.stress > 60 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-tight">
                                {hrv.stress > 60 ? 'Necesitas recuperación' : 'Cuerpo listo para entrenar'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
