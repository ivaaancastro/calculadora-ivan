import React, { useMemo, useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, Clock, MapPin, Zap, Heart, Flame, Mountain, 
  ExternalLink, Trash2, Calendar, Activity, Wind, Dumbbell, Layers, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';

// --- DECODIFICADOR MAPA ---
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

const MapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] }); }, [map, bounds]);
    return null;
};

const InteractiveMap = ({ polyline, color }) => {
    const [mapType, setMapType] = useState('normal');
    const coords = useMemo(() => polyline ? decodePolyline(polyline) : null, [polyline]);

    if (!coords || coords.length === 0) return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
            <MapPin size={24} className="text-slate-300 dark:text-slate-600 mb-2"/>
            <span className="text-slate-400 font-medium text-xs">Sin datos GPS</span>
        </div>
    );

    const mapSources = {
        normal: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri' }
    };

    return (
        <div className="w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 z-0 bg-slate-100 dark:bg-slate-900">
            <div className="absolute top-3 right-3 z-[400]">
                <button onClick={(e) => { e.stopPropagation(); setMapType(prev => prev === 'normal' ? 'satellite' : 'normal'); }} className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
                    <Layers size={12} className={mapType === 'satellite' ? 'text-blue-500' : 'text-slate-400'} />
                    {mapType === 'normal' ? 'Satélite' : 'Mapa'}
                </button>
            </div>
            <MapContainer center={coords[0]} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer key={mapType} url={mapSources[mapType].url} attribution={mapSources[mapType].attribution} />
                {mapType === 'satellite' && <Polyline positions={coords} pathOptions={{ color: "#ffffff", weight: 5, opacity: 0.7 }} />}
                <Polyline positions={coords} pathOptions={{ color: color || "#3b82f6", weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
                <MapBounds bounds={coords} />
            </MapContainer>
        </div>
    );
};

// COMPONENTE AUXILIAR PARA LAS MÉTRICAS DE LA CABECERA
const MetricBox = ({ label, value, unit, valueColor = "text-slate-800 dark:text-slate-200", icon }) => (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</span>
        <span className={`text-lg md:text-xl font-black ${valueColor} flex items-baseline gap-1`}>
            {value} {icon}
            {unit && <span className="text-[10px] text-slate-500 font-bold ml-0.5">{unit}</span>}
        </span>
    </div>
);


// --- PÁGINA PRINCIPAL ---
export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
  const [streams, setStreams] = useState(null);
  const [loadingStreams, setLoadingStreams] = useState(true);
  
  const fetchedRef = useRef(null);

  useEffect(() => {
      if (!activity) return;

      if (fetchedRef.current !== activity.id) {
          fetchedRef.current = activity.id;
          setLoadingStreams(true);
          setStreams(null);

          if (activity.streams_data) {
              setStreams(activity.streams_data);
              setLoadingStreams(false);
          } else if (activity.strava_id) {
              fetchStreams(activity.id, activity.strava_id).then(data => {
                  setStreams(data);
                  setLoadingStreams(false);
              });
          } else {
              setLoadingStreams(false);
          }
      }
  }, [activity, fetchStreams]);

  // COMPRESOR DE DATOS PARA GRÁFICOS
  const chartData = useMemo(() => {
      if (!streams || !streams.time) return [];
      const timeData = streams.time.data;
      
      const targetPoints = 150; 
      const step = Math.max(1, Math.floor(timeData.length / targetPoints));
      const data = [];
      
      for (let i = 0; i < timeData.length; i += step) {
          data.push({
              time: Math.floor(timeData[i] / 60), 
              hr: streams.heartrate ? streams.heartrate.data[i] : null,
              speed: streams.velocity_smooth ? Number((streams.velocity_smooth.data[i] * 3.6).toFixed(1)) : null,
              alt: streams.altitude ? Math.round(streams.altitude.data[i]) : null,
              watts: streams.watts ? streams.watts.data[i] : null,
          });
      }
      return data;
  }, [streams]);

  // CÁLCULOS EXTRA: Sacar los máximos de los streams para la cabecera
  const maxHr = useMemo(() => {
      if (streams?.heartrate?.data?.length > 0) return Math.max(...streams.heartrate.data);
      return null;
  }, [streams]);

  const maxSpeedMetric = useMemo(() => {
      if (streams?.velocity_smooth?.data?.length > 0) {
          const maxMs = Math.max(...streams.velocity_smooth.data);
          const type = activity.type.toLowerCase();
          
          if (type.includes('bici') || type.includes('ciclismo')) {
              return { value: (maxMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Máx' };
          }
          if (type.includes('carrera') || type.includes('correr') || type.includes('run')) {
              if (maxMs <= 0) return null;
              const minPerKm = 16.666666666667 / maxMs;
              const mins = Math.floor(minPerKm); 
              const secs = Math.round((minPerKm - mins) * 60);
              return { value: `${mins}:${secs.toString().padStart(2, '0')}`, unit: '/km', label: 'Ritmo Máx' };
          }
      }
      return null;
  }, [streams, activity]);

  const exactZoneAnalysis = useMemo(() => {
      if (!streams || !streams.heartrate || !streams.time) return null;
      
      const type = activity.type.toLowerCase();
      const isBike = type.includes('bici') || type.includes('ciclismo');
      const userZones = isBike ? settings.bike.zones : settings.run.zones;
      
      const hrData = streams.heartrate.data;
      const timeData = streams.time.data;
      let zoneSeconds = [0, 0, 0, 0, 0];
      
      for (let i = 1; i < hrData.length; i++) {
          const hr = hrData[i];
          const dt = timeData[i] - timeData[i-1]; 
          const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
          if (zIndex !== -1) zoneSeconds[zIndex] += dt;
          else if (hr > userZones[4].max) zoneSeconds[4] += dt; 
      }

      const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
      return zoneSeconds.map((sec, i) => ({
          zone: i + 1,
          minutes: sec / 60,
          pct: totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0
      }));
  }, [streams, activity, settings]);

  if (!activity) return null;

  const formatTime = (mins) => { const h = Math.floor(mins / 60); const m = Math.floor(mins % 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const d = new Date(activity.date);
  const dateStr = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  const getSpeedOrPace = () => {
      const speedMs = activity.speed_avg || 0;
      if (speedMs === 0) return null;
      const type = activity.type.toLowerCase();
      if (type.includes('bici') || type.includes('ciclismo')) return { value: (speedMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Media' };
      if (type.includes('carrera') || type.includes('correr') || type.includes('run')) {
          const minPerKm = 16.666666666667 / speedMs;
          const mins = Math.floor(minPerKm); const secs = Math.round((minPerKm - mins) * 60);
          return { value: `${mins}:${secs.toString().padStart(2, '0')}`, unit: '/km', label: 'Ritmo Medio' };
      }
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

  const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base Aeróbica', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2 Max'];
  const ZONE_COLORS = ['bg-slate-400', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition font-medium px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ArrowLeft size={16} /> Volver
          </button>
          
          <div className="flex gap-2">
              {activity.strava_id && (
                  <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FC4C02]/10 text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white rounded-lg text-xs font-bold transition">
                      <ExternalLink size={14} /> Strava
                  </a>
              )}
              {onDelete && (
                  <button onClick={() => { if(window.confirm("¿Borrar?")) { onDelete(activity.id); onBack(); } }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition">
                      <Trash2 size={16} />
                  </button>
              )}
          </div>
      </div>

      {/* CABECERA AMPLIADA CON TODAS LAS MÉTRICAS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Calendar size={12} /> {dateStr}
              <span className={`px-1.5 py-0.5 rounded text-[9px] text-white ${theme.bg} ml-1`}>{activity.type}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
              {activity.name && activity.name !== 'Entreno sin título' ? activity.name : `${activity.type} Matutino`}
          </h1>
          
          {/* PANEL DE INSTRUMENTOS SUPERIOR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
              <MetricBox label="Duración" value={formatTime(activity.duration)} />
              <MetricBox label="Distancia" value={(activity.distance/1000).toFixed(2)} unit="km" />
              {activity.elevation_gain > 0 && <MetricBox label="Desnivel" value={activity.elevation_gain} unit="m+" />}
              {activity.calories > 0 && <MetricBox label="Calorías" value={activity.calories} unit="kcal" />}
              <MetricBox label="Carga" value={activity.tss} unit="TSS" valueColor="text-blue-600 dark:text-blue-400" />
              
              {speedMetric && <MetricBox label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} />}
              {maxSpeedMetric && <MetricBox label={maxSpeedMetric.label} value={maxSpeedMetric.value} unit={maxSpeedMetric.unit} />}
              
              {activity.hr_avg > 0 && <MetricBox label="Pulso Medio" value={Math.round(activity.hr_avg)} unit="ppm" icon={<Heart size={14} className="text-rose-500 animate-pulse inline ml-1"/>} />}
              {maxHr > 0 && <MetricBox label="Pulso Máx" value={maxHr} unit="ppm" />}
              
              {activity.watts_avg > 0 && <MetricBox label="Potencia Media" value={Math.round(activity.watts_avg)} unit="w" />}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* COLUMNA IZQUIERDA (Mapa y Zonas) */}
          <div className="lg:col-span-5 space-y-5">
              
              {activity.type.toLowerCase().includes('fuerza') ? (
                  <div className="w-full h-[250px] flex flex-col items-center justify-center bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                      <Dumbbell size={40} className="text-purple-300 dark:text-purple-800 mb-3" />
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400">Sesión Indoor</h3>
                  </div>
              ) : (
                  <InteractiveMap polyline={activity.map_polyline} color={theme.stroke} />
              )}

              {/* ANÁLISIS DE ZONAS (REAL) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Heart size={16} className="text-rose-500"/> Zonas de Pulso (Real)
                      </h3>
                      {loadingStreams && <Loader2 size={16} className="animate-spin text-blue-500"/>}
                  </div>
                  
                  {loadingStreams ? (
                      <div className="space-y-3 animate-pulse">
                          {[1,2,3,4,5].map(i => <div key={i} className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>)}
                      </div>
                  ) : exactZoneAnalysis ? (
                      <div className="space-y-3">
                          {exactZoneAnalysis.map((data, i) => (
                              <div key={i} className="flex items-center gap-3">
                                  <div className="w-24 shrink-0 text-right">
                                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{ZONE_LABELS[i]}</span>
                                  </div>
                                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                      <div className={`h-full ${ZONE_COLORS[i]}`} style={{ width: `${data.pct}%` }}></div>
                                  </div>
                                  <div className="w-16 shrink-0 flex justify-between items-center text-[10px]">
                                      <span className="font-black text-slate-700 dark:text-slate-300">{Math.round(data.minutes)}m</span>
                                      <span className="text-slate-400 font-bold">{Math.round(data.pct)}%</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-xs text-slate-400 py-4">No hay datos cardíacos para esta sesión.</p>
                  )}
              </div>
          </div>

          {/* COLUMNA DERECHA (Gráficos Interactivos Recharts) */}
          <div className="lg:col-span-7 space-y-5">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm h-full min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Activity size={16} className={theme.text}/> Telemetría
                      </h3>
                      {loadingStreams && <span className="text-[10px] text-slate-400 font-bold animate-pulse">Descargando Streams...</span>}
                  </div>

                  {loadingStreams ? (
                      <div className="flex-1 flex items-center justify-center">
                          <Loader2 size={32} className="animate-spin text-slate-300"/>
                      </div>
                  ) : chartData.length > 0 ? (
                      <div className="flex-1 space-y-6">
                          
                          {/* GRÁFICO 1: ALTITUD Y VELOCIDAD */}
                          <div className="h-[200px] w-full">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Perfil y Velocidad (km/h)</h4>
                              <ResponsiveContainer width="100%" height="100%">
                                  {/* MARGEN AÑADIDO (top: 25) PARA QUE NO SE CORTE EL TOOLTIP O EL PICO */}
                                  <AreaChart data={chartData} margin={{ top: 25, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                          </linearGradient>
                                          <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5}/>
                                              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                      <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `${val}m`} minTickGap={30} />
                                      
                                      {/* DOMAIN AUTOMÁTICO CON ESPACIO (dataMax * 1.15) */}
                                      <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} domain={[0, dataMax => Math.ceil(dataMax * 1.15)]} />
                                      <YAxis yAxisId="right" orientation="right" hide domain={['dataMin', dataMax => Math.ceil(dataMax * 1.15)]} />
                                      
                                      <Tooltip 
                                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                          labelFormatter={(val) => `Minuto ${val}`}
                                      />
                                      <Area yAxisId="right" type="monotone" dataKey="alt" name="Altitud (m)" stroke="#94a3b8" fillOpacity={1} fill="url(#colorAlt)" isAnimationActive={false} />
                                      <Area yAxisId="left" type="monotone" dataKey="speed" name="Velocidad (km/h)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" isAnimationActive={false} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>

                          {/* GRÁFICO 2: FRECUENCIA CARDÍACA */}
                          <div className="h-[200px] w-full">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Frecuencia Cardíaca (ppm)</h4>
                              <ResponsiveContainer width="100%" height="100%">
                                  {/* MARGEN AÑADIDO */}
                                  <AreaChart data={chartData} margin={{ top: 25, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                      <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `${val}m`} minTickGap={30} />
                                      
                                      {/* DOMAIN PARA QUE NO SE CORTE EL PICO NI BAJE A CERO */}
                                      <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} domain={['dataMin - 5', dataMax => Math.ceil(dataMax * 1.1)]} />
                                      
                                      <Tooltip 
                                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                          labelFormatter={(val) => `Minuto ${val}`}
                                      />
                                      <Area type="monotone" dataKey="hr" name="Pulsaciones" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" isAnimationActive={false} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>

                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                          <Activity size={32} className="opacity-20 mb-2"/>
                          <p className="text-sm font-bold">Sin datos de telemetría.</p>
                      </div>
                  )}
              </div>

          </div>
      </div>
    </div>
  );
};