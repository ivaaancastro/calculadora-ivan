import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary atrapó un error:\n", error, "\n", errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center p-6 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-xl w-full h-full min-h-[150px]">
                    <AlertTriangle className="text-rose-500 mb-2" size={24} />
                    <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest text-center">
                        Error al visualizar
                    </h3>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 text-center mt-1 max-w-[200px] truncate">
                        {this.state.error?.message || "Ocurrió un error inesperado al renderizar."}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded text-[9px] font-bold uppercase transition-colors"
                    >
                        <RefreshCcw size={10} /> Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
