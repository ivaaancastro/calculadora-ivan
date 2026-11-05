# AUDIT_REPORT — Auditoría de arquitectura y calidad del proyecto "Forma" (calculadora-ivan)

**Rama de análisis:** `analysis/project-audit` (desde `develop`)  
**Fecha:** 05 Nov 2026  
**Versión del proyecto:** 0.1.0  
**Estado:** Solo análisis — sin cambios de código implementados  
**Autor:** Agente de análisis de software y arquitectura de sistemas

---

## 1. Resumen ejecutivo

El proyecto "Forma" es una PWA de rendimiento deportivo/triatlón con una arquitectura de frontend monolítica sobre React 19 + Vite 7, usando Supabase (Auth, DB, RLS, Edge Functions), Zustand, TanStack React Query, Google Gemini y Playwright/Vitest para pruebas.

La aplicación cumple funcionalmente su propósito (dashboard de entrenamientos, PMC/CTL/ATL/TSB, sincronización Strava e Intervals.icu, zonas FC/potencia, análisis de actividad, perfil de atleta), pero presenta **deficiencias críticas de seguridad**, **cobertura de pruebas insuficiente (~5.3% statements)**, **componentes monolíticos que violan SRP**, **código sin tipado a pesar de tener TypeScript instalado**, y **migraciones SQL sin versionado claro**.

Se han identificado hallazgos de gravedad **crítica** (secretos expuestos en `.env` commiteado), **alta** (sin validación de variables de entorno, sin rate limiting en Edge Function, tests no deterministas, MSW sin handlers, cobertura nula en la mayoría de archivos) y **media** (deuda técnica en componentes/hooks grandes, falta de TypeScript, migraciones conflictivas).

---

## 2. Puntos débiles del proyecto

### 2.1 Manejo de sesión de auth (`src/App.jsx` y `src/supabase.js`)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-01 | **Secretos expuestos en `.env` commiteado** | Crítica | El archivo `.env` contiene valores reales de producción: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` (JWT con rol `anon`), `VITE_STRAVA_CLIENT_SECRET`, `VITE_GEMINI_API_KEY`. El archivo `.env` **no está en `.gitignore`**, por lo que los secretos están rastreados por git y expuestos en el repositorio. Cualquiera con acceso al repo puede leer las claves de Supabase, Strava y Gemini. |
| P-02 | **Sin validación de variables de entorno al arranque** | Alta | `src/supabase.js` lee `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` sin validar que existan. Si faltan, `createClient(undefined, undefined)` falla en runtime sin mensaje claro. Igual ocurre en `src/services/ai.js` con `VITE_GEMINI_API_KEY`. No hay un punto central de validación de env vars al iniciar la app. |
| P-03 | **Race condition potencial en inicialización de sesión** | Media | `App.jsx` llama `supabase.auth.getSession()` y, en el mismo `useEffect`, se suscribe a `onAuthStateChange`. No hay garantía de orden entre la resolución de `getSession()` y la primera emisión del subscription. Si el usuario cierra sesión en otra pestaña, el subscription dispara `SIGNED_OUT`, pero el estado local puede haberse establecido antes con una sesión caducada. |
| P-04 | **Ruta catch-all `*` sin patrón de rutas protegidas** | Media | Todo el router se resuelve en una sola ruta `*` que renderiza `Dashboard` o `LandingPage` según `session`. No hay rutas protegidas explícitas, ni redirección automática de `/login` cuando hay sesión, ni manejo de `401` global. |
| P-05 | **Limpieza de sesión no transaccional** | Media | En `SIGNED_OUT` se hace `queryClient.clear()` y `resetStore()`, pero no se revocan tokens de Strava almacenados en `profiles` (solo se nulifican en `disconnectStrava` que se llama manualmente). Quedan tokens huérfanos en Supabase. |

### 2.2 Variables de entorno (`.env`, claves expuestas, falta de validación)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-06 | **`.env` no ignorado por git** | Crítica | `.gitignore` no incluye `.env` ni `.env.*`. Los secretos de producción están versionados. |
| P-07 | **No existe `.env.example`** | Media | No hay plantilla de variables de entorno requerida para nuevos desarrolladores ni para entornos de CI/staging. |
| P-08 | **Strava `client_secret` expuesto al cliente** | Alta | `VITE_STRAVA_CLIENT_SECRET` se usa directamente en el frontend (`useActivities.js` llama a `strava.com/oauth/token` con `client_secret` en el body). El secreto de cliente de OAuth debería vivir solo en el backend; exponerlo en el cliente permite sustraerlo y suplantar la aplicación. Se debería usar el Edge Function de Supabase o un backend propio para el token refresh. |
| P-09 | **Intervals.icu API Key vía proxy directo en el cliente** | Alta | `useIntervalsSync.js` llama directamente a `intervals.icu` con Basic Auth (`API_KEY:<apiKey>`) desde el navegador (CORS). La clave de Intervals viaja expuesta en el frontend. La Edge Function `intervals-proxy` existe pero no se usa desde el cliente en desarrollo. |

