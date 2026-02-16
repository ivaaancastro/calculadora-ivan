import React from 'react';
import { 
  X, Clock, MapPin, Zap, Heart, Flame, Mountain, 
  ExternalLink, Trash2, Calendar, Activity, Wind, AlignLeft, Dumbbell
} from 'lucide-react';

export const ActivityDetailModal = ({ activity, onClose, onDelete }) => {
  if (!activity) return null;

  // 1. HELPERS DE FORMATO
  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return {
      day: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // 2. CÁLCULO DE RITMOS (REALES DE STRAVA)
  // Strava nos da 'speed_avg' en metros/segundo
  const getSpeedOrPace = () => {
      const speedMs = activity.speed_avg || 0;
      if (speedMs === 0) return null;

      const type = activity.type.toLowerCase();
      
      // Si es Ciclismo -> km/h
      if (type.includes('bici') || type.includes('ciclismo')) {
          const kmh = (speedMs * 3.6).toFixed(1);
          return { value: kmh, unit: 'km/h', label: 'Velocidad' };
      }
      
      // Si es Carrera -> min/km
      if (type.includes('carrera') || type.includes('correr') || type.includes('run')) {
          const minPerKm = 16.666666666667 / speedMs; // Conversión mágica de m/s a min/km
          const mins = Math.floor(minPerKm);
          const secs = Math.round((minPerKm - mins) * 60);
          return { value: `${mins}:${secs.toString().padStart(2, '0')}`, unit: '/km', label: 'Ritmo' };
      }

      // Natación -> min/100m (Aproximado)
      if (type.includes('nadar') || type.includes('swim')) {
           return { value: ((100 / speedMs) / 60).toFixed(2), unit: '/100m', label: 'Ritmo' };
      }

      return null;
  };

  const speedMetric = getSpeedOrPace();

  // 3. TEMA DE COLORES
  const getTheme = (type) => {
    const t = type.toLowerCase();
    if (t.includes('run') || t.includes('carrera')) return { bg: 'from-orange-500 to-red-500', text: 'text-orange-600', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Strava_Logo.svg/1200px-Strava_Logo.svg.png" className="w-4 opacity-50 grayscale"/> }; // Usamos icono genérico o el de strava
    if (t.includes('bike') || t.includes('bici')) return { bg: 'from-blue-600 to-indigo-600', text: 'text-blue-600' };
    if (t.includes('gym') || t.includes('fuerza')) return { bg: 'from-purple-600 to-fuchsia-600', text: 'text-purple-600' };
    return { bg: 'from-slate-600 to-slate-800', text: 'text-slate-600' };
  };
  const theme = getTheme(activity.type);
  const { day, time } = formatDate(activity.date);


  // 4. ESTRATEGIA DE MÉTRICAS SEGÚN DEPORTE
  const type = activity.type.toLowerCase();
  
  // Métricas Comunes
  let metrics = [
    { label: 'Tiempo', value: formatTime(activity.duration), icon: Clock },
    { label: 'Carga', value: activity.tss || 0, unit: 'TSS', icon: Zap },
    { label: 'Pulso Medio', value: activity.hr_avg > 0 ? Math.round(activity.hr_avg) : '-', unit: 'ppm', icon: Heart }
  ];

  // Métricas Específicas
  if (type.includes('fuerza') || type.includes('gym')) {
      // FUERZA: Solo añadimos Calorías
      metrics.push({ label: 'Calorías', value: activity.calories, unit: 'kcal', icon: Flame });
  } else {
      // CARDIO (Correr/Bici): Añadimos Distancia y Ritmo
      metrics.splice(1, 0, { label: 'Distancia', value: (activity.distance / 1000).toFixed(2), unit: 'km', icon: MapPin });
      
      if (speedMetric) {
          metrics.push({ label: speedMetric.label, value: speedMetric.value, unit: speedMetric.unit, icon: Wind });
      }
      
      // Bici: Potencia y Desnivel
      if (type.includes('bici')) {
          if (activity.watts_avg > 0) metrics.push({ label: 'Potencia', value: activity.watts_avg, unit: 'w', icon: Activity });
          if (activity.elevation_gain > 0) metrics.push({ label: 'Desnivel', value: activity.elevation_gain, unit: 'm+', icon: Mountain });
      }
      // Correr: Desnivel
      else if (activity.elevation_gain > 0) {
          metrics.push({ label: 'Desnivel', value: activity.elevation_gain, unit: 'm+', icon: Mountain });
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* HEADER HERO */}
        <div className={`bg-gradient-to-br ${theme.bg} p-6 pb-8 text-white relative shrink-0 shadow-lg`}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md">
                <X size={18} />
            </button>
            
            <div className="flex items-center gap-2 opacity-90 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Calendar size={12} /> {day} <span className="opacity-50">|</span> {time}
            </div>
            
            {/* TÍTULO DE STRAVA (O EL TIPO SI NO HAY TÍTULO) */}
            <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">
                {activity.name && activity.name !== 'Entreno sin título' ? activity.name : activity.type}
            </h2>

            {/* DESCRIPCIÓN */}
            {activity.description && (
                <div className="flex gap-2 items-start opacity-90">
                    <AlignLeft size={14} className="mt-1 shrink-0"/>
                    <p className="text-sm font-medium italic line-clamp-2 leading-relaxed">
                        "{activity.description}"
                    </p>
                </div>
            )}
        </div>

        {/* BODY CON DATOS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 -mt-6 bg-white dark:bg-slate-900 rounded-t-3xl relative z-10 space-y-6">
            
            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                        <div className={`flex items-center gap-2 mb-1 text-[10px] uppercase font-bold text-slate-400`}>
                            <m.icon size={12} /> {m.label}
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                {m.value}
                            </span>
                            {m.unit && <span className="text-[10px] font-bold text-slate-500 ml-0.5">{m.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* SECCIÓN EXTRA SI ES FUERZA */}
            {(type.includes('fuerza') || type.includes('gym')) && (
                 <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/20 flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl text-purple-600">
                        <Dumbbell size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300">Entrenamiento de Fuerza</h4>
                        <p className="text-xs text-purple-700 dark:text-purple-400">Registrado en Strava. TSS estimado por pulso.</p>
                    </div>
                 </div>
            )}

        </div>

        {/* FOOTER ACCIONES */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3">
            {activity.strava_id && (
                <a 
                    href={`https://www.strava.com/activities/${activity.strava_id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FC4C02] hover:bg-[#E34402] text-white rounded-xl font-bold text-sm transition shadow-lg shadow-orange-500/20"
                >
                    <ExternalLink size={16} /> Ver en Strava
                </a>
            )}
            
            {onDelete && (
                <button 
                    onClick={() => {
                        if(window.confirm("¿Seguro que quieres borrar esta actividad para siempre?")) {
                             onDelete(activity.id);
                             onClose();
                        }
                    }}
                    className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition border border-slate-200 dark:border-slate-700"
                    title="Eliminar actividad"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};