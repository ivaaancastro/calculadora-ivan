import React from 'react';
import { Delta, Hero, Stat } from '../ui';
import { buildStatsNarrative } from '../../utils/statsNarrative';

/**
 * Resumen fijo de Rendimiento (Capa 6, PR 18; RF-D1, RF-D7). Absorbe «Estado de entreno» y
 * «Estado de VFC»: Forma (TSB) protagonista con el chip del estado de forma, la frase y, debajo,
 * Carga 7 d, VFC y Estrés. Cada cifra aparece solo aquí; las pestañas no las repiten.
 */
export const StatsHero = ({ trainingStatus, hrv }) => {
    const { text, figure, chip, sub, kpis } = buildStatsNarrative({ trainingStatus, hrv });
    if (!figure && kpis.length === 0) return null;
    return (
        <Hero
            data-stats="hero"
            aria-label="Resumen de hoy"
            className="pt-5"
            eyebrow="Hoy"
            chip={chip}
            line={text}
            sub={sub}
            label={figure?.label}
            value={figure?.value}
            metric={figure?.metric}
        >
            {kpis.length > 0 && (
                <div data-stats="kpis" className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5 pt-5 border-t border-line md:col-span-2">
                    {kpis.map((k) => (
                        <Stat
                            key={k.id}
                            data-stats="kpi"
                            label={k.label}
                            value={k.value}
                            unit={k.unit}
                            metric={k.metric}
                            delta={k.delta != null && <Delta value={k.delta} unit=" ms" size="sm" label="frente a tu base" />}
                            sub={k.sub}
                            className="min-w-0"
                        />
                    ))}
                </div>
            )}
        </Hero>
    );
};
