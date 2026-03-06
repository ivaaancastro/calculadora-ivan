import React, { useMemo, useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Footprints, Bike, Dumbbell, Activity, Zap, Sparkles, AlertCircle, Info } from 'lucide-react';

const PERIODS = [
    { key: '30d', label: '30d', days: 30 },
    { key: '90d', label: '90d', days: 90 },
    { key: '1y', label: '1 año', days: 365 },
    { key: 'all', label: 'Todo', days: 9999 },
];

// Helper: speed from activity (m/s → min/km for pace, km/h for display)
const getSpeed = (a) => a.distance > 0 && a.duration > 0 ? (a.distance / 1000) / (a.duration / 60) : null; // km/min
const getPace = (a) => a.distance > 0 && a.duration > 0 ? (a.duration / (a.distance / 1000)) : null; // min/km

const SPORT_CONFIGS = {
    Carrera: {
        key: 'Carrera', icon: Footprints, color: '#f97316',
        match: (t) => /run|carrera|trail|sendero/i.test(t),
        metrics: [
            {
                key: 'ef', label: 'Eficiencia (EF)',
                desc: 'Velocidad / FC — más alto = más eficiente',
                calc: (a) => {
                    const spd = getSpeed(a); // km/min
                    return (spd && a.hr_avg > 40) ? (spd * 1000) / a.hr_avg : null; // m/min / bpm → higher = better
                },
                format: (v) => v.toFixed(2),
                higherIsBetter: true,
                primary: true,
            },
            {
                key: 'pace', label: 'Ritmo (min/km)',
                desc: 'Ritmo medio — más bajo = más rápido',
                calc: (a) => getPace(a),
                format: (v) => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`,
                higherIsBetter: false,
            },
            {
                key: 'hr', label: 'FC media',
                desc: 'No indica mejora por sí sola — usar con EF',
                calc: (a) => a.hr_avg > 0 ? a.hr_avg : null,
                format: (v) => `${Math.round(v)} bpm`,
                neutral: true, // FC alone doesn't indicate improvement
            },
            {
                key: 'dist', label: 'Distancia (km)',
                desc: 'Volumen por sesión',
                calc: (a) => a.distance > 0 ? a.distance / 1000 : null,
                format: (v) => v.toFixed(1),
                higherIsBetter: true,
            },
            {
                key: 'tss', label: 'HRSS',
                desc: 'Carga de entrenamiento por sesión',
                calc: (a) => a.tss > 0 ? a.tss : null,
                format: (v) => Math.round(v),
                neutral: true,
            },
        ]
    },
    Ciclismo: {
        key: 'Ciclismo', icon: Bike, color: '#3b82f6',
        match: (t) => /bici|ciclismo|ride|cycling|gravel|mtb|virtual/i.test(t),
        metrics: [
            {
                key: 'ef', label: 'Eficiencia (EF)',
                desc: 'Potencia / FC — más alto = más eficiente',
                calc: (a) => {
                    if (a.watts_avg > 0 && a.hr_avg > 40) return a.watts_avg / a.hr_avg;
                    // Fallback: speed-based EF
                    const spd = getSpeed(a);
                    return (spd && a.hr_avg > 40) ? (spd * 1000) / a.hr_avg : null;
                },
                format: (v) => v.toFixed(2),
                higherIsBetter: true,
                primary: true,
            },
            {
                key: 'speed', label: 'Velocidad (km/h)',
                desc: 'Velocidad media — más alto = más rápido',
                calc: (a) => a.speed_avg > 0 ? a.speed_avg * 3.6 : null,
                format: (v) => v.toFixed(1),
                higherIsBetter: true,
            },
            {
                key: 'watts', label: 'Potencia (W)',
                desc: 'Potencia media — mayor potencia a misma FC = mejora',
                calc: (a) => a.watts_avg > 0 ? a.watts_avg : null,
                format: (v) => `${Math.round(v)} W`,
                higherIsBetter: true,
            },
            {
                key: 'hr', label: 'FC media',
                desc: 'No indica mejora por sí sola — usar con EF',
                calc: (a) => a.hr_avg > 0 ? a.hr_avg : null,
                format: (v) => `${Math.round(v)} bpm`,
                neutral: true,
            },
            {
                key: 'tss', label: 'HRSS',
                desc: 'Carga de entrenamiento por sesión',
                calc: (a) => a.tss > 0 ? a.tss : null,
                format: (v) => Math.round(v),
                neutral: true,
            },
        ]
    },
    Fuerza: {
        key: 'Fuerza', icon: Dumbbell, color: '#a855f7',
        match: (t) => /fuerza|weight|strength|crossfit|hiit/i.test(t),
        metrics: [
            {
                key: 'duration', label: 'Duración (min)',
                desc: 'Duración por sesión',
                calc: (a) => a.duration > 0 ? a.duration : null,
                format: (v) => Math.round(v),
                higherIsBetter: true,
            },
            {
                key: 'tss', label: 'HRSS',
                desc: 'Carga de entrenamiento por sesión',
                calc: (a) => a.tss > 0 ? a.tss : null,
                format: (v) => Math.round(v),
                neutral: true,
            },
            {
                key: 'hr', label: 'FC media',
                desc: 'No indica mejora por sí sola',
                calc: (a) => a.hr_avg > 0 ? a.hr_avg : null,
                format: (v) => `${Math.round(v)} bpm`,
                neutral: true,
            },
        ]
    },
};

// Simple linear regression
const linearTrend = (data, key) => {
    const valid = data.filter(d => d[key] != null);
    if (valid.length < 3) return null;
    const n = valid.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    valid.forEach((d, i) => {
        sumX += i; sumY += d[key]; sumXY += i * d[key]; sumX2 += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;
    const pctChange = mean > 0 ? (slope * n / mean) * 100 : 0;
    return { slope, pctChange };
};

export const TrendsChart = ({ activities }) => {
    const [sport, setSport] = useState('Carrera');
    const [period, setPeriod] = useState('90d');
    const [metric, setMetric] = useState(0);

    const config = SPORT_CONFIGS[sport];
    const currentMetric = config.metrics[metric] || config.metrics[0];

    const chartData = useMemo(() => {
        const periodDays = PERIODS.find(p => p.key === period)?.days || 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - periodDays);

        const filtered = (activities || [])
            .filter(a => !a.isPlanned && config.match(a.type || '') && new Date(a.date) >= cutoff)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const baseData = filtered.map(a => {
            const point = { date: new Date(a.date).toLocaleDateString('en-CA'), name: a.name };
            config.metrics.forEach(m => {
                point[m.key] = m.calc(a);
            });
            return point;
        }).filter(p => p[currentMetric.key] != null);

        // Calculate Moving Average (smooth trend)
        const windowSize = Math.max(3, Math.floor(baseData.length / 10)); // dinamico segun la cantidad de datos
        return baseData.map((d, i, arr) => {
            let sum = 0; let count = 0;
            for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
                if (arr[j][currentMetric.key] != null) {
                    sum += arr[j][currentMetric.key];
                    count++;
                }
            }
            return {
                ...d,
                [`${currentMetric.key}_ma`]: count > 0 ? sum / count : null
            };
        });

    }, [activities, sport, period, config, currentMetric]);

    const trend = useMemo(() => linearTrend(chartData, currentMetric.key), [chartData, currentMetric]);

    const avg = useMemo(() => {
        if (chartData.length === 0) return null;
        const sum = chartData.reduce((s, d) => s + (d[currentMetric.key] || 0), 0);
        return sum / chartData.length;
    }, [chartData, currentMetric]);

    // Insight generator
    const insightMessage = useMemo(() => {
        if (chartData.length < 4) return { text: "Necesitas registrar más actividades para poder analizar tu tendencia.", color: "text-slate-500", bg: "bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700", icon: Info };

        const isNeutral = currentMetric.neutral;
        const pct = trend ? trend.pctChange : 0;
        const isImproving = trend && !isNeutral ? (currentMetric.higherIsBetter === false ? pct < 0 : pct > 0) : false;
        const isWorsening = trend && !isNeutral ? (currentMetric.higherIsBetter === false ? pct > 0 : pct < 0) : false;
        const absPct = Math.abs(pct).toFixed(1);

        if (isNeutral) {
            return {
                text: `Esta métrica te sirve como contexto. Tu media reciente es de ${currentMetric.format(avg || 0)}. Fíjate en el Factor de Eficiencia (EF) para saber si estás progresando.`,
                color: "text-slate-600 dark:text-zinc-300",
                bg: "bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700",
                icon: Info
            };
        }

        if (Math.abs(pct) < 1.5) {
            return {
                text: `Te estás manteniendo estable. Tu ${currentMetric.label.split(' ')[0]} no ha sufrido grandes variaciones (cambio < 1.5%). Entramos en fase de consolidación.`,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30",
                icon: Minus
            };
        }

        if (isImproving) {
            const verb = currentMetric.higherIsBetter === false ? "reducido" : "aumentado";
            return {
                text: `¡Excelente progreso! Tu ${currentMetric.label.split(' ')[0]} ha ${verb} un ${absPct}%. La curva de tendencia general (línea gruesa) muestra una clara adaptación positiva de tu cuerpo.`,
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30",
                icon: TrendingUp
            };
        }

        if (isWorsening) {
            const extra = pct > 5 ? "Revisa tu nivel de fatiga o carga." : "Pequeños valles son normales tras semanas duras.";
            return {
                text: `Tu ${currentMetric.label.split(' ')[0]} ha empeorado un ${absPct}%. La tendencia está bajando ligeramente. ${extra}`,
                color: "text-orange-600 dark:text-orange-400",
                bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/30",
                icon: TrendingDown
            };
        }

        return { text: "Recopilando datos...", color: "text-slate-500", bg: "bg-slate-50 dark:bg-zinc-800", icon: Activity };
    }, [chartData, trend, currentMetric, avg]);

    // Determine trend direction and whether it's good or bad
    const isNeutral = currentMetric.neutral;
    const isImproving = trend && !isNeutral
        ? (currentMetric.higherIsBetter === false ? trend.slope < 0 : trend.slope > 0)
        : false;
    const isFlatOrNeutral = isNeutral || !trend || Math.abs(trend.pctChange) < 1;

    const TrendIcon = isFlatOrNeutral ? Minus : isImproving ? TrendingUp : TrendingDown;
    const trendColor = isFlatOrNeutral ? 'text-slate-400 dark:text-zinc-500' : isImproving ? 'text-emerald-500' : 'text-red-500';
    const trendBg = isFlatOrNeutral ? 'bg-slate-50 dark:bg-zinc-800/50' : isImproving ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-red-50 dark:bg-red-900/10';

    const trendLabel = isFlatOrNeutral
        ? (isNeutral ? 'Métrica informativa' : 'Sin cambio significativo')
        : `${Math.abs(trend.pctChange).toFixed(1)}% ${isImproving ? 'mejora' : 'empeora'}`;

    const tooltipStyle = {
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '6px',
        color: '#f4f4f5',
        fontSize: '11px',
        fontWeight: '600',
        padding: '8px 12px'
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-4 h-full flex flex-col">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                    <h3 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Activity size={14} className="text-slate-400 dark:text-zinc-500" strokeWidth={2.5} /> Tendencias de Rendimiento
                    </h3>
                </div>
                <div className="flex gap-1">
                    {PERIODS.map(p => (
                        <button key={p.key} onClick={() => setPeriod(p.key)}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors
                                ${period === p.key ? 'bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}
                        >{p.label}</button>
                    ))}
                </div>
            </div>

            {/* SPORT TABS */}
            <div className="flex gap-1.5 mb-3">
                {Object.values(SPORT_CONFIGS).map(s => {
                    const Icon = s.icon;
                    return (
                        <button key={s.key} onClick={() => { setSport(s.key); setMetric(0); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all
                                ${sport === s.key ? `text-white shadow-sm` : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}
                            style={sport === s.key ? { backgroundColor: s.color } : {}}
                        >
                            <Icon size={12} /> {s.key}
                        </button>
                    );
                })}
            </div>

            {/* METRIC TABS */}
            <div className="flex items-center gap-2 mb-4 pb-2">
                <div className="flex gap-1.5 flex-wrap">
                    {config.metrics.map((m, i) => (
                        <button key={m.key} onClick={() => setMetric(i)}
                            className={`px-2.5 py-1.5 text-[9px] font-bold transition-all rounded-md tracking-wider uppercase
                                ${metric === i
                                    ? `text-white bg-slate-800 dark:bg-zinc-200 dark:text-zinc-900 shadow-sm`
                                    : 'text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}
                        >
                            {m.primary && <Zap size={10} className="inline mr-1 text-emerald-500 dark:text-emerald-600" />}
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* INSIGHT BOX */}
            <div className={`p-3 rounded-lg border mb-4 flex items-start gap-3 transition-colors ${insightMessage.bg}`}>
                <div className={`mt-0.5 rounded-full p-1.5 shadow-sm bg-white dark:bg-zinc-900 ${insightMessage.color}`}>
                    <insightMessage.icon size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1 ${insightMessage.color}`}>
                        <Sparkles size={10} /> Análisis Automático
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">{insightMessage.text}</p>
                </div>
            </div>



            {/* CHART */}
            <div className="flex-1 min-h-0">
                {chartData.length < 2 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1">Sin datos suficientes</p>
                        <p className="text-[10px]">Necesitas al menos 2 actividades de {sport} en este período</p>
                    </div>
                ) : (
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 2" stroke="#3f3f46" opacity={0.2} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 9, fill: '#71717a' }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    minTickGap={30}
                                    axisLine={{ stroke: '#3f3f46' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 9, fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                    reversed={currentMetric.higherIsBetter === false}
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                                    formatter={(value, name) => [currentMetric.format(value), name.includes('_ma') ? 'Tendencia Suavizada' : currentMetric.label]}
                                />
                                {avg && (
                                    <ReferenceLine
                                        y={avg}
                                        stroke="#71717a"
                                        strokeDasharray="4 4"
                                        strokeWidth={1}
                                        label={{ position: 'right', value: `Media: ${currentMetric.format(avg)}`, fill: '#71717a', fontSize: 9, fontWeight: 'bold' }}
                                    />
                                )}

                                {/* Raw Values (Faint Scatter/Line) */}
                                <Line
                                    type="monotone"
                                    dataKey={currentMetric.key}
                                    stroke={config.color}
                                    strokeWidth={1}
                                    strokeOpacity={0.3}
                                    dot={{ r: 2, fill: config.color, fillOpacity: 0.5, strokeWidth: 0 }}
                                    activeDot={false}
                                />

                                {/* Moving Average / Trend (Thick Area) */}
                                <Area
                                    type="monotone"
                                    dataKey={`${currentMetric.key}_ma`}
                                    stroke={config.color}
                                    strokeWidth={3}
                                    fill="url(#trendGradient)"
                                    dot={false}
                                    activeDot={{ r: 5, strokeWidth: 0, fill: config.color }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* STATS ROW */}
            {chartData.length >= 2 && (
                <div className="flex justify-around mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Media</span>
                        <span className="text-sm font-black text-slate-700 dark:text-zinc-200 font-mono">{avg ? currentMetric.format(avg) : '-'}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Mejor</span>
                        <span className="text-sm font-black text-slate-700 dark:text-zinc-200 font-mono">
                            {currentMetric.format(chartData.reduce((best, d) => {
                                const v = d[currentMetric.key];
                                if (v == null) return best;
                                if (best == null) return v;
                                return currentMetric.higherIsBetter === false ? Math.min(best, v) : Math.max(best, v);
                            }, null) || 0)}
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Último</span>
                        <span className="text-sm font-black text-slate-700 dark:text-zinc-200 font-mono">
                            {currentMetric.format(chartData[chartData.length - 1]?.[currentMetric.key] || 0)}
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Sesiones</span>
                        <span className="text-sm font-black text-slate-700 dark:text-zinc-200 font-mono">{chartData.length}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
