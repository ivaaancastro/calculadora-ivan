# Tareas — Capa 4, rama `feat/landing-v2`

Spec: `spec.md`. Plan: `plan.md`. **Aprobada por el usuario el 2026-11-12: «Apruebo recomendadas»** → D1 = tras `data-ui="v2"`, D2 = extender «Panel», D3 = hero con UI real (datos simulados), D4 = retirar el canvas, D5 = retirar «∞», «24/7», «100% gratis» (el mensaje de precio queda fuera hasta que lo confirme), D6 = equivalentes en el repo si la skill no aparece, D7 = borrar `LoginPage.jsx`.
Abiertas aún: D5 (mensaje de precio) y D6 (¿existe la skill/verificadores en otra ruta?).

## PR 1 — `refactor(landing)`: estructura sin cambio visual

Rama `refactor/landing-structure`, sale de `feat/landing-v2` (docs) sobre `develop` (`54443b5`).

- [x] `LandingPage.jsx` 495 → 264 líneas; `AuthModal`, `FadeIn` y `ParticleCanvas` a `src/components/landing/`.
- [x] Cabecera `z-40` → `z-nav` (30). `z-10` del hero y `zIndex: 0` del canvas se quedan: orden interno, no capa de la app.
- [x] Color del canvas: `rgba(96,130,255)` → token `--landing-particle` (claro y oscuro, mismo valor).
- [x] D7: `src/components/auth/LoginPage.jsx` borrado (sin referencias).
- [x] `e2e/public.spec.js`: modal con sus 3 modos y retorno, Escape, `/email-confirmado` → landing.
- [x] Línea base de `lint:colors` movida y bajada (754→743 palette, 9→8 rgb, 168→165 dark).
- [ ] PR hacia `develop`.

### Notas del PR 1
- **Volcado `full` frente a `develop` (`54443b5`):** 104 volcados, 88.718 elementos, **12 diferencias, todas `z-index` 40 → 30 en la cabecera de la landing** (6 volcados de landing + 6 de modal de acceso en móvil y tablet; escritorio no tiene landing). Lo previsto; la cabecera no convive con nada entre 30 y 40.
- **Resultados:** lint ✓, lint:colors ✓ (743/3/100/8/165, baja), lint:ui ✓ (14), unit 195/195, integración 10/10, build ✓, E2E Docker **207 ✓** / 113 omitidas / 0 ✘ (capturas sin cambios).
- Nota de entorno: `node_modules` de este worktree está casi vacío; los comandos resuelven al de la raíz del repo.

## PR 2 — dirección visual (hero + una sección) · parada de aprobación
## PR 3 — resto de secciones
## PR 4 — modal de acceso y `EmailConfirmedPage`
## PR 5 — cierre documental y verificadores
