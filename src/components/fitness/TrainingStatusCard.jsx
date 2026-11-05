import React from 'react';
import { TrendingUp } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { Card } from '../ui/Card';

export const TrainingStatusCard = ({ trainingStatus }) => {
  if (!trainingStatus) return null;

  const statusColor = trainingStatus.tsb > 10 ? '#10b981' : trainingStatus.tsb < -10 ? '#f97316' : '#6b7280';

  return (
    <section className="mb-8">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Estado de Entreno</h3>
            <InfoTooltip text="Basado en tu carga acumulada (CTL) y fatiga (ATL) de los últimos 28 días." />
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${statusColor}10`, color: statusColor }}>
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{trainingStatus.status}</h4>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{trainingStatus.desc}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-12 md:pl-10 md:border-l border-slate-200 dark:border-zinc-800">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga (7d)</p>
              <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{trainingStatus.load7}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TSB</p>
              <p className={`text-xl font-bold ${trainingStatus.tsb > 10 ? 'text-emerald-600 dark:text-emerald-400' : trainingStatus.tsb < -10 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                {trainingStatus.tsb > 0 ? '+' : ''}{trainingStatus.tsb}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
