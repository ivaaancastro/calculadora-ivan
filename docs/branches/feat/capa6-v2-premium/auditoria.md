# Auditoría del rediseño (2026-11-24)

**Alcance.** Rediseño completo: `6459138..e450aed` (`origin/develop`). Son 218 commits y los PR #50–#139, con +28.418 / −7.127 líneas.

**Método.** Revisión en solo lectura, en cuatro frentes:
- sistema de diseño;
- pantallas y lógica;
- gráficas, rendimiento y accesibilidad;
- proceso y tests.

Además se revisaron las 48 capturas de `e2e/__screenshots__/visual-v2.spec.js`.

**Verificación ejecutada:**
- `lint`, `lint:colors`, `lint:ui`, `lint:motion` y `build` terminan en verde.
- vitest: 62 ficheros y 430 tests, todos en verde.
- E2E: no se ejecutó.

La spec de correcciones, `spec.md`, cita los hallazgos por su ID.

## Fortalezas (se conservan)
- **Páginas partidas:**

  | Página | Líneas antes | Líneas después |
  |---|---|---|
  | `CalendarPage` | 2.353 | 166 |
  | `ActivityDetailPage` | 1.009 | 182 |
  | `HealthPage` | 967 | 204 |

  Los refactors fueron en PR separados del cambio visual.
- **Carga inicial más ligera:** el JS inicial baja de ~298 a ~158 kB gzip, porque `Dashboard` es `lazy` y Recharts ya no entra en la carga inicial.
- **Tokens con una sola fuente:** los JSON generan `tokens.css` y `tailwindTokens.cjs`, con tests de paridad. El trinquete de color ha bajado de 4.988 a 966 infracciones sin una sola subida.
- **Primitivas `ui/` limpias:** sin paleta cruda ni hex, todas con test, y con escala z-index semántica.
- **E2E deterministas:** fecha fija, semilla y Docker igual en local y en CI, con selectores por rol (92 `getByRole` frente a 15 `getByText`).
- **Gráficas:** tema centralizado, `chartA11y` y `useChartMotion`, que respeta `prefers-reduced-motion`.

## Hallazgos

