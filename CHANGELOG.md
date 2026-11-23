# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added — Fase Premium D2, Dashboard (`feat/premium-dashboard-rejilla`, PR 3)
- `feat(dashboard):` rejilla de 12 columnas en escritorio (≥ 1024 px, v2): héroe y KPI a ancho completo, gráfica de evolución (8 col, 380 px) con panel lateral fijo (4 col) de métricas secundarias, contenido centrado a 1440 px. Cierra JER-1 y DIS-1 del Dashboard.

### Added — Fase Premium D2, Dashboard (`feat/premium-dashboard-kpis`, PR 2)
- `feat(dashboard):` KPI primarios v2 (`KpiCard`: ATL, TSB y ratio de carga) con cifra animada, variación a 7 días en verde/ámbar/rojo, sparkline de 28 días y chip de zona para el ACWR; secundarios en «libro» sin cajas (`kpiTrend`).

### Added — Fase Premium D3, Rendimiento (`feat/premium-rendimiento`, PR 2)
- `feat(rendimiento):` receta de tarjeta única en v2 (radios concéntricos, título 13/600, rótulos ≥ 11 px, ancho 1200 px) y estados vacíos que explican qué falta (estado de entreno, VFC, pronóstico).

### Added — Fase Premium D4, Salud (`feat/premium-salud-historial`, PR 3)
- `feat(salud):` historial v2: tendencia con área en degradado y banda de recuperación óptima, detalle del día con cifra protagonista, tira de días con filete.

### Added — Fase Premium D4, Salud (`feat/premium-salud-biomarcadores`, PR 2)
- `feat(salud):` biomarcadores v2 con jerarquía por estado (`biomarkerStatus`, tarjetas en atención al principio), cifra de 28–32 px, variación verde/rojo y `Sparkline` de 7 días (FC reposo, VFC, sueño, pasos, peso).

### Added — Fase Premium D2, Dashboard (`feat/premium-dashboard`, PR 1)
- `feat(dashboard):` `FormHero` (solo v2): resumen narrativo del estado de forma (`buildFormSummary`, reglas deterministas), CTL como cifra protagonista con variación a 28 días, chip de estado y selector de rango también en móvil. Spec y plan en `docs/branches/feat/premium-dashboard/`.

### Added — Fase Premium D3, Rendimiento (`feat/premium-rendimiento`, PR 1)
- `feat(rendimiento):` héroe «Hoy» (solo v2) con resumen narrativo y hasta 4 KPI (carga 7d, TSB, VFC, eFTP), tarjetas agrupadas en Hoy / Potencia / Marcas / Volumen con encabezado; `buildStatsNarrative` con tests. Spec en `docs/branches/feat/premium-rendimiento/`.

### Added — Fase Premium D4, Salud (`feat/premium-salud`, PR 1)
- `feat(salud):` `HealthHero` (solo v2): frase de estado narrativa y recuperación como cifra protagonista con filete del tono; banco de energía con cifra grande y marcas 30/60 %; «Pilar 0N» oculto. Spec y plan en `docs/branches/feat/premium-salud/`.

### Added — Fase Premium D1, detalle de actividad (`feat/premium-detalle`, PR 1)
- `feat(detalle):` `DetailHero` (solo v2): título grande, tres cifras protagonistas por deporte (`pickHeroMetrics`), «ledger» de métricas sin cajas, filete del color del deporte y entrada en cascada; la cabecera pasa a una fila de controles. Spec y plan en `docs/branches/feat/premium-detalle/`.
- `feat(detalle):` PR 3: medidores del impacto con marcas, tarjetas unificadas y tabla de laps con mejor vuelta marcada (solo v2).
- `feat(detalle):` PR 2: HUD de telemetría de altura estable, esqueleto de carga v2 en lugar del spinner y nota de series ausentes (potencia/FC) en las gráficas.

