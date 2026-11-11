# Plan — rama `feat/ui-skin-v2-visual` (PR 5 de la Capa 3)

Derivado de `docs/branches/feat/ui-skin-v2-visual/spec.md`, de la spec de la capa
(`docs/branches/feat/ui-shell/spec.md`, D7 y RF9–RF11) y del plan de la capa (PR 5).
Base: `origin/develop` en `fcba9fd`. La rama ya existe; `spec.md` y este `plan.md` están escritos y
`tasks.md` y el código **esperan aprobación**.

Regla de oro del PR: con `data-ui` ausente, **0 diferencias** de volcado y **0 capturas de v1 cambiadas**.
De las 48 capturas de v2, solo pueden cambiar las **12** de Dashboard y Calendario.

## Estado

| Paso | Estado |
|---|---|
| 1. Rama, spec y plan | hecho (2026-11-11) |
| 1b. Preview sin código (12 capturas) | hecho (2026-11-11, `preview/`) |
| 2. Aprobación del usuario | **pendiente** (parada del flujo SDD) |
| 3. `tasks.md` y código | no empieza sin el paso 2 |
| 4. Verificación | pendiente |
| 5. Parada D7 (capturas de las dos pantallas) | pendiente |

---

## 1. Orden de implementación

### 1.1 Paleta y herramientas (sin tocar pantallas)

- [ ] `scripts/check-palette.mjs`: lee los bloques v2 de `tokens.css`, calcula contraste WCAG (4,5:1 texto, 3:1 gráficos) contra la superficie de su tema y ΔE entre las tres series; falla con código 1 y lista los pares que no pasan. Uso: `node scripts/check-palette.mjs`.
- [ ] `src/styles/tokens.css`: bloque nuevo (fuera de los generados) con la tabla de la spec:
  `html[data-ui="v2"] [data-skin="dashboard"], html[data-ui="v2"] [data-skin="calendar"] { … }` y su variante `html[data-ui="v2"].dark […​] { … }`.
  Se declaran las dos variantes completas (nada de heredar del tema v1) para que el cambio no dependa del orden de `.dark`.
- [ ] `node scripts/check-palette.mjs` en verde **antes** de seguir.

### 1.2 Mecanismo de la piel

- [ ] `src/styles/skin-v2.css`: capa de piel, un bloque por tema y ámbito. Contiene solo:
  - tamaños: `.text-\[8px\]`…`.text-\[18px\]`, `text-xs/sm/base/lg/xl/2xl/3xl`;
  - radios: `rounded-md/lg/xl/2xl/3xl` (no `rounded-full`);
  - sombras: `shadow-xs/sm/card` (la tarjeta oscura pasa de `shadow-none` a anillo de 1 px);
  - cifras: `tabular-nums` y tracking en los valores.
- [ ] `src/index.css`: `@import './styles/skin-v2.css';` al final, fuera de `@layer` (gana a las utilidades y a sus variantes `dark:`), con un comentario que explique el porqué.
- [ ] Atributos: `data-skin="dashboard"` en la raíz de `AdvancedAnalytics`, `data-skin="calendar"` en la raíz de `CalendarPage`. Inertes en v1.
- [ ] `src/components/ui/cardClasses.js`: clase `section-header` en `SECTION_HEADER` (inerte en v1) para la marca de sección.
- [ ] `CalendarPage.jsx`: `text-emerald-500` → `text-legacy-tsb-up` y `text-red-400` → `text-danger-light` (mismos valores en v1, tokens nuevos en v2).

### 1.3 Gráficas

- [ ] `src/components/charts/chartTheme.js`: tema `v2` claro y oscuro con la paleta de la spec (series, anatomía, tooltip y PMC); `chartTheme.v2` y `getChartTheme(theme, skin = 'v1')`.
- [ ] `src/components/charts/ChartSkin.jsx` (**nuevo**): contexto con `useChartSkin()` (`'v1'` por defecto) y `ChartSkinProvider`.
- [ ] `src/components/charts/useChartTheme.js`: `getChartTheme(theme, useChartSkin())`.
- [ ] Las dos pantallas envuelven su contenido en `ChartSkinProvider` con `isV2 ? 'v2' : 'v1'` (`useUiMode`).
- [ ] `src/__tests__/unit/chartTheme.test.js`: valida el tema v2 contra los bloques v2 de `tokens.css` (mismo criterio que hoy con v1) y que `getChartTheme('light')` sigue siendo v1.

### 1.4 Capturas y revisión

- [ ] `npm run test:e2e:update` (Docker) para regenerar **solo** las capturas de v2 que cambian.
- [ ] `cmp` archivo a archivo contra la rama base: 36 de v2 idénticas y 48 de v1 idénticas; 12 de v2 distintas (Dashboard y Calendario).
- [ ] Revisar a ojo las 12 capturas nuevas (claro/oscuro, móvil/tablet/escritorio) y ajustar en la capa de piel lo que se rompa (sobre todo el Calendario: celdas de ~130 px y chips de actividad).

## 2. Verificación

```bash
node scripts/check-palette.mjs
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                 # macOS
npm run test:e2e:docker             # capturas de referencia
```

Volcado (en serie; `develop` en `wt-develop` con `E2E_PORT=5274`):

```bash
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-develop" npx playwright test e2e/tools/style-dump.spec.js
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-rama"    npx playwright test e2e/tools/style-dump.spec.js
node scripts/style-diff.mjs "$TMPDIR/dump-develop" "$TMPDIR/dump-rama"
```

Referencia al abrir la rama: unit 192, integración 10, E2E macOS 109 ✓ / 209 omitidas, Docker 205 ✓ / 113 omitidas, táctil 113, `lint:colors` 756/3/100/9/168, `lint:ui` 14.
Lo que se espera de este PR: **0 diferencias** en el volcado, unit 192+2 (tema v2), todo lo demás igual y 0 ✘.

## 3. Paradas de aprobación

1. ~~Spec y plan de la capa~~ — 2026-11-10.
2. ~~Spec y plan del mecanismo (PR 4)~~ — 2026-11-11.
3. **Este `spec.md` y este `plan.md`, antes de escribir código** (parada del flujo SDD).
4. **D7, tras el PR 5:** capturas de Dashboard y Calendario (claro/oscuro/móvil/tablet) para aprobar la dirección antes del PR 6.

## 4. Fuera de alcance

- Extender la dirección al resto de pantallas y el lienzo de la app (PR 6).
- Escalas ordinales nuevas (zonas, RPE, sueño, VO2): solo si el PR 6 las necesita.
- Vistas por defecto (v2 como v1) y cierre documental (PR 7).
