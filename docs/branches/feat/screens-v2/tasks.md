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
- [ ] Lista y filtros móvil, `AddActivityModal`, estados; paridad «Actividades»

## PR 4 — Dashboard
- [ ] 4a `refactor/dashboard-routes` (R): `TAB_PATHS` único (D17)
- [ ] 4b `feat/screens-dashboard-v2` (V ⏸): primer vistazo, `FuelingPanel`

## PR 5 — `feat/screens-stats-v2` (V ⏸)
- [ ] Orden y densidad de tarjetas; paridad «Rendimiento»

## PR 6 — Salud
- [ ] 6a `refactor/health-sections` (R)
- [ ] 6b `feat/screens-health-v2` (V ⏸)

## PR 7 — Detalle
- [ ] 7a `refactor/activity-detail-sections` (R)
- [ ] 7b `feat/screens-detail-v2` (V ⏸): mapa, gráficas, +34 px

## PR 8 — Calendario
- [ ] 8a `refactor/calendar-logic` (R)
- [ ] 8b `refactor/calendar-views` (R)
- [ ] 8c `feat/screens-calendar-v2` (V ⏸)

## PR 9 — `docs/screens-cierre`
- [ ] Paridad completa, prueba iPhone completa, `MEMORY.md`, `CHANGELOG.md`, roadmap, spec marcada

## Registro
- [ ] PR #83 (docs) mergeado con autorización