### Added — Fase Premium C, capa de gráficas Forma (`feat/premium-charts`, PRs #111–#115)
- `feat(charts):` lenguaje base v2: rejilla continua desvanecida, tooltip de cristal común (`[data-chart-tooltip]`), `useChartMotion` (entrada 700 ms; apagada con `prefers-reduced-motion` y en navegadores automatizados), `chartFigureProps`/`summarizeSeries` (alternativa textual), `ChartSkeleton`; aplicado a `EvolutionChart`.
- `feat(charts):` `Sparkline` y `role="img"` en `AppleRingGauge`; banda de TSB óptimo y zona de proyección en `EvolutionChart`; `ZoomRange` sincronizado en el detalle; `ActivityHeatmap` en el Calendario. Todo solo en v2.

### Changed — Fase Premium B, PR 2 (`feat/premium-palette`)
- `feat(charts):` paleta Forma v2 (azul, naranja, esmeralda, violeta, rosa, cian, ámbar) validada con `dataviz` en claro y oscuro (ΔE CVD ≥ 10, banda de luminosidad); `pace`/`sleep` dejan de repetir tono con CTL/ATL; deporte único en `SPORTS` y `DISTRIBUTION`.
- `refactor(colors):` zonas del calendario, Rendimiento, Perfil y predicciones leen `chartTheme`; `lint:colors` baja la base de 8 archivos; se elimina un prop `dark:stroke` inválido.
- `feat(ui):` primitivas `Skeleton`, `EmptyState` y `ErrorState` (recetas en `stateClasses.js`) usadas en Actividades, Salud, Balance de entrenamiento, Detalle y `ErrorBoundary`.

### Added/Changed — Fase Premium B, PR 1 (`feat/premium-tokens`)
- `feat(skin-v2):` radios concéntricos 6/8/12/16/20, sombras de reposo en capas, elevación `--elev-2/3` (claro/oscuro), lienzo oscuro más profundo que la tarjeta, mínimo tipográfico 10 px, foco global, `text-wrap`, `transition-all` acotado en v2, pulsación única 0.97, contorno neutro en mapas/imágenes. Solo `html[data-ui="v2"]`.
- `chore(lint):` `npm run lint:motion` (trinquete de `transition-all`) en `verify` y CI.

### CI — style-diff en jobs paralelos (`ci/style-diff-paralelo`)
- `ci(verify):` `style-after` y `style-before` (solo si no hay baseline publicado) corren en paralelo y `style-diff` los compara: ≈8 min en lugar de ≈15. Spec: `docs/branches/ci/style-diff-paralelo/`.

### Docs — Fase Premium A (`docs/premium-auditoria`)
- `docs(premium):` auditoría de diseño priorizada (`docs/branches/feat/premium-design/auditoria.md`): color, bordes, sombras, tipografía, jerarquía, distribución, gráficas, estados, movimiento y accesibilidad, con prioridad, esfuerzo y fase destino. Sin cambios en `src/`.

### Docs — Fase Premium (`docs/premium-spec`)
- `docs(premium):` spec y plan de la Fase Premium (`docs/branches/feat/premium-design/`): A auditoría de diseño, B tokens y acabado v2, C capa de gráficas Forma (lenguaje visual de bklit-ui sin instalar el paquete), D rediseño de pantallas (bloqueada hasta referencias). Anexo con el checklist de `make-interfaces-feel-better`. Decisiones D1..D10 pendientes de aprobación.
- `docs(premium):` roadmap reordenado (cerrar en curso → Premium → Capa 6 → Capa 7 → deudas → opcionales) con línea «Siguiente paso». Sin cambios en `src/`.

### Detalle de actividad: Coach Insights con texto (`fix/detalle-coach-insights`)
- `fix(detalle):` la tarjeta «Coach Insights» ya no sale vacía: frase nueva para IF 0,70–0,85 (intensidad moderada) y para «Mantenimiento»; la tarjeta no se pinta si no hay frases.
- Las frases de IF y de pico de 5 min solo se generan en bici (donde el detalle por deporte muestra potencia). Lógica en `src/utils/coachInsights.js`.

