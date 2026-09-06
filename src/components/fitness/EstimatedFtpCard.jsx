import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { tooltipStyle } from './fitnessConstants';

export const EstimatedFtpCard = ({
    ftp,
    ftpDiff,
    configFTP,
    curveChartData
}) => {
    return (
        <section className="mb-12">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-10">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">FTP Estimado</h3>
                    <InfoTooltip text="Umbral funcional de potencia proyectado (eFTP)." />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-lg uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30 ml-2">Modelo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-zinc-100 leading-none">{ftp?.eFTP || '--'}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vatios</span>
                        </div>
                        {ftp?.wPerKg && (
                            <p className="text-2xl font-bold text-amber-500 tracking-tighter mt-3">{ftp.wPerKg} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">W/kg</span></p>
                        )}

                        {ftpDiff !== null && (
                            <div className="mt-8 flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50 w-fit">
                                {ftpDiff > 0 ? <ArrowUp size={16} className="text-emerald-500" /> : ftpDiff < 0 ? <ArrowDown size={16} className="text-red-500" /> : <Minus size={16} className="text-slate-400" />}
                                <span className={`text-[10px] font-bold uppercase tracking-tight ${ftpDiff > 0 ? 'text-emerald-600' : ftpDiff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                    {ftpDiff > 0 ? '+' : ''}{ftpDiff}W <span className="opacity-50 font-bold ml-1">vs config ({configFTP}W)</span>
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="h-[240px] w-full bg-slate-50/30 dark:bg-zinc-800/20 rounded-3xl p-4 border border-slate-100/50 dark:border-zinc-800/50">
                        {curveChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={curveChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ftpGradFinal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <RechartsTooltip contentStyle={tooltipStyle} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={3} fill="url(#ftpGradFinal)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} connectNulls isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase tracking-widest bg-slate-50/30 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800/50">No hay datos de potencia</div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
