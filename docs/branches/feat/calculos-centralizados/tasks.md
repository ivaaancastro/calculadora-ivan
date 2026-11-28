# Tareas — B1 · Cálculos centralizados

Aprobado el 2026-11-27 (D1–D5 en A). Un PR por sección; no se empieza la siguiente hasta que la PM
confirme que la anterior está en `develop`.

## PR 1 — Fechas y zonas (`feat/calculos-centralizados`)
- [x] `dates.js`: claves de día, semana y `formatDayShort`, con tests en tres husos (RF-1, RF-2)
- [x] `zones.js`: definiciones únicas y clasificación contigua, con tests (RF-3, RF-4)
- [x] Consumidores de zonas y deporte con `sportOf`; borrar copias y código muerto (RF-3, RF-5)
- [x] `npm run verify` y revisión visual
- [x] Registrar y abrir PR a `develop`

## PR 2 — PMC, TSS y carga (`feat/calculos-pmc`)
- [x] `load.js`: totales (D3), ACWR, rampa, tendencia, monotonía
- [x] `calculatePMC` único: claves locales, proyección con planes, `offsetCtl`, TSB (D1)
- [x] TSS estable, streams solo 95 días (D2)
- [x] Consumidores: Dashboard, Calendario, gráfico flotante, Salud, Perfil, Rendimiento, `useStravaSync`
- [x] Sin VFC inventada (D5); fuera `getTrainingStatus`
- [x] E2E `TSB = CTL − ATL`, verificación, capturas y PR

## PR 3 — Distribución de carga (`feat/calculos-distribucion`)
- [x] Reparto del TSS en tres categorías; sustituye a `getTrainingBalance`
- [x] `TrainingBalanceCard` 7/28/90 y «Distribución de foco» solo con horas (D4)
- [x] Quitar el relleno de 50 TSS/h (RF-11) y E2E de cifras en Salud y Perfil (CA-1)
- [x] `docs/architecture/metricas.md`, E2E, `CHANGELOG.md`, `MEMORY.md` y PR
