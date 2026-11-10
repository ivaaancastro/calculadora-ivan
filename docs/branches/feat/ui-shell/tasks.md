# Tareas — Capa 3, rama `feat/ui-shell`

Spec: `spec.md` (esta carpeta). Plan de la capa completa: `plan.md`.
Aprobada por el usuario el 2026-11-10: "Apruebo todo (D1–D8)".

## PR 1 — `refactor(ui-shell)`: tokens, z-index y D-01

Rama `feat/ui-shell`, sale de `develop` (`06ac9e3`). **0 diferencias** de volcado y capturas.

- [ ] `tokens.css`: `--nav-h` (3.5rem), `--nav-h-total`, `--bottom-nav-h` (3.375rem), `--bottom-nav-gap` (0.75rem), `--bottom-nav-reserve` (8rem) y la escala `--z-*`.
- [ ] `tailwind.config.js`: `zIndex` con los tokens.
- [ ] `MobileSwipePager.jsx`: alto y hueco inferior con tokens.
- [ ] `UploadStatusBanner.jsx`: `top` con token.
- [ ] z-index: 10 elementos a tokens (8 × `z-50`, `z-[60]`, `z-[100]`).
- [ ] D-01: `.hide-scrollbar` en las exclusiones del pager y `test.fail()` fuera.
- [ ] `e2e/shell.spec.js` y `src/__tests__/unit/shellTokens.test.js`.
- [ ] Verificación completa.
- [ ] PR hacia `develop`.

### Notas del PR 1

## PR 2 — `refactor(ui-shell)`: cabecera y acciones

Único PR de la capa que cambia capturas de v1 a propósito (D1). **No empezar sin releer D2 y D3.**

- [ ] Cabecera móvil ligera (identidad + menú, tema, Strava).
- [ ] Escritorio sin los 4 iconos de utilidad ni el cierre de sesión duplicado.
- [ ] Altura real: cabecera a 56 px y tokenizar `Dashboard.jsx:172` y `ActivityDetailPage`.
- [ ] Ajustes: "Borrar DB" (con `confirm`) e "Importar CSV" cableado (cierra D-03).
- [ ] Paridad recorrida y anotada.
- [ ] Pruebas: paridad, destructiva, tema.
- [ ] Capturas afectadas regeneradas y revisadas una a una.
- [ ] Verificación completa.
- [ ] PR hacia `develop`.

### Notas del PR 2

## PR 3 — `docs(ui-shell)`: cierre

- [ ] Cobertura, `MEMORY.md`, `CHANGELOG.md`, `paridad.md` (D-01 y D-03), roadmap.
- [ ] PR hacia `develop`.

### Notas del cierre
