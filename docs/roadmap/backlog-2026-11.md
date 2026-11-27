# Backlog 2026-11 — Tablero de seguimiento

Lo mantiene la sesión PM. Última actualización: 2026-11-27.
Base auditada: `develop` @ `cb595b8` (igual que `main` salvo el merge de la release #165). Auditoría por lectura de código, sin ejecutar la app.

**Estados:** Pendiente · Brainstorming · Spec (en redacción) · Por aprobar · Implementando · En revisión (PR) · En `develop` · Bloqueado.

## Tablero

| Bloque | Oleada | Depende de | Estado | Rama | PR | Sesión |
|--------|--------|-----------|--------|------|----|--------|
| B1 Cálculos centralizados | 1 | — | Pendiente | `feat/calculos-centralizados` (prevista) | — | — |
| B3 Tema | 1 | — | Pendiente | `feat/tema-sistema` (prevista) | — | — |
| B5 Popovers de información | 1 | código: tras B1 | Pendiente | `feat/popovers-info` (prevista) | — | — |
| B8a Auditoría de datos | 1 | — | Pendiente | `docs/auditoria-datos` (prevista) | — | — |
| B2 Detalle de actividad | 2 | B1, B5 (y B3 por el mapa) | Bloqueado | — | — | — |
| B4 Calendario | 2 | B1, B5 | Bloqueado | — | — | — |
| B7 Modo por deporte | 3 | B1 + brainstorming | Bloqueado | — | — | — |
| B6 Lenguaje y no repetir | 3 | B1, B2, B7 | Bloqueado | — | — | — |
| B8b Sincronización Strava | 4 | B8a | Bloqueado | — | — | — |
| B9 Integraciones de salud (investigación) | 4 | — | Pendiente | — | — | — |
| B10 Marca, iOS y marketing | 5 | B9 (iOS) | Bloqueado | — | — | — |

## Estado actual por bloque

### B1 Cálculos centralizados
- **Existe:** `calculatePMC` y `calculateActivityTSS` (`src/utils/tssEngine.ts`), tabla de estados `formState.js`, tarjetas `TrainingBalanceCard` (3 categorías tipo Garmin) y `WeeklyVolumeAndFocusCard`.
- **Discrepancias:**
  - Segundo «TSB» en Rendimiento (`fitnessStatsEngine.ts` `getTrainingStatus`, medias de 28 y 7 días).
  - CTL, ATL y TSB se redondean por separado: pueden no cuadrar en pantalla.
  - Salud toma el último punto de la serie (hoy + 7), no hoy (`useWellnessInfo.js`).
  - El Calendario usa la serie filtrada por el rango del Dashboard y otra fórmula de proyección (`calendarEngine.js` `projectPmc`).
  - Fechas UTC en el PMC y locales en el Calendario.
  - El TSS cambia cuando llegan los streams o el histórico.
  - Tres rampas, cargas semanales con criterios distintos, zonas copiadas en varios sitios y con huecos.
  - El balance aeróbico asigna todo el TSS de una sesión a una sola categoría.
- **Falta:** módulo único de zonas y carga, convención hoy/ayer documentada, tests de ATL/TSB, redondeo, TSS por stream, hrTSS y tiempo en zonas.

### B3 Tema
- **Existe:** `useTheme` y el pre-pintado leen `prefers-color-scheme` si no hay preferencia guardada; `mapTiles.js` tiene tiles claros y oscuros.
- **Falta:** reaccionar a cambios del sistema, volver a «Sistema» tras tocar el interruptor, mapa según el tema (`ActivityMap.jsx` arranca en claro), `theme-color` por tema.

### B5 Popovers de información
- **Existe:** dos componentes, `ui/InfoTooltip` y `ui/MetricTooltip`, además de varios `title=` nativos.
- **Falta:** un solo componente con portal y colisiones, animación de salida, foco y móvil. Pendiente decidir si entran los tooltips de gráfica.

### B8a Auditoría de datos (primera pasada, sin medir)
1. Posible bucle de auto-sync de Intervals (`useIntervalsAutoSync.js`: depende de `profileQuery`, sin guarda).
2. Streams de 95 días descargados al arrancar; un refetch borra los históricos.
3. `wellness_data select('*')` de 180 días repetido y sin caché.
4. `activities` sin paginar (posible corte a 1.000 filas) y `profiles select('*')` con tokens.
5. Deep sync secuencial tras cada sync de Strava, sin parar con 429.

### B2 Detalle de actividad
- **Existe:** cursor sincronizado entre gráficas y de gráfica a mapa; zonas en la pestaña Detalle (`DataTab.jsx`).
- **Falta:** gráficas antes de Impacto y Coach, quitar la pestaña, zoom arrastrando y pellizco (hoy `ZoomRange`), sincronía de mapa a gráfica, día abreviado.

### B4 Calendario
- **Existe:** heatmap con título y leyenda Menos/Más.
- **Falta:** quitar el botón Forma (`CalendarPage.jsx`) y `PmcFloatingChart`; unidad, escala, meses y tooltip del heatmap; utilidad de fecha corta en `utils/dates.js`.

### B7 Modo por deporte
- **Existe:** piezas de detección de deporte (`utils/sport.js`, reparto por deporte).
- **Falta:** ajuste de deporte principal, detección y adaptación de TSS y métricas.

### B6 Lenguaje y no repetir
- **Existe:** `activityMetricDescriptions.js` (solo detalle) y `e2e/metrics.spec.js` (una vez por pantalla).
- **Falta:** glosario único (CTL, ATL, TSB, VFC…), inventario entre pantallas; «Forma» y «Carga» significan varias cosas.

### B8b Sincronización Strava
- **Existe:** sync manual con botón en cabecera; canje de token en Edge Function.
- **Falta:** webhooks, sync en servidor, «Última sincronización», deslizar para recargar, cabeceras de límite y backoff.
- **A confirmar:** `MEMORY.md` anota que Strava se replantea por sus límites de API.

### B9 Integraciones de salud
- **Existe:** sueño, VFC, FC en reposo, peso, VO2max, pasos y SpO2 vía intervals.icu a `wellness_data`. Sin integración directa. `intervals-proxy` desplegable pero sin llamadas desde `src`.
- **Aviso:** sin datos reales, Salud muestra datos simulados (`useWellnessData.js`).

### B10 Marca, iOS y marketing
- **Existe:** PWA instalable, iconos y favicon.
- **Falta:** identidad única (favicon y icono PWA no coinciden), logo en cabecera, `og:image`, `robots.txt`, Capacitor o iOS.

## Plan de la Oleada 1 (pendiente de OK)

Cada sesión usa su worktree desde `origin/develop` y redacta `spec.md` y `plan.md`. Sin aprobación no hay `tasks.md` ni código.

| Sesión | Escribe | No toca | Puerto dev / E2E |
|--------|---------|---------|------------------|
| B1 | `src/utils/{tssEngine,fitnessStatsEngine,calendarEngine,calendarLoad,pmcPoints,formState,formSummary,statsNarrative,kpiTrend,monthSummary,activityGroups,dates,calendarTemplates}`, nuevos `zones`/`load`; hooks de métricas y queries; `store`; `components/fitness/*`; consumidores en `dashboard/`, `calendar/`, `pages/`, `health/`; sus tests; `e2e/stats`, `e2e/metrics`, `mockApp` | tema, tooltips, `tokens.css` | 5181 / 5281 |
| B3 | `useTheme.js`, `index.html`, `vite.config.js`, `Navbar.jsx`, `activity/{ActivityMap.jsx,mapTiles.js}`, ajuste en Perfil si se aprueba; `e2e/layout`, `e2e/detail-map` | `src/utils` de métricas, tarjetas | 5182 / 5282 |
| B8a | `docs/branches/docs/auditoria-datos/` (solo documentos; scripts de medida en scratchpad) | `src/` | 5184 / — |
| B5 | `components/ui/*Tooltip*` y componente nuevo, llamadas en `fitness/*`, `detail/DetailHero`, `title=` informativos, `tokens.css`, sus tests, `e2e/mobile` | motores de cálculo | 5183 / 5283 |

**Orden de código:** B1, B3 y B8a en paralelo. B5 redacta su spec a la vez e implementa cuando B1 esté en `develop` (comparten las tarjetas de Rendimiento y `CalendarMonthView`).
**Merges:** de uno en uno. Antes de cada PR, la sesión actualiza su rama con `develop` y solo entonces añade su entrada en `CHANGELOG.md` y `MEMORY.md`. La sesión PM revisa diff, CI y navegador antes de mergear. Nunca a `main`.

## Decisiones

| # | Decisión | Recomendación | Estado |
|---|----------|---------------|--------|
| D1 | TSB «hoy» (CTL−ATL tras la actividad del día) o «ayer» (estilo TrainingPeaks) | Hoy; redondear CTL y ATL y restar los enteros | Pendiente |
| D2 | ¿Los tooltips de gráfica entran en B5? | No: B5 cubre información; las gráficas, en B2 | Pendiente |
| D3 | Posible bucle de auto-sync de Intervals | Que B8a lo mida primero y, si se confirma, `fix` propio | Pendiente |
