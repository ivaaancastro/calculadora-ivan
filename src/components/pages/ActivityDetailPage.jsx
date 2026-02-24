import React, { useMemo, useEffect, useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, Trash2, Calendar, Activity, Layers, Loader2, Heart, Clock, MapPin, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

const MapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] }); }, [map, bounds]);
    return null;
};

const InteractiveMap = ({ polyline, color }) => {
    const [mapType, setMapType] = useState('normal');
    const coords = useMemo(() => polyline ? decodePolyline(polyline) : null, [polyline]);

    if (!coords || coords.length === 0) return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
            <MapPin size={24} className="text-slate-400 dark:text-zinc-600 mb-2"/>
            <span className="text-slate-500 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">Sin datos GPS</span>
        </div>
    );

    const mapSources = {
        normal: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: '&copy; CartoDB' },
        satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: '&copy; Esri' }
    };

    return (
        <div className="w-full h-[250px] md:h-[350px] rounded-lg overflow-hidden relative border border-slate-200 dark:border-zinc-800 z-0 bg-slate-100 dark:bg-zinc-900">
            <div className="absolute top-3 right-3 z-[400]">
                <button onClick={(e) => { e.stopPropagation(); setMapType(prev => prev === 'normal' ? 'satellite' : 'normal'); }} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase hover:text-blue-500 transition-colors">
                    <Layers size={12} /> {mapType === 'normal' ? 'Satélite' : 'Mapa'}
                </button>
            </div>
            <MapContainer center={coords[0]} zoom={13} scrollWheelZoom={true} className="w-full h-full z-0" zoomControl={false}>
                <TileLayer key={mapType} url={mapSources[mapType].url} attribution={mapSources[mapType].attribution} />
                {mapType === 'satellite' && <Polyline positions={coords} pathOptions={{ color: "#ffffff", weight: 4, opacity: 0.5 }} />}
                <Polyline positions={coords} pathOptions={{ color: color || "#2563eb", weight: 3, opacity: 1 }} />
                <MapBounds bounds={coords} />
            </MapContainer>
        </div>
    );
};

