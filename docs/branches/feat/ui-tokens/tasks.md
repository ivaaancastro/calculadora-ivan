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
- [x] PR (#53)

### Notas de verificación del PR 2
- Codemod basado en el AST (`@babel/parser`, declarado como `devDependency`): solo sustituye pares claro/`dark:` exactos dentro del mismo literal y conserva variantes y lados (`hover:`, `border-b-`…).
- **Regla de precedencia:** por expresión de clases (atributo JSX, plantilla, ternario) y propiedad, se migran todos los pares o ninguno. Motivo: en Tailwind 3, `dark:` se genera después de `hover:`/`focus:`, así que hoy en oscuro gana `dark:`; un token (una sola clase) perdería frente a `focus:` y cambiaría el aspecto. Descartados: 10 por otra clase de la misma propiedad en el literal y 3 por otra clase en la misma expresión.
- El volcado de estilos ahora fuerza `:hover`, `:focus`, `:focus-visible` y `:active` (CDP) en los elementos con esas variantes. Rama frente a `develop` (`5b7fe90`): 82 volcados, 63.302 entradas, **0 diferencias**. Defecto de prueba (migrar a mano un par descartado del modal de acceso): detectado, el borde con foco en oscuro pasaba de `zinc-800` a azul. Retirado. Así se encontró D-08 (`paridad.md`).
- `lint:colors`: `dark` 1.314 → 1.147 y `palette` 3.315 → 2.981; 167 clases con tokens.
- Resultados: lint ✓, lint:colors ✓, unit 79/79, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias).

## PR 3 — Texto (`feat/ui-tokens-text`)
- [x] Inventario, tabla (`src/styles/tokens/text.json`, 17 tokens: pares con ≥ 3 usos), codemod (`scripts/codemods/text.mjs` sobre el CLI común `family.mjs`) y revisión manual
- [x] Cobertura ≥ 90 %: **93,6 %** (540 de 577 pares)
- [x] Verificación completa
- [x] PR (#54)

### Notas de verificación del PR 3
- Regla de precedencia afinada: dos literales de la misma expresión solo compiten si pueden coexistir en el elemento; las ramas opuestas de un ternario no (`on ? 'text-blue-600' : 'text-slate-500 dark:text-zinc-400'` se migra). Con la regla del PR 2 la cobertura era 87,9 %.
- Fallo encontrado en la primera versión y corregido: el bloqueo no se propagaba (`Navbar.jsx:110`, base sin migrar con la rama alternativa migrada). Ahora un literal que no se migra bloquea a todo lo que coexiste con él (prueba en `codemodText.test.js`). En ese caso concreto no había cambio visible: `group-hover:` gana a `dark:` por especificidad (`.group:hover .x` 0,3,0 frente a `.dark .x` 0,2,0), no por orden.
- El volcado de estilos no cubría `group-hover:` (18 usos): ahora fuerza `:hover` en los `.group`. Rama frente a `develop` (`636dd02`): 82 volcados, 64.132 entradas, **0 diferencias**.
- Sin migrar: 37 pares, 16 sin token (uno o dos usos) y 21 descartes por precedencia, casi todos por un acento de texto en el mismo literal (`text-blue-500`…). Quedan 3 pares de borde que la regla nueva permitiría migrar; no se tocan aquí para no mezclar familias.
- `lint:colors`: `dark` 1.147 → 607, `palette` 2.981 → 1.901; 707 clases con tokens.
- Resultados: lint ✓, lint:colors ✓, unit 88/88, integración 10/10, build ✓, E2E macOS 79 ✓ (133 omitidas: capturas y volcado), E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01).

