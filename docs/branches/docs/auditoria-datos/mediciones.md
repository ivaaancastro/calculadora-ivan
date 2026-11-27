# Mediciones — B8a

**Todas las cifras son de datos simulados** (no hay todavía agregados reales) salvo que se diga «lectura de código».
Commit medido: `b4c82d9` (código de `develop` en `0d21f36`), build de producción. Los scripts están en el scratchpad de la sesión y no se versionan.

## Cómo se mide

Vite en 5184 con variables falsas, `e2e/support/mockApp.js` y encima un PostgREST simulado que respeta `select`, filtros y un máximo de 1000 filas (valor por defecto de Supabase, **sin confirmar** en el proyecto). Intervals y Strava interceptados; el resto de la red externa, abortada. KB = cuerpo JSON sin comprimir; gzip = el mismo cuerpo con gzip nivel 6 (la compresión real puede diferir). Sin latencia de red.

| Perfil | Actividades | Streams | Bienestar |
|--------|------------:|---------|----------:|
| pequeño | 85 (las de los E2E) | 6 actividades de 120 puntos | 61 días |
| **real (provisional)** | 600 a 4/semana | todas, 1 Hz, 30–150 min (media 75), 8 claves + vueltas | 181 días |
| grande | 1500 | como real | 181 días |

El perfil «real» es un **supuesto** hasta ejecutar [`consultas.sql`](consultas.sql).

## S1 · Auto-sync de Intervals — **CONFIRMADA**

Medido primero con `develop` en `f471136` y repetido en `b4c82d9` (éxito y 401): mismo resultado.

**Fuente: simulada.** `e2e/support/mockApp.js` con perfil con credenciales falsas; `intervals.icu` interceptado (respuesta a 150 ms, salvo el caso lento) y toda la red externa abortada. Vite en 5184, a 1440 y 390 px, ventana de 30 s, desarrollo y build de producción. Los hooks, `main.jsx`, el store y `ErrorBoundary` son iguales en `origin/main`.

Build de producción (en desarrollo: 54 en lugar de 53; mismo resultado):

| Caso | Sincronizaciones lanzadas | `upsert` de bienestar | Escrituras en `profiles` | Lecturas de `profiles` | Pantalla de error |
|------|--------------------------:|----------------------:|-------------------------:|-----------------------:|:-----------------:|
| Control: sin credenciales | 0 | 0 | 0 | 1 | no |
| Control: ya sincronizado hoy | 0 | 0 | 0 | 1 | no |
| Éxito | 53 | 106 | 53 | 54 | **sí** |
| Éxito lento (3 s) | 53 | 106 | 53 | 54 | **sí** |
| Intervals responde 401 | 53 | 0 | 0 | 54 | **sí** |
| Falla guardar `wellness_data` (500) | 53 | 53 | 0 | 54 | **sí** |
| Falla guardar `intervals_last_synced` (500) | 53 | 106 | 53 | 54 | **sí** |

