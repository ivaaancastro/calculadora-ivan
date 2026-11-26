# Plan — fix/detail-back-map
1. `ActivityRouteWrapper`: `useNavigate`/`useLocation`; `onBack` (navigate(-1) o `/history`) y `fetchStreams`. Test de integración del wrapper (origen y URL directa).
2. `ActivityMap.jsx`: fuentes Light/Dark de Esri Canvas (+ `maxNativeZoom`); test unitario de las URLs.
3. `e2e/detail-back.spec.js`: Volver desde Actividades y Calendario (clic real) + URL directa; v1 y v2.
4. Verificar: lint, lint:colors, lint:ui, vitest, build, E2E Docker (`E2E_PORT` propio, mutex `/tmp/forma-docker.lock`). Sin estilos → `style-diff` no aplica (solo lógica + URL de teselas).
5. Registrar: `tasks.md`, CHANGELOG, MEMORY; PR a `develop` sin mergear.
