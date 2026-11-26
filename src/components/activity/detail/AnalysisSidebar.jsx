import React, { memo } from 'react';
import { Card } from '../../ui';

/** ¿La frase del Coach repite el impacto del chip? Entonces no se pinta (RF-D1). */
const repeatsImpact = (insight, te) => !!te?.primaryBenefit && insight.toLowerCase().includes(te.primaryBenefit.toLowerCase());

const Meter = ({ label, value, sub, fill }) => (
    <div className="space-y-2 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-medium text-ink-3">{label}</span>
            <span className="text-sm font-semibold font-mono tabular-nums text-ink">{value}</span>
        </div>
        <div data-detail="meter" className="h-2 bg-surface-2 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_calc(20%-1px),rgb(var(--surface))_calc(20%-1px),rgb(var(--surface))_20%)] rounded-full overflow-hidden">
            <div className={`h-full ${fill}`} style={{ width: `${(value / 5) * 100}%` }} />
        </div>
        <p className="text-[12px] text-ink-4 truncate">{sub}</p>
    </div>
);

/**
 * Impacto del entrenamiento y Coach (RF-D1): una tarjeta con dos columnas separadas por un filete. El chip de
 * impacto es el único sitio donde se nombra el beneficio; el Coach no lo repite.
 */
export const AnalysisSidebar = memo(function AnalysisSidebar({ trainingEffect, fitnessAnalysis }) {
    if (!trainingEffect) return null;
    const insights = (fitnessAnalysis?.insights || []).filter((i) => !repeatsImpact(i, trainingEffect)).slice(0, 3);
    return (
        <Card as="section" data-detail="sidebar" className={`grid ${insights.length ? 'md:grid-cols-2' : ''}`}>
            <div data-detail="impact" className="p-card md:p-card-lg space-y-5 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-semibold text-ink">Impacto del entrenamiento</h3>
                        <p className="text-[12px] text-ink-4">
                            Efecto aeróbico y anaeróbico
                            {trainingEffect.peakEpoc > 0 && <span className="font-mono tabular-nums"> · EPOC {trainingEffect.peakEpoc} ml</span>}
                        </p>
                    </div>
                    <span data-metric="impact" className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-surface-2 border ${trainingEffect.benefitColor.replace('text-', 'border-').replace('dark:', '')} ${trainingEffect.benefitColor}`}>
                        {trainingEffect.primaryBenefit}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <Meter label="Aeróbico" value={trainingEffect.aerobic} sub={trainingEffect.aerobicLabel} fill={trainingEffect.aerobic >= 3 ? 'bg-indigo-500' : 'bg-indigo-400'} />
                    <Meter label="Anaeróbico" value={trainingEffect.anaerobic} sub={trainingEffect.anaerobicLabel} fill={trainingEffect.anaerobic >= 3 ? 'bg-purple-600' : 'bg-purple-400'} />
                </div>
                <p className="pt-4 border-t border-hairline text-[13px] leading-relaxed text-body">{trainingEffect.description}</p>
            </div>

            {insights.length > 0 && (
                <div data-detail="insights" className="p-card md:p-card-lg min-w-0 border-t md:border-t-0 md:border-l border-hairline">
                    <h3 className="text-sm font-semibold text-ink mb-4">Coach Insights</h3>
                    <ol className="space-y-3">
                        {insights.map((insight, idx) => (
                            <li key={idx} className="flex gap-3">
                                <span className="font-mono text-[12px] font-semibold text-ink-4 mt-0.5 tabular-nums">0{idx + 1}</span>
                                <p className="text-[13px] leading-relaxed text-ink-3">{insight}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </Card>
    );
});
