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
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-lg min-w-[160px]">
        <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 flex justify-between items-center">
          {title}
          {diffDays > 0 && <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 px-1 py-0.5 rounded text-[8px] ml-2">Sim: +{diffDays}d</span>}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            if (entry.dataKey === 'dailyTss') return null;
            
            const colors = {
              ctl: 'text-slate-700 dark:text-slate-300',
              atl: 'text-slate-500 dark:text-slate-400',
              tsb: 'text-slate-400 dark:text-slate-500'
            };
            const labels = {
              ctl: 'Fitness',
              atl: 'Fatiga',
              tsb: 'Forma'
            };
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">{labels[entry.dataKey]}</span>
                <span className={`text-[11px] font-semibold ${colors[entry.dataKey]}`}>{entry.value.toFixed(1)}</span>
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
      <div className="bg-transparent rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 h-full w-full flex items-center justify-center text-center">
        <div>
           <Activity size={16} className="mx-auto text-slate-300 mb-2" />
           <p className="text-[9px] text-slate-400 dark:text-zinc-600 uppercase tracking-widest font-medium">Sin Datos</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full w-full flex flex-col font-sans">
      {/* Minimalist Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></div>
            <span className="text-[9px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Fitness</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></div>
            <span className="text-[9px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Fatiga</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></div>
            <span className="text-[9px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Forma</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTcb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: '500' }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              minTickGap={50}
              axisLine={false}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
              dy={10}
            />

            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b', fontWeight: '500' }} axisLine={false} tickLine={false} dx={-10} />
            <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 30', 'dataMax + 30']} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />

            <ReferenceLine
              x={todayStr}
              yAxisId="left"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="4 4"
              label={{ position: 'insideTopLeft', value: 'HOY', fill: '#64748b', fontSize: 9, fontWeight: '600', letterSpacing: '0.05em' }}
            />

            {/* Removed Background TSS Bars */}
            
            <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="tsb" 
                stroke="#eab308" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorTcb)"
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: '#eab308' }} 
                isAnimationActive={false} 
            />
            
            <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="ctl" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorCtl)"
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#3b82f6' }} 
                isAnimationActive={false} 
            />
            
            <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="atl" 
                stroke="#f43f5e" 
                strokeWidth={1.5} 
                strokeDasharray="3 3"
                dot={false} 
                activeDot={{ r: 3, stroke: '#fff', strokeWidth: 1.5, fill: '#f43f5e' }} 
                isAnimationActive={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};