import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const StravaCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Iniciando conexión...');
  const navigate = useNavigate();
  
  const hasFetched = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        setStatus('error');
        setMessage('Error: Faltan las claves API en el archivo .env');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setMessage('Acceso denegado por el usuario.');
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No se recibió código de Strava.');
        return;
      }

      try {
        setMessage('Intercambiando credenciales con Strava...');

        const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`, {
          method: 'POST'
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Respuesta Strava:", data);
            throw new Error(data.message || 'Error al canjear token');
        }

        setMessage('Guardando acceso seguro...');
        
        // 1. OBTENEMOS LA SESIÓN DEL USUARIO ACTUAL DE SUPABASE
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          throw new Error('No hay sesión activa. Inicia sesión en la app primero.');
        }

        // 2. GUARDAMOS EL TOKEN ASOCIADO ESTRICTAMENTE A ESTE USUARIO (UPSERT)
        const { error: dbError } = await supabase
          .from('profiles')
          .upsert({
            user_id: session.user.id,
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_expires_at: data.expires_at,
          }, { onConflict: 'user_id' }); // IMPORTANTE: Si ya existe el user_id, lo actualiza

        if (dbError) throw dbError;

        setStatus('success');
        setMessage('¡Conectado! Redirigiendo al Laboratorio...');
        
        setTimeout(() => {
            window.location.href = '/'; 
        }, 2000);

      } catch (err) {
        console.error("Error Strava Auth:", err);
        setStatus('error');
        setMessage('Error de conexión. ' + (err.message === 'Bad Request' ? 'El código caducó. Intenta conectar de nuevo.' : err.message));
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-sm text-center max-w-md w-full border border-slate-200 dark:border-zinc-800">
        
        {status === 'processing' && (
            <>
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">Procesando</h2>
            </>
        )}

        {status === 'success' && (
            <>
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">¡Éxito!</h2>
            </>
        )}

        {status === 'error' && (
            <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">Error</h2>
            </>
        )}

        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-3">{message}</p>
        
        {status === 'error' && (
            <button onClick={() => navigate('/')} className="mt-6 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded font-bold text-[11px] uppercase tracking-widest transition-colors">
                Volver a intentar
            </button>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;