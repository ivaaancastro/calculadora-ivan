import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar } from 'recharts';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const title = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
      <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 shadow-2xl min-w-[200px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 flex justify-between items-center">
          {title}
          {diffDays > 0 && <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[8px] ml-2">Simulación: +{diffDays}d</span>}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            // No mostrar TSS en el listado principal del tooltip si es 0, para limpieza
            if (entry.dataKey === 'dailyTss' && entry.value === 0) return null;
            
            const colors = {
              ctl: 'text-[#007aff]', // Apple Blue
              atl: 'text-[#ff2d55]', // Apple Red
              tsb: 'text-[#ffcc00]', // Apple Gold
              dailyTss: 'text-slate-400'
            };
            const labels = {
              ctl: 'Fitness (CTL)',
              atl: 'Fatiga (ATL)',
              tsb: 'Forma (TSB)',
              dailyTss: 'Carga (TSS)'
            };
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">{labels[entry.dataKey]}</span>
                <span className={`text-sm font-black ${colors[entry.dataKey]}`}>{entry.value.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const EvolutionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 h-full w-full flex items-center justify-center text-center">
        <div>
           <Activity size={24} className="mx-auto text-slate-300 mb-2" />
           <p className="text-[10px] text-slate-400 dark:text-zinc-600 uppercase tracking-widest font-black">Cargando Tendencias...</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full w-full flex flex-col">
      {/* Redesigned Minimalist Header (Apple Style) */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fitness</span>
            <span className="text-xs font-bold text-[#007aff]">CTL</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 dark:border-zinc-800 pl-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fatiga</span>
            <span className="text-xs font-bold text-[#ff2d55]">ATL</span>
          </div>
          <div className="flex flex-col border-l border-slate-100 dark:border-zinc-800 pl-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Forma</span>
            <span className="text-xs font-bold text-[#ffcc00]">TSB</span>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-zinc-700">Health Pro Sync</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#007aff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#007aff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTcb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ffcc00" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" stroke="#a1a1aa" opacity={0.05} vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              minTickGap={40}
              axisLine={false}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
            />

            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 30', 'dataMax + 30']} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#007aff', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />

            <ReferenceLine
              x={todayStr}
              yAxisId="left"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="0"
              label={{ position: 'insideTopLeft', value: 'HOY', fill: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: '0.1em' }}
            />

            {/* Background TSS Bars - Very Subtle */}
            <Bar yAxisId="left" dataKey="dailyTss" fill="#71717a" opacity={0.05} radius={[2, 2, 0, 0]} barSize={6} isAnimationActive={false} />
            
            <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="tsb" 
                stroke="#ffcc00" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorTcb)" 
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3, fill: '#ffcc00' }} 
                isAnimationActive={false} 
            />
            
            <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="ctl" 
                stroke="#007aff" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCtl)" 
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3, fill: '#007aff' }} 
                isAnimationActive={false} 
            />
            
            <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="atl" 
                stroke="#ff2d55" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: '#ff2d55' }} 
                isAnimationActive={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};