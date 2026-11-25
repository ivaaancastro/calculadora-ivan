# Tareas — Capa 4, PR 4 (`feat/auth-modal-v2`)

Spec y plan aprobados por el usuario el 2026-11-16: «lo apruebo» (P1: foco opt-in `trapFocus` solo para el acceso v2, recomendado).

- [x] Primitivas aditivas: `Modal` variante `auth-v2` + `trapFocus`; `Input` variante `auth`; `Button` (`primary`, `link`) e `IconButton` (`quiet`) nuevos; tests unit.
- [x] `AuthModal.jsx`: piel v2 (mismo `handleAuth`), copy neutro, roles aria; v1 intacta.
- [x] `EmailConfirmedPage.jsx`: v2 con `data-skin`, `Card`, `Button`; v1 intacta.
- [x] E2E `public.spec.js` (3 modos v2, teclado/foco, `/email-confirmado` v2) y capturas Docker nuevas, leídas una a una.
- [x] Verificación: lint, `lint:colors`, `lint:ui`, unit, integración, E2E Docker, build, `style-diff` = 0, taste-skill.
- [x] `CHANGELOG.md`, `MEMORY.md`, PR a `develop`, CI verde, parada.

## Resultados
- Primitivas aditivas: `Modal` `auth-v2` + `trapFocus`; `Input` `auth`; `Button` `primary`/`link`; `IconButton` `quiet`. Test unit nuevo de `auth-v2`.
- E2E nuevos en `public.spec.js` (acceso v2: 3 modos, foco atrapado, Escape y foco devuelto; `/email-confirmado` v2). Capturas nuevas `e2e/access-visual-v2.spec.js` (24: 3 modos + correo × claro/oscuro × 390/768/1440), revisadas una a una reducidas. El nombre del archivo debe contener `visual-v2` para que `playwright.config.js` lo corra en móvil y tablet.
- Lint ✓, `lint:colors` ✓ (743/3/100/8/165), `lint:ui` ✓ (14), unit+integración 206/206, build ✓, E2E Docker completo **234 ✓** / 113 omitidas / 0 ✘. Volcado `full` `develop` vs rama: 36 volcados, 22.318 elementos, **0 diferencias**.
- **taste-skill: no ejecutado.** El entorno denegó la ejecución de `perf.mjs`/`consistency.mjs` contra un `vite preview`; además solo miden la página, no el modal. Pendiente para el PR 5 (cierre), junto con peso y Lighthouse. `.taste-skill/` clonado (ignorado por git).
