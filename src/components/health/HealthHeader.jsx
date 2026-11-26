import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Segmented } from '../ui';

const VIEWS = [
    { value: 'today', label: 'Hoy' },
    { value: 'history', label: 'Historial' },
];

/**
 * Cabecera de Salud. El selector Hoy/Historial cambia toda la pantalla, así que va en su
 * cabecera, a la altura del título, igual en móvil y escritorio (spec Capa 6, RF-D3).
 */
export const HealthHeader = ({ wellnessMetrics, setActiveTab, activeTab, wellnessLoading, apiError }) => (
    <header data-health="header" className="flex flex-col gap-3 pt-2 md:pt-4">
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Salud</h1>
                {wellnessMetrics?.isSimulated && (
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-fill-4 text-body-soft uppercase tracking-[0.05em]">Demo</span>
                )}
            </div>
            <Segmented
                data-health="view-tabs"
                role="group"
                aria-label="Vista"
                className="shrink-0"
                optionClassName="min-h-[44px] md:min-h-[36px]"
                options={VIEWS}
                value={activeTab}
                onChange={setActiveTab}
            />
        </div>
        {wellnessLoading && <p className="text-xs text-ink-3">Sincronizando métricas fisiológicas…</p>}
        {apiError && (
            <div role="alert" className="px-3.5 py-2 rounded-xl bg-danger-tint-3 border border-danger-edge text-danger-ink text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={14} aria-hidden="true" /> Error al sincronizar datos biométricos
            </div>
        )}
    </header>
);
