import React, { memo } from 'react';
import { Bike, Footprints, Mountain, Dumbbell, Activity as ActivityIcon, ArrowUpRight } from 'lucide-react';
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
 * Héroe del detalle, como Strava (RF-D5): en escritorio, el mapa grande a la izquierda y el
 * título y las cifras clave a la derecha; en móvil, primero el mapa y después las cifras. Sin
 * mapa (fuerza, natación…) las cifras ocupan todo el ancho: la rejilla se recompone.
 */
export const DetailHero = memo(function DetailHero({ activity, dateStr, metrics, themeColor, map }) {
    const sport = detectSportType(activity.type);
    const { label, icon: Icon } = SPORT_META[sport] || SPORT_META.generic;
    const { hero, rest } = pickHeroMetrics(sport, metrics);
    return (
        <section
            data-detail="hero"
            className={`grid gap-6 lg:gap-8 ${map ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : ''}`}
        >
            {map && (
                <div data-detail="map" className="h-[260px] sm:h-[340px] lg:h-auto lg:min-h-[440px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-card">
                    {map}
                </div>
            )}

            <div
                className="hero-rule relative pt-5 min-w-0 flex flex-col gap-5 [font-feature-settings:'tnum'_1,'cv11'_1,'ss03'_1]"
                style={{ '--hero-accent': themeColor }}
            >
                <div className="space-y-2">
                    <p data-detail="eyebrow" className="motion-safe:animate-rise flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        <Icon size={14} strokeWidth={2.25} style={{ color: themeColor }} aria-hidden="true" />
                        <span>{label}</span>
                        <span aria-hidden="true" className="text-ink-4">·</span>
                        <span className="font-mono normal-case tracking-normal font-medium text-ink-4 truncate">{dateStr}</span>
                    </p>
                    <h1 data-detail="title" className="motion-safe:animate-rise motion-safe:[animation-delay:0.05s] text-[26px] sm:text-[32px] leading-[1.1] font-bold tracking-[-0.03em] text-ink [text-wrap:balance]">
                        {activity.name || activityTypeLabel(activity.type)}
                    </h1>
                    {activity.strava_id && (
                        <a
                            data-detail="strava"
                            href={`https://www.strava.com/activities/${activity.strava_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 min-h-[32px] max-md:min-h-[44px] text-[12px] font-semibold text-ink-3 hover:text-ink transition-colors"
                        >
                            Ver en Strava <ArrowUpRight size={14} className="text-strava" aria-hidden="true" />
                        </a>
                    )}
                </div>

                {hero.length > 0 && (
                    <div data-detail="figures" style={{ gridTemplateColumns: `repeat(${hero.length}, minmax(0, 1fr))` }} className="grid [&>*+*]:border-l [&>*+*]:border-line">
                        {hero.map((m) => (
                            <MetricTooltip key={m.id} metricId={m.metricId}>
                                <div data-detail="figure" className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5 lg:px-4 motion-safe:animate-rise motion-safe:[animation-delay:0.12s]">
                                    <div className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-4 truncate">{m.label}</div>
                                    <div className="mt-1.5 flex items-baseline gap-1 min-w-0">
                                        <span className={`text-[28px] sm:text-[40px] ${map ? 'lg:text-[34px] xl:text-[38px]' : 'lg:text-[44px]'} leading-none font-semibold tracking-[-0.04em] tabular-nums truncate ${m.accent || 'text-ink'}`}>{m.value}</span>
                                        {m.unit && <span className="text-[12px] font-medium text-ink-4 shrink-0">{m.unit}</span>}
                                    </div>
                                </div>
                            </MetricTooltip>
                        ))}
                    </div>
                )}

                {rest.length > 0 && (
                    <div data-detail="stats" className={`grid grid-cols-2 gap-x-6 ${map ? '' : 'sm:grid-cols-3 xl:grid-cols-4'}`}>
                        {rest.map((m) => (
                            <MetricTooltip key={m.id} metricId={m.metricId}>
                                <div data-detail="ledger-row" className="flex items-baseline justify-between gap-3 py-2.5 border-b border-hairline min-w-0">
                                    <span className="text-[12px] font-medium text-ink-3 truncate">{m.label}</span>
                                    <span className="flex items-baseline gap-1 shrink-0">
                                        <span className={`text-sm font-semibold tabular-nums ${m.accent || 'text-ink'}`}>{m.value}</span>
                                        {m.unit && <span className="text-2xs font-medium text-ink-4">{m.unit}</span>}
                                    </span>
                                </div>
                            </MetricTooltip>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
});
