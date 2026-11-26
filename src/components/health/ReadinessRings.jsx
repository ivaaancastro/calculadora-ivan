import React from 'react';
import { Moon, Zap } from 'lucide-react';
import { Card } from '../ui';
import { AppleRingGauge } from './AppleRingGauge';

/** Las etiquetas de estado llegan en mayúsculas de título («Buen Sueño»); se muestran en frase. */
const sentence = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

const Pillar =({ icon: Icon, title, status, sub, color, delay, children }) => (
    <Card data-health="pillar" variant="pillar" className={`p-card md:p-card-lg flex items-center gap-4 md:gap-6 motion-safe:animate-rise-slow ${delay}`}>
        {children}
        <div className="min-w-0 flex flex-col gap-1">
            <span data-health="ring-title" className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                <Icon size={13} strokeWidth={2.25} style={{ color }} aria-hidden="true" />{title}
            </span>
            <span data-health="pillar-status" className="text-lg font-semibold tracking-[-0.01em] text-ink">{sentence(status)}</span>
            <span className="text-[12px] text-ink-3">{sub}</span>
        </div>
    </Card>
);

/**
 * Anillos de Salud (spec Capa 6, RF-D1): Carga y Sueño, cada uno con el color de su métrica.
 * La recuperación no tiene anillo: es la cifra del héroe.
 */
export const ReadinessRings = ({ wellnessMetrics, strainInfo, sleepInfo, ct }) => {
    const hours = wellnessMetrics?.latestSleep;
    const hasHours = hours !== undefined && hours !== null && hours !== '--' && hours !== '';
    return (
        <div data-health="pillars" className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Pillar icon={Zap} title="Carga diaria" status={strainInfo.label} sub="Impacto del día, de 0 a 10" color={ct.series.strain} delay="">
                <AppleRingGauge value={strainInfo.val} max={10} digits={1} color={ct.series.strain} title="Carga diaria" />
            </Pillar>
            <Pillar icon={Moon} title="Sueño" status={sleepInfo.label} sub={hasHours ? `${hours} h descansadas` : 'Sin horas registradas'} color={ct.series.sleep} delay="motion-safe:[animation-delay:0.08s]">
                <AppleRingGauge value={wellnessMetrics?.latestSleepScore} metric="sleep" unit="%" color={ct.series.sleep} title="Calidad del sueño" />
            </Pillar>
        </div>
    );
};
