import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

export const DistributionChart = ({ distribution, total }) => {
  // CORRECCIÓN: Comprobamos si ya es un array o si es un objeto para formatearlo correctamente
  const data = Array.isArray(distribution) 
    ? [...distribution].sort((a, b) => b.value - a.value)
    : Object.entries(distribution || {}).map(([name, value]) => ({
        name, value
      })).sort((a, b) => b.value - a.value);

  const getSportColor = (sportType) => {
    const t = String(sportType).toLowerCase();
    if (t.includes('bici') || t.includes('ride') || t.includes('ciclismo')) return '#2563eb'; 
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return '#ea580c'; 
    if (t.includes('nadar') || t.includes('swim')) return '#0891b2'; 
    if (t.includes('gym') || t.includes('fuerza')) return '#7c3aed'; 
    if (t.includes('andar') || t.includes('walk') || t.includes('caminata')) return '#10b981'; 
    return '#71717a'; 
  };

  const tooltipStyle = { 
    backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', 
    color: '#f4f4f5', fontSize: '11px', fontWeight: '600', padding: '8px 12px' 
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <PieChartIcon size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5}/> Distribución
        </h3>
        <span className="text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-1 rounded">
          Total: {total || 0}
        </span>
      </div>

      <div className="flex-1 relative">
        {data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius="65%" outerRadius="85%" paddingAngle={3} dataKey="value" stroke="none">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSportColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{color: '#fff'}} cursor={{fill: 'transparent'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 dark:text-zinc-100">{total}</span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Sesiones</span>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 uppercase tracking-widest font-bold">Sin datos</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/50 px-2 py-1 rounded border border-slate-100 dark:border-zinc-700/50">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSportColor(item.name) }}></div>
            <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">{item.name}</span>
            <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};