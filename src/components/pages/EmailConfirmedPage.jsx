import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Activity, ArrowRight } from 'lucide-react';

export const EmailConfirmedPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      
      <div className="max-w-md w-full bg-slate-50 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-action-solid text-white p-3 rounded-xl shadow-lg shadow-action-solid/20">
            <Activity size={32} strokeWidth={2.5} />
          </div>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-4 text-positive">
          <CheckCircle2 size={64} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-black text-ink-soft tracking-tight mb-2 uppercase">
          ¡Cuenta Confirmada!
        </h1>
        
        <p className="text-sm font-medium text-ink-3 mb-8 leading-relaxed">
          Tu dirección de correo electrónico ha sido verificada correctamente. Ya tienes acceso completo a Forma y puedes empezar a analizar tu rendimiento.
        </p>

        <Link 
          to="/"
          className="group w-full py-3.5 bg-action-solid hover:bg-action-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-action-solid/20 hover:shadow-action-solid/30 active:scale-[0.98]"
        >
          Ir a Iniciar Sesión
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>

      </div>
    </div>
  );
};
