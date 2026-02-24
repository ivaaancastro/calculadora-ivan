import React, { useState, useMemo } from 'react';
import { Activity, Clock, Map, Mountain, Zap, Heart, Search, Filter } from 'lucide-react';

const getSportIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('bici') || t.includes('ride') || t.includes('ciclismo')) return <Activity size={12} className="text-blue-500" />;
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return <Activity size={12} className="text-orange-500" />;
    if (t.includes('nadar') || t.includes('swim')) return <Activity size={12} className="text-cyan-500" />;
    if (t.includes('fuerza') || t.includes('gym')) return <Activity size={12} className="text-purple-500" />;
    if (t.includes('andar') || t.includes('walk')) return <Activity size={12} className="text-emerald-500" />;
    return <Activity size={12} className="text-slate-400" />;
};

const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
};

export const HistoryList = ({ activities, onSelectActivity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('all');

  const processedData = useMemo(() => {
    let filtered = [...activities];

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => String(a.name).toLowerCase().includes(term) || String(a.type).toLowerCase().includes(term));
    }

    // Filtro por deporte
    if (filterSport !== 'all') {
      filtered = filtered.filter(a => {
        const t = String(a.type).toLowerCase();
        if (filterSport === 'bici') return t.includes('bici') || t.includes('ride') || t.includes('ciclismo');
        if (filterSport === 'run') return t.includes('run') || t.includes('carrera') || t.includes('correr');
        if (filterSport === 'fuerza') return t.includes('fuerza') || t.includes('gym') || t.includes('pesight');
        return true;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activities, searchTerm, filterSport]);

  if (!activities || activities.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
        
        {/* BARRA DE HERRAMIENTAS SUPERIOR */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar actividad..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <div className="flex border border-slate-200 dark:border-zinc-700 rounded overflow-hidden">
                    {['all', 'bici', 'run', 'fuerza'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterSport(type)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${filterSport === type ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-transparent text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border-l border-slate-200 dark:border-zinc-700 first:border-l-0'}`}
                        >
                            {type === 'all' ? 'Todo' : type}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* TABLA DE DATOS (DATA GRID) */}
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-900/95 backdrop-blur shadow-sm">
                    <tr className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">
                        <th className="px-4 py-3 font-semibold">Fecha</th>
                        <th className="px-4 py-3 font-semibold">Deporte</th>
                        <th className="px-4 py-3 font-semibold">Título</th>
                        <th className="px-4 py-3 font-semibold text-right"><div className="flex items-center justify-end gap-1"><Clock size={10}/> Tiempo</div></th>
                        <th className="px-4 py-3 font-semibold text-right"><div className="flex items-center justify-end gap-1"><Map size={10}/> Km</div></th>
                        <th className="px-4 py-3 font-semibold text-right"><div className="flex items-center justify-end gap-1"><Mountain size={10}/> Desnivel</div></th>
                        <th className="px-4 py-3 font-semibold text-right"><div className="flex items-center justify-end gap-1"><Zap size={10}/> TSS</div></th>
                        <th className="px-4 py-3 font-semibold text-right"><div className="flex items-center justify-end gap-1"><Heart size={10}/> Pulso Med</div></th>
                    </tr>
                </thead>
                <tbody className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 divide-y divide-slate-100 dark:divide-zinc-800">
                    {processedData.length > 0 ? processedData.map((act) => (
                        <tr 
                            key={act.id} 
                            onClick={() => onSelectActivity(act)}
                            className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                        >
                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                                {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                    {getSportIcon(act.type)}
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-500">{act.type}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[200px] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                {act.name || 'Entreno'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-zinc-300">
                                {formatTime(act.duration)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-zinc-300">
                                {act.distance ? (act.distance / 1000).toFixed(1) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-zinc-300">
                                {act.elevation_gain ? Math.round(act.elevation_gain) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-black text-amber-600 dark:text-amber-500">
                                {act.tss > 0 ? Math.round(act.tss) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-zinc-400">
                                {act.hr_avg > 0 ? Math.round(act.hr_avg) : '-'}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" className="px-4 py-8 text-center text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                No se encontraron actividades
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};