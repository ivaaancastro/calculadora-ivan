import React from 'react';
import { Stat, MetricTooltip } from '../../ui';
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
                                            <MetricTooltip metricId="distance"><Stat label="Distancia" value={(activity.distance / 1000).toFixed(2)} unit="km" /></MetricTooltip>
                                            <MetricTooltip metricId="duration"><Stat label="Tiempo" value={formatMinsToHMM(activity.duration)} /></MetricTooltip>
                                            <MetricTooltip metricId="elevation"><Stat label="Desnivel" value={activity.elevation_gain || 0} unit="m" /></MetricTooltip>
                                            {speedMetric && <MetricTooltip metricId={speedMetric.label === 'Ritmo Medio' ? 'pace' : 'speed'}><Stat label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} accent="text-speed" /></MetricTooltip>}
                                            {activity.hr_avg > 0 && <MetricTooltip metricId="hrAvg"><Stat label="FC Media" value={activity.hr_avg} unit="bpm" accent="text-hr" /></MetricTooltip>}
                                            <MetricTooltip metricId="tss"><Stat label="Carga" value={Math.round(activity.tss || 0)} unit="TSS" accent="text-load" /></MetricTooltip>
                                            {proMetrics.avgWatts > 0 && <MetricTooltip metricId="wattsAvg"><Stat label="W Media" value={proMetrics.avgWatts} unit="w" accent="text-power" /></MetricTooltip>}
                                            {proMetrics.ifFactor > 0 && <MetricTooltip metricId="if"><Stat label="IF" value={proMetrics.ifFactor} accent="text-power" /></MetricTooltip>}
                                            {proMetrics.cadenceAvg > 0 && <MetricTooltip metricId="cadence"><Stat label="Cadencia" value={proMetrics.cadenceAvg} unit={isPaceBased ? 'ppm' : 'rpm'} /></MetricTooltip>}
                                            {proMetrics.workKj > 0 && <MetricTooltip metricId="work"><Stat label="Trabajo" value={proMetrics.workKj} unit="kJ" /></MetricTooltip>}
                                            {proMetrics.npWatts > 0 && <MetricTooltip metricId="np"><Stat label="NP" value={proMetrics.npWatts} unit="w" accent="text-power-strong" /></MetricTooltip>}
                                            {proMetrics.efObj && <MetricTooltip metricId="ef"><Stat label="EF" value={proMetrics.efObj.value} unit={proMetrics.efObj.unit} /></MetricTooltip>}
                                            {proMetrics.decouplingObj && (
                                                <MetricTooltip metricId="decoupling"><Stat label="Drift" value={proMetrics.decouplingObj.value} unit="%" accent={proMetrics.decouplingObj.color} /></MetricTooltip>
                                            )}
                                        </div>
                                    </div>
);
