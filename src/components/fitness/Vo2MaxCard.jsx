import React from 'react';
import { Footprints, Bike } from 'lucide-react';

export const Vo2MaxCard = ({ vo2Sport, setVo2Sport, currentVo2, vo2Level, vo2Stats }) => {
    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">VO2 Máximo</h3>
                    </div>
                    <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                        {['run', 'bike'].map(s => (
                            <button
                                key={s}
                                onClick={() => setVo2Sport(s)}
                                className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${vo2Sport === s ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {s === 'run' ? 'Carrera' : 'Bici'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-end gap-3 mb-8">
                    <span className="text-4xl font-bold tracking-tighter" style={{ color: vo2Level.c }}>{currentVo2 > 0 ? currentVo2 : '--'}</span>
                    <div className="pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ml/kg/min</span>
                        <span className="block text-[10px] font-bold uppercase tracking-tight mt-0.5" style={{ color: vo2Level.c }}>Nivel {vo2Level.l}</span>
                    </div>
                </div>

                <div className="relative pt-2 pb-8">
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                        {[
                            { c: 'bg-red-400', p: '20%' }, { c: 'bg-orange-400', p: '20%' },
                            { c: 'bg-emerald-400', p: '20%' }, { c: 'bg-blue-400', p: '20%' },
                            { c: 'bg-purple-400', p: '20%' }
                        ].map((s, idx) => (
                            <div key={idx} className={`${s.c} opacity-30`} style={{ width: s.p }} />
                        ))}
                    </div>
                    {currentVo2 > 0 && (
                        <div
                            className="absolute top-1.5 h-2.5 w-1 rounded-full bg-slate-900 dark:bg-white transition-all duration-1000 z-10"
                            style={{ left: `${Math.min(98, Math.max(2, currentVo2 <= 35 ? (currentVo2 - 25) / 10 * 20 : currentVo2 <= 42 ? 20 + (currentVo2 - 35) / 7 * 20 : currentVo2 <= 50 ? 40 + (currentVo2 - 42) / 8 * 20 : currentVo2 <= 60 ? 60 + (currentVo2 - 50) / 10 * 20 : 80 + Math.min((currentVo2 - 60) / 10 * 20, 20)))}%` }}
                        />
                    )}
                    <div className="flex justify-between mt-4 px-0.5 opacity-40">
                        {['Pobre', 'Medio', 'Bueno', 'Excelente', 'Superior'].map((l) => (
                            <span key={l} className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{l}</span>
                        ))}
                    </div>
                </div>

                {/* Both sports metrics */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800">
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Footprints size={12} className="text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VO2 Carrera</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{vo2Stats?.run?.vo2max > 0 ? vo2Stats.run.vo2max : '--'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Bike size={12} className="text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VO2 Bici</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{vo2Stats?.bike?.vo2max > 0 ? vo2Stats.bike.vo2max : '--'}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