### 2.3 Servicio de IA (`src/services/ai.js`)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-10 | **Manejo de errores frágil y genérico** | Alta | El `catch` captura cualquier error y devuelve un mensaje estático ("Mi conexión neuronal ha fallado"). Solo distingue dos casos por `error.message` (string matching frágil contra mensajes de Google). No distingue errores de red, cuota excedida, timeout, o respuesta vacía. |
| P-11 | **Sin timeout ni reintentos** | Alta | `model.generateContent(prompt)` no tiene timeout. Si Gemini no responde, la promesa queda pendiente indefinidamente y la UI se bloquea esperando. No hay lógica de reintento (retry) con backoff. |
| P-12 | **Sin validación ni sanitización de entrada** | Media | `userQuestion` se interpola directamente en el prompt sin escapar comillas ni sanitizar. Riesgo de prompt injection (un usuario podría inyectar instrucciones que sobrescriban el rol de "entrenador de triatlón"). `contextData` tampoco se valida (campos `undefined` generan "undefined" en el prompt). |
| P-13 | **Singleton lazy sin mecanismo de reinicialización** | Media | Si la API key cambia (rotación), el singleton `_model` no se invalida y sigue usando la instancia anterior hasta recargar la pestaña. |

### 2.4 Estado global con Zustand (`src/store/useAppStore.js`)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-14 | **Merge superficial de settings (`updateSettings`)** | Media | `set((state) => ({ settings: { ...state.settings, ...partialSettings } }))` hace shallow merge. Si `partialSettings` incluye `run: { lthr: 180 }`, reemplaza todo el objeto `run` (pierde `zones`, `max`, `ftp`, etc.) en lugar de hacer deep merge. Puede dejar el estado inconsistente. |
| P-15 | **Sincronización store↔Supabase sin detección de conflictos** | Media | `useProfileQuery` llama `updateSettings()` al cargar desde Supabase, sobrescribiendo cambios locales no guardados del usuario. No hay timestamp de "última modificación local" ni estrategia de "último en escribir gana" vs "fusionar". |
| P-16 | **`resetStore` no limpia tokens de Strava en Supabase** | Media | Al hacer logout desde `App.jsx`, `resetStore()` limpia el estado local pero los tokens de Strava en la tabla `profiles` solo se limpian si se llama `disconnectStrava()` explícitamente (que no se invoca en el flujo global de logout). |
| P-17 | **No hay selectores derivados / memoización de estado** | Baja | Los componentes se suscriben a `settings` completo; cualquier cambio en un campo provoca re-render de todos los consumidores del store. No se usan selectores de Zustand (`store(state => state.campo)`) de forma consistente. |

### 2.5 Componentes grandes (violación de SRP)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-18 | **`Dashboard.jsx` (313 líneas) — componente dios** | Alta | Gestiona: router anidado, lazy loading de 6 páginas, ErrorBoundary, navegación móvil/escritorio, pestañas, gestos de swipe, estado de modal, upload status, y renderiza 5 vistas principales (AdvancedAnalytics, FitnessStats, Calendar, Health, History). Viola SRP: debería delegar routing, layout y cada vista a componentes propios. |
| P-19 | **`CalendarPage.jsx` (1003+ líneas) — componente dios** | Alta | Contiene: vista de calendario, planner de entrenamientos, plantillas de workout (`WORKOUT_TEMPLATES`), arrastrar y soltar, parser de "magic paste" con IA (`handleMagicPaste`), estimación automática de TSS, gráfico PMC flotante (`PmcFloatingChart` con SVG manual), recomendación de "smart coach", sincronización de bloques. Mezcla lógica de negocio (cálculo de TSS, zonas, recomendación) con UI. |
| P-20 | **`HealthPage.jsx` (831+ líneas) — componente dios** | Alta | Contiene: anillos estilo Apple (`AppleRingGauge`), gráfico de historial, tabla de biomarcadores, insights, cálculo de readiness, esfuerzo (strain), banco de energía, selector de rango. Mezcla presentación y motor analítico de bienestar. |
| P-21 | **`ProfilePage.jsx` (830+ líneas) — componente dios** | Alta | Contiene: avatar, cambio de contraseña, eliminación de cuenta, subida a storage, auto-detección de LTHR (`handleAutoDetectLTHR` con `getPeakByTime` inline), zonas FC/pace/potencia, 4 secciones (general/zones/integrations/security). Lógica de cálculo de zonas duplicada (`calcZonesFromLTHR`, `calcZonesFromFCMax`, `calcPaceZones`) dentro del componente. |
| P-22 | **`ActivityDetailPage.jsx` (597+ líneas) — componente dios** | Alta | Contiene: telemetría, 4 pestañas (análisis/mapa/laps/detalle), HUD dinámico, picos de actividad, 5 gráficos de recharts (velocidad, FC, potencia, altitud, cadencia), mapa interactivo. Mezcla navegación, procesamiento de streams y presentación. |

