import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const EvolutionChart = ({ data }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col h-full">
    <div className="flex justify-between mb-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase">Tendencia de Carga</h3>
      <div className="flex gap-3 text-[10px] font-bold uppercase"><span className="text-blue-500">Fitness</span><span className="text-orange-500">Fatiga</span></div>
    </div>
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{top:5, right:0, left:-25, bottom:0}}>
          <defs><linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" hide />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
          <Tooltip contentStyle={{borderRadius:'8px', border:'none', fontSize:'11px'}} labelStyle={{color: '#64748b'}}/>
          <Area type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCtl)" />
          <Area type="monotone" dataKey="atl" stroke="#f97316" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);