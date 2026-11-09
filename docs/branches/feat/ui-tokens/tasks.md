# Tareas — spec-rediseno-02-c1 (Capa 1: tokens y tema)

Solo se marca lo verificado. Spec y plan aprobados el 2026-11-09 ("Apruebo todo").

## PR 1 — Infraestructura (`feat/ui-tokens`)
- [x] Prueba de concepto: `rgb(var(--x) / <alpha-value>)` y la variante con `calc()` dan el mismo color calculado
- [x] `src/styles/tokens.css` (valores actuales, `:root` y `.dark`), importado en `src/index.css`; solo los tokens con consumidor (ver plan, PR 1 paso 2)
- [x] `tailwind.config.js` con `theme.extend.colors`
- [x] `src/components/charts/chartTheme.js` y `useChartTheme.js`, con prueba de paridad contra `tokens.css`
- [x] `scripts/check-colors.mjs`, `scripts/color-baseline.json`, `npm run lint:colors` y paso en CI
- [x] `e2e/tools/style-dump.spec.js` + `scripts/style-diff.mjs` con pantallas y estados extra
- [x] Proyecto `tablet` (768 px): 16 capturas generadas en Docker y revisadas una a una; las 32 existentes sin cambios
- [x] `layout.spec.js` a 768 px (o defecto registrado en `paridad.md`)
- [x] Verificación: lint, lint:colors, unit, integration, build, e2e (macOS), e2e en Docker y volcado idéntico a `develop`
- [x] PR hacia `develop` con resultados (#52)

### Notas de verificación del PR 1
- Prueba de concepto: `rgb(var(--x) / calc(var(--x-a, 1) * <alpha-value>))` da el mismo color calculado que las clases originales (opacidad propia, modificador `/80`, `/[0.04]`, sin opacidad).
- Volcado de estilos: 82 volcados (desktop, mobile, tablet × 8 pantallas + 6 estados extra × claro/oscuro; `calendario-forma` solo existe ≥ 640 px), 56.718 elementos. Dos ejecuciones seguidas de la rama: 0 diferencias. Rama frente a `develop` (`8ab2963`): 0 diferencias. Defecto de prueba (rejilla `#cbd5e1` → `#cbd5e2`, invisible en capturas): detectado y retirado.
- Los `<g>` de Recharts se ignoran en el volcado: cambian de anidamiento según el punto de la animación.
- 768 px: 16 capturas generadas en Docker con `--update-snapshots=missing` (las 32 existentes intactas) y revisadas una a una. `layout.spec.js` pasa a 768 px. Observado sin ser defecto de esta capa: el botón "Conectar con Strava" parte su texto en dos líneas y el Calendario usa la lista de una columna.
- Resultados: lint ✓, lint:colors ✓ (línea base: 44 archivos), unit 66/66, integración 10/10, build ✓, E2E macOS 79 ✓ (133 omitidas: capturas y volcado), E2E Docker 127 ✓ (85 omitidas: volcado manual y `fixme` D-05).

## PR 2 — Bordes (`feat/ui-tokens-borders`)
- [x] Inventario y tabla de equivalencias (`src/styles/tokens/borders.json`, 19 tokens: pares con ≥ 3 usos)
- [x] Codemod con pruebas (`scripts/codemods/lib.mjs`, `borders.mjs`; 13 pruebas), revisión manual de clases dinámicas
- [x] Verificación completa y línea base bajada
- [ ] Cobertura ≥ 80 %: **79,5 %** (167 de 210 pares). Los 13 pares con token que no se migran son descartes deliberados por precedencia (ver notas)
- [ ] PR

### Notas de verificación del PR 2
- Codemod basado en el AST (`@babel/parser`, declarado como `devDependency`): solo sustituye pares claro/`dark:` exactos dentro del mismo literal y conserva variantes y lados (`hover:`, `border-b-`…).
- **Regla de precedencia:** por expresión de clases (atributo JSX, plantilla, ternario) y propiedad, se migran todos los pares o ninguno. Motivo: en Tailwind 3, `dark:` se genera después de `hover:`/`focus:`, así que hoy en oscuro gana `dark:`; un token (una sola clase) perdería frente a `focus:` y cambiaría el aspecto. Descartados: 10 por otra clase de la misma propiedad en el literal y 3 por otra clase en la misma expresión.
- El volcado de estilos ahora fuerza `:hover`, `:focus`, `:focus-visible` y `:active` (CDP) en los elementos con esas variantes. Rama frente a `develop` (`5b7fe90`): 82 volcados, 63.302 entradas, **0 diferencias**. Defecto de prueba (migrar a mano un par descartado del modal de acceso): detectado, el borde con foco en oscuro pasaba de `zinc-800` a azul. Retirado. Así se encontró D-08 (`paridad.md`).
- `lint:colors`: `dark` 1.314 → 1.147 y `palette` 3.315 → 2.981; 167 clases con tokens.
- Resultados: lint ✓, lint:colors ✓, unit 79/79, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias).

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
