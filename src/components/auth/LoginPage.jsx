import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { Activity, Mail, Lock, ArrowLeft, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Se ha enviado un enlace a tu correo para restablecer la contraseña.');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/email-confirmado`
          }
        });
        if (error) throw error;
        setMessage('¡Registro exitoso! Revisa tu email para confirmar la cuenta o inicia sesión.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef0f3] dark:bg-[#0b0c0e] text-[#0b0c0e] dark:text-zinc-200 flex items-center justify-center p-4 overflow-x-hidden">
      <a href="#" className="skip-link">Saltar al contenido</a>

      <div className="wrap max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-[#1f2de6] text-white p-2 rounded-[12px]">
            <Activity size={26} strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#0b0c0e] dark:text-zinc-100 tracking-tight leading-none">
              Forma<span className="text-[#1f2de6]">Lab</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mt-1">
              Acceso a tu cuenta
            </p>
          </div>
        </div>

        <Card className="p-8 sm:p-10">
          {isForgotPassword && (
            <Link to="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setError(null); setMessage(null); }} className="inline-flex items-center gap-1 mb-6 text-[11px] text-slate-400 dark:text-zinc-500 hover:text-[#1f2de6]">
              <ArrowLeft size={14} /> Volver
            </Link>
          )}

          <h2 className="text-lg font-bold text-[#0b0c0e] dark:text-zinc-100 mb-6 tracking-tight">
            {isForgotPassword ? 'Recuperar Clave' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-[12px] text-red-700 dark:text-red-300 text-[11px] font-medium text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-[12px] text-emerald-700 dark:text-emerald-300 text-[11px] font-medium text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="atleta@ejemplo.com"
              />
            </div>

            {!isLogin && !isForgotPassword && (
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nombre Completo</label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                />
              </div>
            )}

            {!isForgotPassword && (
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Contraseña</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn btn--primary w-full"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar' : 'Crear Cuenta'
              )}
            </button>
          </form>

          {!isForgotPassword && (
            <div className="mt-6 text-center border-t border-slate-200 dark:border-zinc-800 pt-5 flex flex-col gap-3">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
              </button>
              {isLogin && (
                <button
                  onClick={() => { setIsForgotPassword(true); setError(null); setMessage(null); }}
                  className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hover:text-[#1f2de6] dark:hover:text-blue-400"
                >
                  ¿Has olvidado tu contraseña?
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
