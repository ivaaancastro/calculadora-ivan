import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useChartTheme } from '../charts/useChartTheme';

const Card = ({ children, className }) => <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>{children}</div>;

export const ChartsSection = ({ chartData, distribution }) => {
  const ct = useChartTheme();
  const COLORS = { 'Ciclismo': ct.distribution.bike, 'Carrera': ct.distribution.run, 'Fuerza': ct.distribution.strength, 'Caminata': ct.distribution.walk, 'Entrenamiento': ct.distribution.workout };
  return (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <Card className="xl:col-span-2 flex flex-col min-h-[350px]">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Evolución</h3>
        <div className="flex gap-4 text-[10px] font-bold uppercase"><span className="text-metric-ctl">Fitness</span> <span className="text-legacy-atl-orange">Fatiga</span></div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top:10, right:0, left:-20, bottom:0}}>
            <defs><linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ct.series.ctl} stopOpacity={0.2}/><stop offset="95%" stopColor={ct.series.ctl} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.anatomy.gridSoft} />
            <XAxis dataKey="date" hide />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
            <Tooltip contentStyle={{borderRadius:'12px', border:'none'}}/>
            <Area type="monotone" dataKey="ctl" stroke={ct.series.ctl} strokeWidth={3} fill="url(#colorCtl)" />
            <Area type="monotone" dataKey="atl" stroke={ct.series.atlOrange} strokeWidth={2} fill="none" strokeDasharray="4 4" />
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
              {distribution.map((entry, index) => <Cell key={index} fill={COLORS[entry.name] || ct.distribution.other} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>
);
};