- Referencia sana: **1** sincronización. Salen ~53 y todas quedan en vuelo a la vez (2 peticiones a Intervals cada una).
- La app cae a «Vaya, algo se ha roto» con `Maximum update depth exceeded` (React #185). **Eso es lo que corta el bucle**; no hay condición de parada propia.
- Con 61 días simulados son 2 lotes por sincronización. Con 181 días reales serían 4: **unas 212 escrituras** (estimado: 53 × 4).

Tras recargar (build, 8 s más):

| Caso | Sincronizaciones nuevas | Pantalla de error |
|------|------------------------:|:-----------------:|
| Éxito | 0 | no |
| Intervals 401 | 53 | **sí** |
| Falla guardar `wellness_data` | 53 | **sí** |
| Falla guardar `intervals_last_synced` | 53 | **sí** |

Es decir: con éxito, la primera apertura del día rompe la app y al recargar funciona; si la sincronización falla de forma persistente (clave caducada, por ejemplo), la app se rompe en cada apertura.

**No verificado:** comportamiento con la API real de Intervals (límites, CORS) ni con datos reales.

### Causa
1. `useIntervalsAutoSync.js` depende de `profileQuery`, nuevo en cada render, así que el efecto corre en cada render.
2. No hay guarda «en curso» ni marca de «ya intentado».
3. El propio efecto llama a `setUploadState`; `useProfileQuery` consume el store sin selector, así que vuelve a renderizar y a ejecutar el efecto de forma síncrona.

### Propuesta para el `fix` aparte (D3)
- Guarda fuera del render (en curso + intentado hoy, también si falla).
- Quitar `profileQuery` de las dependencias (usar solo `refetch`).
- Comprobar el error del `update` de `intervals_last_synced`.
- Prueba: E2E con credenciales falsas que exija exactamente 1 sincronización en éxito y en 401, sin pantalla de error. La fixture actual tiene las credenciales a `null`, por eso el CI no lo ve.

## Matriz por pantalla (arranque en frío)

Fuente: simulada. «Tareas largas»: suma de tareas > 50 ms en la máquina de medida; varía entre pasadas, solo orientativa.

| Datos | Pantalla | Ancho | Peticiones | KB | KB gzip | Composición (n × consulta) | Tareas largas (ms) |
|---|---|--:|--:|--:|--:|---|--:|
| pequeno | `/` | 1440 | 11 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 2× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 85 |
| pequeno | `/stats` | 1440 | 12 | 179 | 21 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 0 |
| pequeno | `/calendar` | 1440 | 10 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 0 |
| pequeno | `/health` | 1440 | 12 | 179 | 21 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 0 |
| pequeno | `/history` | 1440 | 10 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 0 |
| pequeno | `/activity (reciente)` | 1440 | 6 | 81 | 15 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 67 |
| pequeno | `/activity (antigua)` | 1440 | 6 | 74 | 13 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 0 |
| pequeno | `/profile` | 1440 | 5 | 74 | 13 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| pequeno | `/` | 390 | 11 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 2× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 77 |
| pequeno | `/stats` | 390 | 12 | 179 | 21 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 187 |
| pequeno | `/calendar` | 390 | 10 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 79 |
| pequeno | `/health` | 390 | 12 | 179 | 21 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 86 |
| pequeno | `/history` | 390 | 10 | 144 | 18 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 2200 |
| pequeno | `/activity (reciente)` | 390 | 6 | 81 | 15 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 63 |
| pequeno | `/activity (antigua)` | 390 | 6 | 74 | 13 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 0 |
| pequeno | `/profile` | 390 | 5 | 74 | 13 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| real | `/` | 1440 | 11 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 2× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1892 |
| real | `/stats` | 1440 | 12 | 14 261 | 4 146 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 2270 |
| real | `/calendar` | 1440 | 10 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1476 |
| real | `/health` | 1440 | 12 | 14 261 | 4 146 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 1475 |
| real | `/history` | 1440 | 10 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1469 |
| real | `/activity (reciente)` | 1440 | 6 | 13 872 | 4 154 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 63 |
| real | `/activity (antigua)` | 1440 | 6 | 14 265 | 4 264 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 56 |
| real | `/profile` | 1440 | 5 | 13 775 | 4 124 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| real | `/` | 390 | 11 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 2× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1768 |
| real | `/stats` | 390 | 12 | 14 261 | 4 146 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 2303 |
| real | `/calendar` | 390 | 10 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1848 |
| real | `/health` | 390 | 12 | 14 261 | 4 146 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 6× bienestar 180 d, 1× streams 95 d | 1500 |
| real | `/history` | 390 | 10 | 14 099 | 4 139 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 4× bienestar 180 d, 1× streams 95 d | 1521 |
| real | `/activity (reciente)` | 390 | 6 | 13 872 | 4 154 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 65 |
| real | `/activity (antigua)` | 390 | 6 | 14 265 | 4 264 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 55 |
| real | `/profile` | 390 | 5 | 13 775 | 4 124 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| grande | `/` | 1440 | 9 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d, 2× bienestar último, 2× bienestar 180 d | 193 |
| grande | `/stats` | 1440 | 9 | 14 424 | 4 305 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d, 1× bienestar último, 3× bienestar 180 d | 171 |
| grande | `/calendar` | 1440 | 8 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 2× bienestar 180 d, 1× streams 95 d | 164 |
| grande | `/health` | 1440 | 9 | 14 424 | 4 305 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 3× bienestar 180 d, 1× streams 95 d | 149 |
| grande | `/history` | 1440 | 8 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d, 1× bienestar último, 2× bienestar 180 d | 169 |
| grande | `/activity (reciente)` | 1440 | 5 | 14 181 | 4 294 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| grande | `/activity (antigua)` | 1440 | 6 | 14 376 | 4 351 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 58 |
| grande | `/profile` | 1440 | 5 | 14 181 | 4 294 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| grande | `/` | 390 | 9 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 2× bienestar último, 2× bienestar 180 d, 1× streams 95 d | 81 |
| grande | `/stats` | 390 | 9 | 14 424 | 4 305 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 3× bienestar 180 d, 1× streams 95 d | 82 |
| grande | `/calendar` | 390 | 8 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 2× bienestar 180 d, 1× streams 95 d | 171 |
| grande | `/health` | 390 | 9 | 14 424 | 4 305 | 1× perfil, 1× act. ligera, 2× planificados, 1× bienestar último, 3× bienestar 180 d, 1× streams 95 d | 86 |
| grande | `/history` | 390 | 8 | 14 343 | 4 301 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d, 1× bienestar último, 2× bienestar 180 d | 577 |
| grande | `/activity (reciente)` | 390 | 5 | 14 181 | 4 294 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |
| grande | `/activity (antigua)` | 390 | 6 | 14 376 | 4 351 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 1 act., 1× streams 95 d | 54 |
| grande | `/profile` | 390 | 5 | 14 181 | 4 294 | 1× perfil, 1× act. ligera, 2× planificados, 1× streams 95 d | 0 |

En `grande`, el corte deja 1000 de 1500 filas. En el simulador se quedan las más antiguas, así que faltan las recientes (por eso hay menos peticiones y la actividad reciente no se abre). Sin `order`, el servidor real no garantiza cuáles faltarían.

`/` a 1440 px, perfil real:

| Consulta | Filas | KB | KB gzip |
|----------|------:|---:|--------:|
| `activities` streams 95 días | 55 | 13 166 | 3 869 |
| `activities` ligera | 600 | 608 | 255 |
| `wellness_data *` (4 veces) | 181 | 324 | 14 |
| `planned_workouts *` (2), `profiles *`, bienestar último (2) | — | ~2 | ~1 |

Al cargar `/` se descargan además los trozos de `CalendarPage`, `FitnessStatsPage` y `HealthPage`.

## Composición de las respuestas (perfil real)

| Respuesta | KB | KB gzip |
|-----------|---:|--------:|
| Streams 95 días, completo | 13 165 | 3 871 |
| Solo `time`+`heartrate`+`watts`+`velocity_smooth` | 3 946 | 1 279 |
| Clave `latlng` | 5 164 | 1 322 |
| Clave `distance` | 1 745 | 690 |
| Clave `altitude` | 1 382 | 278 |
| Clave `time` | 1 131 | 187 |
| Claves `heartrate` / `watts` (cada una) | 953 | 170 / 265 |
| Clave `velocity_smooth` | 905 | 211 |
| Clave `cadence` | 716 | 149 |
| Clave `laps` | 209 | 2 |
| Actividades ligera | 608 | 255 |
| …sin `map_polyline` | 223 | 13 |
| …sin `map_polyline` ni columnas sin uso | 138 | 11 |
| Bienestar 181 días, `*` | 81 | 3,6 |
| Bienestar, solo columnas usadas | 34 | 2,1 |

## Flujos (perfil real)

### Cambiar de pestaña (1440 px, tras el arranque)
`/stats`, `/health` y volver a `/`: 1 petición de bienestar cada vez. `/calendar` y `/history`: 0. Recargar repite el arranque completo (12 peticiones): no hay caché persistente.

### S2 · Rango «Todo», alta manual y vuelta

| Actividades | Telemetría al arrancar | «Todo» descarga | Telemetría tras «Todo» | El alta manual vuelve a descargar | Telemetría después | Pedir «Todo» otra vez |
|---:|---|---|---|---|---|---|
| 200 | 55/200 | 35 601 KB (145 act.) | 200/200 | 13 164 KB de streams | **55/201** | no pide nada, sigue 55/201 |
| 300 | 55/300 | 59 589 KB (245 act.) | 300/300 | 13 164 KB de streams | **55/301** | no pide nada, sigue 55/301 |
| 600 | 55/600 | 133 140 KB (545 act.), 40 MB gzip | no leída | — | — | — |

Con 600, el navegador de la prueba se cerró tras recibir la respuesta. Puede ser un límite del banco (respuesta interceptada de ese tamaño): **no se atribuye a la app**. Cada alta manual cuesta 10 peticiones, 7 de ellas de bienestar (6 de 180 días); «Todo» provoca además 3.

### S5 · Sync de Strava con 20 actividades pendientes

| Caso | Peticiones a Strava | Emitidas tras el primer 429 | Actividades guardadas | …con `laps: []` | Peticiones a Supabase asociadas |
|------|--:|--:|--:|--:|---|
| 429 desde la 6.ª petición | 41 | **35** | 2 | 0 | 21 `profiles` (tokens), 20 comprobaciones, 4 bienestar |
| 429 solo en `/laps` | 41 | 38 | 20 | **20** | 21 `profiles`, 20 comprobaciones, 40 bienestar |
| 429 en el listado | 1 | 0 | 0 | 0 | para con error genérico |

Cada actividad guardada provoca 2 recargas de bienestar de 180 días. Las guardadas con `laps: []` no se vuelven a pedir, porque ya tienen `streams_data`.

### S6 · Qué se monta

| Ancho | Ruta | Nodos en el árbol móvil | Nodos en el árbol de escritorio | Árbol visible |
|--:|------|--:|--:|--|
| 1440 | `/` | 23 786 | 274 | escritorio |
| 1440 | `/history` | 23 786 | 450 | escritorio |
| 390 | `/` | 2 015 | 145 | móvil |
| 390 | `/history` | 2 015 | 22 278 | móvil |

El panel de historial (≈ 22 000 nodos) existe siempre en uno de los dos árboles, esté o no visible.

### S7 · `wellness_data` vacía con Intervals configurado y ya sincronizado hoy

| Pantalla | Peticiones del cliente a Intervals | KB |
|----------|--:|--:|
| `/` | 4 | 66 |
| `/stats` | 6 | 100 |
| `/health` | 6 | 100 |

## Uso por columna y clave (lectura de código)

### `activities`
| Columna | Quién la lee |
|---------|--------------|
| `id`, `date`, `type`, `duration`, `distance`, `hr_avg`, `name` | cálculos, listas y detalle |
| `watts_avg` | `tssEngine`, `useFitnessAnalytics` |
| `speed_avg` | `detailUtils`, `fitnessStatsEngine`, `useFitnessAnalytics` |
| `elevation_gain` | `usePMCMetrics`, detalle |
| `calories` | `HistoryList`, `activityMetricsBySport` |
| `strava_id` | `useStravaSync`, detalle, borrado |
| `map_polyline` | **solo detalle** (`ActivityDetailPage`, `MapTab`) |
| `streams_data` | ver tabla siguiente |
| `created_at`, `effort_perceived`, `notes`, `user_id` | sin lector encontrado (`user_id` solo se usa como filtro) |
| `description` | se escribe desde Strava; no se encontró lector para actividades hechas (las lecturas son de entrenos planificados). Confirmar antes de quitarla |

### `streams_data`
| Clave | Cálculos globales (todas las actividades) | Solo detalle |
|-------|-------------------------------------------|--------------|
| `time`, `heartrate`, `watts` | `tssEngine`, `fitnessStatsEngine`, `useFitnessAnalytics`; FC además en `ProfilePage` (detección de umbral) | sí también |
| `velocity_smooth` | `fitnessStatsEngine`, `useFitnessAnalytics` | sí también |
| `latlng`, `altitude`, `distance`, `cadence`, `laps` | — | `useActivityMetrics`, `ActivityCharts`, mapa |

### `wellness_data`
| Columnas | Estado |
|----------|--------|
| `date`, `hrv`, `sleep_secs`, `sleep_score`, `resting_hr`, `weight`, `vo2max`, `readiness`, `steps`, `spo2`, `stress` | usadas |
| `ctl`, `atl` | se copian en `useWellnessData`; lector final sin confirmar |
| `hrv_sdnn`, `body_fat`, `soreness`, `respiration` | llegan a `useWellnessAnalytics` (`latest…`) y **ningún componente las muestra** |
| `avg_sleeping_hr`, `sleep_quality`, `synced_at` | solo se escriben |
| `id`, `user_id`, `source` | sin lector (`useWellnessData` fija el origen a mano) |

### `profiles` y `planned_workouts`
`profiles` se pide con `*`, incluidos `strava_access_token`, `strava_refresh_token` e `intervals_api_key`. El cliente usa hoy los tres. Son 1 fila y menos de 1 KB: el motivo para recortar es de seguridad, no de peso. `planned_workouts` son pocas filas; no merece recorte de columnas.

## Consultas y caché (lectura de código)

| Dato | Dónde | Caché | Observación |
|------|-------|-------|-------------|
| `['profile']` | `useProfileQuery` | `staleTime` infinito | |
| `['activities']` | `useActivitiesQuery` | 30 min | sin `order` ni `range`; los streams se inyectan fuera de la consulta y un refetch los borra |
| `['plannedWorkouts', ajustes]` | `usePlannedWorkoutsQuery` | 5 min | la clave cambia al llegar el perfil: 2 descargas |
| bienestar 180 d | `useWellnessData` (`useEffect`) | ninguna | una por instancia y cada vez que cambian `settings` o las actividades |
| bienestar último | `AdvancedAnalytics` (`useEffect`) | ninguna | una por instancia |
| streams de una actividad | `useStravaSync.fetchActivityStreams` | en `['activities']` | |
| PWA | `vite.config.js` | solo recursos estáticos | sin caché de datos; la caché de react-query vive en memoria |