| ID | Sev. | Hallazgo | Evidencia |
|---|---|---|---|
| SEG-1 | Crítica | El secreto de cliente de Strava se compila en el bundle (es anterior al rediseño). | `StravaCallback.jsx:19,46`, `useStravaSync.js:14` (`VITE_STRAVA_CLIENT_SECRET`) |
| BUG-1 | Alta | El readout «Actual» de EvolutionChart muestra el último punto **proyectado**, no el de hoy. El héroe dice CTL 40 / TSB +20 y el gráfico dice 34 / +26. | `EvolutionChart.jsx:73-75`; captura `dashboard-light` |
| BUG-2 | Alta | «8 sesiónes» y una comparación del mes en curso parcial contra el mes anterior completo (−78,1 %). | `monthSummary.js:43,55` |
| BUG-3 | Alta | `toast._or` no existe: TypeError al sincronizar Intervals sin credenciales. | `ProfilePage.jsx:96` |
| BUG-4 | Media | Atributo `data-profile` duplicado (el build lo avisa, el lint no). | `SportZonesSection.jsx:116,156,190` |
| BUG-5 | Media | Coste O(n²) en las posiciones del historial virtualizado. | `HistoryList.jsx:143` |
| BUG-6 | Alta | Umbrales de TSB distintos según la pantalla: con TSB 6, Dashboard dice «Pico de forma» y Rendimiento «Equilibrado». | `formSummary.js:15-22`, `statsNarrative.js:19-30`, `AdvancedAnalytics.jsx:134-141` |
| BUG-7 | Media | Fechas `YYYY-MM-DD` interpretadas en UTC, lo que desplaza el primer o el último día del mes. | `monthSummary.js:4-7`, `calendarLoad.js:4` |
| BUG-8 | Media | «Junio De 2026», porque `capitalize` pone en mayúscula cada palabra. | `CalendarPage.jsx:61` |
| BUG-9 | Media | «Progreso Plan 195/0» con la barra llena cuando no hay plan. | `CalendarMonthView.jsx:142` |
| BUG-10 | Media | En móvil, «HOY» y «PROYECCIÓN» se solapan en el gráfico. | `EvolutionChart.jsx:231,240`; captura `dashboard-dark` móvil |
| BUG-11 | Baja | Keys por índice en fichas que se arrastran. | `CalendarMonthView.jsx:291`, `AdvancedAnalytics.jsx:289,294` |
| BUG-12 | Baja | La sparkline semanal se salta las semanas sin actividad (confianza media). | `activityGroups.js:32` |
| COP-1 | Media | Separador decimal mezclado (19,1 frente a 0.38) y nombres distintos para la misma métrica (Fitness / Aptitud / CTL, Ramp / Rampa, Ride / Run). | capturas de dashboard, calendario y actividades |
| COP-2 | Media | VO₂max aparece con 3 valores (65,2 / 53,8 / 52,0) sin decir de dónde sale cada uno. | `AdvancedAnalytics`, `Vo2MaxCard`, `BiomarkersGridV2` |
| A11Y-1 | Alta | 362 textos de menos de 11 px (RF8); en v2 la piel solo los sube a 10 px; ejes de gráficas a 9 px. | `tokens.css:894-895`, `skin-v2.css:637`, `EvolutionChart.jsx:202…` |
| A11Y-2 | Alta | `InfoTooltip` es un `div onClick` que solo se abre con hover y tiene un icono de 11 px (14 usos). | `InfoTooltip.jsx:31`, `infoTooltipClasses.js:9` |
| A11Y-3 | Alta | Campos `cell` con `outline-none` y sin anillo de foco; además, el anillo de v2 excluye los inputs. | `fieldClasses.js:30-31,44-45`, `skin-v2.css:1048` |
| A11Y-4 | Media | Botones de solo icono sin nombre accesible y filas que no se pueden usar con teclado. | `PmcFloatingChart.jsx:140`, `WorkoutViewerModal.jsx:69`, `AuthModal.jsx:124`, `HistoryList.jsx:253` |
| A11Y-5 | Media | 8 de 11 gráficas sin alternativa textual. | `ActivityCharts`, `PowerProfileCard`, `WeeklyVolumeAndFocusCard`… |
| PERF-1 | Media | Cada `mousemove` re-renderiza el detalle entero (5 AreaChart y el mapa), sin throttle ni memo. | `ActivityDetailPage.jsx:65` |
| PERF-2 | Baja | El precache de la PWA (1,7 MB) incluye recharts y leaflet; los iconos no están comprimidos. | `vite.config.js` (workbox por defecto) |
| DUP-1 | Media | Hay dos `formatDuration` con **unidades distintas** (segundos y minutos), además de `formatMinutes` y otros dos formateos sueltos. | `formatters.js:8`, `formatDuration.ts:9`, `monthSummary.js:12`, `CalendarMonthView.jsx:53`, `fitnessStatsEngine.ts:373` |
| DUP-2 | Media | Clasificación de deporte con `includes('run')` en 8 sitios y dos `getSportIcon`. | `activityGroups.js:53`, `HistoryList.jsx:32`, `calendarHelpers.jsx:25`… |
| DUP-3 | Baja | `toLocaleDateString('en-CA')` repetido 24 veces y dos `const key` iguales. | `calendarLoad.js:4`, `monthSummary.js:4` |
| DUP-4 | Media | 5 pistas casi idénticas en `ActivityCharts` y configuración de ejes copiada a mano en cada gráfica (9, 10 u 11 px). | `ActivityCharts.jsx` |
| DUP-5 | Media | 7 héroes con el mismo patrón y 3 implementaciones del delta; ninguno usa `ui/Stat`. | `FormHero`, `MonthHero`, `StatsHero`, `HealthHero`, `KpiCard`… |
| DUP-6 | Baja | `dashboard/EmptyState` duplica `ui/EmptyState`; `EmptyState` y `ErrorState` son casi iguales. | `Dashboard.jsx:13` |
| ARQ-1 | Media | Capas invertidas: `utils` importa de `components`, `hooks` importa de `components` y `useCountUp` vive en `components/health`. | `calendarLoad.js:2`, `useSwipeNavigation.js`, `useCountUp.js` |
| ARQ-2 | Media | Código muerto: `FuelingPanel` (304 líneas, recibió 6 commits de migración), `ChartsSection` y `usePlanner`; `parser.ts` y `services/ai.ts` solo tienen tests. | grep sin importadores |
| ARQ-3 | Alta | Conviven v1 y v2: 84 `isV2` en 24 ficheros, 7 `*V2.jsx` y una piel que redefine utilidades de Tailwind (`.text-xs`, `[class*=…]`). Esperado hasta la Capa 6 (D12). | `skin-v2.css:26-95,544-560` |
| PRO-1 | Alta | La prueba de layout, shell y touch solo corre en v1 y no detecta solapes entre bloques. | `e2e/layout.spec.js` (`setupApp` sin `ui`) |
| PRO-2 | Media | RF3: +1.734 líneas en hooks y utils dentro de PR visuales sin excepción declarada. | specs `premium-*` |
| PRO-3 | Media | Specs `premium-*` marcadas como «pendiente de aprobación» con todo mergeado, y casillas de capturas marcadas tras revisar solo 1 de 6. | `premium-salud/{spec,tasks}.md`… |
| PRO-4 | Media | `AGENTS` y `MEMORY` sin extensión duplican los `.md`, con contenido desfasado; el job `validate-specs` depende de ellos. | `ci.yml:47-52` |
| PRO-5 | Baja | Ratchets parciales: el de animación es un total global; no hay lint de tamaño de texto ni umbral de cobertura. | `scripts/check-motion.mjs` |
| PRO-6 | Baja | 34 % de los PR por encima de 400 líneas, y 16 MB de capturas en el árbol (unos 69 MB en el historial). | `gh pr list` |
