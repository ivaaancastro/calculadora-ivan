import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const EvolutionChart = ({ data }) => {
  
  // Componente Tooltip personalizado para el modo oscuro
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
               <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
               <span className="font-mono font-bold text-slate-800 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
            <TrendingUp size={14} /> Evolución de Forma
        </h3>
        <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Fitness (CTL)</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Fatiga (ATL)</span>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Rejilla más sutil en modo oscuro (stroke="#334155" aprox) */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
            
            <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fill: '#94a3b8'}} // Fill gris neutro funciona en ambos
                tickFormatter={(str) => {
                    const d = new Date(str);
                    return `${d.getDate()}/${d.getMonth()+1}`;
                }}
                axisLine={false}
                tickLine={false}
                dy={10}
            />
            <YAxis 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area 
                type="monotone" 
                dataKey="ctl" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCtl)" 
                name="Fitness"
                animationDuration={1000}
            />
            <Area 
                type="monotone" 
                dataKey="atl" 
                stroke="#a855f7" 
                strokeWidth={2}
                fill="none" 
                name="Fatiga"
                strokeDasharray="5 5"
                animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};