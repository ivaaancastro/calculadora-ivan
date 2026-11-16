import React from 'react';
import {
    AlertTriangle
} from 'lucide-react';

export const HealthHeader = ({ wellnessMetrics, readinessInfo, setActiveTab, activeTab, wellnessLoading, apiError }) => (
    <>
        <div className="pt-2 sm:pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                            Salud
                        </h1>
                        {wellnessMetrics && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-fill-4 text-body-soft uppercase tracking-wider">
                                {wellnessMetrics.isSimulated ? 'Modo Demo' : 'Biometría Diaria'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-ink-3 mt-0.5 max-w-xl">
                        {wellnessLoading ? 'Sincronizando métricas fisiológicas...' : readinessInfo.msg}
                    </p>
                </div>

                {/* Selector de Vista: Hoy vs Historial */}
                <div className="w-full sm:w-auto grid grid-cols-2 p-1 bg-fill-4 rounded-xl gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('today')}
                        className={`py-1.5 px-4 text-xs font-semibold rounded-lg text-center transition-all active:scale-95 ${
                            activeTab === 'today'
                                ? 'bg-surface-4 text-ink shadow-xs font-bold'
                                : 'text-ink-3 hover:text-ink-2-soft'
                        }`}
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`py-1.5 px-4 text-xs font-semibold rounded-lg text-center transition-all active:scale-95 ${
                            activeTab === 'history'
                                ? 'bg-surface-4 text-ink shadow-xs font-bold'
                                : 'text-ink-3 hover:text-ink-2-soft'
                        }`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {apiError && (
                <div className="px-3.5 py-2 rounded-xl bg-danger-tint-3 border border-danger-edge text-danger-ink text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={14} /> Error al sincronizar datos biométricos
                </div>
            )}
        </div>
    </>
);
