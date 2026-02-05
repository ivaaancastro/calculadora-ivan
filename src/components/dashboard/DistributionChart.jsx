import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = { 'Ciclismo': '#3b82f6', 'Carrera': '#f97316', 'Fuerza': '#8b5cf6', 'Caminata': '#10b981' };

export const DistributionChart = ({ distribution, total }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Disciplinas</h3>
      <div className="flex flex-row items-center h-[200px] gap-4">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                {distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-xl font-black text-slate-700">{total}</span>
          </div>
        </div>
        <div className="w-1/2 space-y-1.5 overflow-y-auto max-h-[140px] custom-scrollbar pr-1">
          {distribution.sort((a,b) => b.value - a.value).map(d => (
            <div key={d.name} className="flex justify-between items-center text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: COLORS[d.name] || '#cbd5e1'}}></div>
                <span className="text-slate-600 font-medium truncate max-w-[80px]">{d.name}</span>
              </div>
              <span className="font-bold text-slate-800">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};