## PR 4 — Superficies (`feat/ui-tokens-surfaces`)
- [x] Inventario, tabla (`src/styles/tokens/surfaces.json`, 43 tokens), codemod (`scripts/codemods/surfaces.mjs`, incluye `index.css`) y revisión manual
- [x] Cobertura ≥ 75 %: **79,2 %** (266 de 336 pares de fondo)
- [x] Verificación completa
- [x] PR (#55)

### Notas de verificación del PR 4
- El codemod lee también los `@apply` de CSS (cada uno es una expresión de clases) y los grises de iOS en hex (`[#1c1c1e]`, `[#2c2c2e]`); los acentos en hex (`#0A84FF`…) siguen para el PR 5.
- `index.css`: `glass-*`, `ios-*` (fondo, borde fino con 4 tokens `hairline-3…6` y texto `ink-3`), fondo y color de `body` (`canvas`, `canvas-ink`), fondo y borde de `liquid-glass` y `liquid-glass-active` (`liquid-*`) y scrollbars (`scrollbar-thumb*`). Las sombras no se tocan (fuera de la capa). Las clases siguen existiendo.
- Al pasar a token, la regla oscura de esas utilidades baja de `.dark .x` (0,2,0) a `.x` (0,1,0). Revisado: ninguna se combina con clases de color en el mismo elemento; `liquid-glass` + `liquid-glass-active` (`BottomNav`) sigue ganando la segunda por orden.
- **La red detectó un cambio y se corrigió:** `sportColors.planned` (`CalendarPage.jsx:1498`) se interpola en otra plantilla junto a `bg-white`; con el token, en oscuro ganaba `bg-white` (volcado: 72 diferencias en el Calendario oscuro; capturas: `calendario` oscuro en los 3 tamaños). El codemod no puede verlo (la clase se define en un sitio y se combina en otro): ese par vuelve a mano a `bg-white dark:bg-zinc-900` con un comentario. Tras revertirlo: 82 volcados, 64.132 entradas, **0 diferencias**.
- `lint:colors`: `dark` 607 → 334, `palette` 1.901 → 1.373; 980 clases con tokens.
- Resultados: lint ✓, lint:colors ✓, unit 94/94, integración 10/10, build ✓, E2E macOS 79 ✓ (133 omitidas), E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01).

## PR 5 — Acentos
Partido en 5a y 5b (decisión del usuario, 2026-11-09): clasificar unos 740 usos por significado en un solo PR no era revisable.

### PR 5a — Estados y métricas (`feat/ui-tokens-accents`)
- [x] Mapa de significado: `action`, `danger`, `positive`, `warning` (`src/styles/tokens/accents.json`, 43 tokens, incluido el azul iOS `action-ios`)
- [x] Métricas fuera de las gráficas: `metric-*-ink` y `legacy-*` (`src/styles/tokens/metrics.json`, 13 tokens, a mano); D-07 en `paridad.md`
- [x] Codemod con lista de inclusión revisada (`scripts/codemods/accents.mjs`), clases sueltas y opacidad
- [x] Verificación completa
- [x] PR (#56)

### Notas del PR 5a
- Los acentos no se migran por color: `emerald-500` es "positivo" en un mensaje de éxito y "VO2" o "carrera" en otra pantalla. El codemod solo toca las expresiones de `ALLOW` (archivo y línea, revisadas una a una) y todo lo demás queda excluido y bloquea lo que coexiste con ello.
- Clases sueltas sin pareja `dark:` (`text-red-500`) → token con el mismo valor en ambos modos. Con opacidad (`bg-red-500/10`) se reutiliza el token con el mismo modificador (`bg-danger/10`): mismo color. Solo cambia la precedencia frente a otra clase de la misma variante y propiedad presente a la vez, caso que la regla ya bloquea.
- 144 usos de estado migrados en 21 archivos (25 descartes por precedencia) y 15 usos de CTL/ATL/TSB a mano (Calendario, `EvolutionChart`, `ChartsSection`, `TrainingStatusCard`). CTL en `blue-500` es exactamente `metric-ctl` (`#3b82f6`).
- Volcado frente a `develop` (`74e2bfb`; referencia tomada en `18adc4e`, mismo árbol), con estados y métricas: 82 volcados, 64.132 entradas, **0 diferencias**.
- `lint:colors`: `dark` 334 → 271, `palette` 1.373 → 1.155; 1.145 clases con tokens.
- Resultados: lint ✓, lint:colors ✓, unit 102/102, integración 10/10, build ✓, E2E macOS 79 ✓ (133 omitidas), E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01).

