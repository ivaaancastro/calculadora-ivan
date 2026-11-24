import React, { useState, useMemo, useRef } from 'react';
import { Search, Calendar, Activity, Clock, MapPin, Zap, Trash2, ChevronRight, Bike, Footprints, Dumbbell, Flame } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDuration } from '../../utils/formatDuration';
import { Button, Card, EmptyState, Input, Select } from '../ui';
import { useConfirmDeleteActivity } from '../../hooks/useConfirmDeleteActivity';
import { ConfirmDeleteActivityModal } from '../activity/ConfirmDeleteActivityModal';
import { AutoChartSkin } from '../charts/ChartSkin';
import { ActivitiesSummary } from './history/ActivitiesSummary';
import { summarizeActivities, weeklyTss, groupByWeek, breakdownBySport } from '../../utils/activityGroups';
import { SportChips } from './history/SportChips';
import { SportBreakdown } from './history/SportBreakdown';
import { WeekHeader } from './history/WeekHeader';

// Rejilla con panel lateral.
const Layout = ({ children }) => (
    <div data-history="layout" className="h-full xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8 max-w-[1440px] mx-auto">{children}</div>
);

const ROW_H = 64;
const WEEK_H = 36;

/** Fecha corta de la fila; el año solo si difiere del de la actividad más reciente (determinista). */
const shortDate = (date, refYear) => {
    const d = new Date(date);
    const opts = { weekday: 'short', day: 'numeric', month: 'short' };
    if (d.getFullYear() !== refYear) opts.year = 'numeric';
    return d.toLocaleDateString('es-ES', opts);
};

