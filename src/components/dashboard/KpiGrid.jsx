import React from 'react';
import { TrendingUp, Zap, Activity, Trophy } from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';

const KpiCard = ({ title, value, subtext, Icon, color, tooltip }) => {
  const colors = { 
    blue: "bg-blue-50 text-blue-600", 
    orange: "bg-orange-50 text-orange-600", 
    emerald: "bg-emerald-50 text-emerald-600", 
    purple: "bg-purple-50 text-purple-600" 
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} bg-opacity-50`}>
          <Icon size={22}/>
        </div>
      </div>
      <div>
        <h4 className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
          {title}
          <InfoTooltip text={tooltip} />
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800">{value}</span>
          <span className="text-xs font-medium text-slate-500">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

export const KpiGrid = ({ metrics, summary, timeRange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <KpiCard 
      title="Fitness (CTL)" 
      value={metrics.ctl} 
      subtext="pts" 
      Icon={TrendingUp} 
      color="blue" 
      tooltip="Carga Crónica. Tu forma física base acumulada (42 días)."
    />
    <KpiCard 
      title="Fatiga (ATL)" 
      value={metrics.atl} 
      subtext="pts" 
      Icon={Zap} 
      color="orange" 
      tooltip="Carga Aguda. Tu fatiga actual (7 días)."
    />
    <KpiCard 
      title="Forma (TSB)" 
      value={metrics.tcb} 
      subtext={metrics.tcb > 0 ? "Fresco" : "Carga"} 
      Icon={Activity} 
      color={metrics.tcb > 0 ? "emerald" : "purple"} 
      tooltip="Balance de Estrés. Positivo = Descansado. Negativo = Entrenando duro."
    />
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl">
       <div className="flex justify-between items-center">
         <div className="bg-white/10 p-2 rounded-lg"><Trophy size={20} className="text-yellow-400"/></div>
         <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded uppercase">{timeRange === 'all' ? 'HISTÓRICO' : timeRange}</span>
       </div>
       <div className="mt-4">
         <p className="text-slate-400 text-[10px] font-bold uppercase">Sesiones Totales</p>
         <span className="text-3xl font-bold">{summary.count}</span>
       </div>
    </div>
  </div>
);