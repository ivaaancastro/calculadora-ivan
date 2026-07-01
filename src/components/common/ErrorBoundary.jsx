import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 max-w-lg w-full border border-slate-200 dark:border-zinc-800 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-500" size={32} />
              </div>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white mb-2">
              Vaya, algo se ha roto
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-8">
              La aplicación ha encontrado un error crítico en la interfaz. No te preocupes, tus datos están a salvo.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-zinc-950 p-4 rounded-lg overflow-auto mb-8 border border-slate-200 dark:border-zinc-800">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 font-bold mb-2">
                  {this.state.error.toString()}
                </p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
              >
                <RefreshCw size={16} />
                Reiniciar Aplicación
              </button>
              <button 
                onClick={this.handleClearCache}
                className="w-full text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 py-3 font-bold text-xs uppercase tracking-widest transition-colors"
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
