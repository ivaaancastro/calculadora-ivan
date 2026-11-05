import React from 'react';
import { Footprints, Bike } from 'lucide-react';
import { Card } from '../ui/Card';
import { CardTitle } from '../ui/Card';

export const Vo2MaxCard = ({ vo2Sport, setVo2Sport, currentVo2, vo2Level, vo2Stats }) => {
  return (
    <section className="mb-8">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">VO2 Máximo</CardTitle>
          </div>
          <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-lg">
            {['run', 'bike'].map(s => (
              <button
                key={s}
                onClick={() => setVo2Sport(s)}
                className={`px-3 py-1 text-[9px] font-medium uppercase tracking-wider rounded-md transition-all ${vo2Sport === s ? 'bg-[#1f2de6] text-[#ffffff]' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s === 'run' ? 'Carrera' : 'Bici'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3 mb-8">
          <span className="text-4xl font-bold tracking-tighter" style={{ color: vo2Level.c }}>{currentVo2 > 0 ? currentVo2 : '--'}</span>
          <div className="pb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ml/kg/min</span>
            <span className="block text-[10px] font-bold uppercase tracking-tight mt-0.5" style={{ color: vo2Level.c }}>Nivel {vo2Level.l}</span>
          </div>
        </div>

        <div className="relative pt-2 pb-8">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
            {[
              { c: 'bg-red-400', p: '20%' }, { c: 'bg-orange-400', p: '20%' },
              { c: 'bg-emerald-400', p: '20%' }, { c: 'bg-blue-400', p: '20%' },
              { c: 'bg-purple-400', p: '20%' }
            ].map((s, idx) => (
              <div key={idx} className={`${s.c} opacity-30`} style={{ width: s.p }} />
            ))}
          </div>
          {currentVo2 > 0 && (
            <div
              className="absolute top-1.5 h-2.5 w-1 rounded-full bg-[#0b0c0e] dark:bg-white transition-all duration-1000 z-10"
              style={{ left: `${Math.min(98, Math.max(2, currentVo2 <= 35 ? (currentVo2 - 25) / 10 * 20 : currentVo2 <= 42 ? 20 + (currentVo2 - 35) / 7 * 20 : currentVo2 <= 50 ? 40 + (currentVo2 - 42) / 8 * 20 : currentVo2 <= 60 ? 60 + (currentVo2 - 50) / 10 * 20 : 80 + Math.min((currentVo2 - 60) / 10 * 20, 20)))}%` }}
            />
          )}
          <div className="flex justify-between mt-4 px-0.5 opacity-40">
            {['Pobre', 'Medio', 'Bueno', 'Excelente', 'Superior'].map((l) => (
              <span key={l} className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{l}</span>
            ))}
          </div>
        </div>

        {/* Both sports metrics */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800/60">
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 mb-1.5">
              <Footprints size={12} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">VO2 Carrera</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{vo2Stats?.run?.vo2max > 0 ? vo2Stats.run.vo2max : '--'}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#eef0f3] dark:bg-[#17181a] border border-slate-200 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 mb-1.5">
              <Bike size={12} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">VO2 Bici</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{vo2Stats?.bike?.vo2max > 0 ? vo2Stats.bike.vo2max : '--'}</p>
          </div>
        </div>
      </Card>
    </section>
  );
};
