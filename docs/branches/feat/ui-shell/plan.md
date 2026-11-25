# Plan de la Capa 3 — navegación y piel v2 (`spec-rediseno-02-c3`)

Derivado de `docs/branches/feat/ui-shell/spec.md` (inventario de 3.2 y decisiones D1–D8) y de `MEMORY.md`.
Dos ramas, en este orden: primero la estructura (`feat/ui-shell`), luego la piel (`feat/ui-skin-v2`). La segunda no puede empezar hasta que la primera esté en `develop`, porque la piel se apoya en `--nav-h` y en la red de capturas.

## Resumen

| # | Rama | PR | Qué entrega | Capturas de v1 |
|---|---|---|---|---|
| 1 | `feat/ui-shell` | `refactor(ui-shell)`: alturas y z-index | `--nav-h`, `--bottom-nav-*`, escala `z-*`, D-01 | sin cambios (más 1 por D-01 solo si mueve píxeles) |
| 2 | `feat/ui-shell` | `refactor(ui-shell)`: cabecera y acciones | cabecera móvil ligera, destructivas y utilidades a Ajustes, D-03 | **se regeneran las afectadas y se revisan una a una (D1)** |
| 3 | `feat/ui-shell` | `docs(ui-shell)`: cierre | cobertura, `MEMORY`, `CHANGELOG`, `paridad` (D-01/D-03), roadmap | — |
| 4 | `feat/ui-skin-v2` | `feat(ui-skin-v2)`: mecanismo | `useUiMode`, `data-ui` por entorno y `localStorage`, conmutador, `e2e/ui-mode.spec.js`, capturas v2 vacías | **0 diferencias** (v1 intacta) |
| 5 | `feat/ui-skin-v2` | `feat(ui-skin-v2)`: dirección visual | escala de texto, radios y paleta en 2 pantallas (Dashboard y Calendario) para elegir (D7) | 0 diferencias |
| 6 | `feat/ui-skin-v2` | `feat(ui-skin-v2)`: extensión | el resto de pantallas y gráficas (`chartTheme` en oscuro, D-10) | 0 diferencias |
| 7 | `feat/ui-skin-v2` | `docs(ui-skin-v2)`: cierre | cobertura, `MEMORY`, `CHANGELOG`, `paridad` (D-07/D-09/D-10), roadmap | — |

Regla de oro de la capa: **cada PR, `node scripts/style-diff.mjs <develop> <rama>` = 0 diferencias**, salvo el PR 1 en la propiedad `z-index` (D5 renumera; el orden se conserva y se prueba), el PR 2 y, dentro de `feat/ui-skin-v2`, los estados con `data-ui="v2"` (que se comparan contra las capturas de v2, no contra v1).

