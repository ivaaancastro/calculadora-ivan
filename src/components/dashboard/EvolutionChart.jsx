import React, { useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const title = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 shadow-xl min-w-[140px] pointer-events-none select-none z-50">
        <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1.5 flex justify-between items-center capitalize">
          {title}
          {diffDays > 0 && <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 px-1 py-0.5 rounded text-[8px] ml-2 font-mono font-normal">+{diffDays}d</span>}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            if (entry.dataKey === 'dailyTss') return null;
            
            const colors = {
              ctl: 'text-blue-600 dark:text-blue-400',
              atl: 'text-rose-600 dark:text-rose-400',
              tsb: 'text-amber-600 dark:text-amber-400'
            };
            const labels = {
              ctl: 'Fitness (CTL)',
              atl: 'Fatiga (ATL)',
              tsb: 'Forma (TSB)'
            };
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">{labels[entry.dataKey]}</span>
                <span className={`text-[11px] font-mono font-bold ${colors[entry.dataKey] || 'text-slate-700'}`}>{entry.value.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const EvolutionChart = ({ data, timeRange, setTimeRange }) => {
  const [hoverPoint, setHoverPoint] = useState(null);

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
  const latestPoint = data[data.length - 1];
  const activePoint = hoverPoint || latestPoint;

  return (
    <div className="h-full w-full flex flex-col font-sans touch-manipulation select-none">
      {/* Selector SOLO en móvil (en escritorio permanece en la cabecera original) */}
      {timeRange && setTimeRange && (
        <div className="md:hidden flex bg-slate-200/60 dark:bg-zinc-800/70 p-1 rounded-full backdrop-blur-md w-full justify-between shadow-xs mb-3">
          {[
            { id: "7d", label: "7D" },
            { id: "30d", label: "30D" },
            { id: "90d", label: "3M" },
            { id: "all", label: "Todo" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`flex-1 px-3 py-1 min-h-[30px] text-xs font-semibold transition-all rounded-full select-none touch-manipulation active:scale-95 ${
                timeRange === t.id
                  ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Dynamic HUD Header (Legibilidad óptima en móvil sin tapar con los dedos) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-100/70 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-700/40 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 capitalize">
            {activePoint ? new Date(activePoint.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Hoy'}
          </span>
          {hoverPoint ? (
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-full">
              Punto
            </span>
          ) : (
            <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-200/60 dark:bg-zinc-700/40 px-1.5 py-0.2 rounded-full">
              Actual
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">CTL</span>
            <span className="font-mono font-bold text-[#3b82f6] text-xs">
              {activePoint?.ctl !== undefined ? Math.round(activePoint.ctl) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">ATL</span>
            <span className="font-mono font-bold text-[#f43f5e] text-xs">
              {activePoint?.atl !== undefined ? Math.round(activePoint.atl) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">TSB</span>
            <span className={`font-mono font-bold text-xs ${
              (activePoint?.tsb ?? 0) >= 0 ? 'text-[#30D158]' : 'text-[#FF9F0A]'
            }`}>
              {activePoint?.tsb !== undefined ? `${activePoint.tsb > 0 ? '+' : ''}${Math.round(activePoint.tsb)}` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Leyenda fija clara */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex gap-3 sm:gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Fitness</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Fatiga</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#eab308]"></div>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Forma</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 8, right: 6, left: -14, bottom: 0 }}
            onMouseMove={(state) => {
              if (state?.activePayload?.[0]?.payload) {
                setHoverPoint(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoverPoint(null)}
            onTouchEnd={() => setHoverPoint(null)}
          >
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
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
              minTickGap={40}
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
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={false} 
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1.5, fill: '#f43f5e' }} 
                isAnimationActive={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};