import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// ---------------------------------------------------------------------------
// Validación temprana de variables de entorno críticas.
// La aplicación no arranca si falta alguna de estas claves, evitando fallos
// impredecibles en tiempo de ejecución (supabase.js y services/ai.js dependen
// de ellas). Los valores reales viven en .env (no versionado); véase .env.example.
// ---------------------------------------------------------------------------
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
  VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  const message =
    `[ERROR DE CONFIGURACIÓN] Faltan variables de entorno obligatorias: ${missingEnvVars.join(
      ', '
    )}.\n` +
    `Copia .env.example a .env, rellena los valores reales y reinicia la aplicación.\n` +
    `No subas nunca el archivo .env a control de versiones (está en .gitignore).`;
  // Fallo temprano solo en producción. En desarrollo/test (incluido E2E) se
  // advierte por consola sin bloquear el arranque, para permitir que las
  // pruebas ejecuten la app sin requerir secretos reales en el entorno CI.
  if (import.meta.env.PROD) {
    throw new Error(message);
  }
  console.error(message);
}

// ---------------------------------------------------------------------------

// Solo cargar Devtools en desarrollo (eliminado del bundle de producción)
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evitamos peticiones innecesarias al cambiar de pestaña
      staleTime: 1000 * 60 * 5, // Los datos se consideran frescos durante 5 minutos
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
)
