# Tareas — rama `feat/ui-skin-v2`

Spec de la rama: `spec.md` (esta carpeta). Spec de la capa: `docs/branches/feat/ui-shell/spec.md`.
Plan: `plan.md`. Aprobación: 2026-11-11 («Apruebo, implementa el PR 4»).

## PR 4 — `feat(ui-skin-v2)`: mecanismo de activación

Rama `feat/ui-skin-v2`, sale de `origin/develop` (`d0c8329`). Sin cambio de piel: v1 solo cambia en la fila nueva de Ajustes (excepción aprobada, ver notas).

### Código
- [x] `src/hooks/useUiMode.js` (estado global, suscriptores, `setUi`, `toggleUi`; `'v1'` = sin atributo).
- [x] `index.html`: script de `data-ui` antes del primer pintado, `localStorage` por delante de `%VITE_UI%`.
- [x] `vite.config.js`: `import.meta.env.VITE_UI` con valor por defecto `v1` (vía `loadEnv`), para que `%VITE_UI%` siempre resuelva.
- [x] `ProfilePage.jsx`: sección «Apariencia» en General con `role="switch"` «Vista previa v2» (fila ≥ 44 px).
- [x] `src/styles/tokens/surfaces.json`: token `control-knob` (blanco en ambos temas) para el pomo, sin `bg-white`.
- [x] `src/__tests__/unit/uiMode.test.js` (jsdom).
- [x] `.env.example`: `VITE_UI` opcional.

### Red
- [x] `e2e/support/mockApp.js`: opción `ui` en `setupApp`.
- [x] `e2e/ui-mode.spec.js`: primer frame, cambio en caliente sin recargar ni repetir peticiones, sesión intacta, persistencia.
- [x] `e2e/support/visual.js` y `visual.spec.js` usando la captura compartida (v1 sin cambios salvo perfil).
- [x] `e2e/visual-v2.spec.js` con 48 capturas de v2.
- [x] `playwright.config.js`: `visual-v2` en `VISUAL_SPECS` y `TABLET_SPECS`.
- [x] Referencias de v2 generadas en Docker y comparadas con v1.

### Verificación
- [x] `lint`, `lint:colors` (756/3/100/9/168, sin subir), `lint:ui` (14), unit 192/192, integración 10/10, build.
- [x] E2E macOS 109 ✓ / 209 omitidas / 0 ✘; Docker 205 ✓ / 113 omitidas / 0 ✘ (7,4 min).
- [x] Informe táctil: 113 (2 + 7 + 43 + 21 + 5 + 16 + 10 + 9); perfil sigue en 9: el conmutador mide ≥ 44 px.
- [x] Volcado frente a `develop`: 104 volcados, 88.718 elementos, **104 diferencias, todas en los 6 estados de `perfil`** (66 nodos nuevos del conmutador + 38 alturas de sus contenedores). Cero diferencias de color, tipografía, sombra o `z-index`.
- [x] Números y notas copiados aquí y en el PR.

### Notas del PR 4

- **Excepción aprobada el 2026-11-11: el conmutador cambia la captura de Ajustes en v1.** La fila «Vista previa v2» es el mecanismo (tiene que existir en v1 para poder encender v2), así que las 6 capturas de `perfil` (3 tamaños × 2 temas) se regeneraron y revisaron. Es el **único** cambio de v1 en esta rama y no toca la piel. El usuario eligió esta opción frente a mover el conmutador a Seguridad y Datos o dejarlo solo por entorno.
- **v2 frente a v1: 42 de 48 capturas byte a byte idénticas.** Las 6 restantes son `perfil` y su diferencia está **confinada al conmutador**: bbox de 52×31 px (la pista mide 51×31) en las seis, ~1.360 píxeles. Es la posición del pomo y el color de la pista, no la piel: no hay ningún token de v2 todavía.
- **`data-ui` antes del primer frame:** probado con una sonda de `requestAnimationFrame` instalada por `addInitScript`; con `localStorage ui=v2` el atributo vale `v2` en el primer frame y con v1 vale `null`. En v1 el atributo queda **ausente** (M2), no `"v1"`.
- **Cambio en caliente:** el conmutador enciende y apaga sin recargar (marca en `window` intacta), conserva el token de sesión y **no repite** peticiones a `/rest/v1/activities` (contador de requests). Tras recargar, `aria-checked` y `data-ui` coinciden con lo elegido.
- **Entorno:** `VITE_UI=v2 npx playwright test e2e/ui-mode.spec.js -g VITE_UI` → 2/2 en verde: arranca en v2 sin `localStorage` y `localStorage ui=v1` gana a la variable (M1). Las dos pruebas se omiten en la ejecución normal (quedan en las 209/113 omitidas).
- **`VITE_UI` con valor por defecto:** sin `define`, Vite dejaba `%VITE_UI%` literal y avisaba en cada arranque. `vite.config.js` resuelve `import.meta.env.VITE_UI` con `loadEnv` (`v1` por defecto); un `.env` o el entorno lo suben a `v2`.
- **Token nuevo:** el pomo usaba `bg-white`, que subía el trinquete de colores sueltos de `ProfilePage` (80 > 79). Se añadió `control-knob` a `surfaces.json` (blanco en claro y oscuro) y se regeneró el bloque de `tokens.css` con `node scripts/codemods/surfaces.mjs --tokens`.
- **Colisión evitada con la shell:** `min-h-[52px]` de la fila chocaba con el guardia de `shellTokens.test.js` (`\b52px\b`); la fila usa `min-h-11` (44 px).
- **`VISUAL_SPECS` no casaba `visual-v2`:** el regex exigía `<palabra>.spec.js`; se amplió a `(visual|layout|touch|gestures|style-dump|shell)(-v2)?\.spec\.js` para que v2 corra también en móvil y tablet.
- **Una sola preparación de captura:** `e2e/support/visual.js` la comparte v1 y v2 (RF11.2); `visual.spec.js` solo declara el proyecto y `visual-v2.spec.js` añade `ui: 'v2'`.

## PR 5 — `feat(ui-skin-v2)`: dirección visual (D7)
- [ ] Escala de texto, radios, sombras y paleta v2 en Dashboard y Calendario.
- [ ] Gráficas de esas dos pantallas en claro y oscuro; `validate_palette.js` en verde.
- [ ] Volcado y capturas de v2; v1 sin diferencias.
- [ ] **Parada de aprobación** antes de extender.

## PR 6 — `feat(ui-skin-v2)`: extensión
- [ ] 5 pantallas restantes de la app (la landing es Capa 4).
- [ ] `chartTheme` con valores `.dark` propios (D-10); escalas ordinales solo si la dirección las pide.
- [ ] Informe táctil y contraste en ambos temas.
- [ ] Capturas de v2 completas.

## PR 7 — `docs(ui-skin-v2)`: cierre
- [ ] Cobertura, `MEMORY.md`, `CHANGELOG.md`, `paridad.md`, roadmap y RF9–RF11 de la capa.
- [ ] Decisión de vista por defecto (Capa 6).
