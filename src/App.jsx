import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; // Asegúrate de que esta ruta es la tuya correcta
import Dashboard from './components/Dashboard'; 
import { LoginPage } from './components/auth/LoginPage'; 

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

  // Si no hay sesión, obligamos a ver la pantalla de Login
  if (!session) {
    return <LoginPage />;
  }

  // Si hay sesión, inyectamos el Dashboard directamente
  return <Dashboard key={session.user.id} />;
}

export default App;