import React from 'react';
import { Activity } from 'lucide-react';
import { Button, EmptyState, Segmented, Stat } from '../ui';
import { formatNumber } from '../../utils/formatters';
import { StatsCard } from './StatsCard';

const ROWS = [
    { key: 'anaerobic', label: 'Anaeróbico', zones: 'Z6–Z7', color: 'bg-purple-500' },
    { key: 'high', label: 'Aeróbico alto', zones: 'Z3–Z5', color: 'bg-orange-500' },
    { key: 'low', label: 'Aeróbico bajo', zones: 'Z1–Z2', color: 'bg-cyan-500' },
];

const VERDICTS = {
    balanced: ['Equilibrado', 'La carga está repartida dentro de los tres objetivos.'],
    lowShort: ['Falta base', 'Incluye más sesiones fáciles, de baja intensidad.'],
    highShort: ['Falta aeróbico alto', 'Añade algo más de ritmo sostenido: tempo y umbral.'],
    anaerobicShort: ['Falta anaeróbico', 'Añade intervalos cortos y muy intensos.'],
    anaerobicOver: ['Exceso anaeróbico', 'Reduce los intervalos máximos y recupera.'],
    highOver: ['Mucho aeróbico alto', 'Baja la intensidad de parte de las sesiones.'],
    lowOver: ['Casi todo suave', 'Puedes dar más peso a las sesiones de calidad.'],
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Sesiones estimadas y fuera del reparto (RF-16). */
const coverage = ({ estimated, unclassified }) => [
    estimated > 0 && `${plural(estimated, 'sesión estimada', 'sesiones estimadas')} con la FC media`,
    unclassified > 0 && `${unclassified} sin clasificar por falta de pulso, potencia o TSS`,
].filter(Boolean).join(' · ');

/** Distribución de la carga por intensidad. El rango 7D/28D/90D va en la cabecera de la tarjeta (RF-D3). */
export const TrainingBalanceCard = ({ balance, balanceDays, setBalanceDays }) => {
    const hasData = balance && !balance.empty;
    const gaps = balance ? coverage(balance) : '';
    const [status, advice] = hasData ? VERDICTS[balance.verdict] : [];
    // Escala común de las barras: la mayor entre las cargas y el techo de cada objetivo.
    const scale = hasData ? Math.max(...ROWS.flatMap(({ key }) => [balance.values[key], balance.targets[key].max]), 1) : 1;

    return (
        <StatsCard
            id="balance"
            title="Distribución de carga"
            info="Reparte el TSS de cada sesión según el tiempo en cada zona. Cuentan carrera, bici, natación y otros deportes; no fuerza, yoga ni caminata."
            actions={
                <Segmented
                    variant="card"
                    size="md-wide"
                    aria-label="Periodo de la distribución de carga"
                    optionClassName="px-4 py-1.5"
                    value={balanceDays}
                    onChange={setBalanceDays}
                    options={[7, 28, 90].map((v) => ({ value: v, label: `${v}D`, tone: 'action-bright' }))}
                />
            }
        >
            {hasData ? (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5">
                        <div data-load="total"><Stat label="Carga clasificada" value={balance.total} unit="TSS" /></div>
                        <Stat label="Sesiones" value={balance.sessions} />
                        <div className="max-md:hidden"><Stat label="Estimadas" value={balance.estimated} sub="Con la FC media" /></div>
                    </div>

                    <ul className="m-0 p-0 list-none flex flex-col gap-5">
                        {ROWS.map(({ key, label, zones, color }) => {
                            const value = balance.values[key];
                            const pct = balance.pcts[key];
                            const target = balance.targets[key];
                            const state = pct < target.pctMin ? 'Bajo' : pct > target.pctMax ? 'Alto' : 'Óptimo';
                            return (
                                <li key={key} data-load="category">
                                    <div className="flex items-baseline justify-between gap-3 mb-2">
                                        <p className="flex flex-wrap items-baseline gap-x-2 min-w-0 text-sm font-medium text-ink">
                                            {label}
                                            <span className="text-[12px] font-normal text-ink-4">{zones}</span>
                                            <span className={`whitespace-nowrap text-[12px] font-semibold ${state === 'Óptimo' ? 'text-positive' : state === 'Alto' ? 'text-danger-ink' : 'text-ink-4'}`}>{formatNumber(pct)} % · {state.toLowerCase()}</span>
                                        </p>
                                        <p className="shrink-0 font-mono text-[12px] text-ink-4 tabular-nums whitespace-nowrap">
                                            <span data-load="value">{value} TSS</span> <span className="max-sm:hidden">· meta {target.pctMin}–{target.pctMax} %</span>
                                        </p>
                                    </div>
                                    <div className="relative h-2.5 w-full bg-surface-2 rounded-full">
                                        <div
                                            aria-hidden="true"
                                            className="absolute -top-1 -bottom-1 border border-dashed border-line-strong rounded-full z-20 pointer-events-none"
                                            style={{ left: `${(target.min / scale) * 100}%`, width: `${((target.max - target.min) / scale) * 100}%` }}
                                        />
                                        <div className={`absolute inset-y-0 left-0 ${color} rounded-full z-10`} style={{ width: `${Math.min(100, (value / scale) * 100)}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="pt-5 border-t border-line">
                        <p className="text-sm font-semibold text-ink">{status}</p>
                        <p className="mt-1 text-sm text-ink-2">{advice}</p>
                        <p data-load="note" className="mt-3 text-[12px] text-ink-3">
                            {gaps && `${gaps}. `}
                            Aproximación propia a partir del tiempo en zonas, inspirada en el «Enfoque de carga» de Garmin; su modelo (Firstbeat, basado en EPOC) es propietario y las cifras no coinciden.
                        </p>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={Activity}
                    title="Sin datos suficientes en el periodo"
                    description={gaps || 'Hacen falta sesiones con pulso o potencia.'}
                    action={balanceDays < 90 && <Button variant="secondary" onClick={() => setBalanceDays(90)}>Ver 90 días</Button>}
                />
            )}
        </StatsCard>
    );
};
