# Tareas — Capa 5 (pantallas)

Spec y plan **aprobados por el usuario el 2026-11-16**: D8 cerrada (conmutador en Ajustes → General hasta la Capa 6, donde se decide su destino), D13 (shell en v2, PR 1), D14 (refactor y visual separados), D15 (orden del plan), D16 (iPhone por parada y completo en el cierre), D17 (`TAB_PATHS` en el PR del Dashboard).
**Estado: Capa 5 implementada (14 PR de código mergeados: #84–#97) + PR 9 de cierre.** Una sesión por fase. **R** refactor sin cambio visible · **V** visual · ⏸ parada de aprobación D7. Sin merge sin autorización escrita.

Verificación común: lint, `lint:colors` (no sube), `lint:ui` (14), unit, integración, build, E2E macOS, volcado v1 = 0, capturas solo en Docker, paridad marcada.

## PR 1 — `feat/screens-shell-v2` (V ⏸)
- [x] Sesión A: `Navbar`, `BottomNav`, lienzo bajo `data-ui="v2"`; `--nav-h` intacto (#87)
- [x] Sesión B: 42 capturas v2 regeneradas, PR y parada (#87)

## PR 2 — Ajustes
- [x] 2a `refactor/profile-sections` (R) (#86)
- [x] 2b `feat/screens-profile-v2` (V ⏸): primer vistazo móvil, paridad «Ajustes» (#90)
  - **Primer vistazo móvil (390 px), sin scroll:** título de sección + «Guardar», selector de sección en la página (General · Zonas · Cuentas · Seguridad; solo v2 y móvil, antes solo estaba en el menú de la cabecera), ficha de perfil compacta, Datos personales y Fisiología (peso, FC reposo, CTL). **Plegado/debajo:** Apariencia (conmutador D8), zonas, cuentas y seguridad en su sección.
  - Ubicación: el cambio de sección móvil gana un acceso en la página; el menú de la cabecera sigue igual.

## PR 3 — `feat/screens-history-v2` (V ⏸)
- [x] Implementación (CSS solo bajo `data-ui="v2"` + ganchos `data-history`/`data-modal` inertes en v1): lista, filtros, `AddActivityModal`, estado vacío; paridad «Actividades» marcada
- [x] Capturas Docker (solo Actividades v2, 6) y parada D7 (#92)
- **Primer vistazo móvil (390 px):** buscador a ancho completo + deporte y periodo en una fila, recuento y las primeras filas (nombre, fecha·deporte, duración y km/TSS); borrar a 44 px. Nada plegado.
- **Estados:** vacío con filtros («No hay resultados») restilado; carga y error son del Dashboard/`ErrorBoundary` (compartidos, sin cambios).

## PR 4 — Dashboard
- [x] 4a `refactor/dashboard-routes` (R): `TAB_PATHS` único (D17) (#91)
- [x] 4b `feat/screens-dashboard-v2` (V ⏸): primer vistazo, `FuelingPanel` (#94)
  - **Primer vistazo móvil (390 px), sin scroll ni desplegar:** Estado de Forma compacto, las 4 métricas de Fisiología y Carga (CTL, ATL, TSB, ratio, en 2 × 2) y la gráfica de evolución con su selector de rango. **Plegado (solo v2 y <768 px):** «Tendencia y Capacidad» (rampa, monotonía, volumen 30D, VO2 máx.) tras un botón de 44 px. Escritorio: sin cambio de estructura, todo visible.
  - Ubicación: la gráfica sube sobre lo plegado en móvil; ninguna acción desaparece.

## PR 5 — `feat/screens-stats-v2` (V ⏸)
- [x] Implementación (CSS solo bajo `data-ui="v2"` + ganchos `data-stats`/`data-card` inertes en v1): orden y densidad en móvil; paridad «Rendimiento» marcada
- [x] Capturas Docker (solo Rendimiento v2) y parada D7 (#93)
- **Primer vistazo móvil (390 px):** Estado de entreno → VFC → Umbrales → Balance (antes Umbrales primero); tarjetas con 16 px de relleno y 12 px de separación; pestañas de sección a 44 px. 768 y 1440 px sin cambios (orden del DOM).

## PR 6 — Salud
- [x] 6a `refactor/health-sections` (R) (#84)
- [x] 6b `feat/screens-health-v2` (V ⏸) (#95)
  - **Primer vistazo móvil (390 px), sin scroll:** título + selector Hoy/Historial (44 px), los tres pilares (recuperación, carga diaria, sueño) como filas compactas con el anillo a 96 px, y el banco de energía. **Plegado/debajo:** biomarcadores y aspectos destacados. Historial: selector 7D/14D/30D y fichas de día a 44 px.
  - Ubicación: sin cambios; el anillo gana `viewBox` (inerte en v1, necesario para escalarlo en v2).

## PR 7 — Detalle
- [x] 7a `refactor/activity-detail-sections` (R) (#85)
- [x] 7b `feat/screens-detail-v2` (V ⏸) (#96; cambian 4 capturas: móvil y tablet, claro/oscuro)
  - **Primer vistazo móvil (390 px):** cabecera con Volver/Strava/Eliminar a 44 px y pestañas en carril a 44 px; mapa con filete de la piel (capas del mapa a 44 px); cuadrícula de métricas; picos (44 px) y gráficas con `useChartTheme()` v2. **Debajo:** panel de impacto del entrenamiento.
  - Ubicación: sin cambios. Ganchos `data-detail` inertes en v1. Los +34 px del pager móvil no se tocan (son del pager, no del Detalle).

## PR 8 — Calendario
- [x] 8a `refactor/calendar-logic` (R) (#88)
- [x] 8b `refactor/calendar-views` (R) (#89)
- [x] 8c `feat/screens-calendar-v2` (V ⏸) (#97)
  - **Primer vistazo móvil (390 px), sin scroll:** mes con «Hoy» y flechas a 44 px y los primeros días con sus sesiones; días vacíos compactos (58 px; la página baja de 3.473 a 3.067 px), hoy en cobalto, «+» a 44 px. Sesiones planificadas discontinuas sobre fondo hundido; modales de plan y rutina con borde del token y controles a 44 px. Escritorio/tablet: misma rejilla, solo piel.
  - Ubicación: sin cambios; ganchos `data-cal` inertes en v1.

## PR 9 — `docs/screens-cierre`
- [x] Paridad completa en `docs/branches/test/ui-safety-net/paridad.md` (sección «cierre de la Capa 5»), comprobada contra código y tests
- [x] `MEMORY.md`, `CHANGELOG.md`, roadmap y spec marcada como implementada
- [x] Guion de la pasada completa en iPhone: `guion-iphone.md` (lo ejecuta el usuario)
- [ ] **Pasada en iPhone real** (usuario): pendiente; no bloquea el cierre documental, sí la Capa 6
- Verificación del cierre (docs, sin cambios en `src/`): lint, `lint:colors` 743/3/100/8/165 (sin subir), `lint:ui` 14, unit 240, integración 24, build ✓. Sin Docker ni capturas.

## Registro
- [x] PR #83 (docs) mergeado con autorización
- [ ] PR 9 (`docs/screens-cierre`) mergeado con autorización
