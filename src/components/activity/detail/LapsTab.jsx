import React from 'react';


export const LapsTab = ({ proMetrics, isPaceBased }) => (
                    <div className="h-full overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-surface-6">
                        <div className="max-w-6xl mx-auto space-y-8 pb-12">
                            <div className="flex items-center justify-between border-b border-line-soft-6 pb-4">
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold text-ink-soft uppercase tracking-tight">Análisis Técnico por Intervalos</h2>
                                    <p className="text-2xs text-ink-4 font-medium tracking-wide uppercase">Segmentación automática ({isPaceBased ? '1km' : '5km'})</p>
                                </div>
                            </div>
                            
                            <div data-detail="laps" className="bg-white dark:bg-zinc-900/20 rounded-3xl border border-line overflow-x-auto custom-scrollbar shadow-card [&_thead_th]:sticky [&_thead_th]:top-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-sunken-10">
                                        <tr className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em] border-b border-line-soft-2">
                                            <th className="p-4">#</th>
                                            <th className="p-4">Tiempo</th>
                                            <th className="p-4 text-right">Dist (km)</th>
                                            <th className="p-4 text-right">{isPaceBased ? 'RITMO' : 'V EL'}</th>
                                            {proMetrics.autoLaps.some(l => l.pwrAvg) && <th className="p-4 text-right">POT (w)</th>}
                                            <th className="p-4 text-right">FC (bpm)</th>
                                            {proMetrics.autoLaps.some(l => l.cadAvg) && <th className="p-4 text-right">CAD</th>}
                                            <th className="p-4 text-right">ELEV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[12px] font-bold tabular-nums text-body-soft-2 divide-y divide-slate-100 dark:divide-zinc-800/40">
                                        {proMetrics.autoLaps.map(lap => {
                                            // Lógica para resaltar el más rápido
                                            const isFastest = !isPaceBased 
                                                ? lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed))
                                                : lap.rawSpeed === Math.max(...proMetrics.autoLaps.map(l => l.rawSpeed));

                                            return (
                                                <tr key={lap.index} data-detail={isFastest ? "lap-fast" : "lap"} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors group ${isFastest ? 'bg-emerald-50/30 dark:bg-emerald-900/5 shadow-[inset_3px_0_0_var(--hero-accent,rgb(var(--line-strong)))]' : ''}`}>
                                                    <td className="p-4 font-bold text-slate-300 dark:text-zinc-700 group-hover:text-indigo-500 transition-colors">{lap.index}</td>
                                                    <td className="p-4 text-ink-soft">{lap.timeStr}</td>
                                                    <td className="p-4 text-right opacity-60 font-medium">{lap.distanceKm}</td>
                                                    <td className={`p-4 text-right font-bold ${isFastest ? 'text-emerald-500' : 'text-ink-soft'}`}>{lap.speedVal}</td>
                                                    {lap.pwrAvg !== null && (
                                                        <td className="p-4 text-right">
                                                            <span className="text-power font-bold">{lap.pwrAvg}</span>
                                                            <span className="ml-1 text-2xs text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">w</span>
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-right">
                                                        <span className="text-hr font-bold">{lap.hrAvg}</span>
                                                    </td>
                                                    {lap.cadAvg !== null && <td className="p-4 text-right text-slate-400">{lap.cadAvg}</td>}
                                                    <td className="p-4 text-right text-slate-400 font-medium">+{lap.elev}m</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
);
