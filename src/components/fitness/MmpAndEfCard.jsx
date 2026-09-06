import React from 'react';
import {
    ComposedChart, Area, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { MousePointer2 } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { tooltipStyle } from './fitnessConstants';
import { formatInterval, formatPace } from '../../hooks/useFitnessAnalytics';

export const MmpAndEfCard = ({
    activities,
    onSelectActivity,
    curveSport,
    setCurveSport,
    mmpTimeframe,
    setMmpTimeframe,
    curveType,
    setCurveType,
    currentCurve,
    curveColor,
    curveUnit,
    isPace,
    analytics
}) => {
    const renderCustomCurveTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={tooltipStyle} className="shadow-xl min-w-[150px]">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Pico de {label}</p>
                    <p className="text-sm font-black mb-2" style={{ color: curveColor }}>
                        {isPace ? formatPace(data.value) : data.value} <span className="text-[9px] font-bold">{curveUnit}</span>
                    </p>
                    {data.actName && (
                        <div className="border-t border-zinc-700 pt-2 mt-1">
                            <p className="text-[10px] text-zinc-200 truncate font-bold">{data.actName}</p>
                            <p className="text-[9px] text-zinc-500">{new Date(data.actDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-1 text-[8px] text-blue-400 mt-1 font-bold uppercase tracking-widest">
                                <MousePointer2 size={8} /> Clic en el punto para abrir
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderCustomEfTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isRun = curveSport === 'run';
            return (
                <div style={tooltipStyle} className="shadow-xl w-48 z-[200]">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-1.5 border-b border-slate-200/50 dark:border-zinc-700/50 pb-1">Factor de Eficiencia</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xl font-bold text-violet-500 leading-none">{data.ef}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">{isRun ? 'm/bpm' : 'w/bpm'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2 bg-zinc-800 p-2 rounded">
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">{isRun ? 'Ritmo' : 'Potencia'}</p>
                            <p className="text-xs font-bold text-zinc-200">{isRun ? data.pace : `${data.watts}w`}</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">Pulso</p>
                            <p className="text-xs font-bold text-rose-400">{data.hr} ppm</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-200/50 dark:border-zinc-700/50 pt-2 mt-1">
                        <p className="text-[11px] text-slate-700 dark:text-zinc-200 truncate font-semibold" title={data.name}>{data.name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(data.date).toLocaleDateString()}</p>
                        <div className="flex items-center gap-1 text-[9px] text-blue-500 mt-2 font-medium">
                            <MousePointer2 size={10} /> Clic en el punto para abrir
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <section className="mb-8">
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Potencial y Récords</h3>
                        <InfoTooltip text="Análisis de eficiencia aeróbica y curvas de potencia máxima" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                            <button onClick={() => setCurveSport('bike')} className={`px-4 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${curveSport === 'bike' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Ciclismo</button>
                            <button onClick={() => setCurveSport('run')} className={`px-4 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${curveSport === 'run' ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Carrera</button>
                        </div>
                        <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                            {['90d', '1y', 'all'].map(t => (
                                <button key={t} onClick={() => setMmpTimeframe(t)} className={`px-3 py-1.5 text-[8px] font-bold uppercase rounded-lg transition-all ${mmpTimeframe === t ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t === 'all' ? 'Todo' : t.toUpperCase()}</button>
                            ))}
                        </div>
                        <div className="flex gap-4 ml-2">
                            {['power', 'speed', 'hr'].map(t => (
                                <button key={t} onClick={() => setCurveType(t)} className={`text-[9px] font-bold uppercase pb-1 border-b-2 transition-all ${curveType === t ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:border-slate-300'}`}>
                                    {t === 'power' ? 'Potencia' : (t === 'speed' ? (curveSport === 'run' ? 'Ritmo' : 'Veloc.') : 'Pulso')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* EF TREND */}
                    <div className="flex flex-col lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Eficiencia Aeróbica (EF)</span>
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${curveSport === 'bike' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500'}`}>
                                {curveSport === 'bike' ? 'Potencia / FC' : 'Ritmo / FC'}
                            </div>
                            <InfoTooltip text={curveSport === 'bike' ? "Relación entre vatios medios y pulso medio. Un EF al alza indica que eres más eficiente (generas más vatios a menos pulso)." : "Relación entre velocidad (m/min) y pulso medio. Un EF al alza indica que eres más eficiente (corres más rápido a menos pulso)."} />
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analytics?.efData?.[curveSport] || []}>
                                    <defs>
                                        <linearGradient id="efGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="dateLabel" hide />
                                    <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                                    <RechartsTooltip content={renderCustomEfTooltip} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="ef" stroke="#8b5cf6" strokeWidth={3} fill="url(#efGrad)" activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                                    <Scatter
                                        dataKey="ef"
                                        fill="transparent"
                                        cursor="pointer"
                                        onClick={(data) => {
                                            const act = activities.find(a => a.id === data.id);
                                            if (act && onSelectActivity) onSelectActivity(act);
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* MMP CURVE */}
                    <div className="flex flex-col lg:col-span-1 lg:border-x border-slate-100 dark:border-zinc-800 lg:px-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Curva MMP</span>
                            <InfoTooltip text="Tu mejor potencia/ritmo para cada duración. Refleja tu perfil de capacidades y récords históricos." />
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={currentCurve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis hide reversed={isPace} domain={['auto', 'auto']} />
                                    <RechartsTooltip content={renderCustomCurveTooltip} isAnimationActive={false} />
                                    <Area type="stepAfter" dataKey="value" stroke={curveColor} strokeWidth={3} fill={curveColor} fillOpacity={0.05} dot={false} isAnimationActive={false} />
                                    <Scatter
                                        dataKey="value"
                                        fill="transparent"
                                        cursor="pointer"
                                        onClick={(data) => {
                                            if (data.actId && onSelectActivity) {
                                                const act = activities.find(a => a.id === data.actId);
                                                if (act) onSelectActivity(act);
                                            }
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* MMP PEAKS TABLE */}
                    <div className="flex flex-col lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Récords Históricos</span>
                            <InfoTooltip text="Tus mejores valores absolutos para las duraciones clave. Se actualizan automáticamente con cada actividad." />
                        </div>
                        <div className="space-y-3">
                            {[1, 60, 300, 1200].map(secs => {
                                const metricKey = curveType === 'power' ? 'pwr' : (curveType === 'speed' ? 'spd' : 'hr');
                                const pk = analytics?.peaksRecord?.[curveSport]?.[metricKey]?.[secs] || { value: 0 };
                                let displayVal = pk.value;
                                if (curveType === 'speed') {
                                    if (curveSport === 'run') displayVal = formatPace(16.6666667 / pk.value);
                                    else displayVal = (pk.value * 3.6).toFixed(1);
                                } else {
                                    displayVal = Math.round(pk.value);
                                }

                                return (
                                    <div key={secs} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/50 hover:border-blue-500/30 transition-all cursor-default">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatInterval(secs)}</span>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-800 dark:text-zinc-100">
                                                {pk.value > 0 ? displayVal : '--'}
                                                <span className="text-[9px] ml-1 font-bold text-slate-400">{curveUnit}</span>
                                            </p>
                                            {pk.actDate && <p className="text-[8px] text-slate-400 uppercase mt-0.5">{new Date(pk.actDate).toLocaleDateString()}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
