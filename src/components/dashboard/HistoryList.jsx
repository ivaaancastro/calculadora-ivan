import React, { useState, useMemo, useRef } from 'react';
import { Search, Calendar, Activity, Clock, MapPin, Zap, Trash2, ChevronRight, Bike, Footprints, Dumbbell, Flame } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDuration } from '../../utils/formatDuration';

const getSportIcon = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera')) {
        return (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0 shadow-2xs">
                <Footprints size={17} strokeWidth={2.3} />
            </div>
        );
    }
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride')) {
        return (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-blue-500/15 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0 shadow-2xs">
                <Bike size={17} strokeWidth={2.3} />
            </div>
        );
    }
    if (t.includes('gym') || t.includes('fuerza') || t.includes('weight') || t.includes('workout')) {
        return (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0 shadow-2xs">
                <Dumbbell size={17} strokeWidth={2.3} />
            </div>
        );
    }
    return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-slate-200/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity size={17} strokeWidth={2.3} />
        </div>
    );
};

export const HistoryList = React.memo(({ activities, onDelete, onSelectActivity }) => {
    const parentRef = useRef(null);
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
                if (sportFilter === 'bike') return t.includes('bike') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride');
                if (sportFilter === 'swim') return t.includes('swim') || t.includes('nadar') || t.includes('natación') || t.includes('natacion');
                if (sportFilter === 'gym') return t.includes('gym') || t.includes('fuerza') || t.includes('weight') || t.includes('workout');
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

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: filteredActivities.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 6,
        initialRect: { width: 800, height: 800 },
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const itemsToRender = virtualItems.length > 0
        ? virtualItems.map(v => ({ index: v.index, start: v.start, isVirtual: true, act: filteredActivities[v.index] }))
        : filteredActivities.map((act, index) => ({ index, start: index * 64, isVirtual: false, act }));

    return (
        <div className="ios-card flex flex-col h-full overflow-hidden">

            {/* BARRA DE FILTROS ESTILO APPLE */}
            <div className="p-3 sm:p-4 border-b border-black/[0.04] dark:border-white/[0.06] bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row gap-2.5 sm:gap-3">

                {/* Buscador de Texto estilo iOS */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-200/60 dark:bg-zinc-800/70 border-0 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    />
                </div>

                {/* Selector de Deporte */}
                <div className="sm:w-44 relative">
                    <Activity size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <select
                        value={sportFilter}
                        onChange={(e) => setSportFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-200/60 dark:bg-zinc-800/70 border-0 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer transition-all"
                    >
                        <option value="all">Todos los Deportes</option>
                        <option value="run">Carrera</option>
                        <option value="bike">Ciclismo</option>
                        <option value="swim">Natación</option>
                        <option value="gym">Fuerza</option>
                    </select>
                </div>

                {/* Selector de Fecha */}
                <div className="sm:w-44 relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-200/60 dark:bg-zinc-800/70 border-0 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer transition-all"
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
            <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/[0.06] bg-slate-50/40 dark:bg-zinc-900/20 flex justify-between items-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <span>{filteredActivities.length} Actividades</span>
            </div>

            {/* LISTA DE ACTIVIDADES VIRTUALIZADA */}
            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredActivities.length > 0 ? (
                    <div
                        className="w-full relative"
                        style={{ height: `${Math.max(rowVirtualizer.getTotalSize(), itemsToRender.length * 64)}px` }}
                    >
                        {itemsToRender.map((virtualRow) => {
                            const act = virtualRow.act;
                            if (!act) return null;
                            return (
                                <div
                                    key={act.id}
                                    data-index={virtualRow.index}
                                    ref={virtualRow.isVirtual ? rowVirtualizer.measureElement : undefined}
                                    onClick={() => onSelectActivity && onSelectActivity(act)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="group flex items-center p-3 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 active:bg-slate-100 dark:active:bg-zinc-800/70 border-b border-black/[0.04] dark:border-white/[0.05] box-border transition-colors cursor-pointer select-none"
                                >
                                    {/* Icono en squircle estilo Apple */}
                                    <div className="mr-3 shrink-0">
                                        {getSportIcon(act.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 mr-2 sm:mr-4">
                                        <h4 className="text-[13px] font-semibold text-slate-900 dark:text-white truncate mb-0.5" title={act.name}>{act.name}</h4>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                                            <span>{new Date(act.date).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            <span>•</span>
                                            <span className="capitalize">{act.type}</span>
                                        </div>
                                    </div>

                                    {/* Compact Mobile Metrics (< md) */}
                                    <div className="flex md:hidden flex-col items-end shrink-0 mr-1 text-right">
                                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                                            {formatDuration(act.duration)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tabular-nums">
                                            {act.distance > 0 
                                                ? `${(act.distance / 1000).toFixed(1)} km` 
                                                : (act.tss > 0 ? `${Math.round(act.tss)} TSS` : '')}
                                        </span>
                                    </div>

                                    {/* Métricas Clínicas (>= md) */}
                                    <div className="hidden md:flex items-center gap-6 mr-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Tiempo</span>
                                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{formatDuration(act.duration)}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-16">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Dist</span>
                                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{act.distance > 0 ? (act.distance / 1000).toFixed(1) + 'km' : '--'}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Kcal</span>
                                            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{act.calories || '--'}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">TSS</span>
                                            <span className={`text-sm font-bold tabular-nums ${act.tss > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {act.tss > 0 ? Math.round(act.tss) : '--'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botón Borrar y Chevron */}
                                    <div className="shrink-0 flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(act.id); }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-500/10 active:scale-90 rounded-full transition-all"
                                            title="Eliminar actividad"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <ChevronRight size={15} className="text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
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
});