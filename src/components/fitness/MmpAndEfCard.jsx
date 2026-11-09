import React from 'react';
import {
    ComposedChart, Area, Scatter, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { MousePointer2, RefreshCw } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { tooltipStyleFor } from './fitnessConstants';
import { formatInterval, formatPace } from '../../hooks/useFitnessAnalytics';
import { useChartTheme } from '../charts/useChartTheme';
import { Card, Segmented } from '../ui';

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
    analytics,
    peaksViewMode = 'period',
    setPeaksViewMode,
    telemetryStats,
    isLoadingHistoricalStreams,
    handleDeepSync,
    isDeepSyncing,
    deepSyncProgress
}) => {
    const ct = useChartTheme();
    const renderCustomCurveTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={tooltipStyleFor(ct)} className="shadow-xl min-w-[150px]">
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
                <div style={tooltipStyleFor(ct)} className="shadow-xl w-48 z-[200]">
                    <p className="text-xs font-semibold text-ink-3 mb-1.5 border-b border-slate-200/50 dark:border-zinc-700/50 pb-1">Factor de Eficiencia</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xl font-bold text-ef leading-none">{data.ef}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">{isRun ? 'm/bpm' : 'w/bpm'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2 bg-zinc-800 p-2 rounded">
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">{isRun ? 'Ritmo' : 'Potencia'}</p>
                            <p className="text-xs font-bold text-zinc-200">{isRun ? data.pace : `${data.watts}w`}</p>
                        </div>
                        <div>
                            <p className="text-[8px] uppercase text-zinc-500 font-bold mb-0.5">Pulso</p>
                            <p className="text-xs font-bold text-hr-soft">{data.hr} ppm</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-200/50 dark:border-zinc-700/50 pt-2 mt-1">
                        <p className="text-[11px] text-body-2 truncate font-semibold" title={data.name}>{data.name}</p>
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
            <Card variant="panel" className="p-3.5 sm:p-6 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Potencial y Récords</h3>
                            <InfoTooltip text="Análisis de eficiencia aeróbica y curvas de potencia/ritmo/FC máxima segundo a segundo" />
                        </div>

                        {telemetryStats && telemetryStats.total > 0 && (
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-fill-3 text-[9px] font-medium text-body-soft-2 border border-line-muted-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${telemetryStats.percentage >= 85 ? 'bg-emerald-500' : (telemetryStats.percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500')}`} />
                                <span>Telemetría: {telemetryStats.withStreams}/{telemetryStats.total} ({telemetryStats.percentage}%)</span>
                                <InfoTooltip text="Las curvas MMP requieren telemetría detallada. Las sincronizaciones rápidas de Strava solo traen resúmenes hasta procesar el Deep Sync." />
                            </div>
                        )}

                        {isLoadingHistoricalStreams && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-action-bright/10 text-action-bright text-[8px] font-bold uppercase tracking-wider animate-pulse">
                                <RefreshCw size={10} className="animate-spin" />
                                Cargando telemetría histórica...
                            </div>
                        )}

                        {telemetryStats && telemetryStats.withStreams < telemetryStats.total && handleDeepSync && (
                            <button
                                onClick={handleDeepSync}
                                disabled={isDeepSyncing}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-action-tint hover:bg-action-tint-hover text-action text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={10} className={isDeepSyncing ? 'animate-spin' : ''} />
                                {isDeepSyncing ? `Descargando (${deepSyncProgress?.current || 0}/${deepSyncProgress?.total || 0})...` : 'Completar telemetría'}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Segmented
                            variant="card"
                            optionClassName="px-4 py-1.5"
                            value={curveSport}
                            onChange={setCurveSport}
                            options={[
                                { value: 'bike', label: 'Ciclismo', tone: 'action' },
                                { value: 'run', label: 'Carrera', tone: 'run' },
                            ]}
                        />
                        <Segmented
                            variant="card"
                            size="sm"
                            optionClassName="px-3 py-1.5"
                            value={mmpTimeframe}
                            onChange={setMmpTimeframe}
                            options={['90d', '1y', 'all'].map((t) => ({ value: t, label: t === 'all' ? 'Todo' : t.toUpperCase() }))}
                        />
                        <div className="flex gap-4 ml-2">
                            {['power', 'speed', 'hr'].map(t => (
                                <button key={t} onClick={() => setCurveType(t)} className={`text-[9px] font-bold uppercase pb-1 border-b-2 transition-all ${curveType === t ? 'text-action-bright border-action-bright' : 'text-slate-400 border-transparent hover:border-slate-300'}`}>
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
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${curveSport === 'bike' ? 'bg-power-tint text-power-ink-2' : 'bg-sport-run-tint text-sport-run-ink-3'}`}>
                                {curveSport === 'bike' ? 'Potencia / FC' : 'Ritmo / FC'}
                            </div>
                            <InfoTooltip text={curveSport === 'bike' ? "Relación entre vatios medios y pulso medio. Un EF al alza indica que eres más eficiente (generas más vatios a menos pulso)." : "Relación entre velocidad (m/min) y pulso medio. Un EF al alza indica que eres más eficiente (corres más rápido a menos pulso)."} />
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={analytics?.efData?.[curveSport] || []}>
                                    <defs>
                                        <linearGradient id="efGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ct.series.ef} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={ct.series.ef} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 2" stroke={ct.anatomy.gridZinc} opacity={0.1} vertical={false} />
                                    <XAxis dataKey="dateLabel" hide />
                                    <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                                    <RechartsTooltip content={renderCustomEfTooltip} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="ef" stroke={ct.series.ef} strokeWidth={3} fill="url(#efGrad)" activeDot={{ r: 5, fill: ct.series.ef, strokeWidth: 2, stroke: ct.anatomy.dotRing }} isAnimationActive={false} />
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
                    <div className="flex flex-col lg:col-span-1 lg:border-x border-line-soft-2 lg:px-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Curva MMP</span>
                            <InfoTooltip text="Tu mejor potencia/ritmo para cada duración. Refleja tu perfil de capacidades y récords históricos." />
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={currentCurve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={ct.anatomy.grid2} opacity={0.3} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: ct.anatomy.tick }} axisLine={false} tickLine={false} />
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
                        <div className="flex items-center justify-between gap-2 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {peaksViewMode === 'alltime' ? 'Récords Absolutos' : `Récords (${mmpTimeframe === 'all' ? 'Todo' : mmpTimeframe.toUpperCase()})`}
                                </span>
                                <InfoTooltip text={peaksViewMode === 'alltime' ? "Tus mejores marcas de todos los tiempos en actividades con telemetría registrada." : "Tus mejores marcas dentro del periodo seleccionado arriba (90d / 1y / Todo)."} />
                            </div>
                            <Segmented
                                variant="card"
                                size="xs"
                                optionClassName="px-2 py-1"
                                value={peaksViewMode}
                                onChange={(mode) => setPeaksViewMode && setPeaksViewMode(mode)}
                                options={[
                                    { value: 'period', label: 'Periodo' },
                                    { value: 'alltime', label: 'Histórico' },
                                ]}
                            />
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
                                    <div key={secs} className="flex items-center justify-between p-3 rounded-xl bg-sunken-3 border border-slate-100 dark:border-zinc-800/50 hover:border-blue-500/30 transition-all cursor-default">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatInterval(secs)}</span>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-ink-2">
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
            </Card>
        </section>
    );
};
