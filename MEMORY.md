# MEMORY — Estado persistente de "Forma" (calculadora-ivan)

> Versión corta, se lee al empezar cada sesión. El detalle histórico completo está en
> `docs/memory/memory-archivo-2026-11-12.md` (leer solo la sección que haga falta, con `offset`/`limit`).
> Cada agente actualiza este archivo al terminar su tarea, **sin añadir historia: la historia va a `tasks.md` de la rama**.

## 0. Reglas globales
- Flujo SDD: Especificar → Planificar → Presentar → Tareas → Implementar → Verificar → Registrar (ver `AGENTS.md`).
- Sin spec aprobada no hay código de producción. Ramas desde `develop`; nunca commit a `main`; merge solo vía PR y con autorización del usuario.
- Conventional Commits. Producción **no se toca** durante el rediseño: todo va a `develop`.

## 1. Estado actual
- **Fase Premium A hecha (PR `docs/premium-auditoria`):** `auditoria.md` pendiente de aprobación del usuario antes de la Fase B.
- **Fase Premium B PR 1 (`feat/premium-tokens`):** tokens/acabado por CSS en v2 hecho; pendiente B2b (hex→tokens, paleta Forma) y B2c (estados). Ver `docs/branches/feat/premium-tokens/spec.md`.
- **Fase Premium D1 hecha (detalle, #117, #122 y `feat/premium-detalle-lateral`):** `DetailHero`, HUD estable, esqueleto, impacto/laps v2. Pendiente D7; diferidos cursor compartido con mapa y `ErrorState`. Spec: `docs/branches/feat/premium-detalle/`. Siguiente: D2 (resto de pantallas).
- **Fase Premium C hecha (PRs #111–#115, `feat/premium-charts`):** lenguaje de gráficas Forma (rejilla, tooltip cristal, animación, a11y), Sparkline, banda/proyección, zoom y heatmap, todo v2. Pendiente: D7 del usuario sobre cada gráfica, snapshots v2 si cambian, `Sparkline` aún sin consumidor (HRV/Vo2 no tienen serie). Detalle: `docs/branches/feat/premium-charts/spec.md`.
- **Fase Premium D2 Dashboard hecha (#118, #132, `feat/premium-dashboard-rejilla`):** `FormHero` (frase por reglas `formSummary.js`, CTL protagonista), `KpiCard` (ATL/TSB/ACWR con delta 7 d y sparkline), secundarios en libro, rejilla 12 col en ≥ 1024 px. Pendiente D7. Detalle: `docs/branches/feat/premium-dashboard/tasks.md`.

- **Fase D3 Rendimiento hecha (`feat/premium-rendimiento*`, PRs #119, #131 y gráficas):** héroe «Hoy» con narrativa/KPI, grupos, receta de tarjeta, estados vacíos y capa Forma en gráficas, todo v2. Pendiente D7 de las 6 capturas. Detalle: `docs/branches/feat/premium-rendimiento/tasks.md`.
- **Fase Premium D4 Salud hecha (#120, #121, #123, `feat/premium-salud`):** `HealthHero`, banco de energía v2, biomarcadores por estado con `Sparkline` (`biomarkerStatus.js`), historial v2 (tendencia en área, banda óptima, detalle del día). Pendiente D7. Descartado por v1 congelada: píldoras por tokens e insights numerados. Detalle: `docs/branches/feat/premium-salud/tasks.md`.
- **➡️ Siguiente paso:** cerrar PR #103 (Coach Insights) y #105 (verificación rápida); empezar la **Fase Premium A** (auditoría; spec D1–D10 aprobada) tras mergear #106 (`docs/branches/feat/premium-design/`). Roadmap vigente en `docs/branches/feat/webapp-redesign/plan.md`.
- **Fase Premium (spec aprobada; alcance todo el diseño; v1 no se protege; dependencias/Tailwind con medida y OK):** se inserta antes de la Capa 6: A auditoría, B tokens/acabado v2, C gráficas Forma (lenguaje bklit-ui sin instalar el paquete), D pantallas (bloqueada hasta referencias; empieza por el detalle).
- **Borrar actividad con confirmación** (`feat/detalle-borrar-actividad`, spec aprobada e implementada): papelera del detalle conectada + diálogo `ConfirmDeleteActivityModal` (también en la lista). Strava puede reimportar la más reciente al sincronizar (avisado en el diálogo; tombstones = spec futura).
- **Tarjetas explicativas del detalle** (`feat/tarjetas-explicativas-detalle`, PR #101): `MetricTooltip` + textos en `activityMetricDescriptions.js`. **Detalle por deporte** (`feat/detalle-por-deporte`, spec aprobada e implementada): matriz en `src/utils/activityMetricsBySport.js` (`SPORT_BLOCKS`); series de fuerza fuera de alcance (`series_count` no existe). Pendiente: rediseño «premium» (spec aparte).
- **Coach Insights del detalle** (`fix/detalle-coach-insights`): frases en `src/utils/coachInsights.js` (IF solo en bici; frase para IF 0,70–0,85 y «Mantenimiento»); tarjeta oculta sin frases.
- **Proyecto:** Forma — dashboard de rendimiento deportivo y salud. Stack: React 19, Vite 7, Tailwind 3, Zustand, TanStack Query, Supabase, Vitest/MSW/Playwright.
- **Fix en curso:** `fix/detail-back-map` (Volver del detalle y teselas Light/Dark del mapa; CARTO exige clave → Esri; sin estilos). Anterior: `fix/touch-targets-v2` (objetivos táctiles ≥ 44 px en v2 móvil; detalle en su `tasks.md`; 14 capturas v2 móviles pendientes de revisión D7).
- **Rama actual:** `docs/screens-cierre` (Capa 5, PR 9 de 9: cierre documental). **Capa 5 implementada**: shell, Ajustes, Actividades, Dashboard, Rendimiento, Salud, Detalle y Calendario en v2 «Panel» (#84–#97). Detalle y paridad: `docs/branches/feat/screens-v2/tasks.md` y `docs/branches/test/ui-safety-net/paridad.md`. **Pendiente de la Capa 5:** pasada completa en iPhone real (usuario) con `docs/branches/feat/screens-v2/guion-iphone.md`. Siguiente: **Capa 6**.
- **Hecho:** specs de auditoría 01–08, spec-001 y E2E. Rediseño: Capa 0 (#51), 1 (#52–#58), 2 (#60–#68), 3 (#70–#76: estructura, flag `data-ui="v2"`, dirección «Panel», 5 pantallas y gráficas), 4 (#78–#82: landing, acceso y correo en v2) y 5 (#83–#97).
- **Pendiente del rediseño:** Fase Premium, Capa 6 (activar v2 por defecto, retirar v1 y decidir el destino del interruptor) y 7 (iOS). Plan: `docs/branches/feat/webapp-redesign/plan.md`. D12: **v1 sigue por defecto hasta la Capa 6**; v2 es opt-in (Ajustes → General «Vista previa v2» o `VITE_UI=v2`). **D8 cerrada:** el interruptor se queda ahí hasta la Capa 6, donde se decide su destino.
- `feat/webapp-redesign` remoto = intento descartado: no hacer `git pull` ahí ni usar `archive/webapp-redesign-v1` ni `stash@{0}`.

- **Pendientes de producto (no van en la landing):** Forma tendrá funciones de pago a futuro (no prometer gratuidad); la conexión con Strava se replantea en otra fase por sus límites de API y ahí se estudiará añadir **Garmin** (API nueva). **Deuda de la Capa 4:** `robots.txt`/`og:image` y CSS bloqueante (roadmap, «Deudas y opcionales»).
- **Skill de la landing:** `.taste-skill/` (clon de Leonxlnx/taste-skill, ignorado por git) solo para las 3 páginas públicas (pasada final hecha en el cierre de la Capa 4).
- **Landing:** «Strava y CSV» se mantiene (decisión 2026-11-16) hasta replantear Strava/Garmin. `Dashboard` es `lazy` en `App.jsx` (la landing no descarga la app autenticada).

## 2. Reglas de trabajo del rediseño (resumen)
- **v1 congelada:** cualquier valor visual nuevo va detrás de `html[data-ui="v2"]` y con capturas propias.
- **Colores:** tokens en `src/styles/tokens.css` → `tailwindTokens.cjs` → Tailwind. Gráficas: `chartTheme.js` + `useChartTheme()`; nunca un hex suelto. `npm run lint:colors` es trinquete (solo baja).
- **Primitivas:** `src/components/ui/` (`npm run lint:ui`, 14). «Centralizar sin unificar»; `className` solo para colocación y espaciado.
- **Cabecera:** mide exactamente `--nav-h` (60 px); nunca debe crecer.
- **Verificación visual:** carriles de `AGENTS.md` §8 bis: `npm run verify` por feat; E2E completo y `style-diff` en el CI; `npm run verify:layer` (style-diff completo `develop` vs rama = 0 en v1) al cerrar capa; capturas solo con la imagen del CI (workflow `Update snapshots` o `npm run test:e2e:update`).
- Detalle de codemods, volcados, precedencia de `dark:` y trampas conocidas: archivo histórico, secciones «Cómo trabajar con…».

## 3. Contexto técnico
- Entrada `src/App.jsx`; store `src/store/useAppStore.js`; Supabase `src/supabase.js`; IA `src/services/ai.js`; motores en `src/utils/`.
- Tests: `src/__tests__/{unit,integration}`; E2E en `e2e/` (puerto 5273, datos simulados, fecha fija 2026-06-15); migraciones en `migrations/`.
- Informe de auditoría: `AUDIT_REPORT.md` (rama `analysis/project-audit`).

## 4. Specs
Todas en `docs/specs/` y `docs/branches/`. Tabla completa con estados: archivo histórico, sección 3.

---
Última actualización: 2026-11-19
