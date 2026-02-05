import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Cell } from 'recharts';
import { InfoTooltip } from '../common/InfoTooltip';

export const EffortScatterChart = ({ activities, settings }) => {
  const data = activities.map(act => {
    const t = act.type.toLowerCase();
    const isBike = t.includes('ciclismo') || t.includes('bici');
    const lthr = isBike ? settings.bike.lthr : settings.run.lthr;
    if (!act.hr_avg || !lthr) return null;
    return { x: act.duration, y: parseFloat(((act.hr_avg/lthr)*100).toFixed(1)), type: act.type, date: act.date, hr: Math.round(act.hr_avg) };
  }).filter(item => item !== null && item.y < 150);

  const getColor = (t) => t.toLowerCase().includes('bici') ? '#3b82f6' : '#f97316';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between mb-4"><h3 className="text-xs font-bold text-slate-500 uppercase flex items-center">Mapa de Esfuerzo <InfoTooltip text="Intensidad vs Volumen"/></h3></div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <ReferenceArea y1={0} y2={85} fill="#ecfccb" fillOpacity={0.4} stroke="none" />
            <ReferenceArea y1={85} y2={90} fill="#dbeafe" fillOpacity={0.3} stroke="none" />
            <ReferenceArea y1={90} y2={95} fill="#ffedd5" fillOpacity={0.3} stroke="none" />
            <ReferenceArea y1={95} y2={105} fill="#fee2e2" fillOpacity={0.3} stroke="none" />
            <ReferenceArea y1={105} y2={140} fill="#fce7f3" fillOpacity={0.3} stroke="none" />
            <XAxis type="number" dataKey="x" unit=" min" tick={{fontSize: 10}} />
            <YAxis type="number" dataKey="y" unit="%" domain={[50, 'auto']} tick={{fontSize: 10}} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                if (active && payload && payload.length) { const d = payload[0].payload; return <div className="bg-slate-800 text-white text-xs p-2 rounded"><b>{d.type}</b><br/>{d.x}min | {d.hr}ppm</div>; } return null;
            }}/>
            <Scatter name="Sesiones" data={data}>{data.map((e, i) => <Cell key={i} fill={getColor(e.type)} />)}</Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};