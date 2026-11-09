# Tareas — spec-rediseno-02-c1 (Capa 1: tokens y tema)

Solo se marca lo verificado. Spec y plan aprobados el 2026-11-09 ("Apruebo todo").

## PR 1 — Infraestructura (`feat/ui-tokens`)
- [ ] Prueba de concepto: `rgb(var(--x) / <alpha-value>)` y la variante con `calc()` dan el mismo color calculado
- [ ] `src/styles/tokens.css` (valores actuales, `:root` y `.dark`), importado en `src/index.css`
- [ ] `tailwind.config.js` con `theme.extend.colors`
- [ ] `src/components/charts/chartTheme.js` y `useChartTheme.js`, con prueba de paridad contra `tokens.css`
- [ ] `scripts/check-colors.mjs`, `scripts/color-baseline.json`, `npm run lint:colors` y paso en CI
- [ ] `e2e/tools/style-dump.mjs` con pantallas y estados extra
- [ ] Proyecto `tablet` (768 px): 16 capturas generadas en Docker y revisadas una a una; las 32 existentes sin cambios
- [ ] `layout.spec.js` a 768 px (o defecto registrado en `paridad.md`)
- [ ] Verificación: lint, lint:colors, unit, integration, build, e2e (macOS), e2e en Docker y volcado idéntico a `develop`
- [ ] PR hacia `develop` con resultados

## PR 2 — Bordes (`feat/ui-tokens-borders`)
- [ ] Inventario y tabla de equivalencias
- [ ] Codemod con pruebas, revisión manual de clases dinámicas
- [ ] Verificación completa, línea base bajada, cobertura ≥ 80 %
- [ ] PR

## PR 3 — Texto (`feat/ui-tokens-text`)
- [ ] Inventario, tabla, codemod, revisión manual
- [ ] Verificación completa, cobertura ≥ 90 %
- [ ] PR

## PR 4 — Superficies (`feat/ui-tokens-surfaces`)
- [ ] Inventario, tabla, codemod (incluye `index.css`), revisión manual
- [ ] Verificación completa, cobertura ≥ 75 %
- [ ] PR

## PR 5 — Acentos (`feat/ui-tokens-accents`)
- [ ] Mapa de significado y tokens `legacy-*`; D-07 en `paridad.md`
- [ ] Codemod, revisión manual, verificación completa
- [ ] PR

## PR 6 — Gráficas (`feat/ui-tokens-charts`)
- [ ] Recharts (9 archivos), SVG del Calendario y `ActivityMap` con `useChartTheme()`
- [ ] Volcado: rejilla, mapa y vista "Forma" revisados expresamente
- [ ] PR

## Cierre
- [ ] Cobertura final frente a los objetivos
- [ ] `MEMORY.md`, `CHANGELOG.md`, roadmap

---
Versión: 0.1.0 — 2026-11-09