### Borrar actividad con confirmación (`feat/detalle-borrar-actividad`)
- `fix(detalle):` la papelera del detalle estaba desconectada (`ActivityRouteWrapper` no pasaba `onDelete`); ahora abre un diálogo de confirmación y, al borrar, vuelve al origen (Actividades, Calendario o `/history` por URL directa) sin pantalla en blanco.
- `fix(actividades):` la papelera de la lista de Actividades también confirma antes de borrar.
- Diálogo `ConfirmDeleteActivityModal` (`Modal` variante `confirm`, `trapFocus`, foco inicial en Cancelar, Esc, sin cierre al tocar fuera) con aviso de Strava si hay `strava_id`; si falla el borrado queda abierto para reintentar. `deleteActivity` devuelve `true`/`false`. Botones `secondary` y `danger` nuevos en `Button`. Spec: `docs/branches/feat/detalle-borrar-actividad/`.

### Detalle de actividad por deporte (`feat/detalle-por-deporte`)
- `feat(detalle):` el detalle se adapta al deporte (bici, carrera, senderismo/caminata, fuerza y genérico, detectado por `activity.type`, incluidos los tipos de Strava sin traducir): resumen, pestañas y bloques distintos; Kcal totales en todos; métricas sin dato no se muestran.
- ClimbPro, bloque de potencia (IF/NP/Trabajo/W/EF) y zonas de potencia solo en bici; carrera con Drift y sin EF; senderismo/caminata con ritmo; fuerza sin Mapa ni Intervalos; sin GPS no hay pestaña Mapa.
- Zonas de ritmo en carrera con selector FC / Ritmo (y FC / Potencia en bici) en la pestaña Detalle, calculadas con `calcPaceZones` y el ritmo umbral de Perfil.
- Perfil metabólico por IF (bici) o % de FC máx. (carrera, senderismo); se oculta el bloque fijo «Estado de recuperación».
- Matriz deporte × bloque en una tabla de datos: `src/utils/activityMetricsBySport.js`. Spec: `docs/branches/feat/detalle-por-deporte/`.

### Detalle de actividad: tarjetas explicativas de métricas (`feat/tarjetas-explicativas-detalle`)
- `feat(detalle):` cada métrica del resumen del detalle (Carga/TSS, IF, NP, Trabajo, FC, ritmo…) se pulsa y abre una tarjeta con su explicación: popover en escritorio y bottom-sheet en móvil, con teclado, foco, Escape y zona táctil ≥ 44 px en v2. Sin ícono `?`: el área es todo el `Stat`.
- Textos centralizados en `src/utils/activityMetricDescriptions.js` (reutilizables en Dashboard y Rendimiento); componente `MetricTooltip` en `src/components/ui/`.
- Tests: unitarios de textos y de `MetricTooltip`, e integración del detalle.
- Spec: `docs/branches/feat/tarjetas-explicativas-detalle/`. El detalle por deporte queda fuera (rama `wip/detalle-por-deporte`).

### Fix — Detalle de actividad: «Volver» y mapa (`fix/detail-back-map`)
- `fix(detalle):` «Volver» no hacía nada: `ActivityRouteWrapper` no pasaba `onBack` (regresión de `83a4a44`). Ahora vuelve a la pantalla de origen (`navigate(-1)`) o, con URL directa, a Actividades; también pasa `fetchStreams` con el nombre correcto.
- `fix(mapa):` CARTO (`basemaps.cartocdn.com`) devuelve teselas con marca de agua «API KEY REQUIRED»; Light y Dark usan ahora Esri World Light/Dark Gray Base (sin clave).
- `test:` integración del wrapper y `e2e/detail-back.spec.js` (Actividades, Calendario, URL directa; v1 y v2).

### Fix — objetivos táctiles ≥ 44 px en v2 (`fix/touch-targets-v2`)
- `fix(v2):` en móvil (< 640 px) y solo con `data-ui="v2"`, el menú de perfil, el botón de tema, «Conectar», los selectores de rango (Dashboard y Rendimiento), el buscador y los selects de Actividades, «+ Añadir manual» y «Volver» (Perfil) miden ≥ 44 px. Cabecera intacta en 60 px; v1 sin cambios (`style-diff` 0).
- `test(e2e):` `touch.spec.js` admite `TOUCH_UI=v2` y lista tamaños y desborde. 14 capturas v2 móviles regeneradas a propósito.

