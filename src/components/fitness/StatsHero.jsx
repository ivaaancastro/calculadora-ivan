import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { buildStatsNarrative } from '../../utils/statsNarrative';

/** Héroe «Hoy» de Rendimiento: narrativa + KPI protagonistas. */
export const StatsHero = ({ trainingStatus, hrv, ftpDiff, eFTP }) => {
    const { text, kpis } = buildStatsNarrative({ trainingStatus, hrv, ftpDiff, eFTP });
    if (kpis.length === 0) return null;
    return (
        <section data-stats="hero" aria-label="Resumen de hoy" style={{ '--hero-accent': trainingStatus?.color }} className="hero-rule relative mb-8 pt-5 [font-feature-settings:'tnum'_1,'cv11'_1] max-md:order-2 max-md:!mb-6">
            {text && <p data-stats="narrative" className="max-w-[62ch] m-0 mb-6 text-[18px] leading-[1.45] font-medium tracking-[-0.01em] text-ink text-pretty max-md:!text-[16px] max-md:!mb-5">{text}</p>}
            <dl data-stats="kpis" className="grid grid-cols-2 gap-y-5 gap-x-0 m-0 md:grid-cols-4">
                {kpis.map((k) => (
                    <div key={k.id} data-stats="kpi" data-tone={k.tone} className="px-4 border-l border-line odd:pl-0 odd:border-l-0 md:odd:pl-4 md:odd:border-l md:first:!pl-0 md:first:!border-l-0 motion-safe:animate-rise motion-safe:[&:nth-child(2)]:[animation-delay:60ms] motion-safe:[&:nth-child(3)]:[animation-delay:120ms] motion-safe:[&:nth-child(4)]:[animation-delay:180ms]">
                        <dt className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-4">{k.label}</dt>
                        <dd className="m-0">
                            <span data-stats="kpi-value" className="text-[36px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.04em]">{k.value}</span>
                            {k.unit && <span data-stats="kpi-unit" className="ml-1 text-[13px] font-medium opacity-60">{k.unit}</span>}
                        </dd>
                        <dd data-stats="kpi-context" className={`flex items-center gap-0.5 m-0 text-[12px] font-medium ${k.tone === 'up' ? 'text-positive-ink' : k.tone === 'down' ? 'text-danger-ink' : 'opacity-75'}`}>
                            {k.tone === 'up' && <ArrowUpRight size={12} aria-hidden="true" />}
                            {k.tone === 'down' && <ArrowDownRight size={12} aria-hidden="true" />}
                            {k.context}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};
