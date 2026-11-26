import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { CustomChartTooltip } from '../ActivitySharedUI';
import { useChartTheme } from '../../charts/useChartTheme';
import { Segmented } from '../../ui';
import { getBlocksForSport, getMetabolicIntensity } from '../../../utils/activityMetricsBySport';
import { axisProps } from '../../charts/axisProps.js';

export const DataTab = ({ sport, zoneType, zoneOptions = [], onZoneTypeChange, exactZoneAnalysis, exactPaceZoneAnalysis, exactPowerZoneAnalysis, paceThresholdIsDefault, proMetrics, activity, maxHr }) => {
    const ct = useChartTheme();
    const blocks = getBlocksForSport(sport);
    const zoneData = zoneType === 'pace' ? exactPaceZoneAnalysis : zoneType === 'power' ? exactPowerZoneAnalysis : exactZoneAnalysis;
    const intensity = getMetabolicIntensity(sport, activity, proMetrics, maxHr);
    const ZONE_COLORS = ct.zones.hr;
    return (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-surface-6">
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                            
                            {/* --- COLUMNA PRINCIPAL (ANÁLISIS TÉCNICO) --- */}
                            <div className="lg:col-span-8 space-y-8">
                                
                                {/* Distribución Volumétrica (Zones - Top Priority) */}
                                {zoneData && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em]">Distribución Volumétrica (Zonas)</h3>
                                        {zoneOptions.length > 1 && (
                                            <Segmented data-detail="zone-type" variant="pill" value={zoneType} onChange={onZoneTypeChange} options={zoneOptions} />
                                        )}
                                    </div>
                                    <div className="h-[280px] bg-surface-6 rounded-2xl border border-line-soft p-6 shadow-sm">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={zoneData} margin={{ bottom: 20 }}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                <XAxis dataKey="label" {...axisProps(ct, { fill: ct.anatomy.tick, fontWeight: 700 })} />
                                                <YAxis hide />
                                                <RechartsTooltip content={<CustomChartTooltip unit=" min" />} cursor={{ fill: ct.anatomy.cursorFill }} />
                                                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                                    {zoneData.map((entry, index) => (
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
                                    {zoneType === 'pace' && (
                                        <div data-detail="pace-zones" className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-line-soft overflow-hidden shadow-sm divide-y divide-line-soft">
                                            {zoneData.map((z) => (
                                                <div key={z.label} className="flex items-center justify-between px-4 py-2 text-2xs font-bold tabular-nums text-body-soft-2">
                                                    <span>{z.label}</span>
                                                    <span className="text-slate-400">{z.range} /km</span>
                                                    <span>{z.minutes} min · {z.pct.toFixed(0)}%</span>
                                                </div>
                                            ))}
                                            {paceThresholdIsDefault && (
                                                <p className="px-4 py-2 text-2xs font-medium text-ink-4">Usando el ritmo umbral por defecto (4:30/km). Ajústalo en Perfil para zonas exactas.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* ClimbPro Section */}
                                {blocks.detail.climbPro && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em]">Análisis de Ascensiones (ClimbPro)</h3>
                                        <span className="text-2xs font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full uppercase tracking-tighter">
                                            {proMetrics.climbPro?.length || 0} Subidas
                                        </span>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-line-soft overflow-hidden shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {proMetrics.climbPro?.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-zinc-900/30">
                                                    <tr className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em] border-b border-line-soft">
                                                        <th className="p-4">CAT</th>
                                                        <th className="p-4">Subida</th>
                                                        <th className="p-4 text-right">DIST (km)</th>
                                                        <th className="p-4 text-right">GANANCIA</th>
                                                        <th className="p-4 text-right">GRADO %</th>
                                                        <th className="p-4 text-right">VAM (m/h)</th>
                                                        <th className="p-4 text-right">TIEMPO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-2xs font-bold tabular-nums text-body-soft-2 divide-y divide-line-soft-5">
                                                    {proMetrics.climbPro.map((climb) => (
                                                        <tr key={climb.index} className="hover:bg-sunken-4 transition-colors group">
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
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
                                                            <td className="p-4 text-right font-bold text-ink-soft">{climb.vam}</td>
                                                            <td className="p-4 text-right text-slate-400 font-medium">{climb.timeStr}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-2 opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-line-strong" />
                                                <p className="text-2xs font-bold uppercase tracking-[0.08em]">Sin ascensiones notables</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                )}

                                {/* Metabolic Profile (Bottom) */}
                                {intensity !== null && (
                                <div className="bg-sunken-10 rounded-2xl p-5 border border-line-soft">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-bold text-ink-soft uppercase tracking-tight">Perfil Metabólico Estimado</h3>
                                            <p className="text-2xs text-ink-4 font-medium">Sustratos energéticos basados en intensidad ({blocks.metabolic === 'if' ? 'IF' : '% de FC máx.'})</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-bold text-ink-soft">{blocks.metabolic === 'if' ? proMetrics.workKj : (activity.calories || 0)}</span>
                                            <span className="ml-1 text-2xs font-bold text-slate-400 uppercase">{blocks.metabolic === 'if' ? 'kJ Totales' : 'kcal'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-2xs font-bold uppercase tracking-tight">
                                                <span className="text-emerald-500">Grasas ({Math.max(0, 100 - (intensity * 100)).toFixed(0)}%)</span>
                                                <span className="text-orange-500">Carbos ({Math.min(100, (intensity * 100)).toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-fill-2 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 transition-paint duration-1000" style={{ width: `${Math.max(5, 100 - (intensity * 100))}%` }} />
                                                <div className="h-full bg-orange-500 transition-paint duration-1000" style={{ width: `${Math.min(95, (intensity * 100))}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-1">
                                            <div className="space-y-1">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">Enfoque Técnico</span>
                                                <p className="text-2xs font-bold text-body leading-tight">
                                                    {intensity < 0.75 
                                                        ? "Optimización de oxidación de grasas y base aeróbica." 
                                                        : "Consumo glucolítico alto. Énfasis en potencia táctica."}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">Recuperación Hist.</span>
                                                <p className="text-2xs font-bold text-body leading-tight">
                                                    {activity.tss > 100 ? "36-48 horas para supercompensación." : "12-24 horas para estar al 100%."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>

                            {/* --- BARRA LATERAL (MÉTRICAS SECUNDARIAS) --- */}
                            <div className="lg:col-span-4 space-y-6">
                                
                                {/* Efficiency Gauges */}
                                {blocks.detail.efficiency && (
                                <div className="bg-sunken-10 rounded-2xl p-6 border border-line-soft space-y-6">
                                    <h3 className="text-xs font-bold text-ink-soft uppercase tracking-tight">Métricas de Eficiencia</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">
                                                <span>Intensidad (IF)</span>
                                                <span className="text-power font-bold">{proMetrics.ifFactor}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-power rounded-full" style={{ width: `${(proMetrics.ifFactor / 1.1) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">
                                                <span>Variabilidad (VI)</span>
                                                <span className="text-indigo-500 font-bold">{proMetrics.vi}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((proMetrics.vi - 1) / 0.3) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">
                                                <span>Eficiencia (EF)</span>
                                                <span className="text-rose-500 font-bold">{proMetrics.efObj?.value}</span>
                                            </div>
                                            <div className="h-1.5 bg-fill-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `70%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/40">
                                        <p className="text-2xs text-ink-3 leading-relaxed font-bold uppercase italic">
                                            Entrenamiento {parseFloat(proMetrics.vi) > 1.1 ? "Variable (MTB/Crit)" : "Constante (TT/Ritmo)"}
                                        </p>
                                    </div>
                                </div>
                                )}

                                {/* Session Highlights */}
                                <div className="space-y-3">
                                    <h3 className="text-2xs font-bold text-ink-4 uppercase tracking-[0.08em]">Hitos de la Sesión</h3>
                                    <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-line-soft overflow-hidden shadow-sm max-h-[450px] overflow-y-auto custom-scrollbar">
                                        <div className="divide-y divide-line-soft">
                                            {blocks.detail.powerHitos && proMetrics.powerCurve?.map((peak, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-2xs font-bold text-slate-400">
                                                            {peak.label}
                                                        </div>
                                                        <span className="text-2xs font-bold text-body-soft uppercase">Pico {peak.label}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-ink-soft">{peak.value}<span className="text-2xs ml-0.5 opacity-50">w</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {maxHr > 0 && <div className="flex justify-between items-center p-3.5 bg-slate-50/30 dark:bg-zinc-900/10">
                                                <span className="text-2xs font-bold text-slate-400 uppercase tracking-[0.08em]">FC Máxima</span>
                                                <span className="text-xs font-bold text-hr">{maxHr} <span className="text-2xs font-bold text-slate-400">bpm</span></span>
                                            </div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    );
};
