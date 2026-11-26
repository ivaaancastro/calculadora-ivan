# Plan — rama `feat/ui-skin-v2` (PRs 4–7 de la Capa 3)

Derivado de `docs/branches/feat/ui-shell/spec.md` (RF9–RF11, D7, D8) y de `docs/branches/feat/ui-shell/plan.md` (PRs 4–7), con el estado real de `develop` en `d0c8329`.
Esta carpeta no repite la spec de la capa: detalla **cómo** se ejecutan los cuatro PRs que quedan.

Regla de oro: cada PR con `node scripts/style-diff.mjs <develop> <rama>` = **0 diferencias en v1**, y las capturas de v1 **sin cambios**. Las capturas de v2 se comparan contra las de v2.

## Resumen

| # | PR | Qué entrega | v1 | v2 |
|---|---|---|---|---|
| 4 | `feat(ui-skin-v2)`: mecanismo | `useUiMode`, `data-ui` por entorno y `localStorage`, conmutador en Ajustes, `ui-mode.spec.js`, 48 capturas de v2 | 0 diferencias | nacen **idénticas** a v1 |
| 5 | `feat(ui-skin-v2)`: dirección visual (D7) | tipografía, radios, paleta y gráficas en Dashboard y Calendario | 0 diferencias | cambian a propósito; **parada de aprobación** |
| 6 | `feat(ui-skin-v2)`: extensión | 6 pantallas restantes y `chartTheme` completo, D-10, escalas si la dirección las pide | 0 diferencias | cambian a propósito |
| 7 | `docs(ui-skin-v2)`: cierre | cobertura, `MEMORY`, `CHANGELOG`, `paridad`, roadmap | — | — |

**Estado (2026-11-11):** rama creada desde `origin/develop` (`d0c8329`). `spec.md` y este `plan.md` escritos; `tasks.md` y código, pendientes de aprobación.

---

## PR 4 — `feat(ui-skin-v2)`: mecanismo de activación

Sin ningún cambio visible. Es la condición para que el resto sea reversible y para que v1 quede demostrablemente congelada.

**Hecho (2026-11-11, rama `feat/ui-skin-v2`):** unit 192, Docker 205 ✓ / 113 omitidas / 0 ✘, volcado 104 diferencias **solo en los 6 estados de `perfil`** (fila del conmutador; ninguna de color, tipografía, sombra o `z-index`). Excepción M4 aprobada: las 6 capturas de perfil se regeneran porque el conmutador tiene que existir en v1. Detalle en `tasks.md`.

### 4.1 Código (primero, en este orden)

- [ ] `src/hooks/useUiMode.js`: estado global fuera del hook, `listeners`, lectura inicial del atributo que ya puso `index.html`, `setUi` (atributo + `localStorage`, `'v1'` = sin atributo) y `toggleUi`. Sin `VITE_UI` dentro del hook (una sola fuente de verdad).
- [ ] `index.html`: script en línea de `data-ui` **después** del de tema, con `%VITE_UI%` y `localStorage` por delante (M1).
- [ ] `src/components/pages/ProfilePage.jsx`: sección «Apariencia» en General con fila `role="switch"` («Vista previa v2»), `aria-checked`, pista con tokens y fila ≥ 44 px. Sin colores nuevos.
- [ ] `src/__tests__/unit/uiMode.test.js` con `@vitest-environment jsdom`: poner/retirar atributo, escribir `localStorage`, dos suscriptores sincronizados, lectura inicial desde el atributo.
- [ ] `.env.example`: `VITE_UI` documentada como opcional (por defecto v1).

### 4.2 Red (después del código)

- [ ] `e2e/support/mockApp.js`: opción `ui` en `setupApp`, escrita en el init script de la primera carga (antes de los scripts de página).
- [ ] `e2e/ui-mode.spec.js`:
  - `data-ui="v2"` en el **primer frame** con `localStorage ui=v2` (sonda instalada por `addInitScript` antes de parsear);
  - el conmutador enciende y apaga sin recargar, guarda en `localStorage` y **no repite** peticiones de actividades (contador de requests);
  - la sesión sigue intacta (clave de auth en `localStorage`);
  - tras recargar, `data-ui` y `aria-checked` coinciden con lo elegido;
  - en v1 el atributo está **ausente** (M2).
- [ ] `e2e/support/visual.js`: extraer de `visual.spec.js` la captura completa (expansión del pager en móvil, ocultación de `canvas` y rejilla, `settleForScreenshot`), con `ui` como opción. **Una sola** preparación para v1 y v2 (RF11.2).
- [ ] `e2e/visual.spec.js`: usa el helper; comportamiento idéntico (las 48 de v1 no cambian).
- [ ] `e2e/visual-v2.spec.js`: mismas 8 pantallas × 2 temas × 3 tamaños con `ui: 'v2'` (RF11.1).
- [ ] `playwright.config.js`: `VISUAL_SPECS` y `TABLET_SPECS` incluyen `visual-v2` (el regex actual exige `<palabra>.spec.js` y no lo casaría).
- [ ] Generar las 48 referencias de v2 **solo en Linux** (`npm run test:e2e:update`) y comprobarlas contra las de v1: `cmp` archivo a archivo; si el PNG no fuera byte a byte, diff de píxeles = 0. Cualquier diferencia es un fallo del mecanismo.

