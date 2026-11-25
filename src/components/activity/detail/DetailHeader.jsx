import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { IconButton, Segmented } from '../../ui';
import { activityTypeLabel } from '../../../utils/sport';

export const DetailHeader = ({ activity, activeTab, setActiveTab, onBack, onDelete, dateStr, tabs }) => {
    // En Análisis el título y las cifras viven en el hero; la cabecera queda en controles.
    const heroOwnsTitle = activeTab === 'analyze';
    return (
            <header data-detail="header" className="glass-nav px-3.5 py-2 sm:px-6 sm:py-3 shrink-0 z-nav">
                {/* --- DESKTOP HEADER (lg:flex) --- */}
                <div className="hidden lg:flex items-center justify-between gap-2 mb-2.5 sm:mb-3 border-b border-hairline pb-2">
                    <Segmented
                        variant="pill"
                        className="overflow-x-auto min-w-0"
                        value={activeTab}
                        onChange={setActiveTab}
                        options={tabs.map(t => ({ value: t.id, label: t.label }))}
                    />
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        {activity.strava_id && (
                            <a data-detail="action" href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" 
                               className="px-2.5 py-1 text-[10px] font-bold text-orange-500 hover:bg-orange-500/10 active:scale-95 rounded-full transition-all uppercase tracking-wider shrink-0">
                                Strava
                            </a>
                        )}
                        <button type="button" aria-label="Eliminar actividad" data-detail="action" onClick={() => onDelete && onDelete(activity.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-danger/10 rounded-full active:scale-90 transition-all shrink-0" title="Eliminar actividad">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                    <IconButton variant="soft" data-detail="action" onClick={onBack} className="w-8 h-8 shrink-0" title="Volver" label="Volver" icon={ArrowLeft} iconSize={16} />
                    {!heroOwnsTitle && (
                    <div className="min-w-0">
                        <h1 className="text-sm font-bold text-ink tracking-tight leading-tight truncate">
                            {activity.name || activityTypeLabel(activity.type)}
                        </h1>
                        <p className="text-[10px] font-semibold text-ink-4 capitalize">{dateStr}</p>
                    </div>
                    )}
                </div>

                {/* --- MOBILE HEADER (lg:hidden) --- */}
                {/* Fila 1: Flecha atrás + Título + Acciones Strava y Borrar */}
                <div className="lg:hidden flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <IconButton variant="soft" data-detail="action" onClick={onBack} className="w-8 h-8 shrink-0" title="Volver" label="Volver" icon={ArrowLeft} iconSize={16} />
                        {!heroOwnsTitle && (
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-ink tracking-tight leading-tight truncate">
                                {activity.name || activityTypeLabel(activity.type)}
                            </h1>
                            <p className="text-[10px] font-semibold text-ink-4 capitalize truncate">{dateStr}</p>
                        </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {activity.strava_id && (
                            <a data-detail="action" href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" 
                               className="px-2.5 py-1 text-[10px] font-bold text-orange-500 hover:bg-orange-500/10 active:scale-95 rounded-full transition-all uppercase tracking-wider shrink-0">
                                Strava
                            </a>
                        )}
                        <button type="button" aria-label="Eliminar actividad" data-detail="action" onClick={() => onDelete && onDelete(activity.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-danger/10 rounded-full active:scale-90 transition-all shrink-0" title="Eliminar actividad">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Fila 2: Selector Segmentado iOS nativo a ancho completo (4 columnas iguales, cómodo y sin cortes) */}
                <div data-detail="tabs" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="lg:hidden grid w-full bg-fill-4 p-1 rounded-xl gap-1 shadow-2xs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-1.5 text-xs font-semibold rounded-lg text-center transition-all select-none touch-manipulation active:scale-[0.98] ${
                                activeTab === tab.id
                                    ? 'bg-surface-4 text-ink shadow-xs font-bold'
                                    : 'text-ink-3 hover:text-ink'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>
    );
};
