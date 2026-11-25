# Plan — spec-rediseno-02-c4-pr4

Rama `feat/auth-modal-v2` desde `develop` (`c66063f`). Un PR a `develop`, sin merge sin autorización escrita. `tasks.md` se crea tras la aprobación.

| Paso | Contenido |
|---|---|
| 1 | Primitivas (aditivas): `Modal` variante `auth-v2` + prop `trapFocus`; `fieldClasses` variante `auth` (input y etiqueta); tokens v2 mínimos si falta alguno (en `tokens.css`, tras `data-ui="v2"`). `lint:ui` y tests de recetas. |
| 2 | `AuthModal.jsx`: `useUiMode`; en v2 renderiza la piel nueva (mismo `handleAuth`, mismo estado, copy neutro, roles aria); v1 intacta. |
| 3 | `EmailConfirmedPage.jsx`: en v2, `data-skin` + `Card` + `Button`; v1 intacta. |
| 4 | E2E `public.spec.js`: 3 modos v2, teclado/foco/Escape, copy; `/email-confirmado` v2. Capturas nuevas (Docker) leídas una a una. |
| 5 | Verificación: lint, `lint:colors`, `lint:ui`, unit, integración, E2E Docker, build, `style-diff` = 0, taste-skill (`consistency`/`perf`). |
| 6 | `tasks.md`, `CHANGELOG.md`, `MEMORY.md`, PR a `develop`, CI verde, parada. |

Orden: 1→2→3 → 4 → 5 → 6.

---
Versión: 0.1.0 (borrador)
