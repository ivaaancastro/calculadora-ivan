# Spec — B1 · Cálculos centralizados

## 1. Identificación
- **ID:** `spec-b1-calculos-centralizados`
- **Título:** Una sola fuente de verdad para carga, forma, zonas y fechas
- **Autor:** agente B1 (Oleada 1)
- **Fecha:** 2026-11-27
- **Estado:** implementada (PR 1–3) — aprobada por el usuario el 2026-11-27 con **D1–D5 en la opción A**

## 2. Objetivo
Que CTL, ATL, TSB, TSS, zonas y carga salgan de un único sitio y digan lo mismo en todas las
pantallas, y que Rendimiento muestre la distribución de carga en aeróbico bajo, aeróbico alto y
anaeróbico. Cada fórmula, con test unitario y documentada.

## 3. Contexto: auditoría (2026-11-27, sobre `develop` cb595b8; 455 tests en verde)

### 3.1 Forma, fitness y fatiga

| # | Problema | Dónde |
|---|----------|-------|
| A1 | Segundo «TSB» que no es CTL − ATL (media 28 d − media 7 d, con `tss \|\| 45`). Es la cifra protagonista de Rendimiento. | `fitnessStatsEngine.ts` `getTrainingStatus`, `statsNarrative.js` |
| A2 | «Carga 7 d» muestra la media diaria, pero se rotula «Estrés acumulado de la semana». | idem |
| A3 | CTL, ATL y TSB se redondean por separado: 50,4 y 40,6 se ven como 50, 41 y **10**. | `tssEngine.ts` `calculatePMC` |
| A4 | La proyección del Calendario usa otra fórmula (`/42`, `/7` frente a `1 − e^(−1/τ)`), ignora `ta`/`tf`, aplica el peso de fatiga también a CTL y hace decaer el ajuste manual `offsetCtl`. | `calendarEngine.js` `projectPmc` |
| A5 | El Calendario recibe la serie recortada por el rango del Dashboard (por defecto 30 d): las semanas anteriores salen sin Fitness/Fatiga/Forma. | `Dashboard.jsx` → `CalendarPage` |
| A6 | Salud toma como «TSB actual» el último punto de la serie, que es **hoy + 7** y además filtrado por rango; sus umbrales (−30 / +10) contradicen `formState` (+5 a +25 es «pico»). | `useWellnessInfo.js`, `useWellnessAnalytics.js` |
| A7 | Tres rampas: CTL(hoy) − CTL(−7), CTL fin de semana − semana anterior, y diferencia diaria × 7. | `tssEngine`, `CalendarMonthView`, `PmcFloatingChart` |
| A8 | Dos escalas de ACWR (`injuryRisk` frente a `acwrZone`); la tendencia «28 días» compara contra 30. | `tssEngine`, `kpiTrend`, `AdvancedAnalytics` |
| A9 | Sin VFC real, se **inventa** una a partir del TSB falso y `Math.sin(Date.now())`. | `getHRVAnalysis` |

### 3.2 TSS, carga y fechas

| # | Problema | Dónde |
|---|----------|-------|
| B1 | El TSS cambia según los streams cargados: primero con datos resumidos, a los 500 ms con streams (95 d) y, tras visitar Rendimiento con rango largo, también el histórico. El CTL del Dashboard depende de qué pantallas se hayan abierto. | `useActivitiesQuery.ts`, `usePMCMetrics.js` |
| B2 | Cinco criterios de carga: semana del Calendario (solo deportes «aeróbicos», TSS bruto), recomendador (todos, ponderado), gráfico de volumen (todos, semana en UTC), resumen del mes (todos), Rendimiento (media móvil, `tss \|\| 45`); el balance rellena `50 TSS/h`. | `calendarEngine`, `useFitnessAnalytics`, `monthSummary`, `fitnessStatsEngine` |
| B3 | El PMC agrupa por día UTC y el Calendario por día local. Las actividades guardan la hora local de Strava marcada como `Z`, así que `toDateKey` puede moverlas de día; los planes se guardan como medianoche local en UTC, así que el recorte UTC los mueve al día anterior. | `tssEngine`, `pmcPoints`, `useWellnessData`, `useStravaSync`, `getMonday` |

### 3.3 Zonas

| # | Problema | Dónde |
|---|----------|-------|
| C1 | Potencia copiada en 4 sitios; ritmo por zona en 2; umbrales de intensidad por %FCmáx distintos (79/89 y 72/82/90). | `zonesCalc`, `useActivityMetrics`, `PlannerModal`, `fitnessStatsEngine`, `calendarTemplates`, `tssEngine` |
| C2 | Huecos entre rangos: con LTHR 168, Z3 acaba en 156 y Z4 empieza en 158; los segundos a 157 ppm se pierden. Igual en potencia y ritmo. | idem |
| C3 | El detalle usa zonas de **carrera** para las actividades `Ride` (solo reconoce «bici»/«ciclismo»). | `useActivityMetrics.js` |
| C4 | `getTrainingBalance` asigna todo el TSS de una sesión a una sola categoría. | `fitnessStatsEngine.ts` |

