import React from 'react';
import { StatsCard } from './StatsCard';

/** Preparación de cada distancia → color del punto (bien, vigilar, mal). */
const PREP_TONE = (p) => (p > 80 ? 'bg-positive' : p > 50 ? 'bg-warning' : 'bg-danger');

export const RacePredictionsCard = ({ racePredictions }) => {
    if (!racePredictions) return null;

    return (
        <StatsCard id="race" title="Pronóstico de carrera" info="Predicción teórica basada en tu VO₂max de carrera (estimado de ritmo y FC).">
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 m-0 p-0 list-none">
                {racePredictions.map((r) => (
                    <li key={r.name} className="min-w-0 border-l border-line pl-4">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">{r.name}</p>
                        <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink">{r.time}</p>
                        <p className="mt-2 font-mono text-[12px] text-ink-4 tabular-nums">{r.pace} /km</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
                            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${PREP_TONE(r.preparation)}`} />
                            {r.preparation} % preparado
                        </p>
                    </li>
                ))}
            </ul>
        </StatsCard>
    );
};
