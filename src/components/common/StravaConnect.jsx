import React from 'react';
import { Activity } from 'lucide-react'; // O el icono que prefieras

const StravaConnect = () => {
  const handleConnect = () => {
    // 1. Cogemos las credenciales del entorno
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI;
    
    // 2. Definimos qué permisos queremos (Scopes)
    // read: perfil básico
    // activity:read_all: leer todas las actividades (públicas y privadas)
    const scope = 'read,activity:read_all';
    
    // 3. Construimos la URL mágica de Strava
    const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;

    // 4. Redirigimos al usuario fuera de nuestra app, hacia Strava
    window.location.href = stravaUrl;
  };

  return (
    <button 
      onClick={handleConnect}
      className="bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
    >
      <Activity size={18} />
      Conectar con Strava
    </button>
  );
};

export default StravaConnect;