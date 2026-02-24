import React, { useState } from 'react';
import { supabase } from '../../supabase'; // Asegúrate de que esta ruta apunte a tu cliente de Supabase
import { Activity, Loader2, Mail, Lock } from 'lucide-react';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu email para confirmar la cuenta (si tienes activada la confirmación en Supabase), o simplemente inicia sesión.");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 transition-colors duration-300">
      
      <div className="w-full max-w-sm">
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-lg shadow-lg shadow-blue-600/20">
              <Activity size={32} strokeWidth={2.5} />
          </div>
          <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none uppercase">
                FORMA<span className="text-blue-500">LAB</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                Performance Analytics
              </p>
          </div>
        </div>

        {/* CAJA DE FORMULARIO */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-100 mb-6 text-center">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded text-red-600 dark:text-red-400 text-[11px] font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-mono text-sm text-slate-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="atleta@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-mono text-sm text-slate-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Entrar al Laboratorio' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 dark:border-zinc-800 pt-4">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors uppercase tracking-widest"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};