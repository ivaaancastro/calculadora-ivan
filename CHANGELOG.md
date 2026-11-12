# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Rediseño — Capa 3: piel v2 «Panel» (`feat/ui-skin-v2-visual`), PR 5 de 7: dirección visual
- `feat(ui-skin-v2):` paleta «Panel» (bloques `@tokens:skin-v2` de `tokens.css`: superficies, rampa de texto, semáforo cobalto/carmín/ámbar, radios 12/14, sombras y escala tipográfica) validada por `scripts/check-palette.mjs` (contraste WCAG y ΔE entre series).
- `feat(ui-skin-v2):` capa de piel `src/styles/skin-v2.css`, solo bajo `html[data-ui="v2"] [data-skin]`; `data-skin="dashboard"` en `AdvancedAnalytics` y `data-skin="calendar"` en `CalendarPage` (y en su PMC flotante). Clases `section-header` y `chip`, inertes en v1.
- `feat(ui-skin-v2):` `chartTheme.v2`, `getChartTheme(theme, skin)` y `ChartSkinProvider`/`useChartSkin`; `useChartTheme` lee la piel del contexto. Test que valida v2 contra los bloques de `tokens.css`.
- `refactor(calendar):` la rampa semanal usa `text-legacy-tsb-up` y `text-danger-light` (mismos valores en v1). `lint:colors` 756 → 754.
- Verificación: volcado `full` frente a `develop` = **0 diferencias**; unit 195, integración 10, E2E macOS 109 ✓. Capturas: 48 de v1 idénticas; de v2 cambian las 12 previstas (Dashboard y Calendario) y además 6 móviles (actividades, rendimiento y salud × 2 temas) solo porque el pager móvil mide el alto de la pestaña más alta y Dashboard/Calendario crecen 34 px.

