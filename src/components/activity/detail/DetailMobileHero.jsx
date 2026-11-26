import React from 'react';
import { InteractiveMap } from '../ActivityMap';

export const DetailMobileHero = ({ activity, streams, themeColor, activePayload, showMap }) => {
    if (!showMap) return null; // las cifras viven en `DetailHero`
    return (
                                    <div className="lg:hidden space-y-2.5">
                                        {showMap && (
                                            <div data-detail="map" className="h-48 sm:h-64 overflow-hidden border border-line rounded-3xl shadow-card">
                                                <InteractiveMap 
                                                    polyline={activity.map_polyline} 
                                                    highResCoords={streams?.latlng?.data} 
                                                    color={themeColor} 
                                                    currentPosition={activePayload?.latlng} 
                                                />
                                            </div>
                                        )}
                                    </div>
    );
};