### 2.6 Uso de `lazy` + `Suspense` — loading states

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-23 | **Fallback de Suspense solo es un spinner** | Media | `LazyFallback` muestra solo un `Loader2`. No diferencia entre "cargando" y "error de carga". Si falla la importación dinámica, el usuario ve un spinner infinito sin opción de reintento. |
| P-24 | **Loading state binario en Dashboard** | Media | `loading && !uploading` muestra un spinner genérico "Cargando métricas..." sin indicar qué está cargando (perfil, actividades, workouts). No hay esqueleto (skeleton) ni progreso parcial. |
| P-25 | **No hay `errorBoundary` en todas las rutas lazy** | Media | Algunas rutas envueltas en `ErrorBoundary` + `Suspense`, otras no. El manejo inconsistente deja rutas expuestas a fallos no capturados. |

### 2.7 PWA y service worker

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-26 | **Sin indicador de estado offline** | Media | `vite-plugin-pwa` con `registerType: 'autoUpdate'` está configurado, pero la UI no muestra si la app está online/offline, ni permite acciones en cola para sincronizar al recuperar conexión. |
| P-27 | **Sin estrategia de caché para llamadas a Supabase/Strava** | Media | El service worker cachea assets estáticos, pero las llamadas API (Supabase, Strava, Intervals, Gemini) fallan silenciosamente sin conexión. No hay estrategia de red primero / caché de respaldo. |
| P-28 | **PWA desactivada en tests (`process.env.VITEST`)** | Baja | Es correcto para tests, pero significa que el service worker nunca se prueba en el suite de pruebas. No hay tests de actualización de SW ni de `activate`. |

### 2.8 Código en `scratch/` (scripts sueltos `.cjs`)

| ID | Hallazgo | Gravedad | Descripción |
|----|----------|----------|-------------|
| P-29 | **Scripts de refactor/fix obsoletos en el repo** | Baja | `scratch/` contiene 7 archivos: `fix_dashboard.cjs`, `fix_nav.cjs`, `fix_nav_2.cjs`, `refactor_dashboard.cjs`, `refactor_nav.cjs`, `rewrite_dashboard.cjs`, `test_peak_power.js`. Son scripts de un solo uso que manipulan archivos fuente mediante reemplazo de strings frágil (`content.replace(...)`). `rewrite_dashboard.cjs` contiene una versión reescrita completa de `Dashboard.jsx` que nunca se aplicó. Deberían eliminarse o migrarse a specs/documentación. |
| P-30 | **`skills/README.md` eliminado (rastreado como deleted en git)** | Baja | El git status muestra `deleted: skills/README.md`. Pérdida de documentación de habilidades sin rastro. |

---

## 3. Deuda técnica

### 3.1 Código JavaScript sin tipado (TypeScript instalado pero sin usar)

TypeScript `^5.9.3` está como `devDep`, y solo los archivos de `src/hooks/queries/*.ts` usan `.ts`. El resto de componentes, hooks, servicios, store y utils son `.js`/`.jsx` sin tipos.

**Archivos sin tipar que deberían migrarse progresivamente:**
- `src/App.jsx`, `src/main.jsx`, `src/supabase.js`
- `src/components/**/*.jsx` (todos los componentes)
- `src/hooks/useActivities.js`, `useIntervalsSync.js`, `useWellnessInfo.js`, `useActivityMetrics.js`, `useFitnessAnalytics.js`, `usePlanner.js`, `useSwipeNavigation.js`, `useTheme.js`
- `src/store/useAppStore.js`
- `src/services/ai.js`
- `src/utils/tssEngine.js`, `fitnessStatsEngine.js`, `parser.js`, `formatters.js`, `formatDuration.js`

**Impacto:** Sin tipos, no hay autocompletado fiable, ni detección de errores en compile-time para las interfaces entre capas (Supabase queries, store, props de componentes).

