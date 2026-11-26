# Spec: Detalle de actividad distinto según el deporte

## 1. Identificación
- **ID:** spec-detalle-por-deporte
- **Título:** El detalle de actividad muestra resumen, pestañas y bloques distintos según el deporte
- **Autor:** agente forma (Claude Code)
- **Fecha:** 2026-11-18
- **Estado:** implementada
- **Rama:** `feat/detalle-por-deporte` (sale de `feat/tarjetas-explicativas-detalle`, PR #101; el PR de esta tarea va después de #101 o se rebasa sobre `develop` cuando se mergee)

## 2. Objetivo
Que el detalle de una actividad deje de ser el mismo para todos los deportes: el resumen superior, las pestañas, los bloques de Análisis/Detalle y las zonas se adaptan a bici, carrera, senderismo/caminata, fuerza y «genérico», mostrando solo lo que tiene sentido (y tiene dato) en cada uno; y la carrera gana zonas de ritmo.

## 3. Contexto y justificación
Hoy `ActivityDetailPage` pinta lo mismo para todo: un ciclista y una sesión de fuerza ven ClimbPro, IF/NP, perfil metabólico basado en IF, mapa, etc. Resultado: bloques vacíos o sin sentido (ClimbPro en gimnasio, «Intensidad IF» a 0 en carrera) y el senderismo enseña velocidad en vez de ritmo.

**Hallazgos del código (verificados, no supuestos):**
1. **Reconocimiento de deporte.** `activity.type` es texto libre. Strava solo traduce `Run/Ride/WeightTraining/Walk/Swim` (`translateStravaType`, `useStravaSync.js:162`); el resto llega **en inglés sin traducir** (`Hike`, `TrailRun`, `VirtualRide`, `EBikeRide`, `Workout`, `Yoga`, `Rowing`…). El alta manual ofrece `Carrera, Ciclismo, Fuerza, Caminata, Natación`. Hay además tres detecciones ya duplicadas: `useActivityMetrics.isPaceBased` (carrera/caminata; **no** incluye senderismo), `getSportTheme` en `detailUtils.js` y `getSportCategory` en `tssEngine.ts`.
2. **Borrador wip (`wip/detalle-por-deporte`).** Útil: la idea de `detectSportType`, `METRIC_IDS_BY_SPORT`, `buildMetricDefs` y `getMetricsForSport` como funciones puras. Defectos a corregir al reutilizarlo: su detector de bici no reconoce `Ride`/`VirtualRide` (su propio test usa `type: 'Ride'` y devolvería `default`), no reconoce `WeightTraining`, mete Carga en el genérico, no cubre Mapa/Intervalos/ClimbPro/zonas, y renderiza vía estructura anterior del detalle (no se mergea; se reescribe sobre la estructura actual).
3. **Kcal.** `activity.calories` existe en BD y se pide en `LIGHT_COLS`. Strava lo rellena con `act.kilojoules || act.calories || 0`, es decir: en bici es el trabajo en kJ guardado como kcal (equivalencia ≈1:1 en ciclismo, aproximación aceptada; se anota, no se corrige aquí). En actividades manuales vale `0` (`AddActivityModal`). Hoy el detalle **no muestra Kcal** en ningún sitio; `activityMetricDescriptions.js` no tiene entrada `kcal` (hay que añadirla).
4. **Series.** **`series_count` no existe en ningún sitio del repositorio** (ni BD, ni sincronización, ni formulario, ni tipos). El borrador lo asumía. Strava no da series en el resumen de actividades. → Ver decisión D1.
5. **Zonas de ritmo ya calculadas a medias.** `exactPacePowerZoneAnalysis` (`useActivityMetrics.js:~49`) ya calcula zonas de ritmo para carrera, pero (a) usa porcentajes duplicados a mano en vez de `calcPaceZones` (`profile/zonesCalc.js`, fuente única que usa Perfil), (b) `settings.run.paceZones` solo se usa como «existe/no existe», (c) `zoneType` está fijo en `'hr'` (`ActivityDetailPage.jsx:20`, `_setZoneType` sin uso), así que nunca se ve. En bici, ese mismo memo da zonas de potencia respecto a `settings.bike.ftp` (también ocultas hoy).
6. **Datos disponibles por actividad** (`activity` ligero): `type, date, duration (min), distance (m), elevation_gain, hr_avg, calories, watts_avg, speed_avg (m/s), tss, map_polyline, strava_id, name`. De `streams_data` (carga diferida): `time, heartrate, watts, cadence, altitude, distance, velocity_smooth, latlng`. De `useActivityMetrics`: `proMetrics {cadenceAvg, decouplingObj, efObj, autoLaps, avgWatts, maxWatts, npWatts, vi, ifFactor, workKj, powerCurve, climbPro}`, `exactZoneAnalysis` (FC), `exactPacePowerZoneAnalysis`, `trainingEffect`, `fitnessAnalysis`, `chartData`, `maxHr`. Cualquier métrica «sin dato» ya llega a 0/null: la regla 7 se cumple filtrando por valor.
7. **Dónde viven hoy los bloques.** Resumen: `DetailHeader.jsx` (escritorio) y `DetailMobileHero.jsx` (móvil), con la lista de `Stat` duplicada en ambos. Pestañas: array duplicado en `DetailHeader.jsx` (escritorio `Segmented` y móvil cuadrícula de 4 columnas). Análisis: `TelemetryPanel` (Picos), `ActivityCharts` (velocidad/ritmo, FC, potencia, altitud, cadencia), `AnalysisSidebar` (mapa + Impacto + Coach Insights). Detalle: `DataTab` (zonas, ClimbPro, Perfil metabólico, Métricas de eficiencia IF/VI/EF, Hitos con curva de potencia, Recuperación).

## 4. Requisitos funcionales

### RF1 — Detección de deporte (una sola fuente)
- [ ] Nueva función pura `detectSportType(activityType)` en `src/utils/activityMetricsBySport.js` que devuelve `'bike' | 'run' | 'hike' | 'strength' | 'generic'` (la caminata se agrupa con senderismo en `'hike'`; no hay clave `walk` aparte, ya que ambos se comportan igual).
- [ ] Reconoce por subcadena, sin distinguir mayúsculas ni tildes: **bici** = `bici, bike, ciclismo, ride` (cubre `Ride`, `VirtualRide`, `EBikeRide`, `MountainBikeRide`, «Ciclismo»); **carrera** = `carrera, run, correr` (cubre `TrailRun`); **senderismo/caminata** = `senderismo, montaña, trekking, hike, caminata, walk, andar`; **fuerza** = `fuerza, gym, weighttraining, crossfit`; todo lo demás (`Natación`, `Swim`, `Rowing`, `Yoga`, `Workout`, desconocido, `null`, vacío) = **genérico**.
- [ ] Orden de evaluación fijo y documentado para evitar solapes (p. ej. «Trail Run» → carrera; «Ride» ≠ «Hiking»).
- [ ] `isPaceBased` (en `useActivityMetrics`), `getSportTheme` (`detailUtils.js`) y los condicionales del detalle pasan a apoyarse en `detectSportType` para eliminar la detección duplicada en el detalle. `getSportCategory` de `tssEngine.ts` (motor de carga) **no se toca**.
- [ ] `isPaceBased` pasa a ser verdadero para carrera **y** senderismo/caminata (hoy el senderismo cae fuera y muestra velocidad).

### RF2 — Resumen superior por deporte
- [ ] Una sola definición de las métricas del resumen (`getMetricsForSport(...)` pura, derivada del borrador) consumida por `DetailHeader` (escritorio) y `DetailMobileHero` (móvil), eliminando la lista duplicada.
- [ ] **Kcal totales** (`activity.calories`) aparece en todos los deportes **cuando `calories > 0`** (regla 7: las métricas sin dato no se muestran; las actividades manuales con 0 no enseñan «0 kcal»). Se añade `kcal` a `activityMetricDescriptions.js` con su tarjeta explicativa (MetricTooltip).
- [ ] Toda métrica sin dato (valor 0/null/NaN) no se renderiza, en todos los deportes.
- [ ] **Bici:** Kcal, Carga, IF, NP, Trabajo, W media, FC media, Vel. media, Cadencia, Distancia, Tiempo, Desnivel, EF, Drift.
- [ ] **Carrera:** Kcal, FC media, Ritmo, Cadencia (ppm), Distancia, Tiempo, Desnivel, Carga, **Drift**. **Sin EF** y **sin** IF, NP, Trabajo ni W media.
- [ ] **Senderismo/caminata:** Kcal, FC media, **Ritmo** (no velocidad), Distancia, Tiempo, Desnivel y Carga (si hay dato). Sin ClimbPro, sin cadencia ni Drift.
- [ ] **Fuerza:** Kcal, Tiempo, FC media y Carga (si hay dato). **Sin Series** (el dato no existe; D1). Sin distancia, desnivel ni ritmo/velocidad.
- [ ] **Genérico:** versión simplificada del resumen de hoy: Kcal, Distancia, Tiempo, Desnivel, FC media, Velocidad media y Carga (todas si hay dato); sin bloques de potencia ni específicos.
- [ ] Cada `Stat` conserva su `MetricTooltip` (PR #101) con el `metricId` correcto (`pace` vs `speed`, etc.).

### RF3 — Pestañas por deporte
- [ ] Las pestañas se derivan de una función pura `getTabsForSport(sport, { hasGps })` usada por la barra de escritorio y la de móvil (un único origen; hoy duplicadas). La barra móvil ajusta sus columnas al número de pestañas visibles (4 o 3, nunca huecos).
- [ ] **Fuerza:** sin pestaña **Mapa** y sin **Intervalos** (quedan Análisis y Detalle).
- [ ] Mapa solo se ofrece si el deporte lo admite **y** hay datos GPS (`map_polyline` o `streams.latlng`); sin GPS la pestaña se oculta en cualquier deporte (D5).
- [ ] Si la pestaña activa desaparece (p. ej. al cambiar de actividad), el detalle vuelve a `analyze`.
- [ ] En fuerza, la barra lateral de Análisis no pinta el mapa; en móvil el hero no pinta el mapa.

### RF4 — ClimbPro solo en bici
- [ ] El bloque «Análisis de Ascensiones (ClimbPro)» de `DataTab.jsx` solo se renderiza si el deporte es bici. No aparece en carrera, senderismo/caminata, fuerza ni genérico. (Opcionalmente `proMetrics.climbPro` ni se calcula fuera de bici; ver plan T4.)

### RF5 — Bloques de Análisis y Detalle por deporte
Se implementan según la **matriz de la sección 5**. Reglas transversales:
- [ ] Impacto del entrenamiento y Coach Insights se muestran en todos los deportes cuando hay dato (`trainingEffect`/`fitnessAnalysis` no nulos).
- [ ] Perfil metabólico: bici (base IF, como hoy), carrera y senderismo/caminata (base **% de FC máx./umbral**, D6; nunca «0 % carbos»). Oculto en fuerza y genérico.
- [ ] «Métricas de eficiencia» (IF, VI, EF): solo bici; en el resto se oculta.
- [ ] «Estado de recuperación» (bloque fijo «~24H») se oculta en todos los deportes (D7).
- [ ] «Hitos de la sesión» con curva de potencia: solo bici; FC máxima en todos los que tengan FC.
- [ ] Gráficas de Análisis: potencia solo en bici; cadencia en bici y carrera; altitud donde haya altitud/GPS; FC donde haya FC; velocidad/ritmo según deporte (ritmo en carrera y senderismo, velocidad en bici y genérico).
- [ ] Picos (`TelemetryPanel`): FC en todos con FC; W solo bici; velocidad en bici/genérico, ritmo en carrera/senderismo; Cima (altitud) donde haya altitud.

### RF6 — Zonas de ritmo en carrera (pestaña Detalle)
- [ ] La pestaña Detalle ofrece un **selector** (Segmented) de tipo de zonas. Opciones por deporte: **bici** → FC / Potencia; **carrera** → FC / Ritmo; resto con FC → solo FC (sin selector). Por defecto FC.
- [ ] Las zonas de ritmo se calculan con **`calcPaceZones(settings.run.thresholdPace)`** de `profile/zonesCalc.js` (fuente única, la misma que Perfil), sustituyendo los porcentajes duplicados en `useActivityMetrics`. Si el usuario no tiene `thresholdPace`, se usa el valor por defecto que ya usa Perfil (`'4:30'`) y se muestra un aviso «usando ritmo umbral por defecto, ajústalo en Perfil».
- [ ] Cada zona muestra etiqueta (Z1…Z7), minutos, % y **rango de ritmo** (min/km), como Strava; el gráfico y la lista usan los mismos colores de zona.
- [ ] Las zonas de ritmo solo cuentan puntos con velocidad válida (descarta paradas, ya hay umbral `vel < 0.2`).
- [ ] Sin `streams.velocity_smooth` o sin ajustes, la opción «Ritmo» no se ofrece (no se muestra un gráfico vacío).
- [ ] Ajustes: los umbrales se editan donde ya se editan (Perfil → Zonas de carrera). Esta spec **no** crea pantalla de ajustes nueva.
- [ ] Bici: se activa el gráfico de potencia (ya calculado respecto a `settings.bike.ftp`) como segunda opción del mismo selector.

### RF7 — Contratos y no regresiones
- [ ] Vista genérica = la de hoy simplificada: sin ClimbPro, sin bloques de potencia/IF/EF ni perfil metabólico (salvo que D6/M-Meta lo cambie).
- [ ] Todo estilo nuevo va bajo `html[data-ui="v2"]`; **v1 congelado**: style-diff = 0 sobre las capturas v1 existentes del detalle (la lógica de visibilidad no cambia píxeles de v1 para una actividad de carrera/bici con los mismos datos, salvo los bloques que esta spec oculta por deporte; ver riesgo R3).
- [ ] Sin cambios de BD ni de la sincronización de Strava.

## 5. Matriz deporte × bloque

Leyenda: ✔ se muestra (si hay dato) · ✗ no se muestra. Todas las celdas dudosas (antes ⚠) están **decididas** por el usuario (ver §5.5 y §10).
Columnas: **Bici · Carrera · Senderismo/Caminata · Fuerza · Genérico**.

### 5.1 Resumen superior (escritorio y móvil)
| Bloque | Bici | Carrera | Sender./Camin. | Fuerza | Genérico |
|---|---|---|---|---|---|
| Kcal totales | ✔ | ✔ | ✔ | ✔ | ✔ |
| Tiempo | ✔ | ✔ | ✔ | ✔ | ✔ |
| Distancia | ✔ | ✔ | ✔ | ✗ | ✔ |
| Desnivel | ✔ | ✔ | ✔ | ✗ | ✔ si hay dato |
| FC media | ✔ | ✔ | ✔ | ✔ | ✔ |
| Velocidad media | ✔ | ✗ | ✗ | ✗ | ✔ |
| Ritmo medio | ✗ | ✔ | ✔ | ✗ | ✗ |
| Carga (TSS) | ✔ | ✔ | ✔ si hay dato | ✔ si hay dato | ✔ si hay dato |
| IF · NP · Trabajo · W media | ✔ | ✗ | ✗ | ✗ | ✗ |
| Cadencia | ✔ (rpm) | ✔ (ppm) | ✗ | ✗ | ✗ |
| EF | ✔ | ✗ | ✗ | ✗ | ✗ |
| Drift | ✔ | ✔ | ✗ (en terreno variable engaña) | ✗ | ✗ |
| Series | ✗ | ✗ | ✗ | ✗ (fuera de alcance, D1) | ✗ |

### 5.2 Pestañas
| Pestaña | Bici | Carrera | Sender./Camin. | Fuerza | Genérico |
|---|---|---|---|---|---|
| Análisis | ✔ | ✔ | ✔ | ✔ | ✔ |
| Mapa | ✔ si hay GPS | ✔ si hay GPS | ✔ si hay GPS | ✗ | ✔ si hay GPS |
| Intervalos | ✔ | ✔ | ✔ | ✗ | ✔ si hay datos de ritmo/velocidad |
| Detalle | ✔ | ✔ | ✔ | ✔ | ✔ |

### 5.3 Pestaña Análisis
| Bloque | Bici | Carrera | Sender./Camin. | Fuerza | Genérico |
|---|---|---|---|---|---|
| Mapa en barra lateral / hero móvil | ✔ si GPS | ✔ si GPS | ✔ si GPS | ✗ | ✔ si GPS |
| Pico FC | ✔ | ✔ | ✔ | ✔ | ✔ |
| Pico W | ✔ | ✗ | ✗ | ✗ | ✗ |
| Pico velocidad / ritmo | ✔ vel. | ✔ ritmo | ✔ ritmo | ✗ | ✔ vel. |
| Pico altitud (Cima) | ✔ | ✔ | ✔ | ✗ | ✔ si hay altitud |
| Gráfica velocidad / ritmo | ✔ vel. | ✔ ritmo | ✔ ritmo | ✗ | ✔ vel. |
| Gráfica FC | ✔ | ✔ | ✔ | ✔ | ✔ |
| Gráfica potencia | ✔ | ✗ | ✗ | ✗ | ✗ |
| Gráfica cadencia | ✔ | ✔ | ✗ | ✗ | ✗ |
| Gráfica altitud | ✔ | ✔ | ✔ | ✗ | ✔ si hay altitud |
| Impacto del entrenamiento | ✔ | ✔ | ✔ | ✔ | ✔ |
| Coach Insights | ✔ | ✔ | ✔ | ✔ | ✔ |

### 5.4 Pestaña Detalle
| Bloque | Bici | Carrera | Sender./Camin. | Fuerza | Genérico |
|---|---|---|---|---|---|
| Zonas FC | ✔ | ✔ | ✔ | ✔ | ✔ |
| Zonas de potencia | ✔ | ✗ | ✗ | ✗ | ✗ |
| Zonas de ritmo | ✗ | ✔ | ✗ | ✗ | ✗ |
| ClimbPro | ✔ | ✗ | ✗ | ✗ | ✗ |
| Perfil metabólico | ✔ (por IF) | ✔ (por FC) | ✔ (por FC) | ✗ | ✗ |
| Métricas de eficiencia (IF/VI/EF) | ✔ | ✗ | ✗ | ✗ | ✗ |
| Hitos (curva de potencia) + FC máx. | ✔ | solo FC máx. | solo FC máx. | solo FC máx. | solo FC máx. |
| Estado de recuperación | ✗ | ✗ | ✗ | ✗ | ✗ (oculto hasta que sea un cálculo real) |

### 5.5 Celdas dudosas: decididas (usuario, 2026-11-18, «ok con todas las propuestas»)
M1 Carga: ✔ si hay dato en senderismo, fuerza y genérico · M2 Cadencia: ✗ en senderismo/caminata · M3 Drift: ✗ en senderismo/caminata · M4 Genérico: Mapa si hay GPS e Intervalos si hay datos · M5 Desnivel en genérico: ✔ si hay dato · M6 Zonas de ritmo: ✗ en senderismo/caminata · M7 Perfil metabólico: ✗ en genérico · M8 Estado de recuperación: oculto en todos hasta que sea un cálculo real · M9 Mapa sin GPS: pestaña oculta.

## 6. Criterios de aceptación
- [ ] `detectSportType` clasifica correctamente los tipos reales de Strava y del alta manual (tabla de casos en las pruebas), incluidos `Ride`, `VirtualRide`, `Hike`, `TrailRun`, `WeightTraining`, `Swim`, `Yoga`, `null`.
- [ ] Una actividad de **bici** con potencia ve el bloque completo (Carga, IF, NP, Trabajo, W, cadencia, EF, Drift), gráfica de potencia, ClimbPro, zonas de potencia y FC.
- [ ] Una actividad de **carrera** no muestra EF, IF, NP, Trabajo, W media, ClimbPro, ni gráfica de potencia; sí Drift, ritmo, cadencia en ppm y zonas de ritmo con rangos min/km.
- [ ] Una actividad de **senderismo/caminata** muestra Ritmo (no velocidad) y no muestra ClimbPro.
- [ ] Una actividad de **fuerza** no tiene pestañas Mapa ni Intervalos, ni mapa en la barra lateral ni en el hero móvil; el resumen es Kcal, Tiempo, FC (y ).
- [ ] Un deporte **genérico** (natación) muestra la vista simplificada sin ClimbPro ni bloques de potencia.
- [ ] Kcal aparece en todos los deportes con `calories > 0`; con `calories = 0` no aparece; ninguna métrica sin dato se renderiza.
- [ ] El selector de zonas FC/Ritmo funciona en carrera, FC/Potencia en bici, y no aparece donde solo hay FC. Las zonas de ritmo usan `calcPaceZones` y respetan `settings.run.thresholdPace`.
- [ ] Móvil: la barra de pestañas se adapta a 3 o 4 pestañas sin huecos; objetivos táctiles ≥ 44 px (se mantiene lo de PR #99).
- [ ] `npm run lint`, `npm test`, `npm run build`, type-check en verde; style-diff v1 = 0.
- [ ] La implementación coincide celda a celda con la matriz de la §5 (ya sin celdas dudosas).

## 7. Diseño técnico
- **Utilidades (nuevo):** `src/utils/activityMetricsBySport.js` — `detectSportType`, `getMetricsForSport`, `getTabsForSport`, `getBlocksForSport` (objeto de banderas booleanas por bloque: `showClimbPro`, `showPowerChart`, `showCadenceChart`, `showMap`, `showMetabolic`, `showEfficiency`, `zoneOptions`…). Funciones puras, sin React; derivadas del borrador, ampliadas y corregidas. La matriz de la sección 5 se codifica como **una tabla de datos** (`SPORT_BLOCKS`), no como `if` dispersos, para que cambiar una celda sea una línea.
- **Componentes afectados:** `src/components/pages/ActivityDetailPage.jsx` (calcula `sport`/`blocks`/`tabs`, los pasa abajo), `src/components/activity/detail/DetailHeader.jsx`, `DetailMobileHero.jsx`, `TelemetryPanel.jsx`, `ActivityCharts.jsx`, `AnalysisSidebar.jsx`, `DataTab.jsx`, `MapTab.jsx`/`LapsTab.jsx` (solo su visibilidad), `detailUtils.js` (`getSportTheme`, `getSpeedOrPace`).
- **Hooks afectados:** `src/hooks/useActivityMetrics.js` — `isPaceBased` vía `detectSportType` (incluye senderismo); zonas de ritmo con `calcPaceZones`; separar el memo en `exactPaceZoneAnalysis` y `exactPowerZoneAnalysis` (hoy mezclados en `exactPacePowerZoneAnalysis`); no calcular `climbPro`/potencia fuera de bici (optimización opcional).
- **Ajustes:** `settings.run.thresholdPace` y `settings.bike.ftp` (existentes). Sin cambios de esquema.
- **Textos:** `src/utils/activityMetricDescriptions.js` — añadir `kcal` (y `series` solo si D1 lo decide).
- **Servicios / Store / Rutas / BD:** sin cambios. No se toca `useStravaSync`.
- **Estilo:** solo clases ya existentes; cualquier estilo nuevo (selector de zonas, aviso de umbral por defecto) bajo `html[data-ui="v2"]` reutilizando `Segmented`.
- **Fuera de alcance (esta spec):** layouts propios por deporte; borrado de actividad (`onDelete` sigue sin conectar); **rediseño «premium»** de estas pantallas, que el usuario especificará más adelante con webs de referencia (esta spec solo decide *qué* se muestra, no *cómo se ve* más allá de reutilizar los componentes actuales).

## 8. Pruebas
- **Unitarias** (`src/__tests__/unit/activityMetricsBySport.test.js`, reescribiendo las del borrador): tabla `it.each` de `detectSportType` (tipos Strava reales, manuales, mayúsculas/tildes, null); matriz completa: para cada deporte, `getMetricsForSport`/`getTabsForSport`/`getBlocksForSport` devuelven exactamente lo de la sección 5 (una prueba que recorre la tabla); Kcal con `0`; métricas sin dato filtradas; ritmo vs velocidad por deporte. `calcPaceZones` ya tiene su cobertura; añadir prueba de `exactPaceZoneAnalysis` con streams sintéticos (suma de minutos, rangos).
- **Integración** (`src/__tests__/integration/ActivityDetailPage.test.jsx` y nuevo `activityDetailBySport.test.jsx`): render por deporte con la actividad y streams de ejemplo: bici (ClimbPro, potencia), carrera (sin EF, zonas de ritmo con selector), senderismo (Ritmo, sin ClimbPro), fuerza (3→2 pestañas, sin mapa), natación (genérico). Regresión: los tests de `MetricTooltip` del detalle siguen en verde.
- **E2E** (`e2e/detail-by-sport.spec.js`, nuevo, con datos mockeados como `detail-back.spec.js`): pestañas visibles por deporte en escritorio y móvil, ausencia de Mapa/Intervalos en fuerza, ClimbPro solo en bici, selector FC/Ritmo en carrera. Capturas v2 solo de lo que cambia a propósito (revisión una a una, AGENTS §8). style-diff v1 = 0.

## 9. Riesgos
| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Tipos de Strava sin traducir (`Hike`, `VirtualRide`…) o escritos por el usuario caen en genérico y pierden bloques. | Detección por subcadena en inglés y español + tabla de pruebas; el genérico es seguro (vista simplificada), nunca rompe. |
| R2 | `series_count` no existe: prometer Series sería enseñar un dato falso/vacío. | Series fuera de alcance por defecto (D1); si el usuario lo quiere, spec aparte (BD + entrada manual). |
| R3 | Ocultar bloques cambia lo que ven hoy los usuarios de v1 (p. ej. IF a 0 en carrera). | v1 se congela en estilo, no en datos: la lógica por deporte es común a v1 y v2. Se avisa en el PR; style-diff compara capturas con actividades de bici/carrera que mantienen sus bloques. |
| R4 | Kcal de bici viene de kJ (≈ kcal); en manuales es 0. | Se muestra solo si > 0; nota en la tarjeta explicativa. No se corrige el dato en esta spec. |
| R5 | Cambiar `isPaceBased` para senderismo afecta a gráfica, picos e Intervalos (autolaps de 1 km). | Cubierto en integración; coherente: el ritmo es el dato de senderismo. Cadencia de caminata en ppm ya está contemplada (M2). |
| R6 | Zonas de ritmo con umbral por defecto engañan si el usuario no lo configuró. | Aviso visible + enlace a Perfil; unificar con `calcPaceZones` evita divergencias con Perfil. |
| R7 | Estado de recuperación y Perfil metabólico son heurísticos (texto fijo «~24H», % de carbos desde IF). | No se rediseñan aquí; la recuperación se oculta (M8) y el perfil metabólico usa % de FC en carrera/senderismo (D6). |
| R8 | Colisión con el rediseño «premium» posterior. | La spec separa *qué* se muestra (tabla de datos) de *cómo*; el rediseño solo reescribirá componentes, no la matriz. |

## 10. Decisiones (cerradas por el usuario, 2026-11-18)
- **D1 — Series en fuerza:** fuera de alcance (el dato no existe). Resumen de fuerza = Kcal, Tiempo, FC (+ Carga si hay dato).
- **D2 — Celdas M1–M9:** aceptadas las propuestas por defecto (ver §5.5).
- **D3 — Genérico:** Carga y Desnivel si hay dato; Mapa si hay GPS; Intervalos si hay datos de ritmo/velocidad.
- **D4 — Zonas de ritmo en senderismo/caminata:** no.
- **D5 — Mapa sin GPS:** se oculta la pestaña en cualquier deporte.
- **D6 — Perfil metabólico en carrera/senderismo:** se calcula con % de FC máx./umbral cuando no hay potencia.
- **D7 — Estado de recuperación:** oculto en todos los deportes hasta que sea un cálculo real.
- **D8 — Selector de zonas:** Segmented FC / Ritmo / Potencia según deporte; FC por defecto.

## 11. Notas adicionales
- Orden de merge: este PR depende de #101 (`MetricTooltip`, `activityMetricDescriptions.js`); rebasar sobre `develop` cuando se mergee.
- `wip/detalle-por-deporte` no se mergea; solo se reutilizan `activityMetricsBySport.js` y su test, adaptados.
- El rediseño «premium» de estas pantallas (con referencias web que aportará el usuario) será una spec posterior; no se anticipa aquí.

---
Plantilla: `docs/sdd/plantilla-especificacion.md` v0.1.0
