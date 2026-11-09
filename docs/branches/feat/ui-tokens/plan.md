# Plan — spec-rediseno-02-c1 (Capa 1: tokens y tema)

Leído antes: `AGENTS.md`, `MEMORY.md` (5b), roadmap (`feat/webapp-redesign`) y la Capa 0 (`test/ui-safety-net`). Las medidas están en la sección 3 de `spec.md`.

**Regla de toda la capa:** ningún PR cambia lo que se ve. Ningún PR toca `src/hooks`, `src/utils`, `src/services`, `src/store`, `src/supabase.js` ni `.opencode/skills/git-release/SKILL.md`. Nada se mergea sin tu autorización; los PR van a `develop`.

## Rutina de verificación (en cada PR)
1. `npm run lint`, `npm run lint:colors`, `npm run test:unit`, `npm run test:integration`, `npm run build`.
2. `npm run test:e2e` en macOS (omite las capturas).
3. `npm run test:e2e:docker` con OrbStack arrancado: **48 capturas sin diferencias**. Nunca `test:e2e:update` en un PR de migración.
4. Volcado de estilos: `node e2e/tools/style-dump.mjs --out <dir>` en un worktree de `develop` y en la rama; `diff -r` vacío. Usa el puerto 5273 (`E2E_PORT`), así que no toca tu servidor en 5173.
5. CI verde. Si difiere de local, manda el CI.
6. Copiar los resultados en el PR y marcar en `tasks.md` solo lo verificado.

## PR 1 — Infraestructura (`feat/ui-tokens`)
Sin cambios en componentes.
1. **Prueba de concepto de la opacidad:** comprobar en una página temporal que `rgb(var(--x) / <alpha-value>)` y la variante con `calc(var(--x-a) * <alpha-value>)` dan el mismo color calculado que `bg-zinc-800/50`, `bg-white/80`, `border-black/[0.04]`, etc. Si la variante con `calc` no funciona en Tailwind 3.4, **paro y te consulto** (la alternativa es un token sin modificador de opacidad para esos pares).
2. `src/styles/tokens.css` con los tokens de las tres familias neutras y los semánticos (generados con el inventario de los codemods), importado en `src/index.css`.
3. `tailwind.config.js` con `theme.extend.colors`.
4. `src/components/charts/chartTheme.js` y `useChartTheme.js`, con la prueba de paridad contra `tokens.css`.
5. `scripts/check-colors.mjs`, `scripts/color-baseline.json` inicial, `npm run lint:colors` y el paso en CI.
6. Proyecto `tablet` (768 × 1024) en `playwright.config.js` para `visual` y `layout`. Generar las 16 capturas nuevas con `npm run test:e2e:update` **antes** de tocar ningún token en uso, revisarlas una a una y comprobar que las 32 existentes no cambian. Revisar también que `layout.spec.js` pasa a 768 px; si no pasa, es un defecto preexistente y lo registro en `paridad.md` en lugar de corregirlo aquí.
7. `e2e/tools/style-dump.mjs` con las pantallas y estados extra de la spec (6.6).
8. Verificación completa. Como ningún componente usa aún los tokens, el volcado debe ser idéntico por construcción.

## PR 2 a 6 — Una familia por PR
Cada rama sale de `develop` actualizado después de mergear el PR anterior.

| PR | Rama | Familia | Medida actual | Objetivo |
|---|---|---|---|---|
| 2 | `feat/ui-tokens-borders` | Bordes | 216 líneas, 32 archivos | ≥ 80 % |
| 3 | `feat/ui-tokens-text` | Texto | 767 líneas, 37 archivos | ≥ 90 % |
| 4 | `feat/ui-tokens-surfaces` | Superficies + `index.css` | 351 líneas, 35 archivos | ≥ 75 % |
| 5 | `feat/ui-tokens-accents` | Acentos | 367 líneas, 30 archivos | según inventario |
| 6 | `feat/ui-tokens-charts` | Gráficas | 173 líneas con hex, 21 archivos | según inventario |

Pasos de cada familia:
1. **Inventario:** `node scripts/codemods/<familia>.mjs --inventory` produce la tabla de pares y usos. Se adjunta al PR.
2. **Tabla de equivalencias:** par exacto → token. Lo que no tenga token queda igual.
3. **Codemod** con sus pruebas sobre fragmentos, ejecutado sobre `src/components`, `App.jsx` (e `index.css` en superficies).
4. **Revisión manual** de las clases construidas dinámicamente (plantillas `${...}` y objetos de color como los de `Navbar` o `CalendarPage`), que un codemod por expresión regular puede no ver.
5. Verificación completa y `npm run lint:colors -- --update` para bajar la línea base.

Particularidades:
- **Texto (PR 3):** si el diff es demasiado grande para revisarlo, se parte en `pages/` y el resto.
- **Superficies (PR 4):** incluye las utilidades `ios-*`, `glass-*`, `liquid-glass`, el fondo de `body` y las scrollbars. Las clases siguen existiendo; la Capa 2 las sustituirá.
- **Acentos (PR 5):** primero el mapa de significado (`action`, `positive`, `warning`, `danger`, `metric-*`, deportes, zonas) y los `legacy-*`; se añade D-07 a `paridad.md`. Los colores iOS en hex (`#007AFF`, `#30D158`…) entran aquí.
- **Gráficas (PR 6):** los 9 archivos de Recharts pasan a `useChartTheme()`; el SVG de la PMC del Calendario y `ActivityMap` también. La rejilla de Recharts, el mapa y la vista "Forma" del Calendario no los ven las capturas: se verifican con el volcado de estilos (6.6 de la spec), revisando expresamente esas entradas en el diff y citándolas en el PR. El canvas de la landing no se toca.

## Cierre de la capa
- Medir la cobertura final con `lint:colors` y compararla con los objetivos de la spec.
- Actualizar `MEMORY.md` (spec implementada y cómo usar tokens, `chartTheme` y `lint:colors`), `CHANGELOG.md` y marcar la Capa 1 en el `tasks.md` del roadmap.

## Riesgos
| Riesgo | Mitigación |
|---|---|
| `calc()` con `<alpha-value>` no da el color exacto | Prueba de concepto en el paso 1 del PR 1; si falla, paro y consulto |
| Un codemod cambia el orden de clases y altera la precedencia (p. ej. dos clases de color en conflicto) | Solo sustituye en el sitio, sin reordenar; el volcado de estilos lo detectaría |
| Clases construidas dinámicamente que el codemod no ve | Revisión manual (paso 4) y `lint:colors` por archivo |
| Diferencias por debajo de 100 píxeles que las capturas no ven | El volcado compara valores exactos |
| Muchos tokens con nombres numerados | Es deliberado (spec 6.3); la Capa 3 los consolida cambiando valores |
| Conflictos con otras ramas que toquen los mismos componentes | Un PR por familia, rebasado sobre `develop` justo antes de abrirlo |
| La línea base se infla a mano | El script nunca la sube solo; cualquier subida se ve en el diff del JSON |

## Lo que no hace esta capa
Unificar colores, corregir la paleta de gráficas según `dataviz`, tocar tipografía, radios o sombras, cambiar la landing ni tocar la lógica de `src/hooks` y `src/utils`. Todo eso queda registrado en la spec (sección 8) para las capas 2 a 5.

---
Versión: 0.1.0 — 2026-11-09
