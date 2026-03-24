import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';
import {
    Activity, TrendingUp, Trophy, Zap, Timer, Gauge,
    Footprints, BarChart3, ChevronDown, Bike, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { 
    estimateFTP, estimateCyclingVO2max, predictRaceTimes, 
    calculateTrainingEffect, analyzePowerProfile, calculateDanielsPaces,
    estimateThresholdPace, calculatePowerZones, calculateFTPHistory,
    calculateFitnessScore, analyzeIntensityDistribution
} from '../../utils/fitnessStatsEngine';
import { InfoTooltip } from '../common/InfoTooltip';

const formatInterval = (secs) => { if (secs < 60) return `${secs}s`; if (secs < 3600) return `${secs / 60}m`; return `${secs / 3600}h`; };

export const FitnessStatsPage = ({ activities, settings, onSelectActivity }) => {
    const [vo2Sport, setVo2Sport] = useState('run');
    const [intensityDays, setIntensityDays] = useState(90);

    const stats = useMemo(() => {
        const today = new Date();
        const d45 = new Date(today); d45.setDate(today.getDate() - 45);
        const restHr = Number(settings.fcReposo) || 60;

        // VO2 Max — Running
        let bestRunVo2 = 0;
        activities.forEach(act => {
            const d = new Date(act.date);
            if (d < d45 || act.duration < 15) return;
            const type = String(act.type).toLowerCase();
            const isRun = type.includes('run') || type.includes('carrera');
            const speed = act.speed_avg || (act.distance && act.duration ? act.distance / (act.duration * 60) : 0);
            
            if (isRun && speed > 2.0 && act.hr_avg > restHr) {
                const max = Number(settings.run.max) || 180;
                const pct = (act.hr_avg - restHr) / (max - restHr);
                if (pct > 0 && act.hr_avg >= max * 0.55) {
                    const vo2 = ((speed * 60 * 0.2) + 3.5) / pct;
                    if (vo2 > bestRunVo2 && vo2 < 85) bestRunVo2 = vo2;
                }
            }
        });

        // VO2 Max — Cycling
        const bikeVo2Result = estimateCyclingVO2max(activities, settings);
        let bestBikeVo2 = bikeVo2Result.vo2max;
        if (bestBikeVo2 === 0 && settings.fcReposo > 30 && settings.bike.max > 120) {
            bestBikeVo2 = Number((15.3 * (settings.bike.max / settings.fcReposo) * 0.95).toFixed(1));
        }

        const ftp = estimateFTP(activities, settings);
        const vo2ForPred = bestRunVo2 > 0 ? bestRunVo2 : bestBikeVo2;
        const races = predictRaceTimes(vo2ForPred);
        const te = calculateTrainingEffect(activities, settings);
        const profile = analyzePowerProfile(ftp);
        
        // New metrics
        const danielsPaces = calculateDanielsPaces(bestRunVo2);
        const thresholdPace = estimateThresholdPace(bestRunVo2, settings);
        const powerZones = calculatePowerZones(ftp.eFTP);
        const ftpHistory = calculateFTPHistory(activities, settings);
        const intensity = analyzeIntensityDistribution(activities, settings, intensityDays);
        
        // Rough CTL calculation for Fitness Score
        const d42 = new Date(); d42.setDate(d42.getDate() - 42);
        const last42 = activities.filter(a => new Date(a.date) >= d42);
        const avgTss = last42.length > 0 ? last42.reduce((s, a) => s + (a.tss || 0), 0) / 42 : 0;
        const fitnessScore = calculateFitnessScore(vo2ForPred, ftp.wPerKg, avgTss);

        const result = {
            vo2: { run: Number(bestRunVo2.toFixed(1)), bike: bestBikeVo2 },
            bikeVo2Method: bikeVo2Result.method === 'map' ? `MAP: ${bikeVo2Result.map}W` : null,
            ftp, races, te, profile,
            danielsPaces, thresholdPace, powerZones, ftpHistory, fitnessScore, intensity
        };
        console.log('[DEBUG] Fitness Stats:', result);
        return result;
    }, [activities, settings]);

    if (!activities || activities.length === 0) return null;

    const currentVo2 = vo2Sport === 'run' ? stats.vo2.run : stats.vo2.bike;
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

            {/* ── Top Row: Fitness Score & VO2 Max ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Fitness Score */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Fitness Score</h3>
                            <InfoTooltip text="Puntuación global de forma física (0-100) combinando VO2max, potencia relativa (W/kg) y carga de entrenamiento (CTL)." />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center">
                                <svg className="w-20 h-20 transform -rotate-90">
                                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-zinc-800" />
                                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * (stats.fitnessScore?.score || 0)) / 100} strokeLinecap="round" style={{ color: stats.fitnessScore?.color, transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
                                </svg>
                                <span className="absolute text-2xl font-bold text-slate-900 dark:text-white">{stats.fitnessScore?.score || '--'}</span>
                            </div>
                            <div>
                                <span className="text-lg font-bold mb-0.5 block" style={{ color: stats.fitnessScore?.color }}>{stats.fitnessScore?.label}</span>
                                <p className="text-[10px] text-slate-400 font-medium">Capacidad fisiológica actual</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        {['vo2', 'ftp', 'ctl'].map(k => (
                            <div key={k} className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">{k === 'vo2' ? 'VO2 Max' : k === 'ftp' ? 'Potencia' : 'Carga (CTL)'}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${stats.fitnessScore?.breakdown[k] || 0}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 w-6 text-right">{stats.fitnessScore?.breakdown[k] || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VO2 Max */}
                <div className="md:col-span-2 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
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
                    <div className="mt-4 relative">
                        <div className="flex h-1.5 rounded-full overflow-hidden">
                            <div className="flex-1 bg-red-400/30" /><div className="flex-1 bg-orange-400/30" /><div className="flex-1 bg-emerald-400/30" /><div className="flex-1 bg-blue-400/30" /><div className="flex-1 bg-purple-400/30" />
                        </div>
                        {currentVo2 > 0 && (
                            <div className="absolute top-0 h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white shadow-md transition-all duration-1000"
                                 style={{ left: `${Math.min(98, Math.max(2, currentVo2 <= 35 ? (currentVo2 - 25) / 10 * 20 : currentVo2 <= 42 ? 20 + (currentVo2 - 35) / 7 * 20 : currentVo2 <= 50 ? 40 + (currentVo2 - 42) / 8 * 20 : currentVo2 <= 60 ? 60 + (currentVo2 - 50) / 10 * 20 : 80 + Math.min((currentVo2 - 60) / 10 * 20, 20)))}%` }} />
                        )}
                        <div className="flex justify-between mt-1 text-[8px] font-medium text-slate-400">
                            <span>25</span><span>35</span><span>42</span><span>50</span><span>60</span><span>70+</span>
                        </div>
                    </div>
                    <div className="flex gap-6 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Footprints size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Carrera</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.vo2.run > 0 ? stats.vo2.run : '--'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bike size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">Ciclismo</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{stats.vo2.bike > 0 ? stats.vo2.bike : '--'}</span>
                            {stats.bikeVo2Method && <span className="text-[9px] text-slate-400 ml-1">({stats.bikeVo2Method})</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── eFTP Section ────────────────────────────────────────── */}
            <section className="mb-6">
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">FTP Estimado</h3>
                        <InfoTooltip text="Umbral funcional de potencia estimado usando la curva de potencia y ratios power/FTP (enfoque FastFitness.Tips / intervals.icu). Se busca tu mejor esfuerzo máximo (3-30min) y se proyecta a 1h." />
                        {stats.ftp.method === 'ratio' && (
                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">eFTP</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Value and Diff */}
                        <div className="lg:col-span-1 border-r border-slate-100 dark:border-zinc-800 pr-8">
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{stats.ftp.eFTP || '--'}</span>
                                <span className="text-lg text-slate-400 font-medium pb-1">W</span>
                            </div>
                            {stats.ftp.wPerKg && (
                                <p className="text-lg font-semibold text-amber-500 mt-1">{stats.ftp.wPerKg} <span className="text-sm text-slate-400">W/kg</span></p>
                            )}
                            {ftpDiff !== null && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    {ftpDiff > 0 ? <ArrowUp size={12} className="text-emerald-500" /> : ftpDiff < 0 ? <ArrowDown size={12} className="text-red-500" /> : <Minus size={12} className="text-slate-400" />}
                                    <span className={`text-xs font-semibold ${ftpDiff > 0 ? 'text-emerald-500' : ftpDiff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {ftpDiff > 0 ? '+' : ''}{ftpDiff}W vs configurado ({configFTP}W)
                                    </span>
                                </div>
                            )}
                            
                            {/* eFTP Evolution Mini Chart */}
                            {stats.ftpHistory.length > 1 && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Evolución eFTP</p>
                                    <div className="h-24">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.ftpHistory}>
                                                <Line type="monotone" dataKey="eFTP" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} isAnimationActive={false} />
                                                <XAxis dataKey="label" hide />
                                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}W`, 'eFTP']} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[8px] text-slate-400">{stats.ftpHistory[0].label}</span>
                                        <span className="text-[8px] text-slate-400">{stats.ftpHistory[stats.ftpHistory.length - 1].label}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Power Curve Chart */}
                        <div className="lg:col-span-2">
                            {curveChartData.length > 0 ? (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={curveChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                                    <div className="flex items-center gap-4 justify-end mt-2">
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500 rounded-full" /><span className="text-[9px] text-slate-400 font-medium">Real</span></div>
                                        {stats.ftp.modeledCurve.length > 0 && (
                                            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-purple-500 rounded-full" style={{ borderTop: '1px dashed' }} /><span className="text-[9px] text-slate-400 font-medium">Modelo CP</span></div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-xs text-slate-400">Sin datos de potencia</div>
                            )}
                        </div>
                    </div>

                    {/* Zone Bars below chart */}
                    {stats.powerZones && (
                        <div className="grid grid-cols-7 gap-1 mt-10">
                            {stats.powerZones.map(z => (
                                <div key={z.zone} className="group relative">
                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                        <div className="h-full rounded-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: z.color, width: '100%' }} />
                                    </div>
                                    <div className="mt-2 text-center">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Z{z.zone}</span>
                                        <span className="block text-[10px] font-bold text-slate-700 dark:text-zinc-300">{z.min}W</span>
                                    </div>
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 min-w-[120px] bg-slate-900 p-2 rounded-lg text-[9px] text-white">
                                        <p className="font-bold">{z.name}</p>
                                        <p>{z.min}{z.max ? ` - ${z.max}` : '+'} W</p>
                                        <p className="text-slate-400">({Math.round(z.pctMin*100)}%-{z.pctMax ? Math.round(z.pctMax*100) : ''}%)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Training Profile: Intensity & Effect ─────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Intensity Distribution */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Distribución de Intensidad</h3>
                            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-md ml-2">
                                {[7, 30, 90].map(d => (
                                    <button key={d} onClick={() => setIntensityDays(d)} className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${intensityDays === d ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-400'}`}>
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: `${stats.intensity?.patternColor}15`, color: stats.intensity?.patternColor }}>
                            {stats.intensity?.pattern || '---'}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="flex-1 space-y-4">
                            {stats.intensity?.zones.map(z => (
                                <div key={z.name} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-medium">
                                        <span className="text-slate-500">{z.name} ({z.label})</span>
                                        <span className="text-slate-700 dark:text-zinc-300">{z.hours}h ({z.pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden lg:block w-32 text-center border-l border-slate-100 dark:border-zinc-800 pl-8">
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">{stats.intensity?.totalHours || 0}</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Horas totales</span>
                            <p className="mt-4 text-[9px] text-slate-500 leading-tight italic">"{stats.intensity?.patternDesc}"</p>
                        </div>
                    </div>
                </div>

                {/* Training Effect Summary */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Perfil de Entrenamiento</h3>
                        <InfoTooltip text="Métricas de frecuencia y carga de tus actividades recientes." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                            <TrendingUp size={16} className="text-blue-500 mb-2" />
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">{stats.te.weeklyAvg}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Sesiones / Semana</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                            <Zap size={16} className="text-amber-500 mb-2" />
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">{Math.round(stats.te.avgLoad)}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Carga Media (TSS)</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                            <Activity size={16} className="text-emerald-500 mb-2" />
                            <span className="block text-lg font-bold text-slate-900 dark:text-white capitalize">{stats.te.primarySport || '---'}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Deporte Principal</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                            <Trophy size={16} className="text-purple-500 mb-2" />
                            <span className="block text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {stats.profile?.sprint > 7 ? 'Velocista Explosivo' : stats.profile?.anaerobic > 180 ? 'Perfil Puncheur / Potencia' : 'Fondista Rodador de Resistencia'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Tipo de Corredor</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Race Predictions & Training Paces ────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Race Predictions */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Predicciones de Carrera</h3>
                        <InfoTooltip text="Tiempos estimados basados en tu VO2 Max actual (Modelo Daniels VDOT con un factor de corrección del 3% por eficiencia real)." />
                    </div>
                    <div className="space-y-4">
                        {stats.races && Object.entries(stats.races).map(([dist, time]) => (
                            <div key={dist} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-slate-500">{dist === '5k' ? '5K' : dist === '10k' ? '10K' : dist === 'media' ? '21K' : '42K'}</div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{dist === '5k' ? '5 km' : dist === '10k' ? '10 km' : dist === 'media' ? 'Media Maratón' : 'Maratón'}</span>
                                </div>
                                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daniels Training Paces */}
                <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ritmos de Entrenamiento</h3>
                        <InfoTooltip text="Ritmos sugeridos para tus sesiones según el modelo VDOT de Jack Daniels." />
                    </div>
                    
                    {stats.danielsPaces ? (
                        <div className="space-y-3">
                            {stats.danielsPaces.map(z => (
                                <div key={z.name} className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                            z.name === 'E' ? 'bg-blue-100 text-blue-600' :
                                            z.name === 'M' ? 'bg-emerald-100 text-emerald-600' :
                                            z.name === 'T' ? 'bg-orange-100 text-orange-600' :
                                            z.name === 'I' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                                        }`}>{z.name}</div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-700 dark:text-zinc-200">{z.label}</span>
                                            <span className="text-[9px] text-slate-400 font-medium">{z.desc}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-mono font-bold text-slate-900 dark:text-white">{z.pace} <span className="text-[10px] font-medium text-slate-400">min/km</span></span>
                                        <span className="text-[10px] text-slate-400 font-medium">{z.speedKmh} km/h</span>
                                    </div>
                                </div>
                            ))}

                            {/* Threshold Pace Card */}
                            {stats.thresholdPace && (
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ritmo Umbral (T)</span>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-400 font-medium leading-none mb-1">Estimado</p>
                                                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{stats.thresholdPace.pace}</p>
                                            </div>
                                            {stats.thresholdPace.configuredPace && (
                                                <div className="text-right border-l border-slate-100 dark:border-zinc-800 pl-4">
                                                    <p className="text-[9px] text-slate-400 font-medium leading-none mb-1">Configurado</p>
                                                    <p className="text-sm font-mono font-bold text-slate-500">{stats.thresholdPace.configuredPace}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">Se requiere VO2 Max de carrera</div>
                    )}
                </div>
            </div>
        </div>
    );
};