const getSportIcon = (type) => {
    const t = String(type).toLowerCase();
    const [Icon, tone] =
        t.includes('run') || t.includes('carrera') ? [Footprints, 'bg-sport-run text-on-action']
        : t.includes('bike') || t.includes('bici') || t.includes('ciclismo') || t.includes('ride') ? [Bike, 'bg-sport-bike text-on-action']
        : t.includes('gym') || t.includes('fuerza') || t.includes('weight') || t.includes('workout') ? [Dumbbell, 'bg-sport-strength text-on-action']
        : [Activity, 'bg-fill-3 text-body-soft'];
    return (
        <div data-history="sport" className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${tone}`}>
            <Icon size={19} strokeWidth={2.2} />
        </div>
    );
};

export const HistoryList = React.memo(({ activities, onDelete, onSelectActivity }) => {
    const parentRef = useRef(null);
    const del = useConfirmDeleteActivity(onDelete);
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

    const summary = useMemo(
        () => ({ totals: summarizeActivities(filteredActivities), weekly: weeklyTss(filteredActivities) }),
        [filteredActivities],
    );

    const breakdown = useMemo(() => breakdownBySport(filteredActivities), [filteredActivities]);
    const hasFilters = searchTerm !== '' || sportFilter !== 'all' || dateFilter !== 'all';
    const clearFilters = () => { setSearchTerm(''); setSportFilter('all'); setDateFilter('all'); };

    // Lista plana: se intercalan cabeceras de semana (36 px) entre filas (64 px).
    const refYear = filteredActivities[0] ? new Date(filteredActivities[0].date).getFullYear() : 0;
    const flat = useMemo(() => {
        return groupByWeek(filteredActivities).flatMap((g) => [
            { kind: 'week', group: g },
            ...g.items.map((act) => ({ kind: 'row', act })),
        ]);
    }, [filteredActivities]);
    const sizes = useMemo(() => flat.map((f) => (f.kind === 'week' ? WEEK_H : ROW_H)), [flat]);
    // Suma acumulada en O(n) (BUG-5): antes se recalculaba el prefijo de cada fila.
    const starts = useMemo(() => {
        let acc = 0;
        return sizes.map((h) => {
            const start = acc;
            acc += h;
            return start;
        });
    }, [sizes]);
    const totalH = sizes.reduce((a, b) => a + b, 0);
    const maxTss = useMemo(() => Math.max(1, ...filteredActivities.map((a) => Number(a.tss) || 0)), [filteredActivities]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: flat.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (i) => sizes[i] ?? ROW_H,
        overscan: 6,
        initialRect: { width: 800, height: 800 },
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const itemsToRender = virtualItems.length > 0
        ? virtualItems.map(v => ({ index: v.index, start: v.start, isVirtual: true, item: flat[v.index] }))
        : flat.map((item, index) => ({ index, start: starts[index], isVirtual: false, item }));

    return (
        <>
        <Layout>
        <Card data-skin="history" data-history="root" className="flex flex-col h-full overflow-hidden">

            <AutoChartSkin><ActivitiesSummary totals={summary.totals} weekly={summary.weekly} /></AutoChartSkin>

            {/* BARRA DE FILTROS ESTILO APPLE */}
            <div data-history="filters" className="p-3 sm:p-4 border-b border-hairline bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row gap-2.5 sm:gap-3">

                {/* Buscador de Texto estilo iOS */}
                <div data-history="search" className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
                    <Input
                        variant="search"
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2"
                    />
                </div>

                <div data-history="chips-row" className="sm:order-last sm:basis-full"><SportChips value={sportFilter} onChange={setSportFilter} /></div>

                {/* Selector de Fecha */}
                <div className="sm:w-44 relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
                    <Select
                        variant="search"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full pl-9 pr-3 py-2"
                    >
                        <option value="all">Todo el Historial</option>
                        <option value="7d">Últimos 7 Días</option>
                        <option value="30d">Últimos 30 Días</option>
                        <option value="90d">Últimos 90 Días</option>
                        <option value="1y">Último Año</option>
                    </Select>
                </div>
            </div>

            {/* RESUMEN DE RESULTADOS */}
            <div data-history="count" className="px-4 py-2 border-b border-hairline bg-slate-50/40 dark:bg-zinc-900/20 flex justify-between items-center text-[11px] font-semibold text-ink-4 uppercase tracking-wider">
                <span>{filteredActivities.length} Actividades</span>
            </div>

            {/* LISTA DE ACTIVIDADES VIRTUALIZADA */}
            <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredActivities.length > 0 ? (
                    <div
                        className="w-full relative"
                        style={{ height: `${Math.max(rowVirtualizer.getTotalSize(), totalH)}px` }}
                    >
                        {itemsToRender.map((virtualRow) => {
                            const { item } = virtualRow;
                            if (!item) return null;
                            if (item.kind === 'week') {
                                return (
                                    <div
                                        key={`w-${item.group.key}`}
                                        data-index={virtualRow.index}
                                        ref={virtualRow.isVirtual ? rowVirtualizer.measureElement : undefined}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: WEEK_H, transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <WeekHeader group={item.group} refYear={refYear} />
                                    </div>
                                );
                            }
                            const act = item.act;
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
                                    data-history="row"
                                    className="group flex items-center p-3 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 active:bg-slate-100 dark:active:bg-zinc-800/70 border-b border-black/[0.04] dark:border-white/[0.05] box-border transition-colors cursor-pointer select-none"
                                >
                                    {/* Icono en squircle estilo Apple */}
                                    <div className="mr-3 shrink-0">
                                        {getSportIcon(act.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 mr-2 sm:mr-4">
                                        <h4 className="text-[13px] font-semibold text-ink truncate mb-0.5" title={act.name}>{act.name}</h4>
                                        <div className="flex items-center gap-1.5 text-[11px] text-ink-3">
                                            <span>{shortDate(act.date, refYear)}</span>
                                            <span>•</span>
                                            <span className="capitalize">{act.type}</span>
                                        </div>
                                    </div>

                                    {/* Compact Mobile Metrics (< md) */}
                                    <div className="flex md:hidden flex-col items-end shrink-0 mr-1 text-right">
                                        <span className="text-xs font-bold text-ink-soft tabular-nums">
                                            {formatDuration(act.duration)}
                                        </span>
                                        <span className="text-[10px] text-ink-4 font-medium tabular-nums">
                                            {act.distance > 0 
                                                ? `${(act.distance / 1000).toFixed(1)} km` 
                                                : (act.tss > 0 ? `${Math.round(act.tss)} TSS` : '')}
                                        </span>
                                    </div>

                                    {/* Métricas Clínicas (>= md) */}
                                    <div className="hidden md:flex items-center gap-6 mr-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Tiempo</span>
                                            <span className="text-sm font-semibold text-ink-2-soft tabular-nums">{formatDuration(act.duration)}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-16">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Dist</span>
                                            <span className="text-sm font-semibold text-ink-2-soft tabular-nums">{act.distance > 0 ? (act.distance / 1000).toFixed(1) + 'km' : '--'}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">Kcal</span>
                                            <span className="text-sm font-semibold text-ink-2-soft tabular-nums">{act.calories || '--'}</span>
                                        </div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-[10px] font-medium text-slate-400 mb-0.5">TSS</span>
                                            <span className={`text-sm font-bold tabular-nums ${act.tss > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {act.tss > 0 ? Math.round(act.tss) : '--'}
                                            </span>
                                            {act.tss > 0 && (
                                                <span data-history="tss-bar" aria-hidden="true" className="mt-1 h-[3px] w-full rounded-full bg-fill-3 overflow-hidden">
                                                    <span className="block h-full rounded-full bg-warning" style={{ width: `${Math.max(6, Math.round((act.tss / maxTss) * 100))}%` }} />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón Borrar y Chevron */}
                                    <div className="shrink-0 flex items-center gap-1 sm:gap-2">
                                        <button
                                            data-history="delete"
                                            onClick={(e) => { e.stopPropagation(); onDelete && del.request(act); }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-danger/10 active:scale-90 rounded-full transition-all"
                                            title="Eliminar actividad"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <ChevronRight size={15} className="text-faint group-hover:text-action-bright transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState data-history="empty" className="h-full" icon={Activity} title="No hay resultados" description="Prueba a cambiar los filtros de búsqueda.">
                        {hasFilters && <Button variant="secondary" onClick={clearFilters}>Quitar filtros</Button>}
                    </EmptyState>
                )}
            </div>
        </Card>
        <SportBreakdown rows={breakdown} />
        </Layout>
        <ConfirmDeleteActivityModal activity={del.pending} busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel} />
        </>
    );
});