### Rediseño — Capa 3: shell (`spec-rediseno-02-c3`), PR 3 de 7: cierre de la estructura
- `docs(ui-shell):` cierra la rama de estructura (PRs #70–#72): cobertura en `tasks.md`, spec con RF1–RF8 y RF12–RF14 marcados (RF9–RF11 quedan para la piel), `paridad.md` con **D-01 cerrado** y **D-03 retirado**, roadmap con «Hecho (2026-11-11), estructura» y `MEMORY.md` al día.
- Sin cambios de código: `src/` queda idéntico a `develop`, así que no hay diferencias de volcado ni de capturas. Referencia al cerrar la shell: unit 187, integración 10, E2E macOS 105 ✓, Docker 153 ✓, táctil 113, `lint:colors` 756/3/100/9/168, `lint:ui` 14.

### Rediseño — Capa 3: shell (`spec-rediseno-02-c3`), PR 2 de 7: cabecera y acciones
- `refactor(ui-shell):` la cabecera mide una altura fija de **60 px** (D4 revisado tras medir 81 px en móvil y 63,5 en escritorio: el botón de Strava se partía en dos líneas) y lleva solo identidad con menú, pestañas de escritorio, tema y Strava. Desaparecen los cinco controles de utilidad de escritorio (importar CSV, añadir manual, borrar DB, sus separadores y cerrar sesión) y el cierre de sesión duplicado de móvil.
- `feat(ui-shell):` «Borrar todas las actividades» pasa a Ajustes → Seguridad y Datos, con su `confirm` y botones de 44 px.
- `refactor(ui-shell):` el botón de Strava no se parte (`whitespace-nowrap`) y en móvil dice «Conectar», con el mismo nombre accesible.
- `refactor(ui-shell):` el histórico, el detalle de actividad y la cabecera del detalle calculan su alto con `--nav-h-total`; el pager móvil por fin encaja (antes asumía 56 px bajo una cabecera de 81).
- `docs(ui-shell):` D3: «Importar CSV» se retira en vez de cablearse, porque nunca estuvo implementado (`processFile` era un `console.log`); D-03 queda como «acción retirada» en `paridad.md`.
- Capturas de v1 regeneradas una sola vez (D1): 42 de 48 (la landing no cambia), revisadas una a una y listadas en el PR. Volcado `full` frente a `develop`: 4.038 diferencias, todas de caja y tipografía de la cabecera y del contenido que se desplaza, **ninguna de color**.

### Rediseño — Capa 3: shell (`spec-rediseno-02-c3`), PR 1 de 7: tokens, z-index y D-01
- `refactor(ui-shell):` tokens `--nav-h`, `--nav-h-total`, `--bottom-nav-h`, `--bottom-nav-gap` y `--bottom-nav-reserve`, y escala `--z-*` en `tailwind.config.js` (sticky 20, nav 30, nav-menu 40, sheet 50, tooltip 55, modal 60, floating 80, map 400, toast 9999).
- `refactor(ui-shell):` 12 elementos pasan de números de capa sueltos a tokens, conservando quién gana; las dos marcas internas de `TrainingBalanceCard` bajan a 10/20.
- `fix(ui-shell):` **D-01 cerrado**: `MobileSwipePager` excluye `.hide-scrollbar` y `gestures.spec.js` deja de ser un fallo esperado.
- `test(ui-shell):` `e2e/shell.spec.js` (alturas y capas) y `src/__tests__/unit/shellTokens.test.js`. Sin cambio de aspecto: las 48 capturas quedan idénticas y el volcado solo difiere en `z-index` (excepción aprobada).

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), cierre
- `docs(ui-primitives):` Capa 2 implementada (PRs #60 a #68). 14 exportaciones en `src/components/ui/` en 8 familias, todas con uso: `Card`/`SectionHeader`, `Stat`/`StatTile`, `Segmented`, `Input`/`Select`, `Button`/`IconButton`, `Modal`, `ChartTooltip`/`chartTooltipStyle`/`InfoTooltip` y `LoadingState`. Retirados 14 clases sin uso de `index.css`, `MetricHelp`, `ios-card`, `ios-touch`, `ios-header`, `IosCard`, `MetricCard`, `PillTab`, `tooltipStyleFor` y los 2 `LazyFallback`. Colores sueltos: palette 865 → 760, arbitrary 9 → 3, rgb 11 → 9, dark 188 → 170. Unitaria 130 → 182, E2E 79 → 87. En los 9 PR el volcado ampliado frente a `develop` dio 0 diferencias y las capturas no cambiaron. Pendientes para las capas siguientes en `docs/branches/feat/ui-primitives/tasks.md`.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 8 de 8: estados de carga
- `feat(ui-primitives):` `LoadingState` con 3 variantes que copian las recetas actuales: `inline` (los 2 fallbacks de `Suspense`), `screen` (carga del Dashboard) y `boot` (arranque de `App`).
- `refactor(ui-primitives):` los 4 sitios usan la primitiva y `LazyFallback` se retira (añadido a `ui-retired.json`). Los textos de carga no cambian: los E2E los usan para esperar a que la pantalla esté lista.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 7 de 8: tooltip de gráfica
- `feat(ui-primitives):` `ChartTooltip` (solo el marco, con `glass`, `dark`, `dark-history` y `card`) y `chartTooltipStyle`, que sustituye a `tooltipStyleFor`; `fitness/fitnessConstants.js` se borra. `InfoTooltip` pasa a `ui/` con tokens exactos.
- `refactor(ui-primitives):` los 5 tooltips propios usan el marco y conservan sus filas hasta la Capa 3.
- `feat(ui-primitives):` D4 d: `InfoTooltip` se abre al tocar y se cierra con otro toque, tocando fuera o con Escape; la burbuja lleva `role="tooltip"`. Prueba nueva `e2e/tooltip-touch.spec.js` (el tooltip de gráfica se abre al tocar en Dashboard, Salud y las 4 de Rendimiento).

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 6 de 8: modal
- `feat(ui-primitives):` `Modal` con una `variant` por modal (`sheet`, `auth`, `planner`, `viewer`), sin portal; los velos pasan a los tokens `scrim` a `scrim-4`.
- `refactor(ui-primitives):` los 4 modales usan la primitiva.
- `feat(ui-primitives):` D4: `role="dialog"`, `aria-modal` y `aria-labelledby`, Escape para cerrar el de arriba y bloqueo del desplazamiento del fondo. Prueba nueva `e2e/modal.spec.js` (4 pruebas).

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 5 de 8: botones
- `feat(ui-primitives):` `Button` (`ghost`, `inverse`, `link-muted`, `danger-text`) e `IconButton` (`soft`, `ghost`, `bare`), con `type="button"` por defecto y `label` obligatoria en el de icono.
- `refactor(ui-primitives):` 17 botones del Calendario, el detalle y el acceso usan la primitiva. Tokens nuevos `faint-fixed` y `fill-hover`; `segmented-mini-off-hover` pasa a `body-soft-fixed`.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 4 de 8: campos
- `feat(ui-primitives):` `Input` y `Select` con las variantes `filled`, `search`, `cell`, `cell-bare` e `inline`; reenvían `ref` y las props nativas.
- `refactor(ui-primitives):` 22 de los 44 campos (modal de añadir, historial, bloques y pasos del Calendario y Ajustes). El gris del buscador pasa al token `ink-4-fixed` y el anillo al token `positive`.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 3 de 8: control segmentado
- `feat(ui-primitives):` `Segmented` con `pill`, `card` (`md-wide`, `md`, `sm`, `xs`) y `mini`; cada opción lleva `aria-pressed` (D4 a) y `PillTab` se retira.
- `refactor(ui-primitives):` 22 opciones del detalle, de Rendimiento y del planificador. Tokens `segmented-off(-hover)`, `segmented-mini-off(-hover)` y `fill-segmented-2`.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 2 de 8: stats del Dashboard
- `feat(ui-primitives):` `Stat` y `StatTile` (`lg`, `sm`) y retirada de `MetricCard`; tokens `hairline-5` y los `metric-*-tile` de ATL, TSB, ACWR, rampa, monotonía y volumen.
- `refactor(ui-primitives):` 26 stats del detalle y 8 fichas del Dashboard usan la primitiva. Las 8 de biomarcadores de Salud se quedan con `Card pressable` (Capa 3).

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 1 de 8: tarjetas
- `feat(ui-primitives):` `Card` (`grouped`, `panel`, con `pressable` y `divided`) y `SectionHeader`; la sombra pasa al token `--shadow-card` (`shadow-card`).
- `refactor(ui-primitives):` 50 tarjetas y 13 cabeceras de sección usan la primitiva; se retiran `ios-card`, `ios-touch`, `ios-header` e `IosCard`. Las tres clases estaban en `@layer utilities` y ganaban a las utilidades de Tailwind: el borde y el texto de peligro de "Zona de peligro" y el `mb-3` de 4 títulos de Salud no se veían y se retiran con ellas.

### Rediseño — Capa 2: primitivas (`spec-rediseno-02-c2`), PR 0 de 8: infraestructura
- `feat(ui-primitives):` `src/components/ui/` (`index.js` y `cx.js`), `scripts/ui-inventory.mjs` (recetas por elemento) y `scripts/check-ui.mjs` con `npm run lint:ui` y su paso en CI (uso de cada exportación, clases y componentes retirados en `scripts/ui-retired.json`, y `className` acotado a colocación y espaciado).
- `test(e2e):` el volcado de estilos admite `STYLE_DUMP_PROPS=full` (tipografía, caja, bordes, radios, disposición, efectos e interacción), con estados nuevos del planificador, el visor de entreno y los tooltips activos: 104 volcados. Dos volcados seguidos de `develop`: 0 diferencias.
- `refactor(ui-primitives):` se retiran 14 clases sin uso de `index.css` (incluida la animación `map-pulse`), `MetricHelp` y 5 tokens que solo usaban esas clases.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), cierre
- `docs(ui-tokens):` Capa 1 implementada (PRs #52 a #58). Cobertura final: texto 95,3 %, bordes 80,5 %, superficies 81,3 %, acentos 64 %, gráficas 95 %; pares `dark:` sueltos 1.314 → 188. Lista de lo pendiente para las capas siguientes en `docs/branches/feat/ui-tokens/tasks.md`.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 6 de 6: gráficas
- `refactor(ui-tokens):` las gráficas de Recharts (Dashboard, Rendimiento, Salud, detalle de actividad), el SVG de la PMC del Calendario y el mapa de Leaflet leen sus colores de `useChartTheme()`; 156 colores pasan a `chartTheme` (72 tokens: series, deportes, zonas, anatomía, tooltip, mapa y PMC; 56 nuevos en `src/styles/tokens/charts.json`). Sin cambios visibles.
- `chore(ui-tokens):` `scripts/codemods/charts.mjs` (asignación por línea que comprueba cada valor) y prueba de paridad `chartTheme` ↔ `tokens.css` sobre todos los bloques.
- `docs(ui-safety-net):` D-10, las gráficas no cambian en oscuro y cada pantalla usa su propia anatomía.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 5b de 6: acentos de categoría
- `refactor(ui-tokens):` 237 pares de acento pasan a 84 tokens de categoría (`sport-*`, `hr`, `power`, `pace`, `speed`, `cadence`, `load`, `vo2`, `hrv`, `sleep`, `steps`, `section-*`, `form-*`, `strava`, `today`, `legacy-*`) y a los de estado y métricas, con `scripts/codemods/categories.mjs` y una asignación por línea revisada a mano. Sin cambios visibles.
- `chore(ui-tokens):` el codemod admite una tabla por expresión y no migra un par `dark:` de base junto a una clase de estado sin `dark:` (caso D-08).
- `docs(ui-safety-net):` D-09, colores distintos para la misma categoría según la pantalla.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 5a de 6: acentos de estado y métricas
- `refactor(ui-tokens):` 144 usos de estado pasan a 43 tokens con significado (`action`, `danger`, `positive`, `warning`, `action-ios`…) con `scripts/codemods/accents.mjs` y una lista de inclusión revisada a mano. Sin cambios visibles.
- `refactor(ui-tokens):` CTL/ATL/TSB fuera de las gráficas usan `metric-*` y `legacy-*` (13 tokens en `metrics.json`).
- `chore(ui-tokens):` el codemod migra clases sueltas sin pareja `dark:` (con su opacidad) y admite exclusiones.
- `docs(paridad):` D-07, colores distintos para la misma métrica según la pantalla (preexistente).

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 4 de 6: superficies
- `refactor(ui-tokens):` 266 de 336 pares de fondo claro/oscuro, incluidos los grises de iOS en hex, pasan a 43 tokens (`surface`, `sunken`, `fill`, `inverse`, `glass`, `canvas`…) con `scripts/codemods/surfaces.mjs`. `index.css` (`glass-*`, `ios-*`, `body`, `liquid-glass`, scrollbars) usa los tokens. Sin cambios visibles.
- `chore(ui-tokens):` el codemod lee los `@apply` de CSS y los colores en hex.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 3 de 6: texto
- `refactor(ui-tokens):` 540 de 577 pares de texto neutro claro/oscuro (`text`, `placeholder:`, `group-hover:`…) pasan a 17 tokens (`ink`, `ink-2`, `ink-3`, `ink-4`, `body`, `faint`, `ink-inverse`…) con `scripts/codemods/text.mjs`. Sin cambios visibles.
- `chore(ui-tokens):` CLI común de los codemods (`scripts/codemods/family.mjs`); la regla de precedencia distingue las ramas opuestas de un ternario y propaga el bloqueo a lo que coexiste con un literal no migrado.
- `test(e2e):` el volcado de estilos también fuerza `:hover` en los `.group` para cubrir `group-hover:`.

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 2 de 6: bordes
- `refactor(ui-tokens):` 167 pares de borde claro/oscuro (`border`, `divide`, `ring`, `outline`) pasan a 19 tokens (`line`, `line-soft`, `line-muted`, `line-strong`, `hairline`…) con un codemod reproducible (`scripts/codemods/borders.mjs`). Sin cambios visibles.
- `test(e2e):` el volcado de estilos fuerza `:hover`, `:focus`, `:focus-visible` y `:active`.
- `docs(paridad):` D-08, el borde de foco de los campos de acceso no cambia en modo oscuro (preexistente).

### Rediseño — Capa 1: tokens y tema (`spec-rediseno-02-c1`), PR 1 de 6
- `feat(ui-tokens):` `src/styles/tokens.css` (canales RGB, claro y `.dark`, valores actuales) expuesto en `tailwind.config.js` con soporte de opacidad (`src/styles/tailwindTokens.cjs`), y `chartTheme`/`useChartTheme` para Recharts en `src/components/charts/`. Sin cambios visibles: ningún componente los usa todavía.
- `ci:` `npm run lint:colors` (`scripts/check-colors.mjs`): trinquete por archivo de colores sueltos con línea base en `scripts/color-baseline.json`.
- `test(e2e):` proyecto `tablet` (768 px) con 16 capturas nuevas y prueba de layout; herramienta de volcado de estilos calculados (`e2e/tools/style-dump.spec.js` + `scripts/style-diff.mjs`) para demostrar migraciones sin cambios, incluida la rejilla de gráficas, el mapa y la vista "Forma" del Calendario.

### Rediseño — Capa 0: red de seguridad de UI (`spec-rediseno-02-c0`)
- `test(e2e):` regresión visual con `toHaveScreenshot` de 8 pantallas (landing, dashboard, rendimiento, calendario, actividades, detalle, salud, perfil) a 390 y 1440 px, en claro y oscuro (32 capturas de referencia generadas en Linux con la imagen oficial de Playwright).
- `test(e2e):` pruebas de layout (desbordamiento horizontal y barras fijas que tapan contenido), informe táctil de controles < 44 px (sin bloquear) y gestos de deslizamiento (D-01 registrado como fallo esperado).
- `test(e2e):` módulo único de datos simulados con fecha fija (`e2e/support/mockApp.js`); E2E migrados a rol y etiqueta, con comprobaciones reales en lugar de ramas condicionales. Proyecto móvil y puerto propio (5273).
- `ci:` el job E2E corre en la imagen oficial de Playwright; nuevos scripts `test:e2e:docker` y `test:e2e:update`.
- `docs(ui-safety-net):` lista de paridad por pantalla con los defectos conocidos D-01, D-03 a D-06.
- `chore(repo):` `playwright-report/` y `test-results/` dejan de versionarse; se ignoran `.playwright-mcp/` y `.taste-skill/`; ESLint ignora carpetas locales de agentes.
- `fix(ui):` "FormaLab" pasa a "Forma" (Navbar, landing, perfil, correo confirmado) y se permite el zoom (`maximum-scale`/`user-scalable=no` fuera del viewport).
- `fix(ui):` etiquetas asociadas (`htmlFor`/`id`) en `AddActivityModal` y en el modal de acceso.
- `fix(config):` `VITE_GEMINI_API_KEY` deja de ser obligatoria al arrancar (aviso en consola); un build de producción solo con las variables de Supabase muestra la landing.

### Seguridad
- `fix(security):` remover `.env` del rastreo de git (`git rm --cached`), agregar `.env` y `.env.*` a `.gitignore`, crear `.env.example` sin valores secretos y validar variables de entorno críticas al arranque (`spec-audit-01`).

### Pruebas
- `test(utils):` añadir tests unitarios para `tssEngine.js`, `parser.js`, `formatDuration.js` y `fitnessStatsEngine.js` en `src/__tests__/unit/` (`spec-audit-02`). Cobertura de `src/utils/` del 0% al ~40%.
- `test(services,store):` añadir tests unitarios para `src/services/ai.js` (mock de Gemini) y `src/store/useAppStore.js` (Zustand) en `src/__tests__/unit/` (`spec-audit-03`).
- `test(e2e):` añadir pruebas E2E críticas con Playwright (`e2e/auth.spec.js`, `e2e/dashboard.spec.js`, `e2e/activities.spec.js`, `e2e/strava.spec.js`, `e2e/export.spec.js`, `e2e/account.spec.js`) que cubren login/logout, dashboard autenticado con métricas PMC, flujo de actividades, sincronización Strava mockeada y exportación CSV. Todas las APIs externas se mockean con `page.route()` para ser deterministas y no depender de credenciales reales ni red externa (`spec-e2e-01`).

### Refactor
- `refactor(dashboard):` extraer `Dashboard.jsx` (313 líneas) en subcomponentes SRP (`EmptyState`, `UploadStatusBanner`, `MobileTabsView`, `DesktopRoutesView`, `ActivitySubRoutes`, `ActivityRouteWrapper`) dejando un shell de orquestación (`spec-audit-04`).
- `fix(dashboard):` corregir imports faltantes (`AdvancedAnalytics`, `HistoryList` en `Dashboard.jsx`; `ActivityRouteWrapper` en `ActivitySubRoutes.jsx`) que provocaban `ReferenceError` y rompían la app en el navegador (`spec-fix-01`).
- `refactor(hooks):` extraer `useActivities.js` (617 líneas) y `useWellnessInfo.js` (493 líneas) en sub-hooks SRP (`useActivitiesData`, `useStravaSync`, `useIntervalsAutoSync`, `usePMCMetrics`, `useWellnessData`, `useWellnessAnalytics`) dejando hooks orquestadores con API pública idéntica (`spec-audit-05`).
- `feat(typescript):` migrar progresivamente a TypeScript: `tssEngine.ts`, `parser.ts`, `formatDuration.ts`, `fitnessStatsEngine.ts`, `useAppStore.ts`, `ai.ts` con tipos estáticos estáticos, `tsconfig.json` creado con `allowJs` para transición progresiva (`spec-audit-06`).
- `test(services,store):` añadir tests unitarios para `src/services/ai.js` (mock de Gemini) y `src/store/useAppStore.js` (Zustand) en `src/__tests__/unit/` (`spec-audit-03`).

### Base de datos
- `feat(database):` consolidar 8 migraciones SQL con versionado ordenado (`000_` a `008_`), crear tabla `schema_migrations` para rastrear migraciones aplicadas, consolidar definición de `wellness_data` (UUID) y añadir `migrations/README.md` (`spec-audit-07`).

### IA
- `feat(ai):` añadir modo de respuestas estructuradas a `askGemini` (parámetro opcional `structured`, schema JSON, tipo `GeminiStructuredResponse`, pruebas unitarias y docs) (`spec-001`).

### Edge Function
- `feat(edge-function):` endurecer `intervals-proxy`: rate limiting por usuario (Deno KV, 60 req/min), lista blanca de endpoints (`wellness`, `athlete`, `activities`), timeout de 10s en `fetch`, CORS restringido, manejo seguro de respuestas no JSON y errores sin exponer internos (`spec-audit-08`).

## [0.1.0] — 2026-11-05

### Implementado
- Sistema de trabajo SDD (Specification-Driven Development) con agentes.
- Archivos base: `MEMORY`, `AGENTS`, `README.md`, `CHANGELOG.md`.
- Carpetas: `docs/` (arquitectura, specs, API, guías, SDD) y `skills/` (una por agente).
- CI actualizado para ejecutar en `develop` y en PRs (no solo en `main`).
- Skills obligatorias definidas: `vercel-react-best-practices`, `web-design-guidelines`,
  `apple-design`, `vercel-composition-patterns`, `writing-guidelines`.
- MCPs obligatorias definidas: `context7`, `opencode`.

### Contexto del proyecto (v0.1.0)
- App PWA de rendimiento deportivo/triatlón ("Forma").
- Stack: React 19, Vite 7, Tailwind CSS, React Router DOM 7, Zustand, TanStack Query,
  Supabase, Google Gemini, Playwright, Vitest.
- Estructura: `src/components`, `src/hooks`, `src/services`, `src/store`, `src/utils`,
  `src/__tests__`, `supabase/functions`, `migrations`, `e2e`, `scratch`.

---
Versión: 0.1.0 — 2026-11-05