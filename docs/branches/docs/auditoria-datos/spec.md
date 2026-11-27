# Spec — Auditoría de carga de datos (B8a)

## 1. Identificación
- **ID:** `b8a-auditoria-datos`
- **Rama:** `docs/auditoria-datos` (desde `origin/develop`, `cb595b8`)
- **Fecha:** 2026-11-27
- **Estado:** pendiente de aprobación

## 2. Objetivo
Medir qué carga cada pantalla (peticiones, tamaño de respuestas, columnas y streams sin usar, paginación y caché) y proponer recortes priorizados con el ahorro estimado. **Solo medir y proponer.** El resultado alimenta B8b (sincronización con Strava, Oleada 4).

## 3. Contexto: sospechas por lectura (sin medir todavía)

| # | Sospecha | Qué se ve en el código | Qué falta demostrar |
|---|----------|------------------------|---------------------|
| S1 | **Bucle de auto-sync de Intervals** (prioritaria) | El efecto de `useIntervalsAutoSync.js` depende de `profileQuery` y no tiene guarda «en curso». El propio efecto cambia el store (`setUploadState`) y el estado de `useIntervalsSync`, que provocan renders. Si la sincronización falla, `intervals_last_synced` no cambia. | Cuántas peticiones salen con éxito, con error y con respuesta lenta |
| S2 | Streams de 95 días al arrancar y refetch que borra los históricos | `useActivitiesQuery.ts`: la fase 2 va en un `setTimeout` fuera de react-query; la fase 1 devuelve `streams_data: null`; `hasLoadedHistoricalStreams` sigue en `true` tras un refetch | Peso real y reproducción del borrado |
| S3 | `wellness_data select('*')` de 180 días repetido | `useWellnessData.js` usa `useEffect` propio; depende de `settings` y `dailyTSS` | Veces por pantalla y peso |
| S4 | `activities` sin paginar y `profiles select('*')` con tokens | Sin `range`/`order`: PostgREST puede cortar a 1000 filas sin avisar. También afecta a la consulta de pendientes del deep sync | Número real de filas y límite configurado |
| S5 | Deep sync tras sync de Strava sin parar con 429 | `handleStravaSync` ignora `{ error: 'rate_limit' }` (el manual sí para). Un 429 en `/laps` guarda `laps: []` | Peticiones emitidas tras el primer 429 |

Hallazgos nuevos de la lectura, que también se miden:

| # | Sospecha | Detalle |
|---|----------|---------|
| S6 | **Las 5 pestañas se montan siempre** | `MainTabsView.jsx` pinta el carrusel móvil (las 5 vistas) y las rutas de escritorio a la vez; solo se ocultan con CSS. Multiplicaría las peticiones de S3 y los cálculos |
| S7 | Intervals.icu llamado desde el cliente como alternativa | `useWellnessData.js` pide 180 días a la API si la tabla está vacía |
| S8 | Recortar streams cambia números | `calculateActivityTSS` y las estadísticas leen `streams_data`; la cobertura de telemetría del Perfil solo ve lo cargado. Condiciona cualquier recorte y toca a B1 |

## 4. Requisitos
- [ ] RF1 — Matriz pantalla × petición: número, tabla/API, columnas pedidas, filas, bytes sin comprimir y con gzip, momento (arranque, navegación, acción).
- [ ] RF2 — Pantallas: `/`, `/stats`, `/calendar`, `/health`, `/history`, `/activity/:id` (reciente y antigua), `/profile`; a 390 y 1440 px.
- [ ] RF3 — Flujos (**solo simulados**): arranque en frío, recarga, cambiar de pestaña, rangos `1y`/`all`, sync de Strava (con 429), sync de Intervals (éxito, error, lento), alta y borrado de actividad.
- [ ] RF4 — Uso por columna de `activities`, `profiles`, `wellness_data`, `planned_workouts`, y por clave de `streams_data`: quién la lee o «sin uso».
- [ ] RF5 — Caché y paginación: `queryKey`, `staleTime`, peticiones fuera de react-query, duplicadas, caché de la PWA, límite de filas.
- [ ] RF6 — Veredicto por sospecha: confirmada / descartada / no verificable, con la cifra que lo sostiene.
- [ ] RF7 — Recortes priorizados: ahorro (KB y peticiones, por arranque y por mes), esfuerzo, riesgo, dependencias (B1, B3, B5, B8b).
- [ ] RF8 — Si S1 se confirma, avisar enseguida para el `fix` aparte (D3).

## 5. Criterios de aceptación
- [ ] Cada cifra indica su fuente: **simulada**, **agregado real** (SQL) o **sesión real**; las estimaciones dicen cómo se calculan.
- [ ] S1–S8 tienen veredicto.
- [ ] `git diff origin/develop --stat` solo toca `docs/branches/docs/auditoria-datos/` y, al final, `CHANGELOG.md` y `MEMORY.md`.
- [ ] Ninguna escritura ni sincronización contra datos reales; ningún secreto, token, dato personal ni cuerpo de respuesta en el repositorio o en el chat.

## 6. Entregables (en esta carpeta)
- `informe.md` — resumen, veredictos, matriz, recortes priorizados y notas para B8b.
- `mediciones.md` — tablas completas.
- `consultas.sql` — solo `SELECT` agregados (si se aprueba D-1 con SQL).
- Scripts de medida: en el scratchpad, **no** se versionan.

## 7. Fuera de alcance
Cambios en `src/`, `e2e/`, base de datos o Edge Functions (incluido el `fix` de S1); tamaño del bundle (salvo el efecto de S6); `docs/roadmap/`.

## 8. Pruebas y verificación
No hay código de producción. Verificación: scripts repetibles (dos pasadas con las mismas cifras de peticiones) y revisión del diff.
