import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CustomChartTooltip } from '../ActivitySharedUI';
import { useChartTheme } from '../../charts/useChartTheme';

export const DataTab = ({ zoneType, exactZoneAnalysis, exactPacePowerZoneAnalysis, proMetrics, activity, maxHr }) => {
    const ct = useChartTheme();
    const ZONE_COLORS = ct.zones.hr;
    return (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-surface-6">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                            
                            {/* --- COLUMNA PRINCIPAL (ANÁLISIS TÉCNICO) --- */}
                            <div className="lg:col-span-8 space-y-8">
                                
                                {/* Distribución Volumétrica (Zones - Top Priority) */}
                                {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis) && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">Distribución Volumétrica (Zonas)</h3>
                                    <div className="h-[280px] bg-surface-6 rounded-2xl border border-line-soft p-6 shadow-sm">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis} margin={{ bottom: 20 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: ct.anatomy.tick }} />
                                                <YAxis hide />
                                                <RechartsTooltip content={<CustomChartTooltip unit=" min" />} cursor={{ fill: ct.anatomy.cursorFill }} />
                                                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                                    {(zoneType === 'hr' ? exactZoneAnalysis : exactPacePowerZoneAnalysis).map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={zoneType === 'hr' ? ZONE_COLORS[index] : ct.zones.all[index % 7]} 
                                                            fillOpacity={0.85}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                )}

                                {/* ClimbPro Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">Análisis de Ascensiones (ClimbPro)</h3>
                                        <span className="text-[9px] font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full uppercase tracking-tighter">
                                            {proMetrics.climbPro?.length || 0} Subidas
                                        </span>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-line-soft overflow-hidden shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {proMetrics.climbPro?.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-zinc-900/30">
                                                    <tr className="text-[8px] font-bold text-ink-4 uppercase tracking-widest border-b border-line-soft">
                                                        <th className="p-4">CAT</th>
                                                        <th className="p-4">Subida</th>
                                                        <th className="p-4 text-right">DIST (km)</th>
                                                        <th className="p-4 text-right">GANANCIA</th>
                                                        <th className="p-4 text-right">GRADO %</th>
                                                        <th className="p-4 text-right">VAM (m/h)</th>
                                                        <th className="p-4 text-right">TIEMPO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-[10px] font-bold tabular-nums text-body-soft-2 divide-y divide-line-soft-5">
                                                    {proMetrics.climbPro.map((climb) => (
                                                        <tr key={climb.index} className="hover:bg-sunken-4 transition-colors group">
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                                                    climb.category === 'HC' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg shadow-black/10' :
                                                                    climb.category === '1' ? 'bg-rose-500 text-white' :
                                                                    climb.category === '2' ? 'bg-orange-500 text-white' :
                                                                    climb.category === '3' ? 'bg-amber-500 text-white' :
                                                                    'bg-fill-2 text-body-soft'
                                                                }`}>
                                                                    {climb.category}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 group-hover:text-indigo-500 transition-colors">Ascensión {climb.index}</td>
                                                            <td className="p-4 text-right text-slate-400">{climb.distance}</td>
                                                            <td className="p-4 text-right">+{climb.gain}m</td>
                                                            <td className="p-4 text-right text-rose-500">{climb.avgGrade}%</td>
                                                            <td className="p-4 text-right font-black text-ink-soft">{climb.vam}</td>
                                                            <td className="p-4 text-right text-slate-400 font-medium">{climb.timeStr}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-2 opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-line-strong" />
                                                <p className="text-[9px] font-bold uppercase tracking-widest">Sin ascensiones notables</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metabolic Profile (Bottom) */}
                                <div className="bg-sunken-10 rounded-2xl p-5 border border-line-soft">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold text-ink-soft uppercase tracking-tight">Perfil Metabólico Estimado</h3>
                                            <p className="text-[9px] text-ink-4 font-medium">Sustratos energéticos basados en intensidad</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-black text-ink-soft">{proMetrics.workKj}</span>
                                            <span className="ml-1 text-[9px] font-bold text-slate-400 uppercase">kJ Totales</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                                                <span className="text-emerald-500">Grasas ({Math.max(0, 100 - (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                                <span className="text-orange-500">Carbos ({Math.min(100, (proMetrics.ifFactor * 100)).toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-fill-2 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.max(5, 100 - (proMetrics.ifFactor * 100))}%` }} />
                                                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(95, (proMetrics.ifFactor * 100))}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-1">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enfoque Técnico</span>
                                                <p className="text-[10px] font-bold text-body leading-tight">
                                                    {proMetrics.ifFactor < 0.75 
                                                        ? "Optimización de oxidación de grasas y base aeróbica." 
                                                        : "Consumo glucolítico alto. Énfasis en potencia táctica."}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Recuperación Hist.</span>
                                                <p className="text-[10px] font-bold text-body leading-tight">
                                                    {activity.tss > 100 ? "36-48 horas para supercompensación." : "12-24 horas para estar al 100%."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- BARRA LATERAL (MÉTRICAS SECUNDARIAS) --- */}
                            <div className="lg:col-span-4 space-y-6">
                                
                                {/* Efficiency Gauges */}
                                <div className="bg-sunken-10 rounded-2xl p-6 border border-line-soft space-y-6">
                                    <h3 className="text-xs font-bold text-ink-soft uppercase tracking-tight">Métricas de Eficiencia</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Intensidad (IF)</span>
                                                <span className="text-power font-black">{proMetrics.ifFactor}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-power rounded-full" style={{ width: `${(proMetrics.ifFactor / 1.1) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Variabilidad (VI)</span>
                                                <span className="text-indigo-500 font-black">{proMetrics.vi}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((proMetrics.vi - 1) / 0.3) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Eficiencia (EF)</span>
                                                <span className="text-rose-500 font-black">{proMetrics.efObj?.value}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `70%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/40">
                                        <p className="text-[9px] text-ink-3 leading-relaxed font-bold uppercase italic">
                                            Entrenamiento {parseFloat(proMetrics.vi) > 1.1 ? "Variable (MTB/Crit)" : "Constante (TT/Ritmo)"}
                                        </p>
                                    </div>
                                </div>

                                {/* Session Highlights */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">Hitos de la Sesión</h3>
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-line-soft overflow-hidden shadow-sm max-h-[450px] overflow-y-auto custom-scrollbar">
                                        <div className="divide-y divide-line-soft">
                                            {proMetrics.powerCurve?.map((peak, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                            {peak.label}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-body-soft uppercase">Pico {peak.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-ink-soft">{peak.value}<span className="text-[9px] ml-0.5 opacity-50">w</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center p-3.5 bg-slate-50/30 dark:bg-zinc-900/10">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FC Máxima</span>
                                                <span className="text-xs font-black text-hr">{maxHr} <span className="text-[9px] font-bold text-slate-400">bpm</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recovery Status (Raised up) */}
                                <div className="bg-emerald-500 dark:bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">Estado de Recuperación</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xl font-black italic">~24H</div>
                                        <div className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded">Supercompensación OK</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    );
};
