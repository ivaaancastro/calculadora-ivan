import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const EvolutionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 h-full w-full flex items-center justify-center">
        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Faltan datos de evolución</p>
      </div>
    );
  }

  const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '11px', fontWeight: '600', padding: '8px 12px' };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 h-full w-full p-4 flex flex-col">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-zinc-800 pb-2 mb-4">
          <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Evolución de Forma
          </h3>
      </div>
      
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
            <XAxis dataKey="date" tick={{fontSize: 9, fill: '#71717a'}} minTickGap={30} axisLine={{stroke: '#3f3f46'}} tickLine={false} />
            <YAxis tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} iconType="plainline" />
            
            <Area type="monotone" dataKey="ctl" name="Fitness (CTL)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCtl)" />
            <Area type="monotone" dataKey="atl" name="Fatiga (ATL)" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 4" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};