**Estado (2026-11-11):** PRs 1–3 de `feat/ui-shell` mergeados en `develop` (#70, #71 y #72). Cobertura y notas en `tasks.md`. La rama `feat/ui-skin-v2` no ha empezado.

---

## Rama `feat/ui-shell`

Sale de `develop` (`06ac9e3`). Una rama, tres PR pequeños y en serie. **Cerrada el 2026-11-11** (#70, #71, #72).

### PR 1 — `refactor(ui-shell)`: tokens, z-index y D-01

Sin cambio de aspecto: el PR se acepta solo si las 48 capturas no cambian y el volcado difiere **únicamente** en `z-index`.

**Hecho (2026-11-10, PR #70):** volcado 104 / 90.548 elementos / 538 diferencias, todas de `z-index`. Notas en `tasks.md`.

- [x] `tokens.css`: `--nav-h` (3.5rem = 56 px, lo que ya asumen pager y banner), `--nav-h-total`, `--bottom-nav-h` (3.375rem = 54 px), `--bottom-nav-gap` (0.75rem), `--bottom-nav-reserve` (8rem = 128 px, el `pb-32` actual) y la escala `--z-*` de 6.3; `tailwind.config.js` expone `zIndex` (`z-nav`, `z-nav-menu`, `z-bottom-nav`, `z-sheet`, `z-modal`, `z-tooltip`, `z-map`).
- [x] `MobileSwipePager.jsx:195`: `h-[calc(100dvh-var(--nav-h-total))]` y `pb-[var(--bottom-nav-reserve)]` (mismos 56 y 128 px de hoy).
- [x] `UploadStatusBanner.jsx:12`: `top-[var(--nav-h-total)]` (pasa de 52 a 56 px; el banner solo existe durante una subida y no aparece en ninguna captura ni volcado, y hoy ya queda 7 px por debajo de la cabecera).
- [x] z-index: los 8 usos de `z-50`, el `z-[60]` y el `z-[100]` pasan a los tokens, conservando qué elemento gana hoy y deshaciendo los empates documentados en 3.2 (la cabecera del detalle baja a `z-nav`, los tooltips suben a `z-tooltip`).
- [x] **D-01**: `.hide-scrollbar` en las exclusiones de `MobileSwipePager.jsx:47-52`; quitar `test.fail()` de `e2e/gestures.spec.js:37`.
- [x] Pruebas nuevas: `e2e/shell.spec.js` (la cabecera mide `--nav-h-total` en móvil y escritorio) y `src/__tests__/unit/shellTokens.test.js` (los tokens existen y valen lo que dicen).
- [x] `grep` sin resultados para `56px`, `52px`, `h-\[54px\]` fuera de `tokens.css`.

**Riesgo:** bajo. Si el volcado se mueve en algo que no sea `z-index`, es un error: se corrige el token, no el elemento.

### PR 2 — `refactor(ui-shell)`: cabecera y acciones

El único PR de la capa en el que las capturas de v1 cambian a propósito (D1).

**Hecho (2026-11-10, PR #71):** 42 de 48 capturas regeneradas y revisadas; volcado 4.038 diferencias, ninguna de color. Notas en `tasks.md`.

- [x] **Cabecera móvil (RF5, D2):** se queda identidad + menú, tema y Strava. Se va el icono de cerrar sesión (queda en el menú) y las utilidades.
- [x] **Altura real de la cabecera (D4):** altura fija de **60 px** (`--nav-h` = `3.75rem`, D4 revisado al medir 81/63,5 px) y tokenizar lo que quedaba: `Dashboard.jsx:172` (170/250 px) y `ActivityDetailPage.jsx:133,712,791` (4rem/70px/130px/pb-32), comprobando la altura real de la cabecera del detalle.
- [x] **Escritorio:** se retiran los 4 iconos de la derecha y el cierre de sesión duplicado; el menú conserva sus 4 secciones.
- [x] **Ajustes (`ProfilePage`)**: recibe
  - "Borrar DB" en Seguridad y Datos, con su `confirm` (RF6);
  - ~~"Importar CSV" en Cuentas Conectadas~~ → **retirado** (D3 revisado: nunca estuvo implementado, D-03 se documenta como acción retirada).
- [x] **Cerrar sesión:** se retiran los dos iconos (escritorio y móvil) y queda solo en el menú de la cabecera, que ya lo tiene.
- [x] Paridad: recorrer `paridad.md:23-44` y anotar en `tasks.md` dónde queda cada acción.
- [x] Pruebas: `e2e/shell.spec.js` gana paridad (9 acciones), destructiva con confirmación y tema persistente. `e2e/dashboard.spec.js:21` sigue igual (el menú no se mueve).
- [x] Regenerar **solo** las capturas afectadas (`npm run test:e2e:update` en Docker), revisarlas y listarlas en el PR.

**Riesgo:** medio. Es el PR que mueve acciones de sitio: la lista de paridad es la red. Si el usuario prefiere otra composición, se cambia antes de escribir código (D2).

### PR 3 — `docs(ui-shell)`: cierre

**Hecho (2026-11-11, PR #72).** Cobertura en `tasks.md`, "Notas del cierre".

- [x] Cobertura final (qué número se quitó de dónde, acciones movidas, z-index antes/después), `MEMORY.md`, `CHANGELOG.md`.
- [x] `paridad.md`: D-01 y D-03 marcados como cerrados, con el PR.
- [x] Roadmap: "Hecho (fecha)" en la Capa 3 con lo que entrega esta rama; la parte de piel queda pendiente.

---

## Rama `feat/ui-skin-v2`

Sale de `develop` **después** del PR 3 (`fadb304`). Usa la spec de `feat/ui-shell` (no se duplica) y tiene su propia carpeta con `spec.md` enlazado, `plan.md` y `tasks.md`.

### PR 4 — `feat(ui-skin-v2)`: mecanismo de activación

Sin ningún cambio visible. Es la condición para que el resto sea reversible.

- [ ] `src/hooks/useUiMode.js` (mismo patrón que `useTheme`: estado global, suscriptores, `localStorage`), con prueba unitaria.
- [ ] `index.html`: script en línea que aplica `data-ui` antes del primer pintado; valor de entorno `VITE_UI` (D8).
- [ ] Conmutador "Vista previa v2" en Ajustes → General (`role="switch"`, etiqueta, ≥ 44 px) — o solo entorno si se elige esa alternativa en D8.
- [ ] `e2e/ui-mode.spec.js`: activar por `localStorage` antes del pintado; conmutar sin recargar (no se pierde la sesión ni se repiten las peticiones de actividades).
- [ ] `e2e/visual-v2.spec.js` con el proyecto `v2`: capturas de las 8 pantallas, 2 temas y 3 tamaños, **idénticas a v1 al principio** (es la prueba de que el mecanismo no pinta nada).

**Riesgo:** bajo. Si el mecanismo pinta algo, las capturas de v2 lo delatan en el mismo PR.

### PR 5 — `feat(ui-skin-v2)`: dirección visual (D7)

- [ ] Definir la escala tipográfica (`--text-*`), los radios (`--radius-*`) y la paleta v2 sobre **Dashboard y Calendario**, incluidas las gráficas de esas dos pantallas.
- [ ] Validar la paleta con `validate_palette.js` de `dataviz`, en claro y oscuro (hoy falla con `#eab308`: contraste 1,87:1).
- [ ] Volcado y capturas de v2 de esas dos pantallas; v1 sin diferencias.
- [ ] **Parada de aprobación:** se presentan las dos pantallas antes de extender nada.

**Riesgo:** medio. Es la única parte creativa de la capa: por eso se hace sobre dos pantallas y se para.

### PR 6 — `feat(ui-skin-v2)`: extensión y gráficas

- [ ] Extender la dirección elegida a las 6 pantallas restantes y a `chartTheme` de todas las gráficas, con valores `.dark` propios (D-10).
- [ ] Escalas ordinales de color (RPE, sueño, VO2, perfil de potencia, IF, rampa…) y D-07/D-09, solo en lo que la dirección visual toque.
- [ ] Informe táctil de v2 y contraste de texto en ambos temas.
- [ ] Capturas de v2 completas.

**Riesgo:** medio-alto. Va por pantallas, con el volcado comparando v2 contra v2.

### PR 7 — `docs(ui-skin-v2)`: cierre

- [ ] Cobertura, `MEMORY.md`, `CHANGELOG.md`, `paridad.md` (D-07/D-09/D-10), roadmap ("Hecho" de la Capa 3 completo).
- [ ] Decisión explícita de qué vista queda por defecto y si v2 se convierte en v1 (sería la Capa 6).

---

## Verificación (en cada PR)

```bash
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                      # macOS
npm run test:e2e:docker                  # capturas de referencia
```

Volcado comparativo (en serie, `develop` en el worktree `wt-develop` con `E2E_PORT=5274`):

```bash
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-develop" npx playwright test e2e/tools/style-dump.spec.js
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-rama"    npx playwright test e2e/tools/style-dump.spec.js
node scripts/style-diff.mjs "$TMPDIR/dump-develop" "$TMPDIR/dump-rama"
```

Referencia al cerrar la Capa 2 (`06ac9e3`): unit 182, integración 10, E2E macOS 87, Docker 135 (✘ esperado de `gestures.spec.js:37` = D-01), volcado 104 / 90.548 elementos / 0 diferencias, táctil 113, `lint:colors` 760/3/100/9/170, `lint:ui` 14 exportaciones. **Al cerrar el PR 1, el ✘ de D-01 desaparece: el E2E de macOS y Docker suben un ✓.**

Referencia al cerrar `feat/ui-shell` (`fadb304`): unit 187, integración 10, E2E macOS 105 ✓ / 159 omitidas, Docker 153 ✓ / 111 omitidas, 0 ✘, táctil 113, `lint:colors` 756/3/100/9/168, `lint:ui` 14. Volcado acumulado de la rama: 538 diferencias de `z-index` en el PR 1 y 4.038 de caja/tipografía en el PR 2, ninguna de color.

## Paradas de aprobación

1. ~~Tras presentar esta spec y este plan~~ — cumplida el 2026-11-10 («Apruebo todo (D1–D8)»).
2. Antes del PR 2 si D2 o D3 cambian (afectan a dónde van las acciones).
3. Tras el PR 5 de `feat/ui-skin-v2` (dirección visual).

## Lo que queda fuera

- Landing, modal de acceso y `EmailConfirmedPage`: Capa 4.
- Reescritura de pantallas y unificación de `TAB_PATHS`/etiquetas ("Rendimiento" vs "Forma"): Capa 5.
- Convertir v2 en la vista por defecto: Capa 6.