### 3.2 Lógica de negocio mezclada con UI en componentes

| Componente | Lógica de negocio embebida | Debería estar en |
|------------|---------------------------|------------------|
| `CalendarPage.jsx` | `WORKOUT_TEMPLATES`, `computeZoneTssPerHour`, `estimateTssFromBlocks`, `getEffectiveTSS`, PMC SVG manual, `handleMagicPaste` parser | `src/utils/tssEngine.js`, nuevo hook `useWorkoutPlanner`, servicio de IA |
| `HealthPage.jsx` | Cálculo de readiness, strain, banco de energía, EWMA de HRV | `src/hooks/useWellnessInfo.js` (ya existe, pero el componente duplica lógica) |
| `ProfilePage.jsx` | `calcZonesFromFCMax`, `calcPaceZones`, `getPeakByTime`, auto-detección LTHR | `src/utils/tssEngine.js`, hook dedicado |
| `ActivityDetailPage.jsx` | `getSpeedOrPace`, `getTheme`, análisis de picos, telemetría | `src/hooks/useActivityMetrics.js` (parcialmente), utils de formato |
| `Dashboard.jsx` | Routing, manejo de pestañas, render condicional de 5 vistas | Sub-componentes por vista + react-router |

### 3.3 Hooks grandes

| Hook | Líneas | Responsabilidades | Problema |
|------|--------|-------------------|----------|
| `useActivities.js` | 617 | Carga actividades, mutations CRUD, Strava sync completo (refresh token, paginación, deep sync, auto-completado workouts), PMC metrics, TSS cálculo | Demasiadas responsabilidades. Debería dividirse en `useActivitiesQuery`, `useStravaSync`, `usePmcMetrics`, `useActivityActions`. |
| `useWellnessInfo.js` | 493 | Fetch wellness (Supabase + API directa + simulador), construcción de datos simulados, EWMA HRV/RHR, readiness score, esfuerzo, tendencias | Mezcla acceso a datos, simulación y motor analítico. Debería dividirse en `useWellnessData` + `useWellnessAnalytics`. |
| `useIntervalsSync.js` | 252 | Sync wellness, sync profile, syncAll, fetch from DB, getLatest | Llamada directa a Intervals.icu desde el cliente (expone API key). Debería usar la Edge Function. |

### 3.4 Utils con funciones extensas

| Archivo | Líneas | Comentario |
|---------|--------|------------|
| `fitnessStatsEngine.js` | 1116+ | 16 funciones exportadas (eFTP, VO2max ciclismo/carrera, predictRaceTimes, trainingEffect, trainingBalance, powerProfile, Daniel paces, etc.). Archivo monolítico sin separación por dominio. Tiene `/* eslint-disable no-unused-vars */` en la cabecera, lo que oculta código muerto. |
| `tssEngine.js` | 553 | Motor de TSS/PMC bien estructurado pero sin tipos. Funciones largas (`calculateActivityTSS` con 4 niveles de prioridad, `calculatePMC` con proyección día a día). |
| `parser.js` | 113 | `parseCSV` y `parseStravaDate`. Bien estructurado, pero sin tests. |
| `formatters.js` | 24 | 3 funciones pequeñas. Falta `formatBlockDuration` (importado en tests pero no definido aquí — probablemente en `formatDuration.js`). |

**Inconsistencia:** `formatDuration.test.js` importa `formatBlockDuration` from `../../../src/utils/formatDuration` pero el archivo `formatDuration.js` no se encontró en el listado (solo `formatters.js`). Posible error de ruta o archivo faltante.

### 3.5 Migraciones SQL — sin versionado claro y posible conflicto de esquema

Se encontraron 8 archivos de migración en `migrations/`:

| Archivo | Observación |
|---------|-------------|
| `enable_rls.sql` | Crea `wellness_data` con `BIGINT GENERATED BY DEFAULT AS IDENTITY` y columnas `hrv, rhr, sleep_hours, readiness_score`. |
| `add_wellness_data.sql` | Crea `wellness_data` con `UUID DEFAULT gen_random_uuid()` y columnas `hrv, hrv_sdnn, resting_hr, sleep_secs, sleep_score, vo2max, readiness, ctl, atl, steps, spo2, respiration, stress, soreness, source, synced_at`. |

**Conflicto:** Ambos archivos crean la misma tabla `wellness_data` con esquemas **incompatibles** (BIGINT vs UUID, columnas diferentes). Si se ejecutan ambos, el segundo fallará o creará columnas duplicadas. No hay un orden de ejecución definido ni una tabla de versionado (`schema_migrations`).

