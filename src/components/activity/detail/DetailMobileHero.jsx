import React from 'react';
import { Stat } from '../../ui';
import { InteractiveMap } from '../ActivityMap';
import { formatMinsToHMM } from '../../../utils/formatters';

export const DetailMobileHero = ({ activity, streams, themeColor, activePayload, speedMetric, proMetrics, isPaceBased }) => (
                                    <div className="lg:hidden space-y-2.5">
                                        {(activity.map_polyline || streams?.latlng?.data) && (
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
                                            <Stat label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" />
                                            <Stat label="Tiempo" value={formatMinsToHMM(activity.duration)} />
                                            <Stat label="Desnivel" value={activity.elevation_gain || 0} unit="m" />
                                            {speedMetric && <Stat label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} accent="text-speed" />}
                                            {activity.hr_avg > 0 && <Stat label="FC Media" value={activity.hr_avg} unit="bpm" accent="text-hr" />}
                                            <Stat label="Carga" value={Math.round(activity.tss || 0)} unit="TSS" accent="text-load" />
                                            {proMetrics.avgWatts > 0 && <Stat label="W Media" value={proMetrics.avgWatts} unit="w" accent="text-power" />}
                                            {proMetrics.ifFactor > 0 && <Stat label="IF" value={proMetrics.ifFactor} accent="text-power" />}
                                            {proMetrics.cadenceAvg > 0 && <Stat label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'ppm' : 'rpm'} />}
                                            {proMetrics.workKj > 0 && <Stat label="Trabajo" value={proMetrics.workKj} unit="kJ" />}
                                            {proMetrics.npWatts > 0 && <Stat label="NP" value={proMetrics.npWatts} unit="w" accent="text-power-strong" />}
                                            {proMetrics.efObj && <Stat label="EF" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} />}
                                            {proMetrics.decouplingObj && (
                                                <Stat label="Drift" value={proMetrics.decouplingObj.value} unit="%" accent={proMetrics.decouplingObj.color} />
                                            )}
                                        </div>
                                    </div>
);
