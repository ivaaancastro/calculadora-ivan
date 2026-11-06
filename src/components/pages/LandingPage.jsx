import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { ArrowRight, Mail, Lock, Activity, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';
import { Link } from 'react-router-dom';

/* ─── Auth Modal (mantenido, sin cambios de lógica) ─── */
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmado`
          }
        });
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 backdrop-blur-2xl border border-slate-200/60 dark:border-zinc-800/60 rounded-[20px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-sm hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="bg-[#1f2de6] text-white p-2 rounded-[12px]">
            <Activity size={22} strokeWidth={2} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight uppercase">
            {isForgotPassword ? 'Recuperar Clave' : isLogin ? 'Bienvenido de Vuelta' : 'Crear Cuenta'}
          </h2>
        </div>

        {error && <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-[12px] text-red-700 dark:text-red-300 text-[11px] font-medium text-center">{error}</div>}
        {message && <div className="mb-3 p-3 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-[12px] text-emerald-700 dark:text-emerald-300 text-[11px] font-medium text-center">{message}</div>}

        <form onSubmit={handleAuth} className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-9 pr-3 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[12px] text-sm text-slate-800 dark:text-zinc-200 focus:border-[#1f2de6] focus:ring-2 focus:ring-[#1f2de6]/20 outline-none transition-colors"
                placeholder="atleta@ejemplo.com"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Contraseña</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-3 py-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[12px] text-sm text-slate-800 dark:text-zinc-200 focus:border-[#1f2de6] focus:ring-2 focus:ring-[#1f2de6]/20 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="btn btn--primary w-full"
          >
            {loading ? <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (
              isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-5 text-center border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col gap-2">
            <button
              onClick={() => { setIsLogin(!isLogin); reset(); }}
              className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </button>
            {isLogin && (
              <button
                onClick={() => { setIsForgotPassword(true); reset(); }}
                className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hover:text-[#1f2de6] dark:hover:text-blue-400"
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

/* ════════════════════════════════════════════════════
   LANDING PAGE — diseño-taste-frontend
   ════════════════════════════════════════════════════ */
export const LandingPage = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:#0b0c0e text-slate-800 dark:text-zinc-200 overflow-x-hidden selection:bg-[#1f2de6]/30">

      {/* ─── NAVBAR (fija, opaca, 1px hairline, sin blur/transparencia) ─── */}
      <nav className="fixed top-0 left-0 right-0 z-[10] border-b border-slate-200 dark:border-zinc-800/60 bg-white/90 dark:bg-[#0b0c0e]/90">
        <div className="wrap flex items-center justify-between h-[72px] px-6">
          <a href="#" className="flex items-center gap-2 link">
            <div className="bg-[#1f2de6] text-white p-1.5 rounded-[8px]">
              <Activity size={16} strokeWidth={2} />
            </div>
            <span className="font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Forma<span className="text-[#1f2de6]">Lab</span></span>
          </a>
          <button
            onClick={() => setAuthOpen(true)}
            className="btn btn--primary"
          >
            Empezar prueba gratis
          </button>
        </div>
      </nav>

      <main>
        {/* ─── HERO — solo en la primera pantalla ─── */}
        <section className="section hero relative overflow-hidden" id="hero" style={{ '--h': 1 }}>
          {/* Efecto dealt tech: patrón geométrico sutil en el hero (sin WebGL) */}
          <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none" data-visual>
            <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#1f2de6]/10 via-transparent to-transparent" />
            <div className="w-full h-full bg-[size:64px_64px] [mask-image:radial-gradient(circle,_#0000_75%,transparent_78%)] [mask-repeat:repeat] [mask-position:0%_0%] bg-[#1f2de6]/10" />
          </div>

          <div className="wrap relative z-10">
            <a href="#top" className="skip-link">Saltar al contenido</a>

            <div className="hero-grid grid grid-cols-12 gap-8 items-start">
              {/* Texto: span 7 */}
              <div className="col-span-12 lg:col-span-7 measure">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-[1.12] mb-6">
                  Dashboard de rendimiento para ciclistas y corredores
                </h1>
                <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-none">
                  Analiza tus actividades, métricas de entrenamiento (CTL, ATL, TSB), zonas de
                  potencia y salud en un solo lugar. Conecta Strava y ve tu evolución.
                </p>
                {/* Dato duro: número real de la app */}
                <div className="flex items-center gap-3 mb-8 text-sm text-slate-500 dark:text-zinc-400 font-medium">
                  <span className="w-1 h-1 rounded-full bg-[#1f2de6] animate-pulse" />
                  <span>Más de 10.000 actividades analizadas</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="primary" onClick={() => setAuthOpen(true)} full>
                    Empezar prueba gratis <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              </div>

              {/* App-frame: UI propio de la app, grande, a la derecha */}
              <div className="col-span-12 lg:col-span-5 mt-10 lg:mt-0">
                <div className="card border-slate-200 dark:border-zinc-800/60 shadow-lg dark:shadow-none overflow-hidden">
                  {/* Header de la app (live HTML) */}
                  <div className="bg-[#e2e5ea] dark:bg-[#17181a] px-6 py-4 border-b border-slate-200 dark:border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#1f2de6] text-white p-1 rounded-[8px]"><Activity size={14} strokeWidth={2} /></div>
                      <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">FormaLab</div>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-zinc-500">Dashboard • Hoy</div>
                  </div>
                  {/* Métricas principales (live HTML del producto) */}
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[12px] border border-slate-200 dark:border-zinc-800 p-4">
                      <div className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">CTL</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">42</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">▲ 3.2 esta semana</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-[12px] border border-slate-200 dark:border-zinc-800 p-4">
                      <div className="text-xs text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">TSB</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100">+8</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Listo para competir</div>
                    </div>
                  </div>
                  {/* Gráfico simulado (live HTML del producto) */}
                  <div className="h-32 bg-white dark:bg-zinc-900 rounded-[12px] border border-slate-200 dark:border-zinc-800 mt-4 p-4">
                    <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                      <path d="M20,100 Q80,60 140,90 T260,60 T380,100" stroke="#1f2de6" strokeWidth="2" fill="none" />
                      <path d="M20,100 L380,100 L380,140 L20,140 Z" fill="rgba(31,45,230,0.08)" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CARACTERÍSTICAS — una sección, una pantalla ─── */}
        <section className="section ground-alt" id="features" style={{ '--h': 1 }}>
          <div className="wrap">
            <SectionHeader
              title="Todo lo que necesitas para entrenar mejor"
              subtitle="Herramientas de análisis diseñadas para ciclistas y corredores que miden su progreso."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {[
                {
                  title: 'Métricas de fitness',
                  text: 'CTL, ATL y TSB calculados automáticamente desde tus actividades sincronizadas.',
                },
                {
                  title: 'Zonas de potencia y FC',
                  text: 'Define tus umbrales y visualiza el tiempo en cada zona por deporte.',
                },
                {
                  title: 'Calendario de entrenamiento',
                  text: 'Planea tus sesiones y lleva el registro de lo ejecutado día a día.',
                },
                {
                  title: 'Salud y bienestar',
                  text: 'HRV, reposo, sueño y entrenamiento listo para interpretar tu fatiga.',
                },
                {
                  title: 'Sincronización Strava',
                  text: 'Conecta Strava y todas tus actividades se importan automáticamente.',
                },
                {
                  title: 'Entrenador IA',
                  text: 'Pregúntale a tu entrenador basado en Google Gemini sobre tu progreso.',
                },
              ].map((item, i) => (
                <Card key={i} className="h-full">
                  <CardTitle>{item.title}</CardTitle>
                  <CardText>{item.text}</CardText>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="section ground-dark border-t border-slate-200/20" id="footer" style={{ '--h': 1 }}>
          <div className="wrap flex flex-col lg:flex-row items-center justify-between gap-6 py-12">
            <div className="flex items-center gap-2">
              <div className="bg-[#1f2de6] text-white p-1 rounded-[8px]"><Activity size={14} strokeWidth={2} /></div>
              <span className="font-bold text-zinc-100 tracking-tight">Forma<span className="text-[#1f2de6]">Lab</span></span>
            </div>
            <div className="text-sm text-zinc-400">
              © {new Date().getFullYear()} FormaLab · Performance Analytics
            </div>
            <div className="flex gap-6 text-sm text-zinc-400">
              <a href="#" className="link hover:text-white">Privacidad</a>
              <a href="#" className="link hover:text-white">Términos</a>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};
