import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import {
    Activity, TrendingUp, Trophy, Zap, Timer, Gauge,
    Footprints, BarChart3, ChevronDown, Bike, ArrowUp, ArrowDown, Minus,
    Medal, Star, Settings, Heart, Brain, Target, Clock, ShieldCheck
} from 'lucide-react';
import {
    estimateFTP, estimateCyclingVO2max, estimateRunningVO2max, 
    calculateTrainingEffect, analyzePowerProfile, getPowerProfileBenchmarks,
    getTrainingBalance, getTrainingStatus, getHRVAnalysis, predictRaceTimes
} from '../../utils/fitnessStatsEngine';
import { InfoTooltip } from '../common/InfoTooltip';
import { useWellnessInfo } from '../../hooks/useWellnessInfo';

const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };

export const FitnessStatsPage = ({ activities, settings, onSelectActivity }) => {
    const [vo2Sport, setVo2Sport] = useState('run');
    const [powerUnit, setPowerUnit] = useState('w'); // 'w' or 'wkg'
    const [selectedDurs, setSelectedDurs] = useState(new Set([5, 15, 30, 60, 300, 'eftp']));
    const [showPowerConfig, setShowPowerConfig] = useState(false);
    const [balanceDays, setBalanceDays] = useState(30);

    // Call the wellness hook for real Garmin data
    const { wellnessMetrics } = useWellnessInfo(activities, settings);

    const stats = useMemo(() => {
        // VO2 Max — Fully Consolidated via Engine
        const runVo2Result = estimateRunningVO2max(activities, settings);
        const bikeVo2Result = estimateCyclingVO2max(activities, settings);

        // FTP and derived stats
        const ftp = estimateFTP(activities, settings);
        const profile = analyzePowerProfile(ftp);
        const powerProfile = getPowerProfileBenchmarks(activities, settings, ftp.eFTP);
        
        const balance = getTrainingBalance(activities, settings, balanceDays);
        const trainingStatus = getTrainingStatus(activities);
        
        // Use real wellness data from Garmin for HRV if available
        const hrv = getHRVAnalysis(activities, wellnessMetrics);
        const racePredictions = predictRaceTimes(runVo2Result.vo2max, activities);

        return {
            vo2: { run: runVo2Result, bike: bikeVo2Result },
            ftp, profile, powerProfile, balance, trainingStatus, hrv, racePredictions
        };
    }, [activities, settings, balanceDays, wellnessMetrics]);

    if (!activities || activities.length === 0) return null;

    const currentVo2Obj = vo2Sport === 'run' ? stats.vo2.run : stats.vo2.bike;
    const currentVo2 = currentVo2Obj.vo2max;
    const vo2Level = currentVo2 <= 0 ? { l: '--', c: '#94a3b8' } : currentVo2 < 35 ? { l: 'Pobre', c: '#ef4444' } : currentVo2 < 42 ? { l: 'Regular', c: '#f97316' } : currentVo2 < 50 ? { l: 'Bueno', c: '#22c55e' } : currentVo2 < 60 ? { l: 'Excelente', c: '#3b82f6' } : { l: 'Superior', c: '#8b5cf6' };

    const tooltipStyle = { backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '10px 14px' };

    // Merge actual + modeled power curve for chart
    const curveChartData = useMemo(() => {
        if (!stats.ftp.powerCurve?.length) return [];
        const durations = [...new Set([...stats.ftp.powerCurve.map(p => p.secs), ...stats.ftp.modeledCurve.map(p => p.secs)])].sort((a, b) => a - b);
        return durations.map(s => {
            const actual = stats.ftp.powerCurve.find(p => p.secs === s);
            const modeled = stats.ftp.modeledCurve.find(p => p.secs === s);
            return { name: formatInterval(s), secs: s, actual: actual?.power || null, modeled: modeled?.power || null };
        });
    }, [stats.ftp]);

    // ── Pre-process Power Profile Chart Data based on selection ──
    const ppChartData = useMemo(() => {
        if (!stats.powerProfile) return [];
        const { userPoints, references, weight, eFTP } = stats.powerProfile;
        
        // Final durations to show: map from userPoints + handle 'eftp'
        const durationsToShow = userPoints.filter(p => selectedDurs.has(p.duration));
        
        let data = durationsToShow.map(p => {
            const entry = { name: p.label, duration: p.duration };
            const factor = powerUnit === 'w' ? weight : 1;
            
            entry['Usuario'] = powerUnit === 'w' ? p.power : p.wKg;
            
            references.forEach(ref => {
                const key = p.duration === 5 ? '5s' : p.duration === 15 ? '15s' : p.duration === 30 ? '30s' : 
                          p.duration === 60 ? '60s' : formatInterval(p.duration);
                // The references are in W/kg, we scale them if unit is 'w'
                entry[ref.category] = Number((ref[key] * factor).toFixed(powerUnit === 'w' ? 0 : 2));
            });
            return entry;
        });

        // Add eFTP point if selected
        if (selectedDurs.has('eftp')) {
            const entry = { name: 'eFTP', duration: 3601 }; // Sort after 60m
            const factor = powerUnit === 'w' ? weight : 1;
            entry['Usuario'] = powerUnit === 'w' ? eFTP : Number((eFTP / weight).toFixed(2));
            
            references.forEach(ref => {
                // eFTP is often compared to 60m benchmark
                entry[ref.category] = Number((ref['60m'] * factor).toFixed(powerUnit === 'w' ? 0 : 2));
            });
            data.push(entry);
        }

        return data.sort((a, b) => a.duration - b.duration);
    }, [stats.powerProfile, powerUnit, selectedDurs]);

    const toggleDur = (d) => {
        const next = new Set(selectedDurs);
        if (next.has(d)) next.delete(d); else next.add(d);
        setSelectedDurs(next);
    };

    const configFTP = Number(settings?.bike?.ftp) || 0;
    const ftpDiff = stats.ftp.eFTP && configFTP ? stats.ftp.eFTP - configFTP : null;

    return (
        <div className="animate-in fade-in duration-500 pb-16 w-full max-w-[1100px] mx-auto px-4 sm:px-8">
            {/* Header */}
            <div className="pt-8 pb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Rendimiento</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1.5 opacity-80">Perfil fisiológico avanzado y recuperación</p>
            </div>

            {/* ── 1. ESTADO DE ENTRENO ────────────────────────────────── */}
            {stats.trainingStatus && (
                <section className="mb-8">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Estado de Entreno</h3>
                                <InfoTooltip text="Basado en tu carga acumulada (CTL) y fatiga (ATL) de los últimos 28 días." />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 rounded-2xl" style={{ backgroundColor: `${stats.trainingStatus.color}10`, color: stats.trainingStatus.color }}>
                                        <TrendingUp size={32} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{stats.trainingStatus.status}</h4>
                                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">{stats.trainingStatus.desc}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-12 md:pl-10 md:border-l border-slate-100 dark:border-zinc-800">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga (7d)</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{stats.trainingStatus.load7}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TSB</p>
                                    <p className={`text-xl font-bold ${stats.trainingStatus.tsb > 10 ? 'text-emerald-500' : stats.trainingStatus.tsb < -10 ? 'text-orange-500' : 'text-slate-400'}`}>
                                        {stats.trainingStatus.tsb > 0 ? '+' : ''}{stats.trainingStatus.tsb}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── 2. ESTADO DE VFC (HRV) ───────────────────────────────── */}
            {stats.hrv && (
                <section className="mb-8">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Estado de VFC</h3>
                                <InfoTooltip text="La Variabilidad de Frecuencia Cardíaca (RMSSD) indica tu recuperación real. " />
                            </div>
                            {stats.hrv.source === 'garmin' && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800/50">
                                    <ShieldCheck size={10} className="text-blue-500" />
                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Sincronizado con Garmin</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-zinc-100">{stats.hrv.rmssd}</span>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">ms</span>
                                    <div className="ml-4 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border shadow-sm" style={{ backgroundColor: `${stats.hrv.color}10`, color: stats.hrv.color, borderColor: `${stats.hrv.color}20` }}>
                                        {stats.hrv.state}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed max-w-sm">{stats.hrv.msg}</p>
                                
                                <div className="mt-8 space-y-3">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.hrv.rmssd / stats.hrv.baseline) * 80)}%` }} />
                                    </div>
                                    <div className="flex justify-between px-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                                        <span>Bajo</span>
                                        <span>Personal: {stats.hrv.baseline}ms</span>
                                        <span>Alto</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Stress Score</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">{stats.hrv.stress}</span>
                                            <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                                        </div>
                                    </div>
                                    <Brain size={24} className="text-slate-300 dark:text-zinc-700" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${stats.hrv.stress > 60 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-tight">
                                        {stats.hrv.stress > 60 ? 'Necesitas recuperación' : 'Cuerpo listo para entrenar'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── 3. PRONÓSTICO DE CARRERA ─────────────────────────────── */}
            {stats.racePredictions && (
                <section className="mb-8">
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-8">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Pronóstico de Carrera</h3>
                            <InfoTooltip text="Predicción teórica basada en tu VO2max actual." />
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.racePredictions.map(r => (
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
            )}

            {/* ── 4. VO2 MÁXIMO ────────────────────────────────────────── */}
            <section className="mb-8">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">VO2 Máximo</h3>
                        </div>
                        <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                            {['run', 'bike'].map(s => (
                                <button key={s} onClick={() => setVo2Sport(s)} className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${vo2Sport === s ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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
                                {c: 'bg-red-400', p: '20%'}, {c: 'bg-orange-400', p: '20%'}, 
                                {c: 'bg-emerald-400', p: '20%'}, {c: 'bg-blue-400', p: '20%'}, 
                                {c: 'bg-purple-400', p: '20%'} 
                            ].map((s, idx) => (
                                <div key={idx} className={`${s.c} opacity-30`} style={{ width: s.p }} />
                            ))}
                        </div>
                        {currentVo2 > 0 && (
                            <div className="absolute top-1.5 h-2.5 w-1 rounded-full bg-slate-900 dark:bg-white transition-all duration-1000 z-10"
                                style={{ left: `${Math.min(98, Math.max(2, currentVo2 <= 35 ? (currentVo2 - 25) / 10 * 20 : currentVo2 <= 42 ? 20 + (currentVo2 - 35) / 7 * 20 : currentVo2 <= 50 ? 40 + (currentVo2 - 42) / 8 * 20 : currentVo2 <= 60 ? 60 + (currentVo2 - 50) / 10 * 20 : 80 + Math.min((currentVo2 - 60) / 10 * 20, 20)))}%` }} />
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
                             <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{stats.vo2.run.vo2max > 0 ? stats.vo2.run.vo2max : '--'}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50">
                             <div className="flex items-center gap-2 mb-1.5">
                                <Bike size={12} className="text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VO2 Bici</span>
                             </div>
                             <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{stats.vo2.bike.vo2max > 0 ? stats.vo2.bike.vo2max : '--'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 5. BALANCE DE ENTRENAMIENTO ─────────────────────────── */}
            <section className="mb-8">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Balance de Entrenamiento</h3>
                            <InfoTooltip text="Distribución de la carga en los últimos días según intensidad." />
                        </div>
                        <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                            {[{l:'7D', v:7}, {l:'30D', v:30}, {l:'90D', v:90}].map(p => (
                                <button key={p.v} onClick={() => setBalanceDays(p.v)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${balanceDays === p.v ? 'bg-white dark:bg-zinc-700 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {p.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {stats.balance && !stats.balance.empty ? (
                        <div className="space-y-10">
                           <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carga Total</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{Math.round(stats.balance.totalLoad)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ratio An/Ae</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{(stats.balance.anaerobic / (stats.balance.aerobicHigh + stats.balance.aerobicLow || 1)).toFixed(2)}</p>
                                </div>
                           </div>

                            <div className="space-y-6">
                                {[
                                    { label: 'Capacidad Anaeróbica', value: stats.balance.anaerobic, color: 'bg-purple-500' },
                                    { label: 'Aeróbico Alta Intensidad', value: stats.balance.aerobicHigh, color: 'bg-orange-500' },
                                    { label: 'Aeróbico Baja Intensidad', value: stats.balance.aerobicLow, color: 'bg-emerald-500' }
                                ].map((b, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-tight">{b.label}</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-zinc-200">{Math.round(b.value)} <span className="text-[8px] text-slate-400">TSS</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-800/50">
                                            <div className={`h-full ${b.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${(b.value / (stats.balance.totalLoad || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 rounded-3xl bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 flex items-start gap-5 shadow-sm">
                                <Zap size={28} className="text-blue-500 mt-1 shrink-0" fill="currentColor" opacity={0.2} strokeWidth={2.5} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm" style={{ backgroundColor: `${stats.balance.color}15`, color: stats.balance.color, borderColor: `${stats.balance.color}30` }}>
                                            {stats.balance.status}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-tighter bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800">
                                            {stats.balance.activityCount} Actividades
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                                        "{stats.balance.recommendation}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-3xl">
                            <Activity size={48} className="mx-auto text-slate-200 dark:text-zinc-800 mb-4 stroke-1" />
                            <p>Sin datos suficientes en el periodo</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── 6. CURVA DE POTENCIA ────────────────────────── */}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Unidad de Medida</p>
                                    <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl w-fit">
                                        {['wkg', 'w'].map(unit => (
                                            <button key={unit} onClick={() => setPowerUnit(unit)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${powerUnit === unit ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                {unit === 'wkg' ? 'W/kg' : 'Vatios'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Tiempos Visibles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[5, 60, 300, 1200, 3600, 7200].map(id => (
                                            <button key={id} onClick={() => toggleDur(id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${selectedDurs.has(id) ? 'bg-blue-500 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'}`}>
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
                            {stats.profile && (
                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {stats.profile.strengths.map((s, i) => (
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
                                            {powerUnit === 'w' ? p['Usuario'] : Math.round(p['Usuario'] * stats.powerProfile.weight)}
                                            <span className="text-[9px] ml-1 opacity-40 font-bold uppercase">W</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-500">{powerUnit === 'wkg' ? p['Usuario'] : (p['Usuario'] / stats.powerProfile.weight).toFixed(2)}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">W/kg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 7. FTP ESTIMADO (eFTP) ───────────────────────────── */}
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
                                <span className="text-4xl font-bold tracking-tighter text-slate-900 dark:text-zinc-100 leading-none">{stats.ftp.eFTP || '--'}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vatios</span>
                             </div>
                             {stats.ftp.wPerKg && (
                                <p className="text-2xl font-bold text-amber-500 tracking-tighter mt-3">{stats.ftp.wPerKg} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">W/kg</span></p>
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
                                        <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <RechartsTooltip contentStyle={tooltipStyle} isAnimationActive={false} />
                                        <Area type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={3} fill="url(#ftpGradFinal)" dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} connectNulls isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase tracking-widest bg-slate-50/30 dark:bg-zinc-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800/50">No hay datos de potencia</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
