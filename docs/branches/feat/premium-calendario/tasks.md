# Tasks — `feat/premium-calendario`

## PR 1 — Cabecera del mes
- [x] Spec y plan aprobados (C-1…C-4 como propuestos).
- [x] `buildMonthSummary` (`src/utils/monthSummary.js`) + test.
- [x] `MonthHero` solo v2 (frase, 4 KPI, heatmap plegable en móvil) + CSS «Calendario D5».
- [x] `npm run verify`, CHANGELOG, MEMORY.
- [x] PR #128 mergeado. Las capturas móviles de otras 4 pantallas cambiaron de altura (el pager mide la pestaña más alta; `MobileSwipePager`).

## PR 2 — Rejilla (`feat/premium-calendario-rejilla`)
- [x] `buildDayLoadLevels` + `getSessionState` (`src/utils/calendarLoad.js`) con tests.
- [x] Tinte de carga por día (`data-load`, serie TSS), estados de ficha (`data-state`: realizado / cumplido / planificado / omitido con etiqueta «Plan»/«Omitida»), chip del ✓, panel semanal a 156 px con texto ≥ 11 px.
- [x] Lo que cambia tamaño va solo en ≥ 1024 px: la altura móvil/tableta no cambia (el pager mide la pestaña más alta) y no mueve las capturas de otras pantallas.
- [x] Capturas v2 del Calendario regeneradas (6, Docker bajo mutex).
- [ ] **Diferido:** extraer `DayCell`/`SessionCard` de `CalendarMonthView`; los ganchos `data-*` (inertes en v1) hicieron innecesaria la extracción y evitan riesgo en el DOM de v1.
- [x] PR #138 mergeado.

## PR 3 — Cierre (`feat/premium-calendario-cierre`)
- [x] PMC flotante: ganchos `data-cal="pmc*"` (inertes en v1) + bloque CSS v2: cromo con tokens de la serie, tooltip de cristal, texto ≥ 11 px, leyenda a 44 px; la gráfica ya usaba `useChartTheme`.
- [x] Móvil/tableta: cinta semanal compacta y fija «S23 · realizado/plan TSS · tiempo» (oculta en v1).
- [x] Capturas v2: Calendario móvil/tableta (+160 px) y, por el pager, las 8 móviles de dashboard/rendimiento/actividades/salud (solo cambian la altura y la barra inferior flotante; comprobado píxel a píxel). Descartadas dos PNG de rendimiento (escritorio y tableta, oscuro) que cambiaron sin relación.
- [x] D5 marcada en `premium-design/tasks.md`, CHANGELOG y MEMORY.
- [ ] PR abierto y CI verde. Queda D7 del usuario sobre el Calendario.
