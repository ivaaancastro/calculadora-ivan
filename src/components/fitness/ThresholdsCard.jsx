import React from 'react';
import { InfoTooltip } from '../common/InfoTooltip';
import { Card } from '../ui';

export const ThresholdsCard = ({ settings }) => {
    return (
        <section className="mb-8">
            <Card variant="panel" className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.1em]">Umbrales Actuales</span>
                    <InfoTooltip text="Tus valores de referencia (FTP en bici, Ritmo Umbral en carrera) configurados en tu perfil." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-sunken-8 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">FTP (Bici)</p>
                        <p className="text-xl font-black text-ink-2">{settings?.bike?.ftp || '--'} <span className="text-[10px] font-bold text-slate-400">W</span></p>
                    </div>
                    <div className="bg-sunken-8 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TP (Carrera)</p>
                        <p className="text-xl font-black text-ink-2">{settings?.run?.thresholdPace || '--'} <span className="text-[10px] font-bold text-slate-400">/km</span></p>
                    </div>
                    <div className="bg-sunken-8 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">W/Kg</p>
                        <p className="text-xl font-black text-ink-2">{(settings?.bike?.ftp ? (settings.bike.ftp / (settings?.weight || 70)).toFixed(2) : '--')}</p>
                    </div>
                    <div className="bg-sunken-8 p-4 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peso</p>
                        <p className="text-xl font-black text-ink-2">{settings?.weight || '--'} <span className="text-[10px] font-bold text-slate-400">Kg</span></p>
                    </div>
                </div>
            </Card>
        </section>
    );
};
