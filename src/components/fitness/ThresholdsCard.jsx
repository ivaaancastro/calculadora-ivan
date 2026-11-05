import React from 'react';
import { InfoTooltip } from '../common/InfoTooltip';
import { Card } from '../ui/Card';

export const ThresholdsCard = ({ settings }) => {
  return (
    <section className="mb-8">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Umbrales Actuales</span>
          <InfoTooltip text="Tus valores de referencia (FTP en bici, Ritmo Umbral en carrera) configurados en tu perfil." />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">FTP (Bici)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{settings?.bike?.ftp || '--'} <span className="text-[11px] font-bold text-slate-400">W</span></p>
          </div>
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">TP (Carrera)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{settings?.run?.thresholdPace || '--'} <span className="text-[11px] font-bold text-slate-400">/km</span></p>
          </div>
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">W/Kg</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{settings?.bike?.ftp ? (settings.bike.ftp / (settings?.weight || 70)).toFixed(2) : '--'}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Peso</p>
            <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{settings?.weight || '--'} <span className="text-[11px] font-bold text-slate-400">Kg</span></p>
          </div>
        </div>
      </Card>
    </section>
  );
};