## 4. Requisitos funcionales

### Fechas (`utils/dates.js`)
- [x] RF-1 Una clave de día única `YYYY-MM-DD`: `activityDayKey` (el día escrito en la fecha de la
  actividad, que ya es local) y `planDayKey` (instante → día local; fecha sola → tal cual).
  «Hoy» es el día local. Sin recortes de `toISOString()` en métricas.
- [x] RF-2 `formatDayShort(valor, { year })` → «lun 15 jun» («lun 15 jun 2026»), para B2 y B4.

### Zonas (`utils/zones.js`)
- [x] RF-3 Definiciones únicas de FC (LTHR y FCmáx), potencia, ritmo y ritmo estimado por zona.
- [x] RF-4 Clasificación contigua por límite inferior (`zona = última con valor >= min`): ningún
  segundo se pierde. No cambian las zonas guardadas ni los rangos que se muestran.
- [x] RF-5 El deporte se decide con `sportOf` (corrige C3).

### Forma (`tssEngine.ts`)
- [x] RF-6 Un único `calculatePMC(actividades, ajustes, planes)`: serie por día local, real hasta
  hoy y proyectada hasta +90 d con los planes, con la misma EWMA (`ta`/`tf`), pesos por deporte y
  `offsetCtl` sumado después (no decae).
- [x] RF-7 Cada punto guarda valores crudos (para calcular) y mostrados según **D1**. Ninguna
  pantalla vuelve a redondear ni a restar por su cuenta.
- [x] RF-8 Dashboard, Rendimiento, Calendario (semanas y gráfico flotante), Salud y Perfil leen de
  esa serie; el rango del Dashboard solo recorta su gráfica.
- [x] RF-9 Estado de forma solo desde `formState.js` (también en Salud y recomendador). Se elimina
  `getTrainingStatus`.

### TSS y carga (`utils/load.js`)
- [x] RF-10 TSS estable según **D2**: no depende de las pantallas visitadas.
- [x] RF-11 Una definición de carga por semana (lunes–domingo local), 7 d móviles, mes y periodo,
  según **D3**. «Carga 7 d» es la suma. Sin rellenos `45` ni `50 TSS/h`: se usa el TSS calculado.
- [x] RF-12 Una rampa: `CTL(d) − CTL(d − 7)`. La semana del Calendario es esa rampa en su domingo.
- [x] RF-13 Un ACWR: media diaria 7 d / 28 d de la carga ponderada por fatiga, con una sola escala
  (`< 0,8` baja, `≤ 1,3` óptima, `≤ 1,5` vigilar, `> 1,5` riesgo); sin 28 días de historia, «Sin datos».
- [x] RF-14 Tendencia de fitness contra hace 28 días. Monotonía y strain, en `load.js`.

### Distribución de carga (Rendimiento, evoluciona `TrainingBalanceCard`)
- [x] RF-15 El TSS de cada sesión se **reparte** entre aeróbico bajo (Z1–Z2), aeróbico alto
  (Z3–Z5) y anaeróbico (Z6–Z7), proporcional a `tiempo en zona × TSS/h de la zona`. La suma de las
  tres es el TSS de la sesión.
- [x] RF-16 Fuente, por orden: potencia (bici con vatios) → FC en streams → FC media (toda la
  sesión a una zona) → sin clasificar. La tarjeta dice cuántas sesiones son estimadas o quedan
  fuera.
- [x] RF-17 Entran carrera, bici, natación y «otros»; fuerza, yoga y caminata no.
- [x] RF-18 Rangos 7 / 28 / 90 días (28 por defecto); objetivos actuales (60–80, 10–25, 5–15 %).
  La tarjeta explica que es una aproximación propia inspirada en el «Enfoque de carga» de Garmin
  (el modelo de Firstbeat, basado en EPOC, es propietario).
- [x] RF-19 «Distribución de foco» (pestaña Volumen) según **D4**.

### Documentación
- [x] RF-20 `docs/architecture/metricas.md`: fórmulas, convenciones, zonas y límites de la
  aproximación.

## 5. Decisiones para el usuario

### D1 · TSB: «hoy» o «ayer»
- **A (recomendada, PM): «hoy».** `TSB = round(CTL) − round(ATL)` del mismo día, con la carga de
  hoy incluida; el estado sale de ese entero. Siempre cuadra con lo que se ve; es la convención de
  Intervals.icu. Contra: baja justo después de entrenar.
- **B: «ayer»** (TrainingPeaks). `TSB(hoy) = round(CTL ayer) − round(ATL ayer)`: la forma con la
  que te levantas, estable durante el día. Contra: no cuadra con el CTL y ATL de hoy que se ven al
  lado (habría que rotularlo o enseñar los de ayer).

### D2 · Qué TSS usa el historial
- **A (recomendada):** streams solo para los últimos 95 días (los que siempre se cargan); lo
  anterior, siempre con datos resumidos aunque sus streams lleguen después. Sin migración. Quedan
  dos límites: un ajuste a los 500 ms de abrir la app, y una sesión puede variar al cumplir 95 días
  (su peso en CTL es ya ≤ 10 %).