### Rediseño — Capa 5 (`docs/screens-cierre`), PR 9 de 9: cierre documental
- `docs(screens-v2):` paridad v1/v2 de todas las pantallas comprobada contra el código y los tests (`paridad.md`), `tasks.md` completo, spec marcada como implementada, roadmap (Capa 6, Capa 7 y fase futura) y `MEMORY.md` al día. D8 cerrada: el interruptor «Vista previa v2» sigue en Ajustes → General hasta la Capa 6.
- `docs(screens-v2):` guion de la pasada completa en iPhone real (`guion-iphone.md`); la ejecuta el usuario y queda pendiente. v2 sigue opt-in (D12).
- Sin cambios en `src/`. Verificación: lint, `lint:colors` 743/3/100/8/165 (sin subir), `lint:ui` 14, unit 240, integración 24 y build en verde.

### Rediseño — Capa 5 (pantallas en v2 «Panel»), PR 3–8c: pantallas
Todo bajo `html[data-ui="v2"]` (v1 intacta, volcado de estilos = 0); capturas v2 regeneradas solo en Docker y aprobadas por pantalla (D7).
- `feat(calendario):` Calendario en v2: días vacíos compactos, hoy en cobalto, controles a 44 px, sesiones planificadas discontinuas y modales de plan y rutina con la piel (PR 8c, #97). Antes, la lógica y las vistas salen de `CalendarPage` (2.348 → ~150 líneas) a utils, hooks y `components/calendar/` (PR 8a #88, PR 8b #89).
- `feat(detalle):` Detalle de actividad en v2: cabecera, pestañas, capas del mapa y picos a 44 px, gráficas con el tema v2 (PR 7b, #96). Antes, `ActivityDetailPage` se parte en `activity/detail/` (PR 7a, #85).
- `feat(salud):` Salud en v2: pilares en filas compactas, anillos a 96 px, banco de energía plano, movimiento de anillos y contador solo en v2 y con `prefers-reduced-motion` respetado (PR 6b, #95). Antes, `HealthPage` se parte en `components/health/` (PR 6a, #84).
- `feat(rendimiento):` Rendimiento en v2: orden de tarjetas en móvil (estado, VFC, umbrales, balance), tarjetas compactas y pestañas a 44 px (PR 5, #93).
- `feat(dashboard):` Dashboard en v2: primer vistazo móvil (forma, 4 métricas, gráfica) con «Tendencia y Capacidad» plegada y `FuelingPanel` ajustado (PR 4b, #94). Antes, `TAB_PATHS` y las vistas escritorio/móvil en una sola fuente (PR 4a, D17, #91).
- `feat(actividades):` Actividades en v2: filtros en una fila, recuento, estado vacío, borrar y cerrar modal a 44 px y panel del alta manual (PR 3, #92).

### Rediseño — Capa 5 (shell y Ajustes), PR 1–2b
- `feat(shell):` `Navbar`, `BottomNav` y lienzo en v2 «Panel» (superficie sólida con borde de 1 px); `--nav-h` (60 px) intacto (PR 1, #87).
- `feat(profile):` Ajustes en v2 con selector de sección en la página (solo móvil) y primer vistazo (PR 2b, #90). Antes, `ProfilePage` (1.048 → 370 líneas) se parte en `pages/profile/` (PR 2a, #86).
- `docs(screens-v2):` spec y plan de la Capa 5 (PR 0, #83): D8 y D13–D17.

### Rediseño — Capa 4 (`docs/landing-cierre`), PR 5 de 5: cierre
- `perf(app):` `Dashboard` se carga con `React.lazy`; un visitante sin sesión ya no descarga la app autenticada ni `recharts`. Landing: JS parseado 1010 → 513 KiB, JS comprimido 303 → 155 KiB; `perf.mjs` sin FAIL. Sin cambio de estilos (el CSS conserva su hash) ni de capturas (E2E Docker 234 ✓).
- `docs(landing):` verificadores de la taste-skill con hallazgos corregidos y descartados con motivo; Lighthouse (rendimiento 95–100, accesibilidad/buenas prácticas 100, SEO 91) y axe (0 violaciones en 20 escenas: landing, modal ×3 y correo confirmado, claro/oscuro, 390/1440). Deuda anotada: `robots.txt`/`og:image` y CSS bloqueante.
- Decisión: «Strava y CSV» se mantiene en la landing hasta que se replantee Strava/Garmin. Specs de la Capa 4 marcadas como implementadas. **Capa 4 cerrada**; siguiente, Capa 5 (pantallas).

### Rediseño — Capa 4 (`feat/auth-modal-v2`), PR 4: modal de acceso y correo confirmado en v2
- `feat(auth):` en v2, el modal de acceso (entrar, registro, recuperar) y `EmailConfirmedPage` usan primitivas (`Modal` `auth-v2`, `Input` `auth`, `Button` `primary`/`link`, `IconButton` `quiet`, `Card`). Copy neutro (sin «gratis» ni «laboratorio»). Flujo de Supabase, validaciones y mensajes intactos; v1 intacta.
- Accesibilidad: `Modal` gana `trapFocus` (opt-in, solo acceso v2): foco inicial, Tab atrapado y foco devuelto al cerrar; `aria-label` en cerrar, `role="alert"`/`status` en mensajes.
- Volcado de estilos frente a `develop`: 36 volcados, 22.318 elementos, 0 diferencias. 24 capturas nuevas (`e2e/access-visual-v2.spec.js`). `lint:colors` sin cambios.

### Rediseño — Capa 4 (`feat/landing-direction`), PR 2: dirección visual de la landing
- `feat(landing):` en v2 la landing usa `HeaderV2`, `HeroV2` y `DashboardPreview` (panel real con datos de ejemplo), sin canvas de partículas y con copy neutro en el hero. Token `--on-action` solo en v2. v1 intacta.
- Volcado de estilos frente a `develop`: 0 diferencias. Capturas v2 de la landing regeneradas (6). `lint:colors` sin cambios (743/3/100/8/165).

### Rediseño — Capa 4 (`refactor/landing-structure`), PR 1: estructura de la landing
- `refactor(landing):` `LandingPage.jsx` se divide (`AuthModal`, `FadeIn`, `ParticleCanvas` en `src/components/landing/`); cabecera a `z-nav`; color del canvas a token `--landing-particle`; se borra `LoginPage.jsx` (código muerto); E2E del flujo público.
- Sin cambio visual: volcado = 12 diferencias, todas `z-index` 40 → 30 de la cabecera; capturas sin cambios. `lint:colors` baja a 743/3/100/8/165.

### Rediseño — Capa 3 (`docs/ui-capa3-cierre`), PR 7 de 7: cierre documental
- `docs(ui-shell):` RF9–RF11 y los criterios de v2 marcados como cumplidos; cierre de la Capa 3 en `tasks.md`; roadmap y `MEMORY.md` al día. D12: v1 sigue por defecto hasta la Capa 6 (v2, opt-in).
- Sin cambios de código: `src/` idéntico a `develop`.

### Rediseño — Capa 3: piel v2 «Panel» (`feat/ui-skin-v2-extension`), PR 6 de 7: extensión
- `feat(ui-skin-v2):` la piel llega a Perfil, Actividades, Rendimiento, Salud y Detalle de actividad (`data-skin="profile|history|stats|health|detail"`). Los selectores de `tokens.css` pasan a `[data-skin]` genérico; `AutoChartSkin` activa la piel de gráficas fuera de Dashboard y Calendario. Shell y lienzo siguen en v1 (D11).
- `feat(ui-skin-v2):` `chartTheme.v2` con valores propios en oscuro (D-10) para series, deportes, distribución, zonas y mapa; `check-palette.mjs` exige 3:1 a todas las gráficas de v2. Colores de deporte unificados (D-09).
- Verificación: volcado `full` frente a `develop` = **0 diferencias** (88.718 elementos); unit 195, integración 10, E2E macOS 109 ✓. Capturas: 48 de v1 idénticas; de v2 cambian las **30** previstas (5 pantallas × 2 temas × 3 tamaños).

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