### PR 5b — Categorías (`feat/ui-tokens-categories`)
- [x] Deportes, FC, potencia, ritmo, velocidad, cadencia, carga, VO2, VFC, sueño, pasos, secciones de Ajustes, estado de forma (`AdvancedAnalytics`, iOS), Strava, "hoy" del Calendario, métricas fuera de las gráficas (`EvolutionChart`) y los estados excluidos en 5a (`src/styles/tokens/categories.json`, 84 tokens; `scripts/codemods/categories.mjs`); D-09 en `paridad.md`
- [x] Verificación completa
- [ ] PR

### Notas del PR 5b
- Cada expresión revisada se asigna a un grupo en `ASSIGN` (archivo → línea → grupo) y usa los tokens de ese grupo: el mismo `orange-500` es `sport-run` en el historial y `legacy-sport-strength-orange` en los puntos del Calendario. Los estados de 5a solo se usan en el grupo `state` (fuera de él, `emerald-500` es cadencia o VO2, no "positivo"). Cada grupo usa también los pares neutros (texto, bordes, superficies), para no dejar bloqueado el neutro que comparte expresión con el acento; un neutro suelto no pasa a un token que solo coincide en valor (`text-slate-300` no es `scrollbar-thumb`).
- Donde una categoría tiene otro color en otra pantalla, el token es `legacy-*` con su valor (carrera en verde y fuerza en naranja/verde en el Calendario, FC en `red-500` en los bloques): D-09.
- **La red detectó un cambio y se corrigió en el codemod:** la primera pasada migraba juntos `text-slate-400 dark:text-zinc-500` y `hover:text-red-500` (detalle), y `border-slate-100/50 dark:border-zinc-800/50` y `hover:border-blue-500/20` (Rendimiento). Hoy, en oscuro, gana `dark:` y no hay hover; con tokens ganaba el hover (volcado: 103 diferencias en `:hover`, oscuro). Es el caso de D-08. Ahora (`guardStates`) un par `dark:` de base no se migra si en lo que coexiste con él hay una clase de estado sin su `dark:` de la misma propiedad (prueba en `codemodCategories.test.js`). Tras corregirlo: 82 volcados, 64.132 entradas, **0 diferencias**.
- 237 pares sustituidos; 17 descartes por precedencia en líneas asignadas (D-08 y similares).
- Cobertura de acentos (clases de color de acento en `src/components` y `App.jsx`): 795 antes del PR 5a → 285 ahora, **64 %**. Lo que queda: 83 en escalas ordinales que reutilizan colores de estado (RPE, calidad del sueño, banco de energía, IF, categoría de puerto, nivel de VO2 y de perfil de potencia, estrés, telemetría, progreso del plan, rampa), 17 por precedencia (D-08) y el resto, usos sueltos sin categoría estable (iconos de tarjetas, tarjetas de la landing, degradados, tooltips de Salud, `FuelingPanel`…). Las escalas son estado según la regla de `dataviz` y se definen en la Capa 3.
- `lint:colors`: `dark` 271 → 184, `palette` 1.155 → 853, `arbitrary` 39 → 9.
- Resultados: lint ✓, lint:colors ✓, unit 113/113, integración 10/10, build ✓, E2E macOS 79 ✓ (133 omitidas), E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01).

## PR 6 — Gráficas (`feat/ui-tokens-charts`)
- [ ] Recharts (9 archivos), SVG del Calendario y `ActivityMap` con `useChartTheme()`
- [ ] Volcado: rejilla, mapa y vista "Forma" revisados expresamente
- [ ] PR

## Cierre
- [ ] Cobertura final frente a los objetivos
- [ ] `MEMORY.md`, `CHANGELOG.md`, roadmap

---
Versión: 0.1.0 — 2026-11-09
