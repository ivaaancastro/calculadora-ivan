import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';
import {
    Activity, TrendingUp, Trophy, Zap, Timer, Gauge,
    Footprints, BarChart3, ChevronDown, Bike, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { estimateFTP, estimateCyclingVO2max, estimateRunningVO2max, predictRaceTimes, calculateTrainingEffect, analyzePowerProfile } from '../../utils/fitnessStatsEngine';
import { InfoTooltip } from '../common/InfoTooltip';

const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };

export const FitnessStatsPage = ({ activities, settings, onSelectActivity }) => {
    const [vo2Sport, setVo2Sport] = useState('run');

    const stats = useMemo(() => {
        const today = new Date();
        const d45 = new Date(today); d45.setDate(today.getDate() - 45);
        const restHr = Number(settings.fcReposo) || 60;

        // VO2 Max — Fully Consolidated via Engine
        const runVo2Result = estimateRunningVO2max(activities, settings);
        const bikeVo2Result = estimateCyclingVO2max(activities, settings);

        const ftp = estimateFTP(activities, settings);
        const vo2ForPred = runVo2Result.vo2max > 0 ? runVo2Result.vo2max : bikeVo2Result.vo2max;
        const races = predictRaceTimes(vo2ForPred);
        const te = calculateTrainingEffect(activities, settings);
        const profile = analyzePowerProfile(ftp);

        return {
            vo2: { run: runVo2Result, bike: bikeVo2Result },
            ftp, races, te, profile,
        };
    }, [activities, settings]);

    if (!activities || activities.length === 0) return null;

    const currentVo2Obj = vo2Sport === 'run' ? stats.vo2.run : stats.vo2.bike;
    const currentVo2 = currentVo2Obj.vo2max;
    const vo2Level = currentVo2 <= 0 ? { l: '--', c: '#94a3b8' } : currentVo2 < 35 ? { l: 'Pobre', c: '#ef4444' } : currentVo2 < 42 ? { l: 'Regular', c: '#f97316' } : currentVo2 < 50 ? { l: 'Bueno', c: '#22c55e' } : currentVo2 < 60 ? { l: 'Excelente', c: '#3b82f6' } : { l: 'Superior', c: '#8b5cf6' };

    const tooltipStyle = { backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '10px 14px' };

    // Merge actual + modeled power curve for chart
    const curveChartData = useMemo(() => {
        if (!stats.ftp.powerCurve.length) return [];
        const durations = [...new Set([...stats.ftp.powerCurve.map(p => p.secs), ...stats.ftp.modeledCurve.map(p => p.secs)])].sort((a, b) => a - b);
        return durations.map(s => {
            const actual = stats.ftp.powerCurve.find(p => p.secs === s);
            const modeled = stats.ftp.modeledCurve.find(p => p.secs === s);
            return { name: formatInterval(s), secs: s, actual: actual?.power || null, modeled: modeled?.power || null };
        });
    }, [stats.ftp]);

    const configFTP = Number(settings?.bike?.ftp) || 0;
    const ftpDiff = stats.ftp.eFTP && configFTP ? stats.ftp.eFTP - configFTP : null;

    return (
        <div className="animate-in fade-in duration-500 pb-16 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="pt-6 pb-8">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Rendimiento</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">Tu perfil fisiológico y potencial</p>
            </div>

            {/* ── VO2 Max ─────────────────────────────────────────────── */}
            <section className="mb-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">VO2 Máximo</h3>
                            <InfoTooltip text="Consumo máximo de oxígeno estimado. Es la métrica gold-standard de tu capacidad aeróbica." />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                            {['run', 'bike'].map(s => (
                                <button key={s} onClick={() => setVo2Sport(s)} className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${vo2Sport === s ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}>
                                    {s === 'run' ? 'Carrera' : 'Ciclismo'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl font-semibold tracking-tight" style={{ color: vo2Level.c }}>{currentVo2 > 0 ? currentVo2 : '--'}</span>
                        <div className="pb-2">
                            <span className="text-sm text-slate-400 font-medium">ml/kg/min</span>
                            <span className="block text-xs font-semibold mt-0.5" style={{ color: vo2Level.c }}>{vo2Level.l}</span>
                        </div>
                    </div>
                    {/* Scale bar */}
                    <div className="mt-4 relative">
                        <div className="flex h-1.5 rounded-full overflow-hidden">
                            <div className="flex-1 bg-red-400/30" />
                            <div className="flex-1 bg-orange-400/30" />
                            <div className="flex-1 bg-emerald-400/30" />
                            <div className="flex-1 bg-blue-400/30" />
                            <div className="flex-1 bg-purple-400/30" />
                        </div>
                        {currentVo2 > 0 && (
                            <div className="absolute top-0 h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white shadow-md transition-all duration-1000"
                                style={{ left: `${Math.min(98, Math.max(2, currentVo2 <= 35 ? (currentVo2 - 25) / 10 * 20 : currentVo2 <= 42 ? 20 + (currentVo2 - 35) / 7 * 20 : currentVo2 <= 50 ? 40 + (currentVo2 - 42) / 8 * 20 : currentVo2 <= 60 ? 60 + (currentVo2 - 50) / 10 * 20 : 80 + Math.min((currentVo2 - 60) / 10 * 20, 20)))}%` }} />
                        )}
                        <div className="flex justify-between mt-1 text-[8px] font-medium text-slate-400">
                            <span>25</span><span>35</span><span>42</span><span>50</span><span>60</span><span>70+</span>
                        </div>
                    </div>
                    {/* Both sports side */}
                    <div className="flex gap-6 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Footprints size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Carrera</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.vo2.run.vo2max > 0 ? stats.vo2.run.vo2max : '--'}</span>
                            {stats.vo2.run.method !== 'none' && <span className="text-[9px] text-slate-400 ml-1">({stats.vo2.run.description})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Bike size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Ciclismo</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.vo2.bike.vo2max > 0 ? stats.vo2.bike.vo2max : '--'}</span>
                            {stats.vo2.bike.method !== 'none' && <span className="text-[9px] text-slate-400 ml-1">({stats.vo2.bike.description})</span>}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── eFTP + Power Curve (intervals.icu style) ────────────── */}
            <section className="mb-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">FTP Estimado</h3>
                        <InfoTooltip text="Umbral funcional de potencia estimado usando la curva de potencia y ratios power/FTP (enfoque FastFitness.Tips / intervals.icu). Se busca tu mejor esfuerzo máximo (3-30min) y se proyecta a 1h." />
                        {stats.ftp.method === 'ratio' && (
                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">eFTP</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: eFTP value */}
                        <div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{stats.ftp.eFTP || '--'}</span>
                                <span className="text-lg text-slate-400 font-medium pb-1">W</span>
                            </div>
                            {stats.ftp.wPerKg && (
                                <p className="text-lg font-semibold text-amber-500 mt-1">{stats.ftp.wPerKg} <span className="text-sm text-slate-400">W/kg</span></p>
                            )}

                            {/* Diff vs configured */}
                            {ftpDiff !== null && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    {ftpDiff > 0 ? <ArrowUp size={12} className="text-emerald-500" /> : ftpDiff < 0 ? <ArrowDown size={12} className="text-red-500" /> : <Minus size={12} className="text-slate-400" />}
                                    <span className={`text-xs font-semibold ${ftpDiff > 0 ? 'text-emerald-500' : ftpDiff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {ftpDiff > 0 ? '+' : ''}{ftpDiff}W vs configurado ({configFTP}W)
                                    </span>
                                </div>
                            )}

                            {/* Model parameters */}
                            {stats.ftp.model && (
                                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">CP</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.ftp.model.cp}W</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">W'</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.ftp.model.wPrime} kJ</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">pMax</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.ftp.model.pMax}W</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-slate-400 mt-3">{stats.ftp.description}</p>
                        </div>

                        {/* Right: Power curve chart with modeled overlay */}
                        <div>
                            {curveChartData.length > 0 ? (
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={curveChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-zinc-800" opacity={0.5} vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v}W`, name === 'actual' ? 'Real' : 'Modelo CP']} isAnimationActive={false} />
                                            <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} fill="url(#actualGrad)" dot={{ r: 2.5, fill: '#f59e0b', strokeWidth: 0 }} connectNulls isAnimationActive={false} />
                                            {stats.ftp.modeledCurve.length > 0 && (
                                                <Line type="monotone" dataKey="modeled" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div className="flex items-center gap-4 justify-center mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                                            <span className="text-[9px] text-slate-400 font-medium">Real</span>
                                        </div>
                                        {stats.ftp.modeledCurve.length > 0 && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-0.5 bg-purple-500 rounded-full" style={{ borderTop: '1px dashed' }} />
                                                <span className="text-[9px] text-slate-400 font-medium">Modelo CP</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">Sin datos de potencia</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pronóstico de Carrera ────────────────────────────────── */}
            <section className="mb-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Pronóstico de Carrera</h3>
                        <InfoTooltip text="Tiempos estimados usando el modelo de Daniels (VDOT) basado en tu VO2max. Son tiempos teóricos que requieren preparación específica." />
                    </div>
                    {stats.races ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.races.map(r => (
                                <div key={r.name} className="text-center py-4 px-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors">
                                    <span className="text-lg mb-1 block">{r.emoji}</span>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{r.name}</p>
                                    <p className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">{r.time}</p>
                                    <p className="text-[11px] font-medium text-blue-500 mt-1">{r.pace} /km</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Se necesita VO2max para estimar tiempos</p>
                    )}
                </div>
            </section>

            {/* ── Training Effect ──────────────────────────────────────── */}
            <section className="mb-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Training Effect</h3>
                        <InfoTooltip text="Impacto fisiológico del último entrenamiento. Aeróbico mejora la resistencia; anaeróbico mejora la potencia y velocidad." />
                    </div>

                    {stats.te ? (
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
                                <Activity size={16} className="text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{stats.te.activity.name}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(stats.te.activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { key: 'aerobic', label: 'Aeróbico', data: stats.te.aerobic },
                                    { key: 'anaerobic', label: 'Anaeróbico', data: stats.te.anaerobic },
                                ].map(({ key, label, data }) => (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                                            <span className="text-lg font-semibold text-slate-900 dark:text-zinc-100">{data.score}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(data.score / 5) * 100}%`, backgroundColor: data.color }} />
                                        </div>
                                        <p className="text-[10px] font-medium mt-1.5" style={{ color: data.color }}>{data.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Sin entrenamientos recientes</p>
                    )}
                </div>
            </section>

            {/* ── Perfil de Potencia (si hay datos) ──────────────────── */}
            {stats.profile && (
                <section className="mb-6">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Perfil de Potencia</h3>
                            <InfoTooltip text="Análisis de tus puntos fuertes y débiles basado en las ratios de tu curva de potencia (pMax/eFTP y W'/eFTP)." />
                        </div>
                        <div className="space-y-3">
                            {stats.profile.strengths.map((s, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{s.area}</p>
                                        <p className="text-[10px] text-slate-400">{s.desc}</p>
                                    </div>
                                    <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md ${s.level === 'elite' ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' : s.level === 'good' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500 bg-slate-100 dark:bg-zinc-800'}`}>
                                        {s.level === 'elite' ? 'Élite' : s.level === 'good' ? 'Bueno' : 'A mejorar'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
