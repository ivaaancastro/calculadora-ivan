import React from 'react';
import { InteractiveMap } from '../ActivityMap';
import { useChartTheme } from '../../charts/useChartTheme';

export const MapTab = ({ activity, streams, themeColor, activePayload }) => {
    const ct = useChartTheme();
    return (
                        <div className="flex-1 min-h-[480px] w-full relative">
                            <InteractiveMap 
                                polyline={activity.map_polyline} 
                                highResCoords={streams?.latlng?.data} 
                                color={themeColor || ct.sports.fallback} 
                                currentPosition={activePayload?.latlng} 
                            />
                            <div data-detail="map-note" className="absolute top-4 left-4 z-map bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-3 rounded-xl border border-line-soft-2 shadow-md space-y-1 pointer-events-none max-w-[220px]">
                                <h3 className="text-2xs font-bold uppercase tracking-widest text-ink-4">Ruta Detallada</h3>
                                <div className="text-2xs text-body-soft leading-tight">
                                    {activity.distance ? `${(activity.distance / 1000).toFixed(2)} km` : ''} 
                                    {activity.elevation_gain ? ` • +${activity.elevation_gain}m` : ''}
                                </div>
                            </div>
                        </div>
    );
};
