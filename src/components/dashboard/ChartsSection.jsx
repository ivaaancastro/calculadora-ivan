import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Card = ({ children, className }) => <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>{children}</div>;
const COLORS = { 'Ciclismo': '#3b82f6', 'Carrera': '#f97316', 'Fuerza': '#8b5cf6', 'Caminata': '#10b981', 'Entrenamiento': '#6366f1' };

export const ChartsSection = ({ chartData, distribution }) => (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <Card className="xl:col-span-2 flex flex-col min-h-[350px]">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Evolución</h3>
        <div className="flex gap-4 text-[10px] font-bold uppercase"><span className="text-blue-500">Fitness</span> <span className="text-orange-500">Fatiga</span></div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top:10, right:0, left:-20, bottom:0}}>
            <defs><linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
            <Tooltip contentStyle={{borderRadius:'12px', border:'none'}}/>
            <Area type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCtl)" />
            <Area type="monotone" dataKey="atl" stroke="#f97316" strokeWidth={2} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card className="flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-4">Distribución</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
              {distribution.map((entry, index) => <Cell key={index} fill={COLORS[entry.name] || '#cbd5e1'} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>
);