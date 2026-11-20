import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatPace, formatDuration } from '../../../utils/formatters';
import { Card, EmptyState } from '../../ui';
import { useChartTheme } from '../../charts/useChartTheme';
import { useChartSkin } from '../../charts/ChartSkin';
import { ZoomRange } from '../../charts/ZoomRange';
import { sliceByRange } from '../../charts/sliceRange';

export const ActivityCharts = ({ chartData: fullData, activePayload, handleMouseMove, isPaceBased, blocks }) => {
    const ct = useChartTheme();
    const isV2 = useChartSkin() === 'v2';
    const [range, setRange] = useState([0, 100]);
    const chartData = useMemo(() => (isV2 ? sliceByRange(fullData, range) : fullData), [isV2, fullData, range]);
    return (
<>
                                    {chartData.length > 0 ? (
                                        <Card data-detail="charts" className="overflow-hidden">
                                            {isV2 && fullData.length > 20 && <ZoomRange range={range} onChange={setRange} />}
                                            {/* Velocity/Pace */}
                                            {blocks?.charts?.speed !== false && (
                                            <div className="h-[120px] pt-3.5 px-3.5 sm:px-6 border-b border-line-soft-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isPaceBased ? 'Ritmo' : 'Velocidad'}</h4>
                                                        {activePayload && (
                                                            <div className="px-1.5 py-0.5 bg-surface-2 rounded flex items-center gap-2 text-[9px] font-bold tabular-nums">
                                                                <span className="text-body-soft">{formatDuration(activePayload.rawTime)}</span>
                                                                <span className="w-px h-2 bg-slate-300 dark:bg-zinc-700"></span>
                                                                <span className="text-pace">{activePayload.distanceKm} km</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {activePayload && <span className="text-xs font-bold tabular-nums text-pace">{isPaceBased ? formatPace(activePayload.pace) : activePayload.speed + ' km/h'}</span>}
                                                </div>
                                                <ResponsiveContainer width="100%" height={80}>
                                                    <AreaChart 
                                                        data={chartData} 
                                                        syncId="st" 
                                                        onMouseMove={handleMouseMove}
                                                        onTouchMove={handleMouseMove}
                                                        onTouchStart={handleMouseMove}
                                                        onClick={handleMouseMove}
                                                        style={{ touchAction: 'pan-y' }}
                                                    >
                                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                        <XAxis dataKey="time" hide />
                                                        <YAxis reversed={isPaceBased} hide domain={['dataMin', 'dataMax']} />
                                                        <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: ct.series.pace, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                        <Area type="monotone" dataKey={isPaceBased ? "pace" : "speed"} stroke={ct.series.pace} fill={ct.series.pace} fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.pace }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            )}

                                            {/* Heart Rate */}
                                            {chartData.some(d => d.hr > 0) && (
                                                <div className="h-[120px] pt-3.5 px-3.5 sm:px-6 border-b border-line-soft-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FC</h4>
                                                        {activePayload && <span className="text-xs font-bold tabular-nums text-hr">{activePayload.hr} bpm</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart 
                                                            data={chartData} 
                                                            syncId="st" 
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: ct.series.hr, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="hr" stroke={ct.series.hr} fill={ct.series.hr} fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.hr }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Power */}
                                            {chartData.some(d => d.watts > 0) && (
                                                <div className="h-[120px] pt-3.5 px-3.5 sm:px-6 border-b border-line-soft-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Potencia</h4>
                                                        {activePayload && <span className="text-xs font-bold tabular-nums text-power">{activePayload.watts} w</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart 
                                                            data={chartData} 
                                                            syncId="st" 
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin', 'dataMax']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: ct.series.power, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="watts" stroke={ct.series.power} fill={ct.series.power} fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.power }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Altitude */}
                                            {chartData.some(d => d.alt !== null) && (
                                                <div className="h-[120px] pt-3.5 px-3.5 sm:px-6 border-b border-line-soft-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Altitud</h4>
                                                            {activePayload?.grade !== undefined && (
                                                                <span className={`text-[9px] font-black ${activePayload.grade > 3 ? 'text-rose-500' : activePayload.grade < -3 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                    {activePayload.grade > 0 ? '+' : ''}{activePayload.grade.toFixed(1)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        {activePayload && <span className="text-xs font-bold tabular-nums text-slate-500">{activePayload.alt} m</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart 
                                                            data={chartData} 
                                                            syncId="st" 
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: ct.series.altitude, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="alt" stroke={ct.series.altitude} fill={ct.series.altitude} fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.altitude }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Cadence */}
                                            {chartData.some(d => d.cadence > 0) && (
                                                <div className="h-[120px] pt-3.5 px-3.5 sm:px-6">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cadencia</h4>
                                                        {activePayload && <span className="text-xs font-bold tabular-nums text-cadence">{activePayload.cadence} {isPaceBased ? 'ppm' : 'rpm'}</span>}
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={80}>
                                                        <AreaChart 
                                                            data={chartData} 
                                                            syncId="st" 
                                                            onMouseMove={handleMouseMove}
                                                            onTouchMove={handleMouseMove}
                                                            onTouchStart={handleMouseMove}
                                                            onClick={handleMouseMove}
                                                            style={{ touchAction: 'pan-y' }}
                                                        >
                                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={ct.anatomy.gridSoft} opacity={0.5} />
                                                            <XAxis dataKey="time" hide />
                                                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                            <RechartsTooltip isAnimationActive={false} content={() => null} cursor={{ stroke: ct.series.cadence, strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                                            <Area type="monotone" dataKey="cadence" stroke={ct.series.cadence} fill={ct.series.cadence} fillOpacity={0.06} strokeWidth={1.5} dot={false} activeDot={{ r: 3, stroke: ct.anatomy.dotRing, strokeWidth: 1.5, fill: ct.series.cadence }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </Card>
                                    ) : (
                                        <EmptyState className="h-64" title="Sin datos de análisis" />
                                    )}
</>
    );
};
