import React from 'react';
import { Activity, Zap, Moon, ActivitySquare, Footprints, Wind, TrendingUp, Scale, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { Card, SectionHeader } from '../ui';
import { Sparkline } from '../charts/Sparkline';
import { useChartTheme } from '../charts/useChartTheme';
import { biomarkerStatus, orderByAttention, lastSeries, BIOMARKER_KEYS } from './biomarkerStatus';
import { formatNumber } from '../../utils/formatters';

const fmt = (v, d = 0) => (typeof v === 'number' ? formatNumber(v, d) : '--');
const numOrDash = (v) => (v === undefined || v === null || v === '--' ? '--' : v);

/** Biomarcadores (spec §3.1.4): jerarquía por estado, variación y sparkline de 7 días. */
export const BiomarkersGrid = ({ wellnessMetrics: wm }) => {
    const ct = useChartTheme();
    const st = biomarkerStatus(wm);
    const cd = wm?.chartData;
    const sparkOf = (field) => lastSeries(cd, field);

    const defs = {
        rhr: { label: 'FC Reposo', icon: Activity, value: typeof wm?.latestRhr === 'number' ? Math.round(wm.latestRhr) : '--', unit: 'lpm', sub: `Base: ${typeof wm?.baselineRhr === 'number' ? Math.round(wm.baselineRhr) : '--'}`, spark: sparkOf('rhr'), color: ct.series.hr, deltaUnit: '' },
        hrv: { label: 'VFC anoche', icon: Zap, value: numOrDash(wm?.latestHrv), unit: 'ms', sub: `7d: ${numOrDash(wm?.avgHrv7d)} ms`, spark: sparkOf('hrv'), color: ct.series.ef, deltaUnit: '' },
        sleep: { label: 'Sueño', icon: Moon, value: numOrDash(wm?.latestSleep), unit: 'h', sub: `Score: ${wm?.latestSleepScore ?? '--'}%`, spark: sparkOf('sleep'), color: ct.series.sleep },
        tsb: { label: 'Forma TSB', icon: ActivitySquare, value: typeof wm?.currentTsb === 'number' ? (wm.currentTsb > 0 ? '+' : '') + Math.round(wm.currentTsb) : '--', unit: '', sub: 'Equilibrio de fatiga', spark: [], color: ct.series.tsb },
        steps: { label: 'Pasos', icon: Footprints, value: typeof wm?.latestSteps === 'number' ? wm.latestSteps.toLocaleString('es-ES') : numOrDash(wm?.latestSteps), unit: '', sub: 'Objetivo 10.000', spark: sparkOf('steps'), color: ct.series.cadence },
        spo2: { label: 'SpO₂', icon: Wind, value: fmt(wm?.latestSpo2), unit: '%', sub: 'Saturación', spark: [], color: ct.series.ef },
        vo2: { label: 'VO₂max', icon: TrendingUp, value: fmt(wm?.latestVo2max, 1), unit: 'ml/kg', sub: 'Del dispositivo (Intervals.icu)', spark: [], color: ct.series.ef },
        weight: { label: 'Peso', icon: Scale, value: numOrDash(wm?.latestWeight), unit: 'kg', sub: wm?.weightTrend != null ? '7 días' : 'Estable', spark: sparkOf('weight'), color: ct.series.power },
    };

    return (
        <div>
            <SectionHeader as="p">Biomarcadores Clave</SectionHeader>
            <div data-health="biomarkers" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {orderByAttention(BIOMARKER_KEYS, st).map((key) => {
                    const d = defs[key];
                    const s = st[key];
                    const Icon = d.icon;
                    const good = s.delta === null || s.delta === 0 ? null : (s.delta < 0) === (s.goodDir === 'down');
                    return (
                        <Card key={key} data-health="biomarker" data-status={s.status} variant={s.status === 'attention' ? 'biomarker-attention' : 'biomarker'} figures="tnum" className="p-3.5 sm:p-4 flex flex-col justify-between gap-3 min-h-[112px] motion-safe:animate-rise-slow motion-safe:odd:[animation-delay:0.3s] motion-safe:even:[animation-delay:0.36s]">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-4 flex items-center gap-1.5">
                                    <Icon size={13} strokeWidth={2.25} aria-hidden="true" />{d.label}
                                </span>
                                {s.status === 'attention' && (
                                    <span data-health="status-chip" className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-[0.05em] text-warning-ink">
                                        <AlertTriangle size={11} aria-hidden="true" />Atención
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span data-health="biomarker-value" className={`text-[28px] sm:text-[32px] leading-none font-semibold tabular-nums tracking-[-0.03em] ${s.status === 'none' ? 'text-ink-4' : 'text-ink'}`}>{d.value}</span>
                                    {d.unit && <span className="text-[12px] font-medium text-ink-4">{d.unit}</span>}
                                    {s.delta !== null && s.delta !== 0 && (
                                        <span data-health="delta" className={`inline-flex items-center text-[12px] font-semibold tabular-nums ${good ? 'text-positive' : 'text-danger'}`}>
                                            {s.delta > 0 ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />}{Math.abs(s.delta)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end justify-between gap-2 mt-2">
                                    <span className="text-[12px] font-medium text-ink-4">{s.status === 'none' ? 'Sin dato reciente' : d.sub}</span>
                                    {d.spark.length >= 2 && <Sparkline values={d.spark} color={d.color} width={64} height={24} label={`Tendencia de ${d.label}`} />}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
