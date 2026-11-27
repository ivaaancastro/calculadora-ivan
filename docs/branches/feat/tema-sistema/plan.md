# Plan: tema del sistema (`feat/tema-sistema`)

Deriva de `spec.md`. Supone las opciones recomendadas D1–D5; si cambia alguna, se ajusta antes de crear `tasks.md`.

## Pasos (cada uno: prueba que falla → código → `npm run verify` → commit)

| # | Paso | Ficheros | RF | Commit |
|---|------|----------|----|--------|
| 1 | Preferencia de tres valores, oyente del sistema, interruptor y robustez | `src/hooks/useTheme.js`, `src/main.jsx`, `src/__tests__/unit/useTheme.test.js` | 1–4, 9 | `feat(tema): seguir el tema del sistema por defecto` |
| 2 | Primera pintura, `theme-color` y `color-scheme` | `index.html`, `useTheme.js`, `src/index.css`, `src/__tests__/unit/indexTheme.test.js` | 7–9 | `fix(tema): barra del navegador y controles nativos según el tema` |
| 3 | Grupo «Apariencia» | `profile/AppearanceGroup.jsx`, `profile/GeneralSection.jsx`, prueba de integración | 5 | `feat(ajustes): elegir tema Sistema, Claro u Oscuro` |
| 4 | Teselas según el tema | `activity/ActivityMap.jsx`, prueba de integración | 6 | `feat(mapa): teselas según el tema activo` |
| 5 | E2E de DOM | `e2e/support/mockApp.js`, `e2e/layout.spec.js`, `e2e/detail-map.spec.js` | 2, 6 | `test(tema): cambio del sistema y mapa oscuro` |
| 6 | Revisión visual (puerto 5182; E2E puntual con `E2E_PORT=5282`), capturas 390/1440 en claro y oscuro | — | — | — |
| 7 | Actualizar la rama con `develop`, `CHANGELOG.md`, `MEMORY.md`, PR a `develop` (sin mergear) | docs | — | `docs(tema): registro de la rama` |

Las capturas «antes» se toman antes del paso 1.

## Ficheros fuera de mi lista inicial
- `src/main.jsx` (una llamada a `initTheme`).
- `src/index.css` (dos líneas de `color-scheme`).
- `src/components/pages/profile/` (grupo nuevo y su inclusión, parte del ajuste en Perfil).
- `e2e/support/mockApp.js` (permitir arrancar sin preferencia).
- No se tocan `tokens.css`, `docs/design/forma.md` ni `docs/roadmap/`. Con D5 = A, tampoco `vite.config.js`.

## Riesgos
- Choque con B5 en `src/index.css`: cambio de dos líneas, se resuelve al actualizar con `develop`.
- `.claude/launch.json` no tiene el puerto 5182: se usa una configuración local, sin commitear.
- El arranque duplica la lógica del hook en `index.html`: lo cubre la prueba del paso 2.
