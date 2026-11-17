# Tareas — Capa 5 (pantallas)

Spec y plan **aprobados por el usuario el 2026-11-16**: D8 cerrada (conmutador en Ajustes → General hasta la Capa 6, donde se decide su destino), D13 (shell en v2, PR 1), D14 (refactor y visual separados), D15 (orden del plan), D16 (iPhone por parada y completo en el cierre), D17 (`TAB_PATHS` en el PR del Dashboard).
Una sesión por fase. **R** refactor sin cambio visible · **V** visual · ⏸ parada de aprobación D7. Sin merge sin autorización escrita.

Verificación común: lint, `lint:colors` (no sube), `lint:ui` (14), unit, integración, build, E2E macOS, volcado v1 = 0, capturas solo en Docker, paridad marcada.

## PR 1 — `feat/screens-shell-v2` (V ⏸)
- [ ] Sesión A: `Navbar`, `BottomNav`, `MobileSwipePager`, lienzo bajo `data-ui="v2"`; `--nav-h` intacto
- [ ] Sesión B: capturas Docker v2, solapes, paridad Navbar/BottomNav, PR, parada

## PR 2 — Ajustes
- [ ] 2a `refactor/profile-sections` (R)
- [x] 2b `feat/screens-profile-v2` (V ⏸): primer vistazo móvil, paridad «Ajustes» — implementado; falta aprobación D7 de las 6 capturas `perfil` v2
  - **Primer vistazo móvil (390 px), sin scroll:** título de sección + «Guardar», selector de sección en la página (General · Zonas · Cuentas · Seguridad; solo v2 y móvil, antes solo estaba en el menú de la cabecera), ficha de perfil compacta, Datos personales y Fisiología (peso, FC reposo, CTL). **Plegado/debajo:** Apariencia (conmutador D8), zonas, cuentas y seguridad en su sección.
  - Ubicación: el cambio de sección móvil gana un acceso en la página; el menú de la cabecera sigue igual.

## PR 3 — `feat/screens-history-v2` (V ⏸)
- [x] Implementación (CSS solo bajo `data-ui="v2"` + ganchos `data-history`/`data-modal` inertes en v1): lista, filtros, `AddActivityModal`, estado vacío; paridad «Actividades» marcada
- [ ] Capturas Docker (solo Actividades v2, 6) y parada D7
- **Primer vistazo móvil (390 px):** buscador a ancho completo + deporte y periodo en una fila, recuento y las primeras filas (nombre, fecha·deporte, duración y km/TSS); borrar a 44 px. Nada plegado.
- **Estados:** vacío con filtros («No hay resultados») restilado; carga y error son del Dashboard/`ErrorBoundary` (compartidos, sin cambios).

## PR 4 — Dashboard
- [ ] 4a `refactor/dashboard-routes` (R): `TAB_PATHS` único (D17)
- [x] 4b `feat/screens-dashboard-v2` (V ⏸): primer vistazo, `FuelingPanel` — implementado; falta aprobación D7 de las 6 capturas `dashboard` v2
  - **Primer vistazo móvil (390 px), sin scroll ni desplegar:** Estado de Forma compacto, las 4 métricas de Fisiología y Carga (CTL, ATL, TSB, ratio, en 2 × 2) y la gráfica de evolución con su selector de rango. **Plegado (solo v2 y <768 px):** «Tendencia y Capacidad» (rampa, monotonía, volumen 30D, VO2 máx.) tras un botón de 44 px. Escritorio: sin cambio de estructura, todo visible.
  - Ubicación: la gráfica sube sobre lo plegado en móvil; ninguna acción desaparece.

## PR 5 — `feat/screens-stats-v2` (V ⏸)
- [x] Implementación (CSS solo bajo `data-ui="v2"` + ganchos `data-stats`/`data-card` inertes en v1): orden y densidad en móvil; paridad «Rendimiento» marcada
- [ ] Capturas Docker (solo Rendimiento v2, 6; cambian las 2 de 390 px) y parada D7
- **Primer vistazo móvil (390 px):** Estado de entreno → VFC → Umbrales → Balance (antes Umbrales primero); tarjetas con 16 px de relleno y 12 px de separación; pestañas de sección a 44 px. 768 y 1440 px sin cambios (orden del DOM).

## PR 6 — Salud
- [ ] 6a `refactor/health-sections` (R)
- [x] 6b `feat/screens-health-v2` (V ⏸): implementado; falta aprobación D7 de las 6 capturas `salud` v2
  - **Primer vistazo móvil (390 px), sin scroll:** título + selector Hoy/Historial (44 px), los tres pilares (recuperación, carga diaria, sueño) como filas compactas con el anillo a 96 px, y el banco de energía. **Plegado/debajo:** biomarcadores y aspectos destacados. Historial: selector 7D/14D/30D y fichas de día a 44 px.
  - Ubicación: sin cambios; el anillo gana `viewBox` (inerte en v1, necesario para escalarlo en v2).

## PR 7 — Detalle
- [ ] 7a `refactor/activity-detail-sections` (R)
- [x] 7b `feat/screens-detail-v2` (V ⏸): implementado; falta aprobación D7 de las capturas `detalle` v2 (cambian 4: móvil y tablet, claro/oscuro; escritorio y v1 idénticas)
  - **Primer vistazo móvil (390 px):** cabecera con Volver/Strava/Eliminar a 44 px y pestañas en carril a 44 px; mapa con filete de la piel (capas del mapa a 44 px); cuadrícula de métricas; picos (44 px) y gráficas con `useChartTheme()` v2. **Debajo:** panel de impacto del entrenamiento.
  - Ubicación: sin cambios. Ganchos `data-detail` inertes en v1. Los +34 px del pager móvil no se tocan (son del pager, no del Detalle).

## PR 8 — Calendario
- [ ] 8a `refactor/calendar-logic` (R)
- [ ] 8b `refactor/calendar-views` (R)
- [x] 8c `feat/screens-calendar-v2` (V ⏸): implementado; falta aprobación D7 de las 6 capturas `calendario` v2
  - **Primer vistazo móvil (390 px), sin scroll:** mes con «Hoy» y flechas a 44 px y los primeros días con sus sesiones; días vacíos compactos (58 px; la página baja de 3.473 a 3.067 px), hoy en cobalto, «+» a 44 px. Sesiones planificadas discontinuas sobre fondo hundido; modales de plan y rutina con borde del token y controles a 44 px. Escritorio/tablet: misma rejilla, solo piel.
  - Ubicación: sin cambios; ganchos `data-cal` inertes en v1.

## PR 9 — `docs/screens-cierre`
- [ ] Paridad completa, prueba iPhone completa, `MEMORY.md`, `CHANGELOG.md`, roadmap, spec marcada

## Registro
- [ ] PR #83 (docs) mergeado con autorización