Otros archivos: `add_constraints.sql` (constraints CHECK en activities, algunos comentados), `add_ctl_offset.sql`, `add_training_zones.sql`, `add_user_profile_fields.sql` (storage bucket avatars con políticas "Anyone can" — permisivas), `delete_user_rpc.sql` (SECURITY DEFINER que borra de `auth.users`, potente y peligroso), `fix_profiles_schema.sql`.

**Falta:** No hay script de migración ni registro de qué migraciones se han aplicado en cada entorno.

### 3.6 Edge Function `supabase/functions/intervals-proxy/index.ts`

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Validación de auth | ✅ | Valida JWT de Supabase y devuelve 401 si no hay usuario. |
| Validación de entrada | ⚠️ Parcial | Valida que `endpoint`, `athleteId`, `apiKey` existan. No sanitiza `endpoint` (posible path traversal si se permite `../`). |
| Rate limiting | ❌ | No hay límite de peticiones por usuario ni por IP. Un cliente puede saturar Intervals.icu. |
| Timeout upstream | ❌ | `fetch(url)` sin `AbortSignal`/timeout. Si Intervals.icu tarda, la Edge Function se queda colgada. |
| Límites de respuesta | ❌ | No hay límite de tamaño de respuesta de Intervals.icu. |
| Manejo de errores | ⚠️ Parcial | Captura errores y devuelve JSON, pero usa `console.error` sin estructurar logs. No diferencia errores de cliente (4xx) de servidor (5xx) de forma granular. |
| `btoa` con apiKey | ⚠️ | `btoa()` falla con caracteres fuera de Latin1. Las API keys de Intervals suelen ser alfanuméricas, pero no está garantizado. |
| CORS | ✅ | Headers CORS configurados, aunque `Access-Control-Allow-Origin: "*"` es permisivo. |

### 3.7 Archivos en `scratch/` que deberían migrarse a specs o eliminarse

- `fix_dashboard.cjs`, `fix_nav.cjs`, `fix_nav_2.cjs`, `refactor_dashboard.cjs`, `refactor_nav.cjs`, `rewrite_dashboard.cjs` — scripts de string-replacement obsoletos. `rewrite_dashboard.cjs` contiene una reescritura completa de Dashboard nunca aplicada.
- `test_peak_power.js` — script de prueba manual de una función aislada. Debería convertirse en unit test en `src/__tests__/unit/`.
- Ninguno tiene spec asociada en `docs/specs/`.

### 3.8 `coverage/` rastreado en git

El directorio `coverage/` (reportes HTML de v8) **no está en `.gitignore`** y aparece como modificado en `git status` (45+ archivos `.html` modificados, algunos nuevos sin trackear). Esto ensucia el historial de git y no debería versionarse.

---

## 4. Tests y Coverage

### 4.1 Métricas actuales de coverage

| Métrica | Valor | Detalle |
|---------|-------|---------|
| Statements | **5.3%** | 273 / 5146 |
| Branches | **4.74%** | 235 / 4951 |
| Functions | **4.45%** | 41 / 921 |
| Lines | **5.71%** | 246 / 4303 |

Estos números están muy por debajo de cualquier umbral razonable (típicamente se busca >70-80% statements y branches en código crítico).

### 4.2 Archivos con 0% coverage

Según el informe de coverage, los siguientes directorios/archivos tienen **0%** statements, branches y functions:

- `src/` (raíz): `App.jsx`, `main.jsx`, `index.css`, `App.css` — 0/28 statements
- `src/components/` (agregado): 0/57 statements
- `src/components/dashboard/`: `Dashboard.jsx`, `Navbar.jsx`, `AdvancedAnalytics.jsx`, `ChartsSection.jsx`, `EvolutionChart.jsx`, `FuelingPanel.jsx`, `HistoryList.jsx` — 0%
- `src/components/pages/`: `ActivityDetailPage.jsx`, `CalendarPage.jsx`, `HealthPage.jsx`, `ProfilePage.jsx`, `FitnessStatsPage.jsx`, `LandingPage.jsx`, `EmailConfirmedPage.jsx` — 0%
- `src/components/modals/`: `AddActivityModal.jsx` — 0% (aunque tiene un test de integración, parece que no se cuenta en coverage o el test no cubre sus statements)
- `src/components/layout/`: `BottomNav.jsx`, `MobileSwipePager.jsx` — 0%
- `src/components/activity/`: `ActivityMap.jsx`, `ActivitySharedUI.jsx` — 0%
- `src/components/auth/`: `LoginPage.jsx` — 0%
- `src/components/common/`: `ErrorBoundary.jsx`, `InfoTooltip.jsx`, `StravaCallback.jsx`, `StravaConnect.jsx` — 0%
- `src/hooks/`: `useActivities.js`, `useIntervalsSync.js`, `usePlanner.js`, `useTheme.js`, `useWellnessInfo.js`, `useActivityMetrics.js`, `useFitnessAnalytics.js`, `useSwipeNavigation.js` — 0%
- `src/services/`: `ai.js` — 0%
- `src/store/`: `useAppStore.js` — 0%
- `src/supabase.js` — 0%
- `src/utils/`: `tssEngine.js`, `fitnessStatsEngine.js`, `parser.js`, `formatDuration.js`, `formatters.js` — 0% (aunque `tssEngine` y `formatDuration` tienen tests, parecen no contabilizarse correctamente o los tests no se ejecutan en el run de coverage)

