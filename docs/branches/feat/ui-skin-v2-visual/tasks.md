# Tareas — rama `feat/ui-skin-v2-visual` (PR 5: dirección visual, D7)

Derivadas de `spec.md` y `plan.md`. Se marcan al completarlas.
Dirección aprobada por el usuario el **2026-11-11**: «Panel» (radios 12/14, borde de 1 px,
tipografía +1/+2, semáforo cobalto/carmín/ámbar, rótulo con marca, chips neutros).

## 1. Herramientas y paleta

- [x] `scripts/check-palette.mjs`: lee los bloques `@tokens:skin-v2` de `tokens.css`, comprueba
      contraste WCAG (texto 4,5:1, series y estados 3:1) contra las superficies de su tema y ΔE ≥ 25
      entre las tres series. Sale en verde.
- [x] `src/styles/tokens.css`: bloque `@tokens:skin-v2` con las dos variantes completas
      (`html[data-ui="v2"] [data-skin=…]` y `html[data-ui="v2"].dark […]`): superficies, bordes,
      rampa de texto, semáforo, `legacy-*`, radios, sombras y escala tipográfica de gráficas.
- [x] `node scripts/check-palette.mjs` en verde antes de tocar pantallas.

## 2. Mecanismo de la piel

- [x] `src/styles/skin-v2.css`: tamaños (`text-[8px]`…`text-3xl`), radios (`rounded-md`…`3xl`,
      `rounded-t-3xl`), sombras (`shadow-xs/sm/card` + anillo en oscuro), `tabular-nums` y
      `section-header::before`.
- [x] `src/index.css`: `@import './styles/skin-v2.css'` al final, fuera de `@layer`.
- [x] `AdvancedAnalytics.jsx`: `data-skin="dashboard"` en la raíz.
- [x] `CalendarPage.jsx`: `data-skin="calendar"` en la raíz.
- [x] `cardClasses.js`: clase `section-header` en `SECTION_HEADER` (inerte en v1).
- [x] `statClasses.js`: clase `chip` en los iconos de `StatTile` (inerte en v1).
- [x] `CalendarPage.jsx`: `text-emerald-500` → `text-legacy-tsb-up` y `text-red-400` →
      `text-danger-light` en la rampa semanal (mismos valores en v1).

## 3. Gráficas

- [x] `chartTheme.js`: `chartTheme.v2` claro/oscuro (series, `pmc`, `anatomy`, `tooltip`) y
      `getChartTheme(theme, skin = 'v1')`.
- [x] `ChartSkin.jsx` (**nuevo**): `ChartSkinProvider` y `useChartSkin` (`'v1'` por defecto).
- [x] `useChartTheme.js`: lee la piel del contexto.
- [x] `AdvancedAnalytics.jsx` y `CalendarPage.jsx`: envuelven su contenido en `ChartSkinProvider`
      con `isV2 ? 'v2' : 'v1'`.
- [x] `chartTheme.test.js`: valida el tema v2 contra los bloques v2 de `tokens.css` y que
      `getChartTheme('light')` sigue devolviendo v1.

## 4. Verificación

- [x] `npm run lint`, `npm run lint:colors` (sin subir), `npm run lint:ui` (14).
- [x] `npm run test:unit` (192 + nuevas) y `npm run test:integration` (10).
- [x] `npm run build`.
- [x] E2E macOS con 0 ✘ (109 ✓) y `npm run test:e2e:docker` con 0 ✘ (205 ✓, 113 omitidas).
- [x] Volcado `develop` vs rama = **0 diferencias**.
- [x] Capturas regeneradas en Docker: 48 de v1 idénticas; de v2, las **12** previstas (Dashboard y
      Calendario × 3 tamaños × 2 temas) más **6 móviles** no previstas (actividades, rendimiento y salud)
      que cambian solo de alto (3439 → 3473 px): el pager móvil mide la pestaña más alta.

## 5. Registro

- [x] `CHANGELOG.md` y `MEMORY.md` actualizados.
- [ ] Parada **D7**: presentar las 12 capturas reales antes del PR 6.
