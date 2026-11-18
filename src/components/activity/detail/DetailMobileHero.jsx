import React from 'react';
import { Stat, MetricTooltip } from '../../ui';
import { InteractiveMap } from '../ActivityMap';

export const DetailMobileHero = ({ activity, streams, themeColor, activePayload, metrics, showMap }) => (
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
                                        <div data-detail="stats" className="grid grid-cols-3 gap-2 py-0.5">
                                            {metrics.map(m => (
                                                <MetricTooltip key={m.id} metricId={m.metricId}><Stat label={m.label} value={m.value} unit={m.unit || undefined} accent={m.accent} /></MetricTooltip>
                                            ))}
                                        </div>
                                    </div>
);
