import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Activity, ArrowRight } from 'lucide-react';
import { Card } from '../ui';

export const EmailConfirmedPage = () => {
  return (
    <div data-skin="email" className="min-h-screen bg-surface-6 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-action-bright/30">
      <main id="main" className="w-full max-w-md">
        <Card variant="panel" className="p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-action-solid text-on-action p-3 rounded-xl">
              <Activity size={28} strokeWidth={2.5} aria-hidden="true" />
            </div>
          </div>
          <div className="flex justify-center mb-4 text-positive">
            <CheckCircle2 size={56} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight mb-2">¡Cuenta Confirmada!</h1>
          <p className="text-sm font-medium text-ink-3 mb-8 leading-relaxed">
            Tu dirección de correo electrónico ha sido verificada correctamente. Ya tienes acceso completo a Forma y puedes empezar a analizar tu rendimiento.
          </p>
          <Link
            to="/"
            className="w-full min-h-[48px] bg-action-solid hover:bg-action-hover text-on-action rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-bright"
          >
            Ir a Iniciar Sesión
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Card>
      </main>
    </div>
  );
};
