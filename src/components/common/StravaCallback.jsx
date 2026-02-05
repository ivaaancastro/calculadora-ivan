import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const StravaCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Iniciando conexión...');
  const navigate = useNavigate();
  
  // TRUCO PRO: Usamos useRef para evitar que React ejecute esto 2 veces en modo desarrollo
  const hasFetched = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Si ya lo ejecutamos una vez, no hacemos nada más (Evita el error 400 por código usado)
      if (hasFetched.current) return;
      hasFetched.current = true;

      // 1. Obtener claves del entorno
      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

      // DEBUG: Comprobamos si las claves existen (Mira la consola del navegador si falla)
      console.log("Intentando conectar con ClientID:", clientId ? "OK" : "FALTA");

      if (!clientId || !clientSecret) {
        setStatus('error');
        setMessage('Error: Faltan las claves API en el archivo .env (Reinicia la terminal)');
        return;
      }

      // 2. Capturar el código de la URL
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

        // 3. Llamada a Strava
        const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`, {
          method: 'POST'
        });

        const data = await response.json();

        // Si Strava devuelve error, lanzamos excepción
        if (!response.ok) {
            console.error("Respuesta Strava:", data);
            throw new Error(data.message || 'Error al canjear token');
        }

        // 4. Guardar en Supabase
        setMessage('Guardando acceso seguro...');
        
        // Obtenemos el ID del atleta de la respuesta de Strava para guardarlo si quieres
        // const athleteId = data.athlete?.id; 

        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_expires_at: data.expires_at,
          })
          .eq('id', 1); // Recuerda: Esto es temporal para el MVP. En prod usaremos user.id real

        if (dbError) throw dbError;

        setStatus('success');
        setMessage('¡Conectado! Descargando tus datos...');
        
        // Esperamos un poco y volvemos al dashboard
        setTimeout(() => navigate('/'), 2000);

      } catch (err) {
        console.error("Error Strava Auth:", err);
        setStatus('error');
        // Si el error es "Bad Request" a menudo es porque el código ya se usó.
        // En ese caso, mejor pedir al usuario que lo intente de nuevo.
        setMessage('Error de conexión. ' + (err.message === 'Bad Request' ? 'El código caducó. Intenta conectar de nuevo.' : err.message));
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-100">
        
        {status === 'processing' && (
            <>
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Procesando...</h2>
            </>
        )}

        {status === 'success' && (
            <>
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">¡Éxito!</h2>
            </>
        )}

        {status === 'error' && (
            <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Error</h2>
            </>
        )}

        <p className="text-slate-500 mt-2 font-medium">{message}</p>
        
        {status === 'error' && (
            <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300 transition">
                Volver a intentar
            </button>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;