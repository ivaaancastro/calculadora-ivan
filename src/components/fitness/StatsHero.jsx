import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { buildStatsNarrative } from '../../utils/statsNarrative';

/** Héroe «Hoy» de Rendimiento (solo v2): narrativa + KPI protagonistas. */
export const StatsHero = ({ trainingStatus, hrv, ftpDiff, eFTP }) => {
    const { text, kpis } = buildStatsNarrative({ trainingStatus, hrv, ftpDiff, eFTP });
    if (kpis.length === 0) return null;
    return (
        <section data-stats="hero" aria-label="Resumen de hoy" style={{ '--hero-accent': trainingStatus?.color }}>
            {text && <p data-stats="narrative">{text}</p>}
            <dl data-stats="kpis">
                {kpis.map((k) => (
                    <div key={k.id} data-stats="kpi" data-tone={k.tone}>
                        <dt>{k.label}</dt>
                        <dd>
                            <span data-stats="kpi-value">{k.value}</span>
                            {k.unit && <span data-stats="kpi-unit">{k.unit}</span>}
                        </dd>
                        <dd data-stats="kpi-context">
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
