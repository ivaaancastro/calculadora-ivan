import React, { useMemo, useEffect, useState } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Zap, Heart, Flame, Mountain, 
  ExternalLink, Trash2, Calendar, Activity, Wind, AlignLeft, Dumbbell, Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- DECODIFICADOR DE RUTAS GPS (STRAVA POLYLINE) ---
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

// Componente auxiliar para centrar el mapa
const MapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }, [map, bounds]);
    return null;
};

// --- COMPONENTE MAPA INTERACTIVO ---
const InteractiveMap = ({ polyline, color }) => {
    const [mapType, setMapType] = useState('normal');

    const coords = useMemo(() => {
        if (!polyline) return null;
        return decodePolyline(polyline);
    }, [polyline]);

    if (!coords || coords.length === 0) return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapPin size={24} className="text-slate-300 dark:text-slate-600 mb-2"/>
            <span className="text-slate-400 font-medium text-xs">Sin datos GPS</span>
        </div>
    );

    const mapSources = {
        normal: {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; CartoDB'
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution: '&copy; Esri'
        }
    };

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 z-0 bg-slate-100 dark:bg-slate-900">
            
            {/* BOTÓN FLOTANTE MÁS COMPACTO */}
            <div className="absolute top-3 right-3 z-[400]">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMapType(prev => prev === 'normal' ? 'satellite' : 'normal');
                    }}
                    className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                >
                    <Layers size={12} className={mapType === 'satellite' ? 'text-blue-500' : 'text-slate-400'} />
                    {mapType === 'normal' ? 'Satélite' : 'Mapa'}
                </button>
            </div>

            <MapContainer 
                center={coords[0]} 
                zoom={13} 
                scrollWheelZoom={true} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer key={mapType} url={mapSources[mapType].url} attribution={mapSources[mapType].attribution} />
                {mapType === 'satellite' && (
                    <Polyline positions={coords} pathOptions={{ color: "#ffffff", weight: 5, opacity: 0.7 }} />
                )}
                <Polyline positions={coords} pathOptions={{ color: color || "#3b82f6", weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
                <MapBounds bounds={coords} />
            </MapContainer>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export const ActivityDetailPage = ({ activity, onBack, onDelete }) => {
  if (!activity) return null;

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  
  const d = new Date(activity.date);
  const dateStr = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const getSpeedOrPace = () => {
      const speedMs = activity.speed_avg || 0;
      if (speedMs === 0) return null;
      const type = activity.type.toLowerCase();
      if (type.includes('bici') || type.includes('ciclismo')) return { value: (speedMs * 3.6).toFixed(1), unit: 'km/h', label: 'Velocidad' };
      if (type.includes('carrera') || type.includes('correr') || type.includes('run')) {
          const minPerKm = 16.666666666667 / speedMs;
          const mins = Math.floor(minPerKm);
          const secs = Math.round((minPerKm - mins) * 60);
          return { value: `${mins}:${secs.toString().padStart(2, '0')}`, unit: '/km', label: 'Ritmo' };
      }
      if (type.includes('nadar') || type.includes('swim')) return { value: ((100 / speedMs) / 60).toFixed(2), unit: '/100m', label: 'Ritmo' };
      return null;
  };
  const speedMetric = getSpeedOrPace();

  const getTheme = (type) => {
    const t = type.toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return { bg: 'bg-orange-500', text: 'text-orange-600', stroke: '#f97316' };
    if (t.includes('bike') || t.includes('bici')) return { bg: 'bg-blue-600', text: 'text-blue-600', stroke: '#3b82f6' };
    if (t.includes('gym') || t.includes('fuerza')) return { bg: 'bg-purple-600', text: 'text-purple-600', stroke: '#a855f7' };
    return { bg: 'bg-slate-700', text: 'text-slate-700', stroke: '#64748b' };
  };
  const theme = getTheme(activity.type);

  const metrics = [
    { label: 'Tiempo', value: formatTime(activity.duration), icon: Clock, show: true },
    { label: 'Distancia', value: (activity.distance / 1000).toFixed(2), unit: 'km', icon: MapPin, show: activity.distance > 0 },
    { label: 'Carga', value: activity.tss || 0, unit: 'TSS', icon: Zap, show: true },
    { label: speedMetric?.label, value: speedMetric?.value, unit: speedMetric?.unit, icon: Wind, show: !!speedMetric },
    { label: 'Pulso Medio', value: Math.round(activity.hr_avg), unit: 'ppm', icon: Heart, show: activity.hr_avg > 0 },
    { label: 'Potencia', value: activity.watts_avg, unit: 'w', icon: Activity, show: activity.watts_avg > 0 },
    { label: 'Desnivel', value: activity.elevation_gain, unit: 'm+', icon: Mountain, show: activity.elevation_gain > 0 },
    { label: 'Calorías', value: activity.calories, unit: 'kcal', icon: Flame, show: activity.calories > 0 }
  ].filter(m => m.show);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* NAVEGACIÓN SUPERIOR MÁS COMPACTA */}
      <div className="flex items-center justify-between mb-4">
          <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition font-medium px-3 py-1.5 text-sm rounded-lg"
          >
              <ArrowLeft size={16} /> Volver
          </button>
          
          <div className="flex gap-2">
              {activity.strava_id && (
                  <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FC4C02]/10 text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white rounded-lg text-xs font-bold transition">
                      <ExternalLink size={14} /> Strava
                  </a>
              )}
              {onDelete && (
                  <button onClick={() => { if(window.confirm("¿Borrar?")) { onDelete(activity.id); onBack(); } }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <Trash2 size={16} />
                  </button>
              )}
          </div>
      </div>

      {/* CABECERA (HERO) MINIMALISTA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      <Calendar size={12} /> {dateStr} <span className="opacity-50">•</span> {timeStr}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] text-white ${theme.bg} ml-1`}>{activity.type}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                      {activity.name && activity.name !== 'Entreno sin título' ? activity.name : `${activity.type} Matutino`}
                  </h1>
                  {activity.description && (
                      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm flex gap-2 items-start max-w-2xl">
                          <AlignLeft size={14} className="shrink-0 mt-1 opacity-40"/> 
                          <span className="leading-relaxed">"{activity.description}"</span>
                      </p>
                  )}
              </div>
          </div>
      </div>

      {/* ZONA CENTRAL: MAPA (8 cols) + MÉTRICAS (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* EL MAPA (Ocupa más espacio visual) */}
          <div className="lg:col-span-8 h-[250px] md:h-[400px] relative z-0">
              {activity.type.toLowerCase().includes('fuerza') || activity.type.toLowerCase().includes('gym') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                      <Dumbbell size={40} className="text-purple-300 dark:text-purple-800 mb-3" />
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400">Sesión de Fuerza</h3>
                      <p className="text-xs text-purple-600/60 dark:text-purple-500/60 mt-1">Indoor / Sin GPS</p>
                  </div>
              ) : (
                  <InteractiveMap polyline={activity.map_polyline} color={theme.stroke} />
              )}
          </div>

          {/* LAS MÉTRICAS (Más pequeñas y compactas) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 auto-rows-min">
              {metrics.map((m, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 ${theme.text}`}>
                              <m.icon size={12} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{m.value}</span>
                          {m.unit && <span className="text-[10px] font-bold text-slate-400">{m.unit}</span>}
                      </div>
                  </div>
              ))}
          </div>

      </div>

    </div>
  );
};