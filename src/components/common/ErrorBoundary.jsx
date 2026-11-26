import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { EmptyState } from '../ui';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente render muestre la UI de repuesto
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sunken-2 p-4">
          <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-lg w-full border border-line">
            <EmptyState
              tone="danger"
              icon={AlertTriangle}
              title="Vaya, algo se ha roto"
              description="La aplicación ha encontrado un error crítico en la interfaz. No te preocupes, tus datos están a salvo."
            />

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-zinc-950 p-4 rounded-lg overflow-auto mb-8 border border-line">
                <p className="text-xs font-mono text-danger-ink font-bold mb-2">
                  {this.state.error.toString()}
                </p>
                <p className="text-2xs font-mono text-ink-3-flat whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-action-solid hover:bg-action-hover text-white py-3 rounded-xl font-bold text-sm uppercase tracking-[0.08em] transition-colors"
              >
                <RefreshCw size={16} />
                Reiniciar Aplicación
              </button>
              <button 
                onClick={this.handleClearCache}
                className="w-full text-ink-3 hover:text-body-2 py-3 font-bold text-xs uppercase tracking-[0.08em] transition-colors"
              >
                Borrar caché y salir
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
