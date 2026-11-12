# Plan — spec-rediseno-02-c4 (Capa 4: landing y acceso)

Spec: `spec.md` (esta carpeta). Rama `feat/landing-v2`, desde `develop` (`54443b5`). PRs pequeños hacia `develop`; cada uno con CI en verde y sin merge hasta que lo autorices. Una sesión por PR (AGENTS.md, sección 8).

| PR | Rama | Contenido | ¿Cambia lo que se ve? | Parada |
|---|---|---|---|---|
| 1 | `refactor/landing-structure` | Separar `LandingPage.jsx` (495 líneas) en `components/landing/` (`AuthModal`, `FadeIn`, hero, secciones); `z-40` → `z-nav` y marcas internas del hero; color del canvas a token; borrar `auth/LoginPage.jsx` (D7); prueba E2E del flujo público. | **No.** Volcado = 0 salvo `z-index` de la cabecera (40 → 30, como D5 de la Capa 3) y capturas sin cambio. | — |
| 2 | `feat/landing-direction` | Dirección visual (D2) sobre **hero + una sección** y cabecera, en 390/768/1440 claro/oscuro; tokens de landing en `tokens.css`; D4 (canvas); D1 decide si va tras `data-ui="v2"`. Capturas propias. | Según D1 | **Aprobación de la dirección con la vista previa** antes del PR 3 |
| 3 | `feat/landing-sections` | Resto de secciones: funciones con UI real (D3), cifras y copy verificado (D5/RF6), CTA final y pie. | Según D1 | — |
| 4 | `feat/auth-modal-v2` | Modal de acceso (3 modos), `EmailConfirmedPage` y estados de error/carga/éxito; foco, etiquetas, 44 px, 11 px. Flujo de Supabase idéntico (RF1). | Según D1 | — |
| 5 | `docs/landing-cierre` | Verificadores (D6), peso, Lighthouse/a11y, cobertura, `MEMORY.md`, `CHANGELOG.md`, roadmap y marcar la spec. | No | — |

## Orden y dependencias
PR 1 antes que todo (es la red de seguridad de los demás: sin cambio visual). PR 2 es una parada obligatoria: no se escribe el PR 3 sin tu OK sobre la dirección. PR 3 y 4 son independientes entre sí tras el 2 (se hacen en serie para no tocar los mismos archivos). PR 5 al final.

## Verificación en cada PR
`npm run lint`, `lint:colors` (no sube), `lint:ui`, unit, integración, `test:e2e`, `build`; capturas **solo en Docker**; `node scripts/style-diff.mjs` develop vs rama (0 en lo que no debe cambiar); capturas nuevas leídas una a una y reducidas, nunca en bloque.

## Primer paso tras la aprobación
Crear `tasks.md` con los 5 PR y arrancar el PR 1 (no necesita ninguna decisión visual; solo D7 para el borrado de `LoginPage.jsx`).

---
Versión: 0.1.0 (borrador) — 2026-11-12
