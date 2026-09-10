import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const decodePolyline = (str, precision = 5) => {
    let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change; lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
};

export const MapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { 
        if (bounds && bounds.length > 0) {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [30, 30] }); 
            const t = setTimeout(() => {
                map.invalidateSize();
                map.fitBounds(bounds, { padding: [30, 30] });
            }, 150);
            const t2 = setTimeout(() => {
                map.invalidateSize();
            }, 400);
            return () => {
                clearTimeout(t);
                clearTimeout(t2);
            };
        }
    }, [map, bounds]);
    return null;
};

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        const update = () => {
            if (map) {
                map.invalidateSize();
            }
        };
        update();
        const t1 = setTimeout(update, 100);
        const t2 = setTimeout(update, 350);
        const t3 = setTimeout(update, 800);
        window.addEventListener('resize', update);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', update);
        };
    }, [map]);
    return null;
};

export const InteractiveMap = ({ polyline, highResCoords, color, currentPosition }) => {
    const [mapType, setMapType] = useState('light');

    const coords = useMemo(() => {
        if (highResCoords && highResCoords.length > 0) return highResCoords;
        if (polyline) return decodePolyline(polyline);
        return null;
    }, [polyline, highResCoords]);

    if (!coords || coords.length === 0) return (
        <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
            <MapPin size={32} className="text-slate-400 dark:text-zinc-600 mb-2" />
            <span className="text-slate-700 dark:text-zinc-300 font-bold text-sm">Sin datos GPS</span>
            <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1 max-w-xs">Esta actividad no contiene coordenadas de ruta o track GPS.</p>
        </div>
    );

    const mapSources = {
        light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri' }
    };

    return (
        <div className="w-full h-full rounded-lg overflow-hidden relative border border-slate-200 dark:border-zinc-800 z-0 bg-slate-100 dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="absolute top-3 right-3 z-[400] flex border border-slate-200 dark:border-zinc-700/80 rounded bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-sm overflow-hidden p-0.5">
                {['light', 'dark', 'satellite'].map((type) => (
                    <button
                        key={type} onClick={(e) => { e.stopPropagation(); setMapType(type); }}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase transition-colors rounded-sm ${mapType === type ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                    >
                        {type === 'satellite' ? 'Sat' : type}
                    </button>
                ))}
            </div>

            <MapContainer center={coords[0]} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer key={mapType} url={mapSources[mapType].url} attribution={mapSources[mapType].attribution} />
                <Polyline positions={coords} pathOptions={{ color: mapType === 'light' ? "#ffffff" : "#000000", weight: 6, opacity: 0.3 }} />
                <Polyline positions={coords} pathOptions={{ color: color || "#2563eb", weight: 3, opacity: 1 }} />
                <CircleMarker center={coords[0]} radius={5} pathOptions={{ color: '#ffffff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }} />
                <CircleMarker center={coords[coords.length - 1]} radius={5} pathOptions={{ color: '#ffffff', fillColor: '#18181b', fillOpacity: 1, weight: 2 }} />

                {currentPosition && (
                    <>
                        <CircleMarker
                            center={currentPosition}
                            radius={10}
                            pathOptions={{ color: 'transparent', fillColor: color || '#2563eb', fillOpacity: 0.3, weight: 0 }}
                        />
                        <CircleMarker
                            center={currentPosition}
                            radius={5}
                            pathOptions={{ color: '#ffffff', fillColor: color || '#2563eb', fillOpacity: 1, weight: 2 }}
                        />
                    </>
                )}
                <MapBounds bounds={coords} />
                <MapResizer />
            </MapContainer>
        </div>
    );
};
