import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';
import Dashboard from './components/Dashboard';
import { LandingPage } from './components/pages/LandingPage';
import StravaCallback from './components/common/StravaCallback';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión inicial al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // 2. Escuchar cambios de autenticación (cuando haces login o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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