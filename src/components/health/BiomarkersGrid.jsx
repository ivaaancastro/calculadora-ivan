import React from 'react';
import {
    Moon, Activity, Zap, ActivitySquare, Scale, Footprints, Wind, TrendingDown, TrendingUp, Minus
} from 'lucide-react';
import { Card, SectionHeader } from '../ui';
import { useUiMode } from '../../hooks/useUiMode';
import { BiomarkersGridV2 } from './BiomarkersGridV2';

export const BiomarkersGrid = ({ wellnessMetrics }) => {
    const { isV2 } = useUiMode();
    if (isV2) return <BiomarkersGridV2 wellnessMetrics={wellnessMetrics} />;
    return (
    <>
        <div>
            <SectionHeader as="p">Biomarcadores Clave</SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {/* FC Reposo */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">FC Reposo</span>
                        <div className="w-6 h-6 rounded-lg bg-hr/10 text-hr flex items-center justify-center shrink-0">
                            <Activity size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-ink">
                                {wellnessMetrics?.latestRhr !== '--' ? Math.round(wellnessMetrics?.latestRhr) : '--'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">lpm</span>
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            Base: {wellnessMetrics?.baselineRhr !== '--' ? Math.round(wellnessMetrics?.baselineRhr) : '--'}
                        </span>
                    </div>
                </Card>

                {/* VFC / HRV */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">VFC Anoche</span>
                        <div className="w-6 h-6 rounded-lg bg-hrv/10 text-hrv flex items-center justify-center shrink-0">
                            <Zap size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                wellnessMetrics?.hrvStatus === 'unbalanced' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                                {wellnessMetrics?.latestHrv || '--'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">ms</span>
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            7d: {wellnessMetrics?.avgHrv7d || '--'} ms
                        </span>
                    </div>
                </Card>

                {/* Sueño Horas */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Sueño</span>
                        <div className="w-6 h-6 rounded-lg bg-sleep/10 text-sleep flex items-center justify-center shrink-0">
                            <Moon size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-ink">
                                {wellnessMetrics?.latestSleep || '--'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">h</span>
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            Score: {wellnessMetrics?.latestSleepScore ?? '--'}%
                        </span>
                    </div>
                </Card>

                {/* Forma TSB */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Forma TSB</span>
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <ActivitySquare size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                typeof wellnessMetrics?.currentTsb !== 'number' ? 'text-slate-400' :
                                wellnessMetrics.currentTsb < -25 ? 'text-rose-500' :
                                wellnessMetrics.currentTsb < -10 ? 'text-amber-500' :
                                wellnessMetrics.currentTsb > 5 ? 'text-blue-500' : 'text-emerald-500'
                            }`}>
                                {typeof wellnessMetrics?.currentTsb === 'number' ? (wellnessMetrics.currentTsb > 0 ? '+' : '') + Math.round(wellnessMetrics.currentTsb) : '--'}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            Equilibrio fatiga
                        </span>
                    </div>
                </Card>

                {/* Pasos */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Pasos</span>
                        <div className="w-6 h-6 rounded-lg bg-steps/10 text-steps flex items-center justify-center shrink-0">
                            <Footprints size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-ink">
                                {typeof wellnessMetrics?.latestSteps === 'number'
                                    ? wellnessMetrics.latestSteps.toLocaleString('es-ES')
                                    : (wellnessMetrics?.latestSteps && wellnessMetrics.latestSteps !== '--' ? wellnessMetrics.latestSteps : '--')}
                            </span>
                        </div>
                        {typeof wellnessMetrics?.latestSteps === 'number' && wellnessMetrics.latestSteps > 0 && (
                            <div className="w-full mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-steps rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (wellnessMetrics.latestSteps / 10000) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* SpO2 */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">SpO₂ Oxígeno</span>
                        <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                            <Wind size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-0.5">
                            <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${
                                typeof wellnessMetrics?.latestSpo2 !== 'number' ? 'text-slate-400' :
                                wellnessMetrics.latestSpo2 >= 95 ? 'text-sky-500' : 'text-amber-500'
                            }`}>
                                {typeof wellnessMetrics?.latestSpo2 === 'number' ? wellnessMetrics.latestSpo2.toFixed(0) : '--'}
                            </span>
                            {typeof wellnessMetrics?.latestSpo2 === 'number' && <span className="text-[10px] font-bold text-slate-400">%</span>}
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            Saturación
                        </span>
                    </div>
                </Card>

                {/* VO2 Max */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">VO₂ Max</span>
                        <div className="w-6 h-6 rounded-lg bg-vo2/10 text-vo2 flex items-center justify-center shrink-0">
                            <TrendingUp size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-ink">
                                {typeof wellnessMetrics?.latestVo2max === 'number' ? wellnessMetrics.latestVo2max.toFixed(1) : '--'}
                            </span>
                            {typeof wellnessMetrics?.latestVo2max === 'number' && <span className="text-[10px] font-bold text-slate-400">ml/kg</span>}
                        </div>
                        <span className="text-[10px] font-medium text-ink-4 mt-1 block">
                            Capacidad aeróbica
                        </span>
                    </div>
                </Card>

                {/* Peso */}
                <Card pressable data-health="biomarker" className="p-3.5 sm:p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Peso</span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Scale size={13} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-ink">
                                {wellnessMetrics?.latestWeight && wellnessMetrics.latestWeight !== '--' ? wellnessMetrics.latestWeight : '--'}
                            </span>
                            {wellnessMetrics?.latestWeight && wellnessMetrics.latestWeight !== '--' && <span className="text-[10px] font-bold text-slate-400">kg</span>}
                        </div>
                        {wellnessMetrics?.weightTrend != null ? (
                            <span className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${
                                wellnessMetrics.weightTrend < -0.1 ? 'text-emerald-500' :
                                wellnessMetrics.weightTrend > 0.1 ? 'text-rose-500' : 'text-slate-400'
                            }`}>
                                {wellnessMetrics.weightTrend < -0.1 ? <TrendingDown size={11} /> :
                                 wellnessMetrics.weightTrend > 0.1 ? <TrendingUp size={11} /> : <Minus size={11} />}
                                {wellnessMetrics.weightTrend > 0 ? '+' : ''}{wellnessMetrics.weightTrend} kg (7d)
                            </span>
                        ) : (
                            <span className="text-[10px] font-medium text-ink-4 mt-1 block">Estable</span>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    </>
);
};