### 4.3 Verificación y cierre

- [ ] `VITE_UI=v2` sin `localStorage` → `data-ui="v2"`; con `localStorage ui=v1` → v1 (M1). Se prueba a mano y se anota el comando en el PR.
- [ ] `style-diff` = 0 diferencias; capturas de v1 sin cambios.
- [ ] `lint`, `lint:colors` (no sube), `lint:ui` (14), unit (187 + nuevas), integración 10, build, E2E macOS y Docker, informe táctil.
- [ ] Números y decisión de M1/M2 copiados en el PR y en `tasks.md`.

**Riesgo:** bajo. Si el mecanismo pinta algo, las 48 capturas de v2 lo delatan en el mismo PR.

---

## PR 5 — `feat(ui-skin-v2)`: dirección visual (D7)

- [ ] Definir `--text-*`, `--radius-*`, sombras y paleta v2 **dentro de** `html[data-ui="v2"]`, sin tocar `:root` ni `.dark` de v1.
- [ ] Aplicarlo solo a **Dashboard y Calendario**, incluidas sus gráficas (ejes, series, tooltips) con valores claros y oscuros.
- [ ] Validar la paleta con `validate_palette.js` de `dataviz` en ambos temas (hoy `#eab308` falla: 1,87:1).
- [ ] Volcado y capturas de v2 de esas dos pantallas; v1 con 0 diferencias.
- [ ] **Parada de aprobación:** presentar las dos pantallas (capturas claro/oscuro/móvil/tablet) antes de extender nada.

**Riesgo:** medio. Es la única parte creativa de la capa; por eso se limita a dos pantallas y se para.

---

## PR 6 — `feat(ui-skin-v2)`: extensión y gráficas

- [ ] Extender la dirección aprobada a las 5 pantallas restantes de la app (Rendimiento, Actividades, Detalle, Salud y Perfil). La landing es Capa 4: sus capturas de v2 siguen iguales a v1.
- [ ] `chartTheme` completo con valores `.dark` propios (D-10).
- [ ] Escalas ordinales (RPE, sueño, VO2, perfil de potencia, IF, rampa…) **solo** si la dirección las necesita; D-07/D-09 en lo que toque.
- [ ] Informe táctil de v2 y contraste de texto en ambos temas.
- [ ] Capturas de v2 completas y volcado v2 contra v2.

**Riesgo:** medio-alto. Va por pantallas, sin tocar v1.

---

## PR 7 — `docs(ui-skin-v2)`: cierre

- [ ] Cobertura (qué token cambió y dónde), `MEMORY.md`, `CHANGELOG.md`, `paridad.md` (D-07/D-09/D-10) y roadmap con la Capa 3 completa.
- [ ] Decisión explícita de qué vista queda por defecto y si v2 pasa a ser v1 (sería la Capa 6), con lo que implica para las referencias de capturas.
- [ ] Nota de qué RF de la capa quedan cerrados (RF9–RF11) y actualización de `docs/branches/feat/ui-shell/spec.md`.

---

## Verificación (en cada PR)

```bash
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                 # macOS
npm run test:e2e:docker             # capturas de referencia
```

Volcado comparativo (en serie; `develop` en `wt-develop` con `E2E_PORT=5274`):

```bash
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-develop" npx playwright test e2e/tools/style-dump.spec.js
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-rama"    npx playwright test e2e/tools/style-dump.spec.js
node scripts/style-diff.mjs "$TMPDIR/dump-develop" "$TMPDIR/dump-rama"
```

**Referencia al abrir la rama (`d0c8329`):** unit 187, integración 10, E2E macOS 105 ✓ / 159 omitidas / 0 ✘, Docker 153 ✓ / 111 omitidas / 0 ✘, táctil 113, `lint:colors` 756/3/100/9/168, `lint:ui` 14, volcado 104 / 90.548 elementos.
En el PR 4 se espera: unit 190+, macOS y Docker con 48 omitidas más (v2 se omite fuera de Linux) y **0 ✘**, volcado **0 diferencias**.

## Paradas de aprobación

1. ~~Spec y plan de la capa~~ — 2026-11-10 («Apruebo todo (D1–D8)»).
2. ~~D8~~ — cerrada con esa aprobación: conmutador en Ajustes → General.
3. **Antes de implementar el PR 4:** este `spec.md` y este `plan.md` (es la parada del flujo SDD: sin ella no hay código).
4. **Tras el PR 5:** dirección visual de Dashboard y Calendario (D7) antes de extender.

## Lo que queda fuera

- Landing, modal de acceso y `EmailConfirmedPage`: Capa 4.
- Reescritura de pantallas y unificación de `TAB_PATHS`/etiquetas: Capa 5.
- Convertir v2 en la vista por defecto: Capa 6.
