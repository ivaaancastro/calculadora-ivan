import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { Button, IconButton, Input, Modal } from '../ui';
import { Activity, Loader2, Mail, Lock, ArrowLeft, ArrowRight, X } from 'lucide-react';

/* ─── Auth Modal ─── */
export const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => { setError(null); setMessage(null); };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();
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
            emailRedirectTo: `${window.location.origin}/email-confirmado`
          }
        });
        if (error) throw error;
        setMessage('¡Registro exitoso! Revisa tu email para confirmar la cuenta.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const title = isForgotPassword ? 'Recuperar Clave' : isLogin ? 'Bienvenido de Vuelta' : 'Crear Cuenta';
  const subtitle = isForgotPassword ? 'Te enviaremos un enlace a tu correo' : isLogin ? 'Accede a tu panel' : 'Empieza a analizar tu rendimiento';
  return (
    <Modal open={open} onClose={onClose} variant="auth" labelledBy="auth-modal-title" closeOnBackdrop trapFocus>
      <div className="absolute top-2 right-2">
        <IconButton variant="quiet" onClick={onClose} label="Cerrar" icon={X} iconSize={18} />
      </div>
      {isForgotPassword && (
        <div className="absolute top-2 left-2">
          <IconButton variant="quiet" onClick={() => { setIsForgotPassword(false); reset(); }} label="Volver" icon={ArrowLeft} iconSize={18} />
        </div>
      )}

      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="bg-action-solid text-on-action p-2.5 rounded-xl">
          <Activity size={24} strokeWidth={2.5} />
        </div>
        <h2 id="auth-modal-title" className="text-xl font-bold text-ink tracking-tight">{title}</h2>
        <p className="text-sm text-ink-3 font-medium">{subtitle}</p>
      </div>

      {error && <div role="alert" className="mb-4 p-3 bg-danger-tint border border-danger-edge rounded-xl text-danger-ink text-xs font-semibold text-center">{error}</div>}
      {message && <div role="status" className="mb-4 p-3 bg-positive-tint border border-positive-edge rounded-xl text-positive-ink text-xs font-semibold text-center">{message}</div>}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="text-xs font-semibold text-ink-3 block mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
            <Input variant="auth" id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="atleta@ejemplo.com" />
          </div>
        </div>
        {!isForgotPassword && (
          <div>
            <label htmlFor="auth-password" className="text-xs font-semibold text-ink-3 block mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
              <Input variant="auth" id="auth-password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
          </div>
        )}
        <Button variant="primary" type="submit" disabled={loading} className="mt-2">
          {loading ? <Loader2 size={16} className="animate-spin" aria-label="Enviando" /> : (
            <>
              {isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar' : 'Crear Cuenta'}
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>

      {!isForgotPassword && (
        <div className="mt-5 text-center border-t border-line-soft-2 pt-3 flex flex-col items-center">
          <Button variant="link" onClick={() => { setIsLogin(!isLogin); reset(); }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </Button>
          {isLogin && (
            <Button variant="link" onClick={() => { setIsForgotPassword(true); reset(); }}>
              ¿Has olvidado tu contraseña?
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};
