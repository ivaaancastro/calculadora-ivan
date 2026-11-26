import React, { memo } from 'react';
import { X } from 'lucide-react';
import { formatPace, formatDuration } from '../../../utils/formatters';
import { useCursor, useCursorStore } from './cursorStore';

const rawTimeOf = (p) => (p ? p.rawTime : null);

/** Posición señalada (tiempo · km) y «Quitar»; sin cursor, una pista de uso. */
function CursorReadout() {
    const store = useCursorStore();
    const point = useCursor();
    if (!point) {
        return <p className="text-[12px] text-ink-4">Pasa el cursor o el dedo por las gráficas</p>;
    }
    return (
        <div className="flex items-center gap-2">
            <span data-detail="cursor" className="font-mono text-[12px] font-semibold tabular-nums text-ink">
                {formatDuration(point.rawTime)}
                {point.distanceKm !== null && <span className="text-ink-4"> · {point.distanceKm} km</span>}
            </span>
            <button
                type="button"
                aria-label="Quitar el punto señalado"
                onClick={() => store.set(null, { immediate: true })}
                className="w-8 h-8 max-md:w-11 max-md:h-11 -my-2 flex items-center justify-center rounded-full text-ink-4 hover:text-ink hover:bg-surface-2 active:scale-press transition-paint"
            >
                <X size={14} />
            </button>
        </div>
    );
}

const PEAK_TONE = {
    hr: { on: 'bg-hr text-white border-hr-strong', off: 'text-hr-ink border-hr-edge hover:bg-hr-tint' },
    power: { on: 'bg-power text-white border-power-strong', off: 'text-power-ink border-power-edge hover:bg-power-tint-2' },
    speed: { on: 'bg-speed text-white border-speed-strong', off: 'text-speed-ink border-speed-edge hover:bg-speed-tint' },
    alt: { on: 'bg-inverse-2 text-ink-inverse border-line-strong', off: 'text-body-soft-2 border-line hover:bg-sunken-9' },
};

/** Picos del entrenamiento: llevan el cursor a ese punto. */
function PeakChips({ peaks, isPaceBased }) {
    const store = useCursorStore();
    const activeTime = useCursor(rawTimeOf);
    const speedPt = isPaceBased ? peaks.bestPacePt : peaks.maxSpeedPt;
    const items = [
        peaks.maxHrPt && { id: 'hr', pt: peaks.maxHrPt, label: 'Pico FC', value: `${peaks.maxHrPt.hr} bpm` },
        peaks.maxWattsPt && { id: 'power', pt: peaks.maxWattsPt, label: 'Pico W', value: `${peaks.maxWattsPt.watts} W` },
        speedPt && { id: 'speed', pt: speedPt, label: isPaceBased ? 'Mejor ritmo' : 'Vel. máx.', value: isPaceBased ? formatPace(speedPt.pace) : `${speedPt.speed} km/h` },
        peaks.maxAltPt && { id: 'alt', pt: peaks.maxAltPt, label: 'Cima', value: `${peaks.maxAltPt.alt} m` },
    ].filter(Boolean);
    if (!items.length) return null;
    return (
        <div data-detail="peaks" className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {items.map(({ id, pt, label, value }) => {
                const on = activeTime === pt.rawTime;
                return (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => store.set(pt, { immediate: true })}
                        className={`min-h-[32px] max-md:min-h-[44px] px-3 rounded-full text-[12px] font-semibold shrink-0 border transition-paint active:scale-press flex items-center gap-1.5 ${on ? PEAK_TONE[id].on : `bg-surface-card ${PEAK_TONE[id].off}`}`}
                    >
                        <span>{label}</span>
                        <span className="font-mono tabular-nums">{value}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Cabecera de la tarjeta de gráficas: la posición del cursor y los picos, junto a lo que
 * controlan (RF-D3). Sustituye al antiguo HUD, que repetía las lecturas de cada pista.
 */
export const TelemetryPanel = memo(function TelemetryPanel({ peaks, isPaceBased }) {
    return (
        <div data-detail="telemetry" className="px-4 md:px-6 pt-4 md:pt-5 pb-3 space-y-3 border-b border-hairline">
            <div className="flex items-center justify-between gap-3 min-h-[32px]">
                <h3 className="text-sm font-semibold text-ink">Telemetría</h3>
                <CursorReadout />
            </div>
            {peaks && <PeakChips peaks={peaks} isPaceBased={isPaceBased} />}
        </div>
    );
});
