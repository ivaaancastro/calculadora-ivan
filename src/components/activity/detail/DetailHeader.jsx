import React, { memo } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { IconButton, Segmented } from '../../ui';

/**
 * Barra única del detalle (RF-D5, «como Strava»): volver, pestañas y borrar en una sola fila,
 * igual en móvil y escritorio. El título y la fecha viven en el héroe.
 */
export const DetailHeader = memo(function DetailHeader({ activity, activeTab, setActiveTab, onBack, onDelete, tabs }) {
    return (
        <header data-detail="header" className="glass-nav shrink-0 z-nav border-b border-hairline">
            <div className="max-w-content mx-auto px-4 md:px-6 py-2 flex items-center gap-1.5 md:gap-4">
                <IconButton
                    variant="soft"
                    data-detail="action"
                    onClick={onBack}
                    className="w-11 h-11 shrink-0"
                    title="Volver"
                    label="Volver"
                    icon={ArrowLeft}
                    iconSize={18}
                />
                <Segmented
                    variant="rail"
                    data-detail="tabs"
                    className="flex-1 md:flex-none min-w-0 overflow-x-auto"
                    optionClassName="max-md:flex-1 max-md:px-1.5 md:min-w-[96px]"
                    value={activeTab}
                    onChange={setActiveTab}
                    options={tabs.map((t) => ({ value: t.id, label: t.label }))}
                />
                {onDelete && (
                    <button
                        type="button"
                        data-detail="action"
                        aria-label="Eliminar actividad"
                        title="Eliminar actividad"
                        onClick={() => onDelete(activity)}
                        className="ml-auto w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-ink-4 hover:text-danger hover:bg-danger/10 active:scale-press transition-paint"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </header>
    );
});