- B: siempre datos resumidos. Estable, pero menos preciso.
- C: guardar el TSS en la base de datos. Lo mejor a largo plazo, pero exige migración y recálculo:
  rama aparte.

### D3 · Qué suma en los totales de carga (semana, 7 d, mes, volumen)
- **A (recomendada):** todo el TSS de todos los deportes: el total coincide con la suma de las
  sesiones visibles. CTL/ATL conservan sus pesos.
- B: estilo Intervals.icu, sin fuerza, yoga ni caminata (lo que hace hoy la semana del Calendario).

### D4 · Tarjeta «Distribución de foco»
- **A (recomendada):** se queda solo con «Horas por zona»; los porcentajes por intensidad viven en
  la distribución de carga (un dato, un sitio).
- B: conserva sus porcentajes (de tiempo) renombrados a las mismas tres categorías.

### D5 · VFC estimada (A9)
- **A (recomendada):** sin dato real de VFC no se muestra VFC ni Estrés (su fórmula dependía del
  TSB que desaparece).
- B: mantener una estimación rotulada «estimada», recalculada con el TSB único y sin ruido.

## 6. Criterios de aceptación
- [x] CA-1 Con los mismos datos, Dashboard, Rendimiento, Calendario, Salud y Perfil muestran los
  mismos CTL, ATL y TSB de hoy; con D1-A, `TSB = CTL − ATL` en cada punto visible.
- [x] CA-2 Visitar cualquier pantalla o cambiar cualquier rango no cambia ningún CTL.
- [x] CA-3 Un solo cálculo de PMC, rampa, ACWR, carga semanal y zonas en `src/`.
- [x] CA-4 Una actividad a las 23:30 y un plan caen en su día con `TZ=Europe/Madrid`,
  `America/Los_Angeles` y `UTC`.
- [x] CA-5 La suma de las tres categorías es la suma del TSS de las sesiones clasificadas.
- [x] CA-6 Cada fórmula (TSS, NP, PMC, proyección, TSB, rampa, ACWR, monotonía, zonas, reparto,
  fechas) tiene test unitario con valores calculados a mano.
- [x] CA-7 `npm run verify` y CI (< 5 min) en verde.

## 7. Diseño técnico
- **Utilidades:** `tssEngine.ts`, nuevos `zones.js` y `load.js`, `dates.js`, `calendarEngine.js`,
  `calendarTemplates.js`, `calendarLoad.js`, `monthSummary.js`, `pmcPoints.js`, `kpiTrend.js`,
  `formState.js`, `formSummary.js`, `statsNarrative.js`, `fitnessStatsEngine.ts` (se borra también
  el código sin uso que duplica zonas, p. ej. `analyzeIntensityDistribution`).
- **Hooks:** `usePMCMetrics`, `useActivities`, `useActivitiesData`, `useCalendarData`,
  `useWellnessInfo`, `useWellnessData`, `useWellnessAnalytics`, `useFitnessAnalytics`,
  `useActivityMetrics`, `useStravaSync` (solo claves de día); `queries/*`.
- **Componentes:** `fitness/*`, `dashboard/AdvancedAnalytics`, `calendar/{CalendarMonthView,
  PmcFloatingChart,PlannerModal}`, `pages/*`, `health/*`; store si hace falta.
- **Base de datos:** sin cambios.
- **No se toca:** tema (`useTheme`, `index.html`, `Navbar`, mapa), componentes de tooltip ni
  `tokens.css`. Colores: tokens que ya existen.
- **Fuera de alcance:** guardar TSS en BD, cambiar las fórmulas de TSS/NP, VO₂max, eFTP,
  `calculateTrainingEffect` o el simulador de bienestar; rediseñar el recomendador.

## 8. Pruebas
- **Unitarias:** `tssEngine`, `zones`, `load`, `dates`, `calendarEngine`, `fitnessStatsEngine`,
  `statsNarrative`, `pmcPoints`, `useActivityMetricsZones`, husos horarios.
- **Integración:** `CalendarPage`, `HealthPage`, `ActivityDetailPage`, `ProfilePage`.
- **E2E (CI):** `e2e/stats`, `e2e/metrics`; datos en `e2e/support/mockApp.js`; comprobación DOM de
  `TSB = CTL − ATL`.
- **Verificación:** `npm run verify`; revisión visual a 390 y 1440 px, claro y oscuro (puerto 5181,
  `E2E_PORT=5281`).

## 9. Notas
- Las cifras **cambiarán** respecto a hoy (fechas, proyección, zonas sin huecos, TSB de
  Rendimiento): es la corrección buscada y se anotará en el `CHANGELOG`.
- B5 espera a que B1 esté en `develop`: comparte las tarjetas de Rendimiento y `CalendarMonthView`.
- Seguimientos vistos y no incluidos: `AddActivityModal` propone la fecha en UTC; el simulador de
  bienestar muestra datos inventados (ámbito de B8a); confirmar los tipos de `activities.date` y
  `planned_workouts.date` (las tablas base no están en `migrations/`; RF-1 funciona con ambos).
