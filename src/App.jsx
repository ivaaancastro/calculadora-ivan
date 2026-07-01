import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';
import Dashboard from './components/Dashboard';
import { LandingPage } from './components/pages/LandingPage';
import { EmailConfirmedPage } from './components/pages/EmailConfirmedPage';
import StravaCallback from './components/common/StravaCallback';
import { Toaster } from 'react-hot-toast';

import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';

function App() {
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  const resetStore = useAppStore(state => state.resetStore);

  useEffect(() => {
    // 1. Obtener la sesión inicial al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // 2. Escuchar cambios de autenticación (cuando haces login o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        // Limpieza de datos por seguridad al cerrar sesión
        queryClient.clear(); // Limpia toda la caché de React Query
        resetStore(); // Resetea el store de Zustand a valores por defecto
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, resetStore]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Strava OAuth callback — must be accessible regardless of auth state */}
        <Route path="/strava-callback" element={<StravaCallback />} />

        {/* Email confirmation success page */}
        <Route path="/email-confirmado" element={<EmailConfirmedPage />} />

        {/* Main app — shows Landing if not authenticated */}
        <Route
          path="*"
          element={
            <>
              {session ? (
                <Dashboard key={session.user.id} />
              ) : (
                <LandingPage />
              )}
              <Toaster
                position="bottom-center"
                toastOptions={{
                  style: {
                    background: '#27272a',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, sans-serif'
                  },
                }}
              />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;