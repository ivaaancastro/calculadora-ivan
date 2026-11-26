# Arquitectura del proyecto — Forma (calculadora-ivan)

## 1. Visión general

Aplicación PWA de rendimiento deportivo/triatlón. Arquitectura de frontend monolítica separada por
capas, con Supabase como backend (Auth, DB, RLS, Edge Functions) y Google Gemini para el asistente
de IA.

## 2. Capas del frontend (`src/`)

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Puntos de entrada | `App.jsx`, `main.jsx`, `index.css` | Router principal, sesión de auth, estilos globales |
| Cliente BaaS | `supabase.js` | Cliente Supabase (instancia única) |
| UI / Componentes | `components/` | Dashboard, páginas, modals, layout, comunes, auth |
| Lógica de presentación | `hooks/` | Custom hooks (actividades, métricas, planner, swipe, tema, etc.) |
| Servicios externos | `services/` | IA (Gemini) |
| Estado global | `store/` | Zustand (`useAppStore`) |
| Utilidades / motores | `utils/` | TSS, fitness stats, parser, formatters |
| Pruebas | `__tests__/` | Unit (node) e integración (jsdom) |

## 3. Backend / BaaS (Supabase)

- **Auth:** sesión de usuario, `onAuthStateChange`, cierre de sesión con limpieza de caché y store.
- **DB:** tablas versionadas en `migrations/` (profiles, wellness_data, training_zones, constraints, RLS).
- **RLS:** políticas de nivel de fila (`auth.uid() = user_id`).
- **Edge Functions:** `supabase/functions/intervals-proxy` (proxy a Intervals.icu).

## 4. Flujo de datos

1. Usuario inicia sesión → Supabase Auth → `App.jsx` guarda sesión.
2. `useActivities` carga actividades vía React Query + Supabase.
3. Los datos fluyen a componentes de dashboard (`AdvancedAnalytics`, `HistoryList`, `CalendarPage`, etc.).
4. `useAppStore` (Zustand) guarda configuración global y estado de sincronización.
5. `ai.js` consulta a Gemini con métricas actuales y actividades recientes.

## 5. Pruebas

- **Unitarias:** `src/__tests__/unit/` (entorno `node`). Ej: `tssEngine`, `formatDuration`.
- **Integración:** `src/__tests__/integration/` (entorno `jsdom`). Ej: `ProfilePage`, `AddActivityModal`, `HistoryList`.
- **E2E:** `e2e/` (Playwright). Ej: `auth.spec.js`, `dashboard.spec.js`.

## 6. Build y despliegue

- Vite build con `manualChunks` para separar vendor (react, recharts, leaflet, supabase, query).
- PWA con `vite-plugin-pwa` (autoUpdate, manifest, iconos).
- CI en GitHub Actions (`.github/workflows/ci.yml`).

## 7. Decisiones de diseño notables

- Code splitting con `React.lazy` + `Suspense` para páginas pesadas.
- `ErrorBoundary` alrededor de rutas y modales.
- Navegación táctil con gestos de borde (`useSwipeNavigation`, `MobileSwipePager`).
- Bottom nav móvil tipo "liquid glass".
- Scripts sueltos de refactor/fix en `scratch/` (pendiente de migrar a specs o eliminar).

---
Versión: 0.1.0 — 2026-11-05