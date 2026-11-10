# Tareas — Capa 3, rama `feat/ui-shell`

Spec: `spec.md` (esta carpeta). Plan de la capa completa: `plan.md`.
Aprobada por el usuario el 2026-11-10: "Apruebo todo (D1–D8)".

## PR 1 — `refactor(ui-shell)`: tokens, z-index y D-01

Rama `feat/ui-shell`, sale de `develop` (`06ac9e3`). **0 diferencias** de volcado y capturas.

- [x] `tokens.css`: `--nav-h` (3.5rem), `--nav-h-total`, `--bottom-nav-h` (3.375rem), `--bottom-nav-gap` (0.75rem), `--bottom-nav-reserve` (8rem) y la escala `--z-*`.
- [x] `tailwind.config.js`: `zIndex` con los tokens.
- [x] `MobileSwipePager.jsx`: alto y hueco inferior con tokens.
- [x] `UploadStatusBanner.jsx`: `top` con token.
- [x] `BottomNav.jsx`: cápsula y satélite con `--bottom-nav-h`.
- [x] z-index: 12 elementos a tokens (8 × `z-50`, `z-[60]`, `z-[100]` ×2, `z-[200]`, `z-[400]` ×2) y las marcas internas de `TrainingBalanceCard` a 10/20.
- [x] D-01: `.hide-scrollbar` en las exclusiones del pager y `test.fail()` fuera.
- [x] `e2e/shell.spec.js` (3 pruebas × 3 proyectos) y `src/__tests__/unit/shellTokens.test.js` (5 pruebas).
- [x] Verificación completa.
- [x] PR hacia `develop` (#70).

### Notas del PR 1

- **Reparto con el PR 2 (decidido al implementar):** corregir las alturas **mueve píxeles**, así que este PR solo cablea tokens con los valores de hoy. `--nav-h` = 56 px (lo que ya asumían el pager y el banner), `--bottom-nav-reserve` = 128 px (el `pb-32` del pager) y `--bottom-nav-h` = 54 px: los tres dan exactamente el mismo resultado que antes. El desfase de 3 px de la cabecera real (~59 px), `Dashboard.jsx:172` (170/250 px) y `ActivityDetailPage.jsx:133,712,791` (4rem/70px/130px/pb-32) se tokenizan en el PR 2, con las capturas.
- **Escala de capas (D5, ajustada al implementar):** `sticky 20`, `nav 30`, `nav-menu 40` (menú y barra inferior; no se solapan), `sheet 50`, `tooltip 55`, `modal 60`, `floating 80`, `map 400`, `toast 9999`. `tooltip` sube de 50 a 55 para deshacer el empate con la hoja y `floating` baja de 100 a 80: el panel "Proyección de Forma" del Calendario no convive con el tooltip de `MmpAndEfCard` (Rendimiento), así que el cambio de ganador no se puede dar.
- **Marcas internas:** `TrainingBalanceCard.jsx:71` estaba en `z-30` y, con la cabecera en 30, habría empatado con ella al hacer scroll. Pasa a `z-20` y la barra de valor de `:80` a `z-10` (la cápsula sigue por encima). El resto de `z-10`/`z-20` internos siguen siendo menores que la cabecera.
- **Banner de subida:** `top-[52px]` → `top-[var(--nav-h-total)]` (52 → 56 px). Solo existe durante una subida y no aparece en ninguna captura ni en el volcado, y hoy ya quedaba 7 px por debajo de la cabecera.
- **Fuera de alcance:** la landing (`LandingPage.jsx:277 z-40`, `:318 z-10`) es Capa 4 y no se toca; conserva sus valores literales.
- **Volcado `full` frente a `develop` (`06ac9e3`): 104 volcados, 90.548 elementos, 538 diferencias, todas de la propiedad `z-index`** (excepción aprobada el 2026-11-10). Reparto: `40 → 30` cabecera (92), `100 → 80` panel del Calendario (4), `50 → 55` tooltips (220), `50 → 30` cabecera del detalle (12), `50 → 40` menú y barra inferior (30), `30 → 20` y `20 → 10` las dos marcas de `TrainingBalanceCard` (90 + 90). El orden por pares que de verdad se solapan lo fija `shellTokens.test.js`.
- **Nota de método:** el primer volcado de `develop` perdió 8 estados móviles por tiempos de espera (el resumen lo tapaba el `tail`); repetido solo `--project=mobile`, 32/32, y los 104 volcados quedaron completos en los dos lados.
- **Resultados:** lint ✓, lint:colors ✓ (760/3/100/9/170, sin cambios), lint:ui ✓ (14 exportaciones), unit 187/187 (182 + 5 de `shellTokens`), integración 10/10, build ✓, E2E macOS 94 ✓ / 159 omitidas / 0 ✘, E2E Docker 142 ✓ / 111 omitidas / 0 ✘ (48 capturas de v1 sin diferencias). **El ✘ de `gestures.spec.js:37` (D-01) desaparece** y `shell.spec.js` suma 7 ✓ (2 omitidas por tamaño).
- Informe táctil en macOS: 113 en `develop` y en la rama, igual por pantalla (2 + 43 + 7 + 10 + 21 + 5 + 9 + 16).

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
