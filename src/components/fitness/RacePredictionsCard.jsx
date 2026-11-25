import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { Card, InfoTooltip } from '../ui';
import { getChartTheme } from '../charts/chartTheme';

const CT = getChartTheme('light');

export const RacePredictionsCard = ({ racePredictions }) => {
    if (!racePredictions) return null;

    return (
        <section className="mb-8">
            <Card variant="panel" className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-8">
                    <h3 className="text-2xs font-bold text-ink-4 uppercase tracking-[0.1em]">Pronóstico de Carrera</h3>
                    <InfoTooltip text="Predicción teórica basada en tu VO2max actual." />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {racePredictions.map(r => (
                        <div key={r.name} className="p-5 rounded-2xl bg-sunken-3 border border-line-soft group relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-2xs font-bold uppercase tracking-[0.1em] text-slate-400">{r.name}</span>
                                    <div className="mt-1 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.preparation > 80 ? CT.zones.all[2] : r.preparation > 50 ? CT.zones.all[3] : CT.zones.all[5] }} />
                                        <span className="text-2xs font-bold text-slate-400 uppercase">{r.preparation}% Prep.</span>
                                    </div>
                                </div>
                                <Trophy size={14} className={`${r.preparation > 80 ? 'text-blue-500' : 'text-slate-300'} transition-colors`} />
                            </div>
                            <p className="text-xl font-bold text-ink-soft tracking-tight">{r.time}</p>
                            <div className="flex items-center gap-1.5 mt-2.5 opacity-60">
                                <Clock size={10} className="text-slate-400" />
                                <p className="text-2xs font-bold text-slate-500 uppercase tracking-tighter">{r.pace} <span className="text-2xs opacity-70">m/km</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </section>
    );
};
