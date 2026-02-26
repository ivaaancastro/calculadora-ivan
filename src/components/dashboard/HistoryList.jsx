import React, { useState, useMemo } from 'react';
import { Search, Calendar, Activity, Clock, MapPin, Zap, Trash2, ChevronRight, Bike, Footprints, Dumbbell, Flame } from 'lucide-react';

const getSportIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return <Footprints size={14} className="text-orange-500" />;
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return <Bike size={14} className="text-blue-500" />;
    if (t.includes('gym') || t.includes('fuerza')) return <Dumbbell size={14} className="text-purple-500" />;
    return <Activity size={14} className="text-slate-500 dark:text-zinc-400" />;
};

export const HistoryList = ({ activities, onDelete, onSelectActivity }) => {
    // ESTADOS DE LOS FILTROS INTERNOS
    const [searchTerm, setSearchTerm] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    // MOTOR DE FILTRADO
    const filteredActivities = useMemo(() => {
        if (!activities) return [];
        
        let filtered = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date)); // Orden cronológico (más nuevo primero)

        // 1. Filtro de Búsqueda (Texto)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(act => 
                (act.name && act.name.toLowerCase().includes(lowerTerm)) || 
                (act.type && act.type.toLowerCase().includes(lowerTerm))
            );
        }

        // 2. Filtro de Deporte
        if (sportFilter !== 'all') {
            filtered = filtered.filter(act => {
                const t = String(act.type).toLowerCase();
                if (sportFilter === 'run') return t.includes('run') || t.includes('carrera');
                if (sportFilter === 'bike') return t.includes('bike') || t.includes('bici') || t.includes('ciclismo');
                if (sportFilter === 'swim') return t.includes('swim') || t.includes('nadar');
                if (sportFilter === 'gym') return t.includes('gym') || t.includes('fuerza');
                return true;
            });
        }

        // 3. Filtro de Fecha
        if (dateFilter !== 'all') {
            const limitDate = new Date();
            if (dateFilter === '7d') limitDate.setDate(limitDate.getDate() - 7);
            else if (dateFilter === '30d') limitDate.setDate(limitDate.getDate() - 30);
            else if (dateFilter === '90d') limitDate.setDate(limitDate.getDate() - 90);
            else if (dateFilter === '1y') limitDate.setFullYear(limitDate.getFullYear() - 1);

            filtered = filtered.filter(act => new Date(act.date) >= limitDate);
        }

        return filtered;
    }, [activities, searchTerm, sportFilter, dateFilter]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col h-full overflow-hidden">
            
            {/* BARRA DE FILTROS */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 flex flex-col sm:flex-row gap-3">
                
                {/* Buscador de Texto */}
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar por título..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-[11px] font-bold text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Selector de Deporte */}
                <div className="sm:w-40 relative">
                    <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <select 
                        value={sportFilter} 
                        onChange={(e) => setSportFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-[11px] font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors"
                    >
                        <option value="all">Todos los Deportes</option>
                        <option value="run">Carrera</option>
                        <option value="bike">Ciclismo</option>
                        <option value="swim">Natación</option>
                        <option value="gym">Fuerza</option>
                    </select>
                </div>

                {/* Selector de Fecha */}
                <div className="sm:w-40 relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md text-[11px] font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors"
                    >
                        <option value="all">Todo el Historial</option>
                        <option value="7d">Últimos 7 Días</option>
                        <option value="30d">Últimos 30 Días</option>
                        <option value="90d">Últimos 90 Días</option>
                        <option value="1y">Último Año</option>
                    </select>
                </div>
            </div>

            {/* RESUMEN DE RESULTADOS */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-zinc-400">
                <span>{filteredActivities.length} Actividades encontradas</span>
            </div>

            {/* LISTA DE ACTIVIDADES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredActivities.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {filteredActivities.map((act) => (
                            <div 
                                key={act.id} 
                                onClick={() => onSelectActivity && onSelectActivity(act)}
                                className="group flex items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                            >
                                {/* Icono */}
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                                    {getSportIcon(act.type)}
                                </div>

                                {/* Info Principal */}
                                <div className="flex-1 min-w-0 mr-4">
                                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate mb-0.5" title={act.name}>{act.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-500 font-medium">
                                        <span>{new Date(act.date).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <span>•</span>
                                        <span className="capitalize">{act.type}</span>
                                    </div>
                                </div>

                                {/* Métricas Clínicas */}
                                <div className="hidden md:flex items-center gap-6 mr-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 flex items-center gap-1"><Clock size={10}/> Tiempo</span>
                                        <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 font-bold">{act.duration}m</span>
                                    </div>
                                    <div className="flex flex-col items-end w-16">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 flex items-center gap-1"><MapPin size={10}/> Dist</span>
                                        <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 font-bold">{act.distance > 0 ? (act.distance / 1000).toFixed(1) + 'km' : '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-end w-12">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 flex items-center gap-1"><Flame size={10}/> Kcal</span>
                                        <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 font-bold">{act.calories || '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-end w-12">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 flex items-center gap-1"><Zap size={10}/> TSS</span>
                                        <span className={`text-[11px] font-mono font-black ${act.tss > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {act.tss > 0 ? Math.round(act.tss) : '--'}
                                        </span>
                                    </div>
                                </div>

                                {/* Botón Borrar (con stopPropagation para no abrir la actividad) */}
                                <div className="shrink-0 flex items-center gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete && onDelete(act.id); }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Eliminar actividad"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronRight size={16} className="text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Activity size={32} className="text-slate-300 dark:text-zinc-700 mb-3" />
                        <h3 className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest">No hay resultados</h3>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Prueba a cambiar los filtros de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};