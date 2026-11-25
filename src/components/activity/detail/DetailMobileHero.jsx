import React from 'react';
import { Stat, MetricTooltip } from '../../ui';
import { InteractiveMap } from '../ActivityMap';

export const DetailMobileHero = ({ activity, streams, themeColor, activePayload, metrics, showMap }) => {
    const isV2 = true; // v2 por defecto (Capa 6); las ramas v1 se retiran en los PR 5a–c
    if (isV2 && !showMap) return null; // v2: las cifras viven en `DetailHero`
    return (
                                    <div className="lg:hidden space-y-2.5">
                                        {showMap && (
                                            <div data-detail="map" className="h-48 sm:h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-zinc-800/80">
                                                <InteractiveMap 
                                                    polyline={activity.map_polyline} 
                                                    highResCoords={streams?.latlng?.data} 
                                                    color={themeColor} 
                                                    currentPosition={activePayload?.latlng} 
                                                />
                                            </div>
                                        )}

                                        {/* Resumen de Métricas en varias Columnas y Filas (Estilo Apple / Strava) */}
                                        {!isV2 && <div data-detail="stats" className="grid grid-cols-3 gap-2 py-0.5">
                                            {metrics.map(m => (
                                                <MetricTooltip key={m.id} metricId={m.metricId}><Stat label={m.label} value={m.value} unit={m.unit || undefined} accent={m.accent} /></MetricTooltip>
                                            ))}
                                        </div>}
                                    </div>
    );
};
