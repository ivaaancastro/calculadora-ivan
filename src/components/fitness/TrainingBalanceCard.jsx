import React from 'react';
import { Activity, Brain } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';

export const TrainingBalanceCard = ({ balance, balanceDays, setBalanceDays }) => {
    return (
        <section className="mb-8">
            <div className="bg-surface-5 rounded-2xl border border-line-muted p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Balance de Entrenamiento</h3>
                        <InfoTooltip text="Distribución de la carga en los últimos días según intensidad." />
                    </div>
                    <div className="flex bg-fill p-1 rounded-xl">
                        {[{ l: '7D', v: 7 }, { l: '30D', v: 30 }, { l: '90D', v: 90 }].map(p => (
                            <button
                                key={p.v}
                                onClick={() => setBalanceDays(p.v)}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${balanceDays === p.v ? 'bg-surface-3 text-action-bright shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {p.l}
                            </button>
                        ))}
                    </div>
                </div>

                {balance && !balance.empty ? (
                    <div className="space-y-12">
                        <div className="grid grid-cols-2 gap-8 px-2">
                            <div className="p-4 rounded-2xl bg-sunken-3 border border-line-soft">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carga Total</p>
                                <p className="text-3xl font-black text-ink-soft">{Math.round(balance.totalLoad)} <span className="text-xs font-bold text-slate-400">Pts</span></p>
                            </div>
                            <div className="p-4 rounded-2xl bg-sunken-3 border border-line-soft">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ratio An/Ae</p>
                                <p className="text-3xl font-black text-ink-soft">{(balance.anaerobic / (balance.aerobicHigh + balance.aerobicLow || 1)).toFixed(2)}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">Aeróbico vs Anaeróbico</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: 'Capacidad Anaeróbica', value: balance.anaerobic, color: 'bg-purple-500', target: balance.targets.anaerobic, pct: balance.pcts.anaerobic },
                                { label: 'Aeróbico Alta Intensidad', value: balance.aerobicHigh, color: 'bg-orange-500', target: balance.targets.high, pct: balance.pcts.high },
                                { label: 'Aeróbico Baja Intensidad', value: balance.aerobicLow, color: 'bg-[#00c2e0]', target: balance.targets.low, pct: balance.pcts.low }
                            ].map((b, i) => {
                                const scale = balance.maxScale || 1;
                                const barWidth = (b.value / scale) * 100;
                                const targetLeft = (b.target.min / scale) * 100;
                                const targetWidth = ((b.target.max - b.target.min) / scale) * 100;
                                const status = b.pct < b.target.pctMin ? 'Bajo' : b.pct > b.target.pctMax ? 'Alto' : 'Óptimo';

                                return (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-4 px-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-ink-3 uppercase tracking-tight">{b.label}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[13px] font-black ${status === 'Alto' ? 'text-rose-500' : 'text-ink-soft'}`}>{Math.round(b.pct)}%</span>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${status === 'Óptimo' ? 'bg-positive/10 border-positive/20 text-positive' : 'bg-surface-2 border-line-2 text-slate-400'}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-body">{Math.round(b.value)} <span className="text-[8px] text-slate-400">TSS</span></span>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Meta: {Math.round(b.target.min)}-{Math.round(b.target.max)}</p>
                                            </div>
                                        </div>

                                        <div className="relative h-4 w-full bg-slate-100 dark:bg-zinc-800/40 rounded-full overflow-visible">
                                            {/* Garmin-style Optimal Range Dotted Capsule (ON TOP) */}
                                            <div
                                                className="absolute -top-1.5 -bottom-1.5 border-2 border-dashed border-slate-300 dark:border-zinc-500 rounded-full z-30 pointer-events-none"
                                                style={{
                                                    left: `${targetLeft}%`,
                                                    width: `${targetWidth}%`
                                                }}
                                            />

                                            {/* Current value bar */}
                                            <div
                                                className={`absolute top-0 bottom-0 ${b.color} rounded-full transition-all duration-1000 shadow-md z-20 ${status === 'Alto' ? 'brightness-110' : ''}`}
                                                style={{ width: `${barWidth}%` }}
                                            >
                                                {/* Glow if optimal or higher */}
                                                {status !== 'Bajo' && (
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 rounded-3xl bg-sunken-3 border border-line-soft flex items-start gap-5 shadow-sm transition-all hover:shadow-md">
                            <div className="p-3 rounded-2xl bg-surface-3 shadow-sm">
                                <Brain size={24} style={{ color: balance.color }} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm" style={{ backgroundColor: `${balance.color}15`, color: balance.color, borderColor: `${balance.color}30` }}>
                                        {balance.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-white/50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-slate-100/50 dark:border-zinc-700/50">
                                        {balance.activityCount} Sesiones
                                    </span>
                                </div>
                                <p className="text-[13px] font-bold text-ink-2 leading-snug mb-1">
                                    {balance.recommendation}
                                </p>
                                <p className="text-[11px] font-medium text-ink-3 leading-relaxed">
                                    {balance.details}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-line-soft-2 rounded-3xl">
                        <Activity size={48} className="mx-auto text-slate-200 dark:text-zinc-800 mb-4 stroke-1" />
                        <p>Sin datos suficientes en el periodo</p>
                    </div>
                )}
            </div>
        </section>
    );
};
