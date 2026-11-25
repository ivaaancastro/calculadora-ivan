import React, { useState, useCallback } from 'react';
import { AuthModal } from '../landing/AuthModal';
import { Header } from '../landing/Header';
import { Hero } from '../landing/Hero';
import { Features } from '../landing/Features';
import { Facts, Cta, Footer } from '../landing/Sections';

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */
export const LandingPage = () => {
  const [authOpen, setAuthOpen] = useState(false);

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div data-skin="landing" className="min-h-screen bg-surface-6 text-ink-2-soft overflow-x-hidden selection:bg-action-bright/30">

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[calc(var(--nav-h)+0.5rem)] focus:z-nav focus:rounded-xl focus:bg-action-solid focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-on-action"
      >
        Saltar al contenido
      </a>
      <Header onOpenAuth={() => setAuthOpen(true)} onFeatures={scrollToFeatures} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero onOpenAuth={() => setAuthOpen(true)} onFeatures={scrollToFeatures} />
        <Features />
        <Facts />
        <Cta onOpenAuth={() => setAuthOpen(true)} />
      </main>
      <Footer onFeatures={scrollToFeatures} />

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