**Solo tienen coverage >0%:** archivos que aparecen con `100%` pero `0/0` (sin statements, probablemente archivos de índice o re-exports vacíos).

### 4.3 Qué se testa y qué falta

#### Unit tests (`src/__tests__/unit/`)
- `tssEngine.test.js`: testa `calculatePMC` (caso vacío, una actividad) y `getSportCategory`. Muy superficial: no testa `calculateActivityTSS`, `calcZonesFromLTHR`, `computeZoneTssPerHour`, `estimateTssFromBlocks`, `recalcTssFromBlocks`.
- `formatDuration.test.js`: testa `formatDuration` y `formatBlockDuration`. Importa `formatBlockDuration` de una ruta que puede no existir (`formatDuration.js` vs `formatters.js`).
- **Faltan tests para:** `parser.js` (parseCSV, parseStravaDate), `formatters.js` (formatPace, formatMinsToHMM), `fitnessStatsEngine.js` (todas sus 16 funciones), el resto de `tssEngine.js`.

#### Integration tests (`src/__tests__/integration/`)
- `ProfilePage.test.jsx`: testa eliminación de cuenta (Strava deauthorize + `delete_user` RPC + signOut). Solo 1 test.
- `AddActivityModal.test.jsx`: testa render condicional, bloqueo de valores negativos, guardado exitoso. 3 tests.
- `HistoryList.test.jsx`: testa estado vacío, renderizado, filtro de búsqueda, filtro por deporte, `onSelectActivity`, `onDelete` sin propagación. 5 tests.
- **Faltan tests para:** `Dashboard`, `CalendarPage`, `HealthPage`, `ActivityDetailPage`, `LandingPage`, `LoginPage`, `StravaConnect`, `StravaCallback`.

#### E2E tests (`e2e/`)
- `auth.spec.js`: 1 test — verifica que se muestra landing y el formulario de login. **No testa login real** (comentado: "Para testear un login exitoso en E2E real, normalmente mockeamos la sesión").
- `dashboard.spec.js`: test vacío/comentado — no testa nada real.
- **Faltan E2E para:** flujos de pago (no existen en la app, pero sí para suscripción si existiera), sincronización Strava (login OAuth, callback, sync de actividades), exportación de datos (CSV), eliminación de cuenta, PWA offline/install, flujo completo de añadir actividad → ver en dashboard → ver detalle.

### 4.4 MSW handlers

En `vitest.setup.js` se crea `export const server = setupServer()` con `onUnhandledRequest: 'error'`, pero **no se registra ningún handler** (`http.get`, `http.post`, etc.) en ningún archivo de tests. Esto significa:

- Cualquier llamada `fetch` real que no sea mockeada a nivel de módulo (como hace `ProfilePage.test.jsx` mockeando `supabase` directamente) fallará con "Unhandled request".
- **No se mockea Supabase vía MSW**, ni Gemini, ni Strava, ni Intervals.icu. Cada test mockea de forma ad-hoc el módulo `supabase`.
- No hay una estrategia centralizada de mocking de APIs externas.

### 4.5 Determinismo de los tests

- `tssEngine.test.js` usa `new Date()` (hoy) para calcular "ayer". Es **dependiente del tiempo**: si se ejecuta en un día con cambio de zona horaria o en hora límite, puede comportarse distinto. Debería usar fechas fijas o mockear `Date`.
- Los tests de integración mockean `supabase.auth.getSession` y `supabase.from` de forma manual, lo que los hace deterministas pero frágiles (acoplamiento a la implementación de Supabase).

---

## 5. Áreas de mejora y recomendaciones (priorizadas)

### Alto impacto / bajo esfuerzo

