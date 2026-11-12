import React, { useState, useCallback } from 'react';
import { FadeIn } from '../landing/FadeIn';
import { ParticleCanvas } from '../landing/ParticleCanvas';
import { AuthModal } from '../landing/AuthModal';
import { HeaderV2 } from '../landing/HeaderV2';
import { HeroV2 } from '../landing/HeroV2';
import { FeaturesV2 } from '../landing/FeaturesV2';
import { FactsV2, CtaV2, FooterV2 } from '../landing/SectionsV2';
import { useUiMode } from '../../hooks/useUiMode';
import {
  Activity, ArrowRight,
  BarChart3, Map, Calendar, Zap, Heart, Timer,
  ChevronDown, TrendingUp, Target, Gauge
} from 'lucide-react';

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, description, color, span = '' }) => (
  <div className={`group relative bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-line-muted rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${span}`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color} transition-transform group-hover:scale-110`}>
      <Icon size={20} className="text-white" />
    </div>
    <h3 className="text-base font-bold text-ink-2 mb-2">{title}</h3>
    <p className="text-sm text-ink-3 leading-relaxed">{description}</p>
  </div>
);

/* ─── Stat Counter ─── */
const StatItem = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center text-center gap-2">
    <Icon size={24} className="text-blue-500" />
    <span className="text-3xl font-black text-ink-2 tracking-tight">{value}</span>
    <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">{label}</span>
  </div>
);

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */
export const LandingPage = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { isV2 } = useUiMode();

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div data-skin="landing" className="min-h-screen bg-surface-6 text-ink-2-soft overflow-x-hidden selection:bg-action-bright/30">

      {isV2 ? (
        <>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[calc(var(--nav-h)+0.5rem)] focus:z-nav focus:rounded-xl focus:bg-action-solid focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-on-action"
          >
            Saltar al contenido
          </a>
          <HeaderV2 onOpenAuth={() => setAuthOpen(true)} onFeatures={scrollToFeatures} />
          <main id="main" tabIndex={-1} className="outline-none">
            <HeroV2 onOpenAuth={() => setAuthOpen(true)} onFeatures={scrollToFeatures} />
            <FeaturesV2 />
            <FactsV2 />
            <CtaV2 onOpenAuth={() => setAuthOpen(true)} />
          </main>
          <FooterV2 onFeatures={scrollToFeatures} />
        </>
      ) : (
        <>
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-nav bg-surface-9 backdrop-blur-xl border-b border-slate-100/80 dark:border-zinc-900/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-action-solid text-white p-1.5 rounded-lg">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="text-base font-black uppercase tracking-tight text-ink-soft">
              Forma
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={scrollToFeatures} className="text-sm font-medium text-ink-3 hover:text-ink-2 transition-colors">
              Funciones
            </button>
            <a href="#stats" className="text-sm font-medium text-ink-3 hover:text-ink-2 transition-colors">
              Rendimiento
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm font-semibold text-body-soft-2 hover:text-ink-soft transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-action-solid hover:bg-action-hover text-white text-sm font-bold px-5 py-2 rounded-full transition-all shadow-lg shadow-action-solid/20 hover:shadow-action-solid/30 active:scale-95"
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
            <div className="inline-flex items-center gap-2 bg-action-tint-3 border border-action-edge rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-action-bright animate-pulse" />
              <span className="text-xs font-semibold text-action">
                Performance Analytics Platform
              </span>
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-ink tracking-tight leading-[1.1] mb-6">
              Tu laboratorio de rendimiento deportivo
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={200}>
            <p className="text-lg sm:text-xl text-ink-3 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Analiza tus actividades, monitoriza tu evolución y lleva tu entrenamiento al siguiente nivel con métricas avanzadas y análisis de datos.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setAuthOpen(true)}
                className="group bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-ink-inverse text-sm font-bold px-8 py-3.5 rounded-full transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:shadow-slate-900/30 active:scale-95 flex items-center gap-2"
              >
                Empezar Gratis
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="text-sm font-semibold text-body-soft hover:text-ink-soft px-8 py-3.5 rounded-full border border-line hover:border-line-strong transition-all hover:shadow-lg active:scale-95"
              >
                Explorar Funciones
              </button>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-faint" />
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-action-bright uppercase tracking-widest mb-3 block">Funciones</span>
              <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-4">
                Todo lo que necesitas para entrenar mejor
              </h2>
              <p className="text-base text-ink-3 max-w-xl mx-auto font-medium">
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
            <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-4">
              ¿Listo para analizar tu rendimiento?
            </h2>
            <p className="text-base text-ink-3 max-w-lg mx-auto mb-8 font-medium">
              Crea tu cuenta gratuita y empieza a entrenar con datos. Conecta Strava y visualiza tu progreso.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="group bg-action-solid hover:bg-action-hover text-white text-sm font-bold px-10 py-4 rounded-full transition-all shadow-xl shadow-action-solid/25 hover:shadow-action-solid/40 active:scale-95 inline-flex items-center gap-2"
            >
              Crear Cuenta Gratis
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-line-soft-6 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-4-dim font-medium">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500" />
            <span className="font-bold uppercase tracking-wider text-body-soft">Forma</span>
          </div>
          <span>© {new Date().getFullYear()} Forma · Performance Analytics</span>
        </div>
      </footer>
        </>
      )}

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
