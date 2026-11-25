import React from 'react';
import {
    BatteryCharging
} from 'lucide-react';
import { useCountUp } from './useCountUp';

export const EnergyBank = ({ energyBankAmount }) => {
    const counted = useCountUp(typeof energyBankAmount === 'number' ? energyBankAmount : null);
    return (
    <>
        <div data-health="energy" className="bg-surface-card rounded-2xl sm:rounded-3xl border border-hairline-3 shadow-card dark:shadow-none transition-all p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950">
            <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <BatteryCharging size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-ink uppercase tracking-tight">
                            Banco de Energía
                        </h3>
                        <p className="text-[11px] text-ink-4">
                            Nivel metabólico restante estimado para el día
                        </p>
                    </div>
                </div>

                {/* Barra estilo batería de iPhone */}
                <div data-health="energy-bar" className="w-full h-7 bg-fill-4 rounded-xl overflow-hidden p-1 relative shadow-inner">
                    <div
                        className={`h-full rounded-lg transition-all duration-1000 ${
                            energyBankAmount === '--' ? 'w-0' :
                            energyBankAmount > 60 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                            energyBankAmount > 30 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                            'bg-gradient-to-r from-rose-500 to-red-400'
                        }`}
                        style={{ width: `${energyBankAmount !== '--' ? Math.max(4, energyBankAmount) : 0}%` }}
                    />
                    <span data-health="energy-mark" style={{ left: '30%' }} aria-hidden="true" />
                    <span data-health="energy-mark" style={{ left: '60%' }} aria-hidden="true" />
                </div>
            </div>

            <div className="sm:border-l border-line-4 sm:pl-6 text-center sm:text-right shrink-0">
                <span data-health="energy-value" className={`text-4xl sm:text-5xl font-black font-mono tabular-nums tracking-tighter ${
                    energyBankAmount === '--' ? 'text-slate-400' :
                    energyBankAmount > 60 ? 'text-emerald-500' :
                    energyBankAmount > 30 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                    {energyBankAmount !== '--' ? Math.round(counted) : '--'}<span className="text-xl font-sans font-bold text-slate-400 ml-1">%</span>
                </span>
                <span className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mt-1">Disponible</span>
            </div>
        </div>
    </>
    );
};
