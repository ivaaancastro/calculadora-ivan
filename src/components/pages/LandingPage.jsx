import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import {
  Activity, Loader2, Mail, Lock, ArrowLeft, ArrowRight,
  BarChart3, Map, Calendar, Zap, Heart, Timer,
  ChevronDown, X, TrendingUp, Target, Gauge
} from 'lucide-react';

/* ─── Particle Canvas ─── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 130, 255, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

/* ─── Fade-in on scroll ─── */
const FadeIn = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ─── Auth Modal ─── */
const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => { setError(null); setMessage(null); };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Se ha enviado un enlace a tu correo para restablecer la contraseña.');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('¡Registro exitoso! Revisa tu email para confirmar la cuenta.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-2xl p-8 animate-[modalIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <X size={18} />
        </button>

        {isForgotPassword && (
          <button
            onClick={() => { setIsForgotPassword(false); reset(); }}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight uppercase">
            {isForgotPassword ? 'Recuperar Clave' : isLogin ? 'Bienvenido de Vuelta' : 'Crear Cuenta'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isForgotPassword ? 'Te enviaremos un enlace a tu correo' : isLogin ? 'Accede a tu laboratorio' : 'Empieza a analizar tu rendimiento'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-[11px] font-semibold text-center">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold text-center">{message}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="atleta@ejemplo.com"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                {isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar al Laboratorio' : 'Crear Cuenta'}
                {!loading && <ArrowRight size={16} />}
              </>
            )}
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-6 text-center border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col gap-2.5">
            <button
              onClick={() => { setIsLogin(!isLogin); reset(); }}
              className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia Sesión'}
            </button>
            {isLogin && (
              <button
                onClick={() => { setIsForgotPassword(true); reset(); }}
                className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                ¿Has olvidado tu contraseña?
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, description, color, span = '' }) => (
  <div className={`group relative bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${span}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color} transition-transform group-hover:scale-110`}>
      <Icon size={20} className="text-white" />
    </div>
    <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{description}</p>
  </div>
);

/* ─── Stat Counter ─── */
const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center text-center gap-2">
    <Icon size={24} className="text-blue-500" />
    <span className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">{value}</span>
    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
  </div>
);

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */
export const LandingPage = () => {
  const [authOpen, setAuthOpen] = useState(false);

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 overflow-x-hidden selection:bg-blue-500/30">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100/80 dark:border-zinc-900/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-zinc-100">
              Forma<span className="text-blue-500">Lab</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
              Funciones
            </button>
            <a href="#stats" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
              Rendimiento
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95"
            >
              Empezar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16">
        <ParticleCanvas />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Performance Analytics Platform
              </span>
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              Tu laboratorio de{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                rendimiento
              </span>
              {' '}deportivo
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={200}>
            <p className="text-lg sm:text-xl text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Analiza tus actividades, monitoriza tu evolución y lleva tu entrenamiento al siguiente nivel con métricas avanzadas y análisis de datos.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setAuthOpen(true)}
                className="group bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold px-8 py-3.5 rounded-full transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:shadow-slate-900/30 active:scale-95 flex items-center gap-2"
              >
                Empezar Gratis
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 px-8 py-3.5 rounded-full border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-lg active:scale-95"
              >
                Explorar Funciones
              </button>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-slate-300 dark:text-zinc-600" />
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 block">Funciones</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                Todo lo que necesitas para entrenar mejor
              </h2>
              <p className="text-base text-slate-500 dark:text-zinc-400 max-w-xl mx-auto font-medium">
                Herramientas avanzadas de análisis diseñadas para ciclistas y corredores que buscan mejorar su rendimiento.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FadeIn delay={0}>
              <FeatureCard
                icon={BarChart3}
                title="Dashboard Avanzado"
                description="Gráficas de evolución, distribución de carga, resúmenes semanales y métricas clave de un vistazo."
                color="bg-blue-600"
              />
            </FadeIn>
            <FadeIn delay={80}>
              <FeatureCard
                icon={TrendingUp}
                title="Análisis de Actividad"
                description="Zonas de FC y potencia, curvas de potencia, análisis de desacople aeróbico y métricas avanzadas."
                color="bg-indigo-600"
              />
            </FadeIn>
            <FadeIn delay={160}>
              <FeatureCard
                icon={Map}
                title="Mapas Interactivos"
                description="Visualiza tus rutas con datos sincronizados en mapa. Pasa el ratón por la gráfica y mira tu posición."
                color="bg-emerald-600"
              />
            </FadeIn>
            <FadeIn delay={240}>
              <FeatureCard
                icon={Calendar}
                title="Calendario"
                description="Vista mensual de tu entrenamiento con la carga diaria, actividades planificadas y ejecutadas."
                color="bg-orange-500"
              />
            </FadeIn>
            <FadeIn delay={320}>
              <FeatureCard
                icon={Gauge}
                title="Métricas de Potencia"
                description="NP, IF, VI, TSS, curvas de potencia y análisis por zonas. Compatible con medidores de potencia."
                color="bg-amber-500"
              />
            </FadeIn>
            <FadeIn delay={400}>
              <FeatureCard
                icon={Zap}
                title="Sincronización Strava"
                description="Conecta tu cuenta de Strava y sincroniza todas tus actividades automáticamente."
                color="bg-orange-600"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="py-20 px-6 bg-slate-50 dark:bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatItem icon={Activity} value="∞" label="Actividades" />
              <StatItem icon={Timer} value="24/7" label="Análisis" />
              <StatItem icon={Heart} value="5+" label="Zonas FC" />
              <StatItem icon={Target} value="100%" label="Gratis" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              ¿Listo para analizar tu rendimiento?
            </h2>
            <p className="text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto mb-8 font-medium">
              Crea tu cuenta gratuita y empieza a entrenar con datos. Conecta Strava y visualiza tu progreso.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="group bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-10 py-4 rounded-full transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-95 inline-flex items-center gap-2"
            >
              Crear Cuenta Gratis
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 dark:border-zinc-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-zinc-600 font-medium">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500" />
            <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">FormaLab</span>
          </div>
          <span>© {new Date().getFullYear()} FormaLab · Performance Analytics</span>
        </div>
      </footer>

      {/* ─── AUTH MODAL ─── */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ─── MODAL ANIMATION ─── */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
