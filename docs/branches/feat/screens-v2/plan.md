# Plan — spec-rediseno-02-c5 (Capa 5: pantallas)

Spec: `spec.md` (esta carpeta). Ramas desde `origin/develop`; PRs pequeños hacia `develop`, cada uno con CI verde y **sin merge hasta que lo autorices por escrito**. Una sesión por fase de `tasks.md` (AGENTS.md, sección 8). Conventional Commits con pie de coautoría.

## Partición en PRs

Leyenda: **R** = `refactor` sin cambio visible (capturas v1 y v2 idénticas). **V** = visual v2 (solo cambian las capturas v2 de su pantalla). **⏸** = parada de aprobación D7 (tú lees las capturas una a una).

| PR | Rama | Contenido | Tipo | Parada |
|---|---|---|---|---|
| 1 | `feat/screens-shell-v2` | `Navbar`, `BottomNav`, `MobileSwipePager` y lienzo bajo v2 (D13); `--nav-h` intacto. Cambian las 48 capturas v2 (barras en todas) | V | ⏸ |
| 2a | `refactor/profile-sections` | `ProfilePage` (1.048) en secciones (`pages/profile/`) | R | — |
| 2b | `feat/screens-profile-v2` | Ajustes: primer vistazo móvil, filas, conmutador D8. Paridad «Ajustes» | V | ⏸ |
| 3 | `feat/screens-history-v2` | Actividades + `AddActivityModal`: lista y filtros móvil, estados vacío/carga. Paridad «Actividades» | V | ⏸ |
| 4a | `refactor/dashboard-routes` | D17: `TAB_PATHS` único y vistas escritorio/móvil unificadas | R | — |
| 4b | `feat/screens-dashboard-v2` | Dashboard: estado de forma + 3–4 métricas + gráfica principal; resto plegado; `FuelingPanel`. Paridad «Dashboard» | V | ⏸ |
| 5 | `feat/screens-stats-v2` | Rendimiento: orden y densidad de las 10 tarjetas en móvil. Paridad «Rendimiento» | V | ⏸ |
| 6a | `refactor/health-sections` | `HealthPage` (964) en secciones | R | — |
| 6b | `feat/screens-health-v2` | Salud: primer vistazo y gráficas. Paridad «Salud» | V | ⏸ |
| 7a | `refactor/activity-detail-sections` | `ActivityDetailPage` (1.017) en secciones | R | — |
| 7b | `feat/screens-detail-v2` | Detalle: mapa y gráficas móvil, altura (+34 px). Paridad «Detalle» | V | ⏸ |
| 8a | `refactor/calendar-logic` | `CalendarPage` (2.348): extraer datos y lógica a hooks | R | — |
| 8b | `refactor/calendar-views` | Extraer vistas: mes/semana, `WorkoutViewerModal`, `PmcFloatingChart` | R | — |
| 8c | `feat/screens-calendar-v2` | Calendario: vista móvil, gestos, modales. Paridad «Calendario» | V | ⏸ |
| 9 | `docs/screens-cierre` | Paridad completa, prueba en iPhone, cobertura, `MEMORY.md`, `CHANGELOG.md`, roadmap, marcar spec | — | — |

15 PRs (7 `R`, 7 `V`, 1 cierre). Si D14 se rechaza, 2a+2b, 6a+6b, 7a+7b y 8a–c se fusionan por pantalla (9 PRs, más grandes).

## Orden y dependencias
- **PR 1 primero:** todas las capturas v2 cambian; sin él cada PR posterior tendría que rehacerlas.
- 2a→2b, 4a→4b, 6a→6b, 7a→7b y 8a→8b→8c van en serie. Los PR `R` de pantallas distintas son independientes entre sí, pero **un solo escritor por archivo**: no se solapan ramas que toquen el mismo fichero.
- Un PR `V` no se empieza sin tu OK sobre las capturas del `V` anterior (parada D7). Los `R` no necesitan parada visual y pueden prepararse mientras se revisa un `V`.
- Calendario va último: es el de mayor riesgo y se beneficia de todo lo aprendido (primitivas, jerarquía móvil, pager).

## Verificación en cada PR
1. `npm run lint`, `lint:colors` (no sube), `lint:ui` (14), `check-palette` si hay tokens, unit, integración, `build` — **filtrados** (`| tail -20`, `--reporter=dot`).
2. E2E macOS (`test:e2e`) con 0 ✘.
3. **Volcado de estilos** `node scripts/style-diff.mjs develop <rama>` = **0 diferencias en v1** (en `R`, también v2 = 0).
4. **Capturas solo en Docker** (`npm run test:e2e:docker`; `:update` solo en los `V`, y solo se regenera lo que cambia a propósito). Nunca leer PNG en bloque: comparación por píxeles; en los `V`, `Read` una a una y reducidas.
5. Paridad: acciones de la pantalla marcadas en `paridad.md`.
6. `V`: checklist corta para iPhone real (D16) en la descripción del PR.

## Coste de sesiones (estimación)
Modelo por defecto Sonnet; Opus solo en las decisiones marcadas. Esfuerzo bajo/medio en lo mecánico.

| Fase de `tasks.md` | Sesiones | Modelo / esfuerzo |
|---|---|---|
| Shell v2 (PR 1) | 2: código+CSS, luego red/capturas | Opus para la dirección de barras, Sonnet el resto |
| Cada `R` (7 PRs) | 1 | Sonnet, bajo/medio (mover código, E2E, volcado) |
| Cada `V` (7 PRs) | 2: implementación; capturas+paridad+PR | Sonnet medio; Opus solo para el «primer vistazo» de Dashboard y Calendario |
| Calendario `R` (8a, 8b) | 1 cada uno | Sonnet medio (el de más riesgo de regresión) |
| Cierre (PR 9) | 1 | Sonnet bajo |
| **Total** | **≈ 26 sesiones** | |

Reglas de ahorro: cerrar sesión al terminar cada sección o a ~150 turnos dejando estado en `tasks.md`; `MEMORY.md` corto; Docker y capturas se ejecutan cuando toca, sin aplazarlos.

## Primer paso tras la aprobación
1. Crear `tasks.md` (una sección por PR, casillas por fase).
2. Arrancar el PR 1 (`feat/screens-shell-v2`) desde `origin/develop` actualizado.
3. Dejar escrito en `tasks.md` el primer vistazo móvil de cada pantalla al abrir su PR `V`.

---
Versión: 0.2.0 (aprobada) — 2026-11-16