| # | Recomendación | Esfuerzo | Impacto |
|---|---------------|----------|---------|
| R-01 | **Agregar `coverage/`, `dist/`, `node_modules`, `.env` a `.gitignore`** | Muy bajo | Crítico: deja de rastrear secretos y reportes de cobertura. |
| R-02 | **Crear `.env.example` con variables requeridas (sin valores reales)** | Bajo | Alto: nuevos desarrolladores saben qué configurar; evita secretos en repo. |
| R-03 | **Añadir validación de variables de entorno al arranque** (`src/env.js` o en `main.jsx`) | Bajo | Alto: falla temprano y con mensaje claro si faltan `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_GEMINI_API_KEY`. |
| R-04 | **Añadir tests unitarios para `tssEngine.js`, `fitnessStatsEngine.js`, `parser.js`, `formatters.js`** | Medio | Alto: cobertura salta de ~5% a ~30%+ al cubrir estos utils puros. |
| R-05 | **Añadir tests para `src/services/ai.js` (mockear Gemini)** | Bajo | Medio-Alto: valida manejo de errores, timeout, sanitización de entrada. |
| R-06 | **Añadir tests para `src/store/useAppStore.js`** | Bajo | Medio: valida `updateSettings` (deep merge), `resetStore`, persistencia. |

### Alto impacto / medio esfuerzo

| # | Recomendación | Esfuerzo | Impacto |
|---|---------------|----------|---------|
| R-07 | **Refactorizar `Dashboard.jsx` (313 líneas) en componentes más pequeños** (`DashboardLayout`, `TabRouter`, `MobileView`, `DesktopView`, `ActivityRouteWrapper`) | Medio | Alto: cumple SRP, más testeable, menos acoplamiento. |
| R-08 | **Refactorizar hooks grandes** (`useActivities.js` → `useActivitiesQuery` + `useStravaSync` + `usePmcMetrics`; `useWellnessInfo.js` → `useWellnessData` + `useWellnessAnalytics`) | Medio | Alto: responsabilidades separadas, más fácil de testear y mantener. |
| R-09 | **Implementar Error Boundaries más granulares** (por página, no solo global) | Medio | Medio-Alto: fallos en una página no derriban toda la app. |
| R-10 | **Añadir tipos a Supabase queries** (generar tipos con `@supabase/supabase-js` o usar `Postgres` types) | Medio | Alto: detección de errores en compile-time, autocompletado de columnas. |
| R-11 | **Migrar progresivamente de JavaScript a TypeScript** (empezar por utils y store) | Medio-Alto | Alto: tipado estático en las capas críticas. |

### Medio impacto / medio esfuerzo

| # | Recomendación | Esfuerzo | Impacto |
|---|---------------|----------|---------|
| R-12 | **Consolidar migraciones SQL** (unificar `wellness_data`, crear tabla de versionado `schema_migrations`, numerar migraciones `001_`, `002_`, ...) | Medio | Medio: evita conflictos de esquema y clarifica el orden de aplicación. |
| R-13 | **Añadir rate limiting y validación de entrada en Edge Function `intervals-proxy`** | Medio | Medio: previene abuso de Intervals.icu y path traversal. |
| R-14 | **Mejorar manejo de estado de carga y errores en PWA** (indicador online/offline, reintento de llamadas fallidas) | Medio | Medio: mejor UX en conexiones inestables. |
| R-15 | **Documentar decisiones de arquitectura en `docs/architecture/`** (flujo de datos, diagrama de componentes, decisiones de RLS) | Medio | Medio: conocimiento compartido para nuevos desarrolladores. |

### Bajo impacto / alto esfuerzo (postergar)

| # | Recomendación | Esfuerzo | Impacto |
|---|---------------|----------|---------|
| R-16 | **Migración completa a TypeScript** (todos los `.js`/`.jsx`) | Alto | Medio: ya hay TS como devDep; el beneficio es progresivo. |
| R-17 | **Reescritura de componentes grandes** (`CalendarPage`, `HealthPage`, `ProfilePage`, `ActivityDetailPage`) | Alto | Medio-Alto: solo tras R-07 y R-08, para no duplicar esfuerzo. |

---

## 6. Roadmap de implementación (por ramas, merge a `develop`)

Cada punto del roadmap se ejecutará como una rama independiente desde `develop`, siguiendo la convención `feat/<nombre>` o `fix/<nombre>`, y se mergeará a `develop` vía PR.

