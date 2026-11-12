# Tareas — Capa 4, rama `feat/landing-v2`

Spec: `spec.md`. Plan: `plan.md`. **Aprobada por el usuario el 2026-11-12: «Apruebo recomendadas»** → D1 = tras `data-ui="v2"`, D2 = extender «Panel», D3 = hero con UI real (datos simulados), D4 = retirar el canvas, D5 = retirar «∞», «24/7», «100% gratis» (el mensaje de precio queda fuera hasta que lo confirme), D6 = equivalentes en el repo si la skill no aparece, D7 = borrar `LoginPage.jsx`.
D5 y D6 resueltas el mismo día (ver spec.md): sin promesa de gratuidad; skill clonada en `.taste-skill/` y verificadores leídos (locales, sin red externa).

## PR 1 — `refactor(landing)`: estructura sin cambio visual

Rama `refactor/landing-structure`, sale de `feat/landing-v2` (docs) sobre `develop` (`54443b5`).

- [x] `LandingPage.jsx` 495 → 264 líneas; `AuthModal`, `FadeIn` y `ParticleCanvas` a `src/components/landing/`.
- [x] Cabecera `z-40` → `z-nav` (30). `z-10` del hero y `zIndex: 0` del canvas se quedan: orden interno, no capa de la app.
- [x] Color del canvas: `rgba(96,130,255)` → token `--landing-particle` (claro y oscuro, mismo valor).
- [x] D7: `src/components/auth/LoginPage.jsx` borrado (sin referencias).
- [x] `e2e/public.spec.js`: modal con sus 3 modos y retorno, Escape, `/email-confirmado` → landing.
- [x] Línea base de `lint:colors` movida y bajada (754→743 palette, 9→8 rgb, 168→165 dark).
- [x] PR hacia `develop` (#78, mergeado en `bd7d046`).

### Notas del PR 1
- **Volcado `full` frente a `develop` (`54443b5`):** 104 volcados, 88.718 elementos, **12 diferencias, todas `z-index` 40 → 30 en la cabecera de la landing** (6 volcados de landing + 6 de modal de acceso en móvil y tablet; escritorio no tiene landing). Lo previsto; la cabecera no convive con nada entre 30 y 40.
- **Resultados:** lint ✓, lint:colors ✓ (743/3/100/8/165, baja), lint:ui ✓ (14), unit 195/195, integración 10/10, build ✓, E2E Docker **207 ✓** / 113 omitidas / 0 ✘ (capturas sin cambios).
- Nota de entorno: `node_modules` de este worktree está casi vacío; los comandos resuelven al de la raíz del repo.

## PR 2 — dirección visual (hero + una sección) · parada de aprobación

Rama `feat/landing-direction`, sale de `develop` (`bd7d046`).

- [x] Propuesta visual presentada y aprobada: opción A «panel real» (hero con UI real y datos simulados).
- [x] Implementación: `HeaderV2`, `HeroV2` y `DashboardPreview` (sección «Tu forma de hoy») tras `data-ui="v2"`; sin canvas en v2; copy neutro en el hero; token `--on-action` (texto sobre acción, solo v2); `data-skin="landing"`. Las secciones de abajo siguen siendo las de v1 (PR 3).
- [x] Capturas de v2 (390/768/1440, claro/oscuro) regeneradas en Docker (solo `visual-v2 … landing`; v1 intacto). Revisadas una a una: se corrigió el truncado de las etiquetas de los KPI en móvil (código TSB/CTL/ATL solo desde `sm`).
- [x] Volcado `full` frente a `develop` (`bd7d046`): 104 volcados, 88.718 elementos, **0 diferencias** (landing v1 y app autenticada intactas).
- [x] Verificadores (taste-skill, sobre `vite build` con `VITE_UI=v2` + `vite preview`): `perf` solo falla «JS parsed» (995 KiB, bundle único de la SPA, preexistente y fuera de alcance); `consistency` lista fallos que son de otro tipo de página (plantilla de marketing: `main`/`.wrap`, hero a 100svh, h2 dentro del hero) y el pie «Datos de ejemplo», que se mantiene a propósito por honestidad (datos simulados); `layout/check.mjs` no es aplicable a una SPA (falla al leer secciones). Pendiente real para PR 3: skip-link, metas `og:`/`twitter:`, y el contraste de la etiqueta «FUNCIONES» (3,68:1, sección de v1).
- [x] Lint, `lint:colors` (743/3/100/8/165, sin subir), `lint:ui`, unit 195/195.
- [ ] PR hacia `develop` y **aprobación del usuario de la dirección visual** antes de PR 3.

## PR 3 — resto de secciones
## PR 4 — modal de acceso y `EmailConfirmedPage`
## PR 5 — cierre documental y verificadores
