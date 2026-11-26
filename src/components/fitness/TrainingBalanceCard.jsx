import React from 'react';
import { Activity } from 'lucide-react';
import { Button, EmptyState, Segmented, Stat } from '../ui';
import { formatNumber } from '../../utils/formatters';
import { StatsCard } from './StatsCard';

/** Balance de la carga por intensidad. El rango 7D/30D/90D va en la cabecera de la tarjeta (RF-D3). */
export const TrainingBalanceCard = ({ balance, balanceDays, setBalanceDays }) => {
    const hasData = balance && !balance.empty;
    const rows = hasData ? [
        { label: 'Capacidad anaeróbica', value: balance.anaerobic, color: 'bg-purple-500', target: balance.targets.anaerobic, pct: balance.pcts.anaerobic },
        { label: 'Aeróbico de alta intensidad', value: balance.aerobicHigh, color: 'bg-orange-500', target: balance.targets.high, pct: balance.pcts.high },
        { label: 'Aeróbico de baja intensidad', value: balance.aerobicLow, color: 'bg-cyan-500', target: balance.targets.low, pct: balance.pcts.low },
    ] : [];

    return (
        <StatsCard
            id="balance"
            title="Balance de entrenamiento"
            info="Distribución de la carga en los últimos días según intensidad."
            actions={
                <Segmented
                    variant="card"
                    size="md-wide"
                    aria-label="Periodo del balance"
                    optionClassName="px-4 py-1.5"
                    value={balanceDays}
                    onChange={setBalanceDays}
                    options={[7, 30, 90].map((v) => ({ value: v, label: `${v}D`, tone: 'action-bright' }))}
                />
            }
        >
            {hasData ? (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-5">
                        <Stat label="Carga total" value={Math.round(balance.totalLoad)} unit="TSS" />
                        <Stat label="Ratio anaeróbico" value={formatNumber(balance.anaerobic / (balance.aerobicHigh + balance.aerobicLow || 1), 2)} sub="Anaeróbico frente a aeróbico" />
                        <Stat label="Sesiones" value={balance.activityCount} className="max-md:hidden" />
                    </div>

                    <ul className="m-0 p-0 list-none flex flex-col gap-5">
                        {rows.map((b) => {
                            const scale = balance.maxScale || 1;
                            const status = b.pct < b.target.pctMin ? 'Bajo' : b.pct > b.target.pctMax ? 'Alto' : 'Óptimo';
                            return (
                                <li key={b.label}>
                                    <div className="flex items-baseline justify-between gap-3 mb-2">
                                        <p className="flex flex-wrap items-baseline gap-x-2 min-w-0 text-sm font-medium text-ink">
                                            {b.label}
                                            <span className={`whitespace-nowrap text-[12px] font-semibold ${status === 'Óptimo' ? 'text-positive' : status === 'Alto' ? 'text-danger-ink' : 'text-ink-4'}`}>{Math.round(b.pct)} % · {status.toLowerCase()}</span>
                                        </p>
                                        <p className="shrink-0 font-mono text-[12px] text-ink-4 tabular-nums whitespace-nowrap">
                                            {Math.round(b.value)} TSS <span className="max-sm:hidden">· meta {Math.round(b.target.min)}–{Math.round(b.target.max)}</span>
                                        </p>
                                    </div>
                                    <div className="relative h-2.5 w-full bg-surface-2 rounded-full">
                                        <div
                                            aria-hidden="true"
                                            className="absolute -top-1 -bottom-1 border border-dashed border-line-strong rounded-full z-20 pointer-events-none"
                                            style={{ left: `${(b.target.min / scale) * 100}%`, width: `${((b.target.max - b.target.min) / scale) * 100}%` }}
                                        />
                                        <div className={`absolute inset-y-0 left-0 ${b.color} rounded-full z-10`} style={{ width: `${Math.min(100, (b.value / scale) * 100)}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="pt-5 border-t border-line">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: balance.color }} aria-hidden="true" />
                            {balance.status}
                        </p>
                        <p className="mt-1 text-sm text-ink-2">{balance.recommendation}</p>
                        {balance.details && <p className="mt-1 text-[13px] text-ink-3">{balance.details}</p>}
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={Activity}
                    title="Sin datos suficientes en el periodo"
                    description="Amplía el periodo para ver tu balance de intensidad."
                    action={balanceDays < 90 && <Button variant="secondary" onClick={() => setBalanceDays(90)}>Ver 90 días</Button>}
                />
            )}
        </StatsCard>
    );
};
