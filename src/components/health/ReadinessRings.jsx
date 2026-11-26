import React from 'react';
import {
    Moon, Battery, Zap
} from 'lucide-react';
import { Card } from '../ui';
import { AppleRingGauge } from './AppleRingGauge';

export const ReadinessRings = ({ wellnessMetrics, readinessInfo, strainInfo, sleepInfo, ct }) => (
    <>
        <div data-health="pillars" className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 max-sm:!gap-2">
            {/* ANILLO RECUPERACIÓN */}
            <Card data-health="pillar" variant="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center max-sm:grid max-sm:grid-cols-[96px_1fr] max-sm:grid-rows-[auto_auto] max-sm:gap-x-3.5 max-sm:py-2.5 max-sm:px-3.5 max-sm:text-left motion-safe:animate-rise-slow">
                <div data-health="pillar-head" className="w-full flex justify-end items-center mb-4 [&>span:first-child]:hidden max-sm:col-start-2 max-sm:row-start-1 max-sm:!mb-1 max-sm:self-end max-sm:flex-col max-sm:items-start max-sm:gap-1">
                    <span className="text-2xs font-bold uppercase tracking-[0.08em] text-ink-4">Pilar 01</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-[0.05em] ${readinessInfo.badge}`}>
                        {readinessInfo.label}
                    </span>
                </div>

                <AppleRingGauge
                    value={wellnessMetrics?.todayReadiness}
                    colorClass={readinessInfo.color}
                    strokeColor={ct.series.readiness}
                    gradientId="apple-ring-rec"
                    metric="recovery"
                    icon={Battery}
                    title="Recuperación"
                    unit="%"
                    size={160}
                    strokeWidth={14}
                />

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center max-sm:col-start-2 max-sm:row-start-2 max-sm:!mt-0 max-sm:!pt-0 max-sm:border-t-0 max-sm:text-left max-sm:self-start">
                    <p className="text-[12px] font-medium text-ink-3">
                        Disponibilidad del SNC
                    </p>
                </div>
            </Card>

            {/* ANILLO ESFUERZO / STRAIN */}
            <Card data-health="pillar" variant="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center max-sm:grid max-sm:grid-cols-[96px_1fr] max-sm:grid-rows-[auto_auto] max-sm:gap-x-3.5 max-sm:py-2.5 max-sm:px-3.5 max-sm:text-left motion-safe:animate-rise-slow motion-safe:[animation-delay:0.08s]">
                <div data-health="pillar-head" className="w-full flex justify-end items-center mb-4 [&>span:first-child]:hidden max-sm:col-start-2 max-sm:row-start-1 max-sm:!mb-1 max-sm:self-end max-sm:flex-col max-sm:items-start max-sm:gap-1">
                    <span className="text-2xs font-bold uppercase tracking-[0.08em] text-ink-4">Pilar 02</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-[0.05em] bg-rose-50 text-hr-ink dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40`}>
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

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center max-sm:col-start-2 max-sm:row-start-2 max-sm:!mt-0 max-sm:!pt-0 max-sm:border-t-0 max-sm:text-left max-sm:self-start">
                    <p className="text-[12px] font-medium text-ink-3">
                        Impacto y fatiga acumulada
                    </p>
                </div>
            </Card>

            {/* ANILLO SUEÑO */}
            <Card data-health="pillar" variant="pillar" className="p-4 sm:p-6 flex flex-col items-center justify-between relative text-center max-sm:grid max-sm:grid-cols-[96px_1fr] max-sm:grid-rows-[auto_auto] max-sm:gap-x-3.5 max-sm:py-2.5 max-sm:px-3.5 max-sm:text-left motion-safe:animate-rise-slow motion-safe:[animation-delay:0.16s]">
                <div data-health="pillar-head" className="w-full flex justify-end items-center mb-4 [&>span:first-child]:hidden max-sm:col-start-2 max-sm:row-start-1 max-sm:!mb-1 max-sm:self-end max-sm:flex-col max-sm:items-start max-sm:gap-1">
                    <span className="text-2xs font-bold uppercase tracking-[0.08em] text-ink-4">Pilar 03</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-[0.05em] bg-action-tint text-action border border-blue-200/50 dark:border-blue-900/40`}>
                        {sleepInfo.label}
                    </span>
                </div>

                <AppleRingGauge
                    value={wellnessMetrics?.latestSleepScore ?? '--'}
                    colorClass={sleepInfo.color}
                    strokeColor={ct.series.sleep}
                    gradientId="apple-ring-sleep"
                    metric="sleep"
                    icon={Moon}
                    title="Calidad Sueño"
                    unit="%"
                    size={160}
                    strokeWidth={14}
                />

                <div data-health="pillar-foot" className="mt-4 pt-3 border-t border-line-soft-4 w-full text-center max-sm:col-start-2 max-sm:row-start-2 max-sm:!mt-0 max-sm:!pt-0 max-sm:border-t-0 max-sm:text-left max-sm:self-start">
                    <p className="text-[12px] font-medium text-ink-3">
                        {wellnessMetrics?.latestSleep || '--'} horas descansadas
                    </p>
                </div>
            </Card>
        </div>
    </>
);
