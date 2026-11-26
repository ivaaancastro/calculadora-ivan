import React from 'react';
import { Bike, Footprints, Mountain, Dumbbell, Activity as ActivityIcon } from 'lucide-react';
import { MetricTooltip } from '../../ui';
import { detectSportType, pickHeroMetrics } from '../../../utils/activityMetricsBySport';
import { activityTypeLabel } from '../../../utils/sport';

const SPORT_META = {
    bike: { label: 'Ciclismo', icon: Bike },
    run: { label: 'Carrera', icon: Footprints },
    hike: { label: 'Senderismo', icon: Mountain },
    strength: { label: 'Fuerza', icon: Dumbbell },
    generic: { label: 'Actividad', icon: ActivityIcon },
};

/**
 * Hero del detalle (spec premium-detalle §3.1): título, tres cifras protagonistas y
 * «ledger» con el resto de métricas. Sin cajas: la jerarquía sale del tamaño y el peso.
 */
export const DetailHero = ({ activity, dateStr, metrics, themeColor }) => {
    const sport = detectSportType(activity.type);
    const { label, icon: Icon } = SPORT_META[sport] || SPORT_META.generic;
    const { hero, rest } = pickHeroMetrics(sport, metrics);
    return (
        <section data-detail="hero" className="space-y-5" style={{ '--hero-accent': themeColor }}>
            <div className="space-y-2">
                <p data-detail="eyebrow" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                    <Icon size={14} strokeWidth={2.25} style={{ color: themeColor }} aria-hidden="true" />
                    <span>{label}</span>
                    <span aria-hidden="true" className="text-ink-4">·</span>
                    <span className="normal-case tracking-normal font-medium text-ink-4 capitalize">{dateStr}</span>
                </p>
                <h1 data-detail="title" className="text-[26px] sm:text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-ink [text-wrap:balance]">
                    {activity.name || activityTypeLabel(activity.type)}
                </h1>
            </div>

            {hero.length > 0 && (
                <div data-detail="figures" style={{ gridTemplateColumns: `repeat(${hero.length}, minmax(0, 1fr))` }} className="grid">
                    {hero.map((m) => (
                        <MetricTooltip key={m.id} metricId={m.metricId}>
                            <div data-detail="figure" className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5">
                                <div className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4 truncate">{m.label}</div>
                                <div className="mt-1 flex items-baseline gap-1 min-w-0">
                                    <span className={`text-[28px] sm:text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums truncate ${m.accent || 'text-ink'}`}>{m.value}</span>
                                    {m.unit && <span className="text-[11px] sm:text-sm font-medium text-ink-4 shrink-0">{m.unit}</span>}
                                </div>
                            </div>
                        </MetricTooltip>
                    ))}
                </div>
            )}

            {rest.length > 0 && (
                <div data-detail="stats" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-6">
                    {rest.map((m) => (
                        <MetricTooltip key={m.id} metricId={m.metricId}>
                            <div data-detail="ledger-row" className="flex items-baseline justify-between gap-3 py-2.5 border-b border-hairline min-w-0">
                                <span className="text-[11px] font-medium text-ink-4 truncate">{m.label}</span>
                                <span className="flex items-baseline gap-1 shrink-0">
                                    <span className={`text-[13px] font-semibold tabular-nums ${m.accent || 'text-ink'}`}>{m.value}</span>
                                    {m.unit && <span className="text-2xs font-medium text-ink-4">{m.unit}</span>}
                                </span>
                            </div>
                        </MetricTooltip>
                    ))}
                </div>
            )}
        </section>
    );
};