const MetricBox = ({ label, value, unit, colorClass = "border-slate-300 dark:border-zinc-700" }) => (
    <div className={`flex flex-col pl-3 border-l-2 py-1 ${colorClass}`}>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-lg md:text-xl font-mono font-black text-slate-800 dark:text-zinc-100 leading-none">
            {value} {unit && <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold ml-0.5">{unit}</span>}
        </span>
    </div>
);

// HELPER: Formateador de Ritmo a mm:ss
const formatPace = (decimalMinutes) => {
    if (!decimalMinutes || decimalMinutes >= 20) return '>20:00';
    const mins = Math.floor(decimalMinutes);
    const secs = Math.round((decimalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ActivityDetailPage = ({ activity, settings, fetchStreams, onBack, onDelete }) => {
  const [streams, setStreams] = useState(null);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const fetchedRef = useRef(null);

  // DETECCIÓN DE DEPORTE (Para saber si dibujamos Vel. o Ritmo)
  const isPaceBased = useMemo(() => {
      if (!activity) return false;
      const t = String(activity.type).toLowerCase();
      return t.includes('carrera') || t.includes('run') || t.includes('correr') || t.includes('andar') || t.includes('walk') || t.includes('caminata');
  }, [activity]);

  useEffect(() => {
      if (!activity) return;
      if (fetchedRef.current !== activity.id) {
          fetchedRef.current = activity.id;
          setLoadingStreams(true); setStreams(null);
          if (activity.streams_data) { setStreams(activity.streams_data); setLoadingStreams(false); }
          else if (activity.strava_id) { fetchStreams(activity.id, activity.strava_id).then(data => { setStreams(data); setLoadingStreams(false); }); }
          else { setLoadingStreams(false); }
      }
  }, [activity, fetchStreams]);

  // PROCESADOR DE DATOS AVANZADO (Velocidad y Ritmo juntos)
  const chartData = useMemo(() => {
      if (!streams || !streams.time) return [];
      const timeData = streams.time.data;
      const step = Math.max(1, Math.floor(timeData.length / 150));
      const data = [];
      
      for (let i = 0; i < timeData.length; i += step) {
          const ms = streams.velocity_smooth ? streams.velocity_smooth.data[i] : null;
          let speed = null;
          let pace = null;
          
          if (ms !== null) {
              speed = Number((ms * 3.6).toFixed(1)); // km/h
              if (ms > 0.1) {
                  pace = Number((16.666666666667 / ms).toFixed(2)); // min/km (decimal)
                  if (pace > 20) pace = 20; // Tope máximo para que no rompa el gráfico al pararse en un semáforo
              } else {
                  pace = 20; 
              }
          }

          data.push({
              time: Math.floor(timeData[i] / 60), 
              hr: streams.heartrate ? streams.heartrate.data[i] : null,
              speed: speed,
              pace: pace,
              alt: streams.altitude ? Math.round(streams.altitude.data[i]) : null,
          });
      }
      return data;
  }, [streams]);

  const maxHr = useMemo(() => streams?.heartrate?.data?.length > 0 ? Math.max(...streams.heartrate.data) : null, [streams]);
  const maxSpeedMetric = useMemo(() => {
      if (streams?.velocity_smooth?.data?.length > 0) {
          const maxMs = Math.max(...streams.velocity_smooth.data);
          if (!isPaceBased) return { value: (maxMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Máxima' };
          
          if (maxMs <= 0.1) return null;
          const minPerKm = 16.666666666667 / maxMs; 
          return { value: formatPace(minPerKm), unit: '/km', label: 'Ritmo Máx' };
      } return null;
  }, [streams, isPaceBased]);

  const exactZoneAnalysis = useMemo(() => {
      if (!streams || !streams.heartrate || !streams.time) return null;
      const type = activity.type.toLowerCase();
      const isBike = type.includes('bici') || type.includes('ciclismo');
      const userZones = isBike ? settings.bike.zones : settings.run.zones;
      const hrData = streams.heartrate.data; const timeData = streams.time.data;
      let zoneSeconds = [0, 0, 0, 0, 0];
      
      for (let i = 1; i < hrData.length; i++) {
          const hr = hrData[i]; const dt = timeData[i] - timeData[i-1]; 
          const zIndex = userZones.findIndex(z => hr >= z.min && hr <= z.max);
          if (zIndex !== -1) zoneSeconds[zIndex] += dt; else if (hr > userZones[4].max) zoneSeconds[4] += dt; 
      }
      const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
      return zoneSeconds.map((sec, i) => ({ zone: i + 1, minutes: sec / 60, pct: totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0 }));
  }, [streams, activity, settings]);

  if (!activity) return null;

  const formatTimeStr = (mins) => { const h = Math.floor(mins / 60); const m = Math.floor(mins % 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const dateStr = new Date(activity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  
  const getSpeedOrPace = () => {
      const speedMs = activity.speed_avg || 0; if (speedMs === 0) return null;
      if (!isPaceBased) return { value: (speedMs * 3.6).toFixed(1), unit: 'km/h', label: 'Vel. Media' };
      
      const minPerKm = 16.666666666667 / speedMs; 
      return { value: formatPace(minPerKm), unit: '/km', label: 'Ritmo Medio' };
  };
  const speedMetric = getSpeedOrPace();

  const getTheme = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return '#ea580c';
    if (t.includes('andar') || t.includes('walk') || t.includes('caminata')) return '#10b981';
    if (t.includes('bike') || t.includes('bici')) return '#2563eb';
    if (t.includes('gym') || t.includes('fuerza')) return '#7c3aed';
    return '#71717a';
  };
  const themeColor = getTheme(activity.type);

  const ZONE_LABELS = ['Z1 Recuperación', 'Z2 Base', 'Z3 Tempo', 'Z4 Umbral', 'Z5 VO2Max'];
  const ZONE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#eab308', '#ef4444'];
  const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontSize: '11px', fontWeight: '500', padding: '8px 12px' };

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      
      <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition font-bold px-3 py-1.5 text-[10px] uppercase rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <ArrowLeft size={14} /> Volver
          </button>
          <div className="flex gap-2">
              {activity.strava_id && (
                  <a href={`https://www.strava.com/activities/${activity.strava_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#FC4C02]/30 text-[#FC4C02] hover:bg-[#FC4C02]/10 rounded text-[10px] font-bold uppercase transition">
                      <ExternalLink size={12} /> Strava
                  </a>
              )}
              {onDelete && (
                  <button onClick={() => { if(window.confirm("¿Borrar actividad?")) { onDelete(activity.id); onBack(); } }} className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition">
                      <Trash2 size={14} />
                  </button>
              )}
          </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-slate-200 dark:border-zinc-800 mb-4 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">
              <Calendar size={12} /> {dateStr}
              <span className="px-1.5 py-0.5 rounded text-[9px] text-white ml-1" style={{backgroundColor: themeColor}}>{activity.type}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
              {activity.name || `${activity.type} Activity`}
          </h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-4 gap-x-6 mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <MetricBox label="Tiempo" value={formatTimeStr(activity.duration)} />
              <MetricBox label="Distancia" value={(activity.distance/1000).toFixed(2)} unit="km" />
              {activity.elevation_gain > 0 && <MetricBox label="Desnivel" value={activity.elevation_gain} unit="m" />}
              <MetricBox label="Carga" value={activity.tss} unit="TSS" colorClass="border-blue-500" />
              {speedMetric && <MetricBox label={speedMetric.label} value={speedMetric.value} unit={speedMetric.unit} />}
              {activity.hr_avg > 0 && <MetricBox label="Pulso Medio" value={Math.round(activity.hr_avg)} unit="ppm" colorClass="border-rose-500" />}
              {maxHr > 0 && <MetricBox label="Pulso Máx" value={maxHr} unit="ppm" />}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <div className="lg:col-span-5 space-y-4">
              <InteractiveMap polyline={activity.map_polyline} color={themeColor} />

              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                      <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Tiempo en Zonas</h3>
                      {loadingStreams && <Loader2 size={12} className="animate-spin text-slate-500"/>}
                  </div>
                  
                  {loadingStreams ? (
                      <div className="space-y-3 animate-pulse">
                          {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded w-full"></div>)}
                      </div>
                  ) : exactZoneAnalysis ? (
                      <div className="space-y-2.5">
                          {exactZoneAnalysis.map((data, i) => (
                              <div key={i} className="flex items-center gap-3">
                                  <div className="w-24 shrink-0"><span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{ZONE_LABELS[i]}</span></div>
                                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-none overflow-hidden flex">
                                      <div className="h-full" style={{ width: `${data.pct}%`, backgroundColor: ZONE_COLORS[i] }}></div>
                                  </div>
                                  <div className="w-16 shrink-0 flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-slate-800 dark:text-zinc-200">{Math.round(data.minutes)}m</span>
                                      <span className="text-slate-500 dark:text-zinc-500">{Math.round(data.pct)}%</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-[10px] text-slate-500 dark:text-zinc-500">Sin datos de frecuencia cardíaca.</p>
                  )}
              </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 shadow-sm h-full min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                      <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Telemetría (Streams)</h3>
                  </div>

                  {loadingStreams ? (
                      <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-slate-500 dark:text-zinc-600"/></div>
                  ) : chartData.length > 0 ? (
                      <div className="flex-1 space-y-6">
                          
                          {/* GRÁFICA VELOCIDAD / RITMO */}
                          <div className="h-[200px] w-full">
                              <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 tracking-wider">
                                  {isPaceBased ? 'Ritmo y Perfil' : 'Velocidad y Perfil'}
                              </h4>
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                      <XAxis dataKey="time" tick={{fontSize: 9, fill: '#71717a'}} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{stroke: '#3f3f46'}} tickLine={false}/>
                                      
                                      {/* MAGIA DE EJES Y RITMO */}
                                      <YAxis 
                                          yAxisId="left" 
                                          tick={{fontSize: 9, fill: themeColor}} 
                                          domain={isPaceBased ? ['dataMin - 0.5', 'dataMax + 1'] : [0, dataMax => Math.ceil(dataMax * 1.1)]} 
                                          axisLine={false} 
                                          tickLine={false}
                                          reversed={isPaceBased} // Invertimos el eje Y para que ir "más rápido" (menos min/km) sea un pico hacia arriba
                                          tickFormatter={isPaceBased ? formatPace : undefined}
                                      />
                                      
                                      <YAxis yAxisId="right" orientation="right" hide domain={['dataMin', dataMax => Math.ceil(dataMax * 1.15)]} />
                                      
                                      <Tooltip 
                                          contentStyle={tooltipStyle} 
                                          labelFormatter={(val) => `Minuto ${val}`} 
                                          formatter={(value, name) => {
                                              if (name === 'pace') return [`${formatPace(value)} /km`, 'Ritmo'];
                                              if (name === 'speed') return [`${value} km/h`, 'Velocidad'];
                                              if (name === 'alt') return [`${value} m`, 'Altitud'];
                                              return [value, name];
                                          }}
                                      />
                                      <Area yAxisId="right" type="monotone" dataKey="alt" name="alt" stroke="#71717a" fillOpacity={0.1} fill="#71717a" isAnimationActive={false} />
                                      
                                      {/* Dibujamos la línea de Pace o de Speed según el deporte */}
                                      <Area yAxisId="left" type="monotone" dataKey={isPaceBased ? "pace" : "speed"} name={isPaceBased ? "pace" : "speed"} stroke={themeColor} strokeWidth={2} fillOpacity={0.1} fill={themeColor} isAnimationActive={false} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>

                          {/* GRÁFICA DE PULSO */}
                          <div className="h-[200px] w-full">
                              <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 tracking-wider">Pulsaciones</h4>
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                      <XAxis dataKey="time" tick={{fontSize: 9, fill: '#71717a'}} tickFormatter={(val) => `${val}m`} minTickGap={30} axisLine={{stroke: '#3f3f46'}} tickLine={false}/>
                                      <YAxis tick={{fontSize: 9, fill: '#ef4444'}} domain={['dataMin - 5', dataMax => Math.ceil(dataMax * 1.1)]} axisLine={false} tickLine={false}/>
                                      <Tooltip 
                                          contentStyle={tooltipStyle} 
                                          labelFormatter={(val) => `Minuto ${val}`} 
                                          formatter={(value, name) => {
                                              if (name === 'hr') return [`${value} ppm`, 'Pulso'];
                                              return [value, name];
                                          }}
                                      />
                                      <Area type="monotone" dataKey="hr" name="hr" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" isAnimationActive={false} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>

                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-600">
                          <p className="text-[10px] uppercase tracking-widest font-bold">Sin datos de telemetría</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};