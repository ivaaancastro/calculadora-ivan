import React from 'react';
import {
    Moon, Battery, Zap
} from 'lucide-react';
import { Card } from '../ui';
import { AppleRingGauge } from './AppleRingGauge';

export const ReadinessRings = ({ wellnessMetrics, readinessInfo, strainInfo, sleepInfo, ct }) => (
    <>
        <div data-health="pillars" className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* ANILLO RECUPERACIÓN */}
            <Card data-health="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center">
                <div data-health="pillar-head" className="w-full flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-4">Pilar 01</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${readinessInfo.badge}`}>
                        {readinessInfo.label}
                    </span>
                </div>

                <AppleRingGauge
                    value={wellnessMetrics?.todayReadiness}
                    colorClass={readinessInfo.color}
                    strokeColor={ct.series.readiness}
                    gradientId="apple-ring-rec"
                    icon={Battery}
                    title="Recuperación"
                    unit="%"
                    size={160}
                    strokeWidth={14}
                />

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center">
                    <p className="text-[11px] font-medium text-ink-3">
                        Disponibilidad del SNC
                    </p>
                </div>
            </Card>

            {/* ANILLO ESFUERZO / STRAIN */}
            <Card data-health="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center">
                <div data-health="pillar-head" className="w-full flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-4">Pilar 02</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40`}>
                        {strainInfo.label}
                    </span>
                </div>

                <AppleRingGauge
                    value={strainInfo.val}
                    max={10}
                    colorClass={strainInfo.color}
                    strokeColor={ct.series.strain}
                    gradientId="apple-ring-strain"
                    icon={Zap}
                    title="Carga Diaria"
                    size={160}
                    strokeWidth={14}
                />

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center">
                    <p className="text-[11px] font-medium text-ink-3">
                        Impacto y fatiga acumulada
                    </p>
                </div>
            </Card>

            {/* ANILLO SUEÑO */}
            <Card data-health="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center">
                <div data-health="pillar-head" className="w-full flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-4">Pilar 03</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40`}>
                        {sleepInfo.label}
                    </span>
                </div>

                <AppleRingGauge
                    value={wellnessMetrics?.latestSleepScore ?? '--'}
                    colorClass={sleepInfo.color}
                    strokeColor={ct.series.sleep}
                    gradientId="apple-ring-sleep"
                    icon={Moon}
                    title="Calidad Sueño"
                    unit="%"
                    size={160}
                    strokeWidth={14}
                />

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center">
                    <p className="text-[11px] font-medium text-ink-3">
                        {wellnessMetrics?.latestSleep || '--'} horas descansadas
                    </p>
                </div>
            </Card>
        </div>
    </>
);
