import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

export const DistributionChart = ({ distribution, total }) => {
  const COLORS = {
    'Carrera': '#f97316', 'Ciclismo': '#3b82f6', 'Caminata': '#10b981', 
    'Fuerza': '#8b5cf6', 'Natación': '#06b6d4', 'Otros': '#94a3b8'
  };
  const getColor = (name) => COLORS[name] || COLORS['Otros'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700">
          <p className="font-bold mb-1">{data.name}</p>
          <span className="font-mono font-bold text-blue-300">
             {((data.value / total) * 100).toFixed(1)}%
          </span>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}/>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{entry.value}</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">({entry.payload.value})</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
            <Activity size={14} /> Distribución
        </h3>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Total: {total}
        </span>
      </div>

      <div className="flex-1 min-h-[180px] relative">
        {distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={distribution} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                    stroke="none" // Quitamos el borde blanco que se ve mal en dark
                >
                {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} verticalAlign="bottom" height={36}/>
            </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                <p className="text-xs font-medium">Sin datos</p>
            </div>
        )}

        {distribution.length > 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                    <span className="block text-3xl font-black text-slate-800 dark:text-white leading-none">{total}</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sesiones</span>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};