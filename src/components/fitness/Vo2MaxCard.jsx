import React from 'react';
import { HeartPulse } from 'lucide-react';
import { Button, EmptyState, Segmented } from '../ui';
import { VO2_SOURCES } from '../../utils/vo2Source';
import { formatNumber } from '../../utils/formatters';
import { StatsCard } from './StatsCard';

const LEVELS = ['Pobre', 'Medio', 'Bueno', 'Excelente', 'Superior'];

/** Posición (%) del VO₂max en la escala de cinco niveles. */
const levelPosition = (v) => {
    const p = v <= 35 ? (v - 25) / 10 * 20
        : v <= 42 ? 20 + (v - 35) / 7 * 20
        : v <= 50 ? 40 + (v - 42) / 8 * 20
        : v <= 60 ? 60 + (v - 50) / 10 * 20
        : 80 + Math.min((v - 60) / 10 * 20, 20);
    return Math.min(98, Math.max(2, p));
};

/**
 * VO₂max del deporte elegido: una sola cifra con su origen (COP-2) y su nivel. El selector de
 * deporte va en la cabecera de la tarjeta (RF-D3); no hay subtarjetas que repitan la cifra (RF-D1).
 */
export const Vo2MaxCard = ({ vo2Sport, setVo2Sport, currentVo2, vo2Level, hasVo2 }) => {
    const source = VO2_SOURCES[vo2Sport];
    return (
        <StatsCard
            id="vo2"
            title="VO₂max"
            actions={
                <Segmented
                    variant="card"
                    size="md-wide"
                    aria-label="Deporte del VO₂max"
                    optionClassName="px-4 py-1.5"
                    value={vo2Sport}
                    onChange={setVo2Sport}
                    options={[
                        { value: 'run', label: 'Carrera' },
                        { value: 'bike', label: 'Bici' },
                    ]}
                />
            }
        >
            {hasVo2 ? (
                <>
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                        <span data-metric="vo2max" className="text-[48px] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">{formatNumber(currentVo2, 1)}</span>
                        <div className="pb-1">
                            <p className="font-mono text-[12px] text-ink-4">ml/kg/min</p>
                            <p className="text-[13px] font-semibold" style={{ color: vo2Level.c }}>Nivel {String(vo2Level.l).toLowerCase()}</p>
                        </div>
                    </div>
                    {source?.source && <p data-fitness="vo2-source" className="mt-2 text-[12px] text-ink-4">{source.label}, {source.source}</p>}

                    <div className="relative mt-6">
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-surface-2">
                            {['bg-red-400', 'bg-orange-400', 'bg-emerald-400', 'bg-blue-400', 'bg-purple-400'].map((c) => (
                                <div key={c} className={`${c} opacity-40 w-1/5`} />
                            ))}
                        </div>
                        <div className="absolute -top-0.5 h-2.5 w-1 rounded-full bg-inverse" style={{ left: `${levelPosition(currentVo2)}%` }} />
                        <div className="flex justify-between mt-3">
                            {LEVELS.map((l) => (
                                <span key={l} className="text-[11px] font-medium text-ink-4">{l}</span>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <EmptyState
                    icon={HeartPulse}
                    title={`Sin VO₂max de ${vo2Sport === 'bike' ? 'bici' : 'carrera'}`}
                    description={vo2Sport === 'bike' ? 'Se estima con salidas con potenciómetro y pulsómetro.' : 'Se estima con carreras con pulsómetro.'}
                    action={setVo2Sport && <Button variant="secondary" onClick={() => setVo2Sport(vo2Sport === 'bike' ? 'run' : 'bike')}>Ver {vo2Sport === 'bike' ? 'carrera' : 'bici'}</Button>}
                />
            )}
        </StatsCard>
    );
};
