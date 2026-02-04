import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Activity, TrendingUp, Calendar, Clock, Flame, Trophy, 
  Search, Filter, ArrowUpRight, ArrowDownRight, Zap, Menu, X, LayoutDashboard
} from 'lucide-react';

// --- COMPONENTES UI REUTILIZABLES ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, subtext, icon: Icon, trend, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="p-5 flex flex-col justify-between h-full hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} bg-opacity-50`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800">{value}</span>
          <span className="text-xs font-medium text-slate-500">{subtext}</span>
        </div>
      </div>
    </Card>
  );
};

const App = () => {
  // --- ESTADO Y CONFIGURACIÓN ---
  const [timeRange, setTimeRange] = useState('all'); // '30d', '90d', '1y', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [settings] = useState({
    lthr: 185.6, fcMax: 201, fcReposo: 47, ta: 42, tf: 7,
    genderFactorA: 0.64, genderFactorB: 1.92
  });

  // --- DATOS PRINCIPALES ---
  const [activities] = useState(() => {
    const saved = localStorage.getItem('ivan_dashboard_v5_pro');
    if (saved) return JSON.parse(saved);

    // DATOS DE EJEMPLO (Incluye Strava Histórico + Garmin Reciente)
    const rawData = [
      // ... GARMIN (Feb 2026 - Dic 2025)
      { d: '2026-02-04', t: 'Fuerza', m: 50, h: 88, c: 190 },
      { d: '2026-02-03', t: 'Ciclismo', m: 64, h: 143, c: 706 },
      { d: '2026-02-02', t: 'Ciclismo', m: 35, h: 127, c: 345 },
      { d: '2026-01-31', t: 'Ciclismo', m: 121, h: 138, c: 1160 },
      { d: '2026-01-29', t: 'Carrera', m: 37, h: 157, c: 496 },
      { d: '2026-01-27', t: 'Carrera', m: 30, h: 127, c: 283 },
      { d: '2026-01-26', t: 'Ciclismo', m: 50, h: 134, c: 550 },
      { d: '2026-01-24', t: 'Ciclismo', m: 53, h: 142, c: 597 },
      { d: '2026-01-17', t: 'Carrera', m: 92, h: 145, c: 1082 },
      { d: '2026-01-14', t: 'Ciclismo', m: 36, h: 136, c: 423 },
      { d: '2026-01-10', t: 'Ciclismo', m: 74, h: 140, c: 827 },
      { d: '2026-01-09', t: 'Carrera', m: 46, h: 157, c: 639 },
      { d: '2026-01-08', t: 'Carrera', m: 51, h: 145, c: 627 },
      { d: '2026-01-07', t: 'Ciclismo', m: 46, h: 141, c: 531 },
      { d: '2026-01-04', t: 'Carrera', m: 64, h: 158, c: 781 },
      { d: '2026-01-03', t: 'Ciclismo', m: 53, h: 139, c: 589 },
      { d: '2025-12-31', t: 'Carrera', m: 60, h: 150, c: 824 },
      // ... STRAVA (Historial 2025)
      { d: '2025-11-21', t: 'Ciclismo', m: 52, h: 138, c: 862 },
      { d: '2025-11-15', t: 'Ciclismo', m: 274, h: 132, c: 1838 },
      { d: '2025-11-01', t: 'Ciclismo', m: 127, h: 119, c: 2071 },
      { d: '2025-10-18', t: 'Carrera', m: 115, h: 177, c: 1637 }, // Media Bilbao
      { d: '2025-10-05', t: 'Carrera', m: 51, h: 179, c: 675 }, // 10k
      { d: '2025-09-07', t: 'Carrera', m: 152, h: 157, c: 1859 },
      { d: '2025-08-09', t: 'Carrera', m: 24, h: 178, c: 267 },
      { d: '2025-07-15', t: 'Carrera', m: 183, h: 163, c: 2313 },
      { d: '2025-07-12', t: 'Carrera', m: 45, h: 180, c: 571 },
      { d: '2025-06-01', t: 'Carrera', m: 50, h: 181, c: 784 },
      { d: '2025-05-10', t: 'Carrera', m: 53, h: 175, c: 734 },
      { d: '2025-05-01', t: 'Carrera', m: 64, h: 176, c: 917 },
      { d: '2025-01-11', t: 'Caminar', m: 67, h: 89, c: 306 },
      // Relleno simulado para densidad gráfica
      { d: '2025-04-15', t: 'Carrera', m: 45, h: 155, c: 500 },
      { d: '2025-03-10', t: 'Carrera', m: 40, h: 160, c: 450 },
      { d: '2025-02-15', t: 'Ciclismo', m: 90, h: 130, c: 800 },
    ];

    return rawData.map((a, i) => ({
      id: `act-${i}`,
      date: a.d,
      type: a.t,
      duration: a.m,
      hrAvg: a.h,
      cal: a.c
    })).sort((a,b) => new Date(a.date) - new Date(b.date));
  });

  // --- MOTOR DE CÁLCULO ---
  const { filteredData, currentMetrics, chartData, distribution, summary } = useMemo(() => {
    // 1. Filtrado por fecha
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    if (timeRange === 'all') cutoff.setFullYear(2020); // Todo

    const visibleActs = activities.filter(a => new Date(a.date) >= cutoff);
    const searchActs = visibleActs.filter(a => 
      a.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.date.includes(searchTerm)
    );

    // 2. Cálculo de CTL/ATL (Banister) sobre TODO el historial (para no romper la curva)
    //    pero solo devolvemos la parte visible para la gráfica.
    let ctl = 0, atl = 0;
    const fullSeries = [];
    
    // Generar calendario diario completo para continuidad
    if (activities.length > 0) {
        const start = new Date(activities[0].date);
        const end = new Date(activities[activities.length-1].date);
        // Extender un poco el final para ver hoy
        const veryEnd = new Date() > end ? new Date() : end;
        
        for (let d = new Date(start); d <= veryEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const daysActs = activities.filter(a => a.date === dateStr);
            
            let dailyTss = 0;
            let dailyDur = 0;
            
            daysActs.forEach(act => {
                const hrRatio = (act.hrAvg - settings.fcReposo) / (settings.fcMax - settings.fcReposo);
                const yFactor = settings.genderFactorA * Math.exp(settings.genderFactorB * hrRatio);
                let trimp = act.duration * hrRatio * yFactor;
                if (act.hrAvg < 100) trimp *= 0.5; // Ajuste caminatas
                
                // TSS aproximado basado en TRIMP
                const tss = trimp > 0 ? (trimp / 1.5) : 0; // Factor de corrección simple
                dailyTss += tss;
                dailyDur += act.duration;
            });

            // Fórmulas exponenciales
            ctl = ctl * Math.exp(-1 / settings.ta) + dailyTss * (1 - Math.exp(-1 / settings.ta));
            atl = atl * Math.exp(-1 / settings.tf) + dailyTss * (1 - Math.exp(-1 / settings.tf));

            fullSeries.push({
                date: dateStr,
                ctl: parseFloat(ctl.toFixed(1)),
                atl: parseFloat(atl.toFixed(1)),
                tcb: parseFloat((ctl - atl).toFixed(1)),
                tss: Math.round(dailyTss)
            });
        }
    }

    // Filtrar serie para el gráfico según timeRange
    const visibleSeries = fullSeries.filter(d => new Date(d.date) >= cutoff);
    const lastPoint = fullSeries[fullSeries.length - 1] || { ctl: 0, atl: 0, tcb: 0 };

    // 3. Distribución
    const cats = searchActs.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));

    // 4. Resumen
    const totalMin = searchActs.reduce((s, a) => s + a.duration, 0);
    const totalCal = searchActs.reduce((s, a) => s + a.cal, 0);

    return {
        filteredData: searchActs.reverse(), // Más recientes primero para la lista
        currentMetrics: lastPoint,
        chartData: visibleSeries,
        distribution: pieData,
        summary: { totalMin, totalCal, count: searchActs.length }
    };
  }, [activities, timeRange, searchTerm, settings]);

  // Colores y Helpers
  const COLORS = { 'Ciclismo': '#3b82f6', 'Carrera': '#f97316', 'Fuerza': '#8b5cf6', 'Caminar': '#10b981', 'Otros': '#94a3b8' };
  const getTsbStatus = (val) => {
      if (val > 20) return { text: 'Recuperación', color: 'text-emerald-500', bg: 'bg-emerald-100' };
      if (val > 5) return { text: 'Fresco', color: 'text-blue-500', bg: 'bg-blue-100' };
      if (val > -10) return { text: 'Óptimo', color: 'text-slate-600', bg: 'bg-slate-100' };
      if (val > -30) return { text: 'Productivo', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { text: 'Sobrecarga', color: 'text-rose-600', bg: 'bg-rose-100' };
  };
  const tsbStatus = getTsbStatus(currentMetrics.tcb);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm/50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
              <Activity size={20} />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Ivan<span className="text-blue-600">Performance</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Professional Dashboard v5.0</p>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {['30d', '90d', '1y', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  timeRange === range 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {range === 'all' ? 'Todo' : range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-slate-500" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Filter Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-2 animate-in slide-in-from-top-2">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Rango de Tiempo</p>
            <div className="grid grid-cols-4 gap-2">
              {['30d', '90d', '1y', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => { setTimeRange(range); setMobileMenuOpen(false); }}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    timeRange === range ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 space-y-6">
        
        {/* 1. KEY METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard 
            title="Fitness (CTL)" 
            value={currentMetrics.ctl} 
            subtext="pts" 
            icon={TrendingUp} 
            trend={2.5} 
            color="blue" 
          />
          <StatCard 
            title="Fatiga (ATL)" 
            value={currentMetrics.atl} 
            subtext="pts" 
            icon={Zap} 
            trend={-1.2} 
            color="orange" 
          />
          <Card className="p-5 flex flex-col justify-between h-full relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-20 transition-transform group-hover:scale-110 ${tsbStatus.bg.replace('bg-', 'bg-')}`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${tsbStatus.bg} ${tsbStatus.color}`}>
                <LayoutDashboard size={22} />
              </div>
            </div>
            <div>
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Forma (TSB)</h4>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-black ${tsbStatus.color}`}>{currentMetrics.tcb > 0 ? `+${currentMetrics.tcb}` : currentMetrics.tcb}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${tsbStatus.bg} ${tsbStatus.color} border border-current border-opacity-20`}>
                  {tsbStatus.text}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="bg-white/10 p-2 rounded-lg"><Calendar size={20}/></div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded text-white/90">
                {timeRange === 'all' ? 'HISTÓRICO' : 'FILTRADO'}
              </span>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Volumen</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{(summary.totalMin/60).toFixed(0)}</span>
                <span className="text-sm font-medium text-slate-400">horas</span>
              </div>
              <div className="w-full bg-white/10 h-1 mt-4 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-full w-3/4"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN CHARTS AREA */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto">
          
          {/* Gráfico Principal (CTL/ATL) */}
          <Card className="xl:col-span-2 p-6 flex flex-col min-h-[400px]">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Rendimiento y Carga</h3>
                <p className="text-xs text-slate-400 font-medium">Evolución de Fitness vs Fatiga</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span> Fitness</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-200"></span> Fatiga</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300"></span> Forma</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 5, right: 0, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'}}
                    itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                    labelStyle={{fontSize: '11px', color: '#94a3b8', marginBottom: '5px'}}
                  />
                  <Area type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCtl)" animationDuration={800}/>
                  <Area type="monotone" dataKey="atl" stroke="#fb923c" strokeWidth={2} fill="none" strokeDasharray="4 4" animationDuration={800}/>
                  <Line type="monotone" dataKey="tcb" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gráfico Donut (Distribución) */}
          <Card className="p-6 flex flex-col justify-center items-center min-h-[350px]">
            <h3 className="text-sm font-bold text-slate-800 self-start mb-2 w-full flex justify-between">
              <span>Distribución</span>
              <Filter size={16} className="text-slate-300"/>
            </h3>
            <div className="w-full h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={distribution} 
                    innerRadius={70} 
                    outerRadius={90} 
                    paddingAngle={6} 
                    dataKey="value"
                    stroke="none"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} className="hover:opacity-80 transition-opacity cursor-pointer"/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{summary.count}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sesiones</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full mt-4">
              {distribution.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[d.name]}}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 3. ACTIVITY LIST WITH SEARCH */}
        <Card className="flex flex-col overflow-hidden">
          {/* Header de la lista */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Clock size={18} className="text-blue-500" />
              <h3 className="font-bold text-slate-800">Historial de Actividades</h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{summary.count}</span>
            </div>
            
            {/* Buscador */}
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Buscar (ej: Carrera, Bilbao...)" 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Grid de Actividades */}
          <div className="overflow-y-auto max-h-[600px] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:gap-[1px] bg-slate-100">
              {filteredData.slice(0, 15).map((act, i) => (
                <div key={act.id} className="bg-white p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-[10px] transition-transform group-hover:scale-110
                      ${act.type === 'Ciclismo' ? 'bg-blue-500' : act.type === 'Carrera' ? 'bg-orange-500' : 'bg-purple-500'}
                    `}>
                      {act.type.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{act.type}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{act.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock size={10} className="text-slate-400"/> {act.duration}’
                      </span>
                      {act.hrAvg > 0 && (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <Activity size={10}/> {act.hrAvg}
                        </span>
                      )}
                    </div>
                    {act.cal > 0 && <span className="text-[10px] font-bold text-slate-400">{act.cal} kcal</span>}
                  </div>
                </div>
              ))}
            </div>
            {filteredData.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <Search size={40} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">No se encontraron actividades</p>
              </div>
            )}
          </div>
        </Card>

      </main>
    </div>
  );
};

export default App;