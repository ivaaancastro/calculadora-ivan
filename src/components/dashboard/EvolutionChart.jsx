import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';

export const EvolutionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 h-full w-full flex items-center justify-center">
        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-widest font-bold">Sin datos de evolución</p>
      </div>
    );
  }

  // Calculamos la fecha de HOY en formato YYYY-MM-DD para pintar la línea de referencia
  const todayStr = new Date().toISOString().split('T')[0];

  const tooltipStyle = { 
    backgroundColor: '#18181b', // zinc-900
    border: '1px solid #27272a', // zinc-800
    borderRadius: '6px', 
    color: '#f4f4f5', 
    fontSize: '11px', 
    fontWeight: '600', 
    padding: '8px 12px' 
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Evolución de Forma
            </h3>
            <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-medium mt-0.5">Incluye simulación de puesta a punto (+7 días)</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
            
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTcb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.3} vertical={false} />
            
            <XAxis 
                dataKey="date" 
                tick={{fontSize: 9, fill: '#71717a'}} 
                tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                minTickGap={20}
                axisLine={{stroke: '#3f3f46'}} 
                tickLine={false}
            />
            
            {/* EJE IZQUIERDO: Para Fitness (CTL) y Fatiga (ATL) */}
            <YAxis yAxisId="left" tick={{fontSize: 9, fill: '#71717a'}} axisLine={false} tickLine={false} />
            
            {/* EJE DERECHO: Para Forma (TSB) - Oculto para que no llene la pantalla de números, pero necesario matemáticamente */}
            <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 10', 'dataMax + 10']} />

            <Tooltip 
                contentStyle={tooltipStyle} 
                cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                labelFormatter={(val) => {
                    const date = new Date(val);
                    const today = new Date();
                    const diffTime = date.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const baseStr = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                    // Si es futuro, le ponemos el aviso
                    if (diffDays > 0) return `${baseStr} (Simulación: +${diffDays} días)`;
                    if (diffDays === 0) return `${baseStr} (Hoy)`;
                    return baseStr;
                }}
                formatter={(value, name) => {
                    if (name === 'ctl') return [value, 'Fitness (CTL)'];
                    if (name === 'atl') return [value, 'Fatiga (ATL)'];
                    if (name === 'tcb') return [value, 'Forma (TSB)'];
                    return [value, name];
                }}
            />
            
            <Legend wrapperStyle={{ fontSize: '10px', color: '#a1a1aa' }} iconType="circle" />

            {/* LÍNEA DE REFERENCIA DE HOY */}
            <ReferenceLine 
                x={todayStr} 
                yAxisId="left" 
                stroke="#10b981" 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                label={{ position: 'insideTopLeft', value: 'HOY', fill: '#10b981', fontSize: 9, fontWeight: 'bold' }} 
            />

            {/* LAS 3 MÉTRICAS */}
            <Area yAxisId="right" type="monotone" dataKey="tcb" name="tcb" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTcb)" activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area yAxisId="left" type="monotone" dataKey="ctl" name="ctl" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCtl)" activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line yAxisId="left" type="monotone" dataKey="atl" name="atl" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};