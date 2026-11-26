import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, InfoTooltip } from '../ui';
import { tsbStateKey } from '../../utils/formState';

// Color del TSB según el estado de forma común (formState.js, BUG-6).
const TSB_TONE = { transition: 'text-legacy-tsb-up', peak: 'text-legacy-tsb-up', overload: 'text-legacy-tsb-down-2', critical: 'text-legacy-tsb-down-2' };

export const TrainingStatusCard = ({ trainingStatus }) => {
    if (!trainingStatus) return null;

    return (
        <section className="mb-8">
            <Card variant="panel" className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xs font-bold text-ink-4 uppercase tracking-[0.1em]">Estado de Entreno</h3>
                        <InfoTooltip text="Basado en tu carga acumulada (CTL) y fatiga (ATL) de los últimos 28 días." />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: `${trainingStatus.color}10`, color: trainingStatus.color }}>
                                <TrendingUp size={32} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold tracking-tight text-ink-soft">{trainingStatus.status}</h4>
                                <p className="text-sm font-medium text-ink-3 mt-0.5">{trainingStatus.desc}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-12 md:pl-10 md:border-l border-line-soft-2">
                        <div className="space-y-1">
                            <p className="text-2xs font-bold text-slate-400 uppercase tracking-[0.05em]">Carga (7d)</p>
                            <p data-metric="load7" className="text-xl font-bold text-ink-soft">{trainingStatus.load7}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xs font-bold text-slate-400 uppercase tracking-[0.05em]">TSB</p>
                            <p data-metric="tsb" className={`text-xl font-bold ${TSB_TONE[tsbStateKey(trainingStatus.tsb)] || 'text-slate-400'}`}>
                                {trainingStatus.tsb > 0 ? '+' : ''}{trainingStatus.tsb}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </section>
    );
};