| Fase | Rama sugerida | Puntos del informe | Prioridad |
|------|---------------|--------------------|-----------|
| 1 | `fix/security-env-secrets` | P-01, P-02, P-06, P-07, P-08, P-09, R-01, R-02, R-03 | Crítica |
| 2 | `feat/coverage-utils-tests` | P-28, R-04 | Alta |
| 3 | `feat/ai-service-tests` | P-10, P-11, P-12, P-13, R-05 | Alta |
| 4 | `feat/store-tests` | P-14, P-15, P-16, P-17, R-06 | Media-Alta |
| 5 | `refactor/dashboard-split` | P-18, P-23, P-24, P-25, R-07 | Alta |
| 6 | `refactor/hooks-split` | P-03, P-09, R-08 | Alta |
| 7 | `feat/ts-progressive` | R-10, R-11, R-16 | Alta-Media |
| 8 | `fix/migrations-consolidation` | P-35 (3.5), R-12 | Media |
| 9 | `feat/edge-function-hardening` | P-09, R-13 | Media |
| 10 | `feat/pwa-offline-state` | P-26, P-27, R-14 | Media |
| 11 | `docs/architecture-decisions` | R-15 | Media |
| 12 | `chore/scratch-cleanup` | P-29, P-30, R-17 (parcial) | Baja |
| 13 | `feat/e2e-critical-flows` | 4.3 (E2E faltantes) | Media-Alta |

### Orden sugerido de ejecución

1. **Semana 1 — Seguridad (fase 1):** `fix/security-env-secrets`. Remover `.env` del rastreo git, agregar a `.gitignore`, crear `.env.example`, validar env vars al arranque. **Esto es bloqueante:** no se debe seguir desarrollando sin corregir P-01/P-06.
2. **Semana 2 — Cobertura base (fases 2-4):** `feat/coverage-utils-tests`, `feat/ai-service-tests`, `feat/store-tests`. Subir coverage del 5.3% a un umbral razonable (>40% statements en código crítico).
3. **Semana 3-4 — Refactorización core (fases 5-6):** `refactor/dashboard-split`, `refactor/hooks-split`. Reducir complejidad de componentes y hooks grandes.
4. **Mes 2+ — Estabilidad y tipo (fases 7-13):** TypeScript progresivo, migraciones, Edge Function, PWA offline, E2E críticos, documentación.

---

## 7. Próximos pasos sugeridos

1. **Inmediato (esta semana):**
   - Crear rama `fix/security-env-secrets` desde `develop`.
   - Agregar `.env`, `.env.*`, `coverage/`, `dist/` a `.gitignore`.
   - Crear `.env.example` sin valores reales.
   - Eliminar scripts de `scratch/` o migrarlos a `docs/specs/`.
   - Agregar validación de env vars al arranque.
   - Escribir spec SDD para cada fase antes de implementar (flujo SDD obligatorio).

2. **Corto plazo (2-4 semanas):**
   - Escribir spec SDD para "Aumento de cobertura de tests" y "Migración progresiva a TypeScript".
   - Implementar tests unitarios para `tssEngine.js`, `parser.js`, `formatters.js`, `ai.js`, `useAppStore.js`.
   - Registrar handlers de MSW para Supabase, Gemini, Strava e Intervals.icu.
   - Refactorizar `Dashboard.jsx` en componentes más pequeños.

3. **Mediano plazo (1-3 meses):**
   - Consolidar migraciones SQL con versionado.
   - Añadir rate limiting y validación en Edge Function.
   - Migrar hooks grandes a hooks enfocados.
   - Completar E2E para flujos críticos (Strava sync, añadir actividad, detalle).

4. **Registro en `MEMORY.md`:**
   - Al terminar cada grupo de tareas, actualizar `MEMORY.md` con el estado de specs implementadas y hallazgos resueltos, siguiendo el flujo SDD (Especificar → Planificar → Implementar → Verificar → Registrar).

---

## 8. Conclusión

El proyecto "Forma" tiene una base técnica sólida (stack moderno, arquitectura en capas, PWA, sincronización con múltiples fuentes de datos, motor de métricas deportivas bien implementado en `tssEngine.js` y `fitnessStatsEngine.js`), pero requiere **intervención inmediata en seguridad** (secretos expuestos en `.env`), **cobertura de pruebas** (del 5.3% actual a un umbral razonable) y **refactorización de componentes/hooks monolíticos** antes de poder escalar con seguridad.

El flujo SDD ya está definido en `AGENTS.md` y `MEMORY.md`; lo que falta es aplicarlo rigurosamente a cada una de las mejoras listadas arriba, escribiendo specs antes de implementar y manteniendo `MEMORY.md` actualizado.

---
*Informe generado en la rama `analysis/project-audit`. No se han implementado cambios de código todavía; solo se ha documentado el análisis.*