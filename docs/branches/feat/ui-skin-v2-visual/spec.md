# Especificación SDD — rama `feat/ui-skin-v2-visual` (PR 5: dirección visual, D7)

## 1. Identificación
- **ID:** `spec-rediseno-02-c3-skin-dir` (extensión operativa de `spec-rediseno-02-c3-skin`)
- **Título:** Dirección visual de la piel v2 sobre Dashboard y Calendario
- **Autor:** agente OpenCode
- **Fecha:** 2026-11-11
- **Estado:** pendiente de aprobación (parada del flujo SDD antes de escribir código)
- **Spec de la capa:** `docs/branches/feat/ui-shell/spec.md` (RF9–RF11) — **no se duplica**.
- **Spec de la rama anterior:** `docs/branches/feat/ui-skin-v2/spec.md` (mecanismo M1–M4, PR 4).
- **Plan de la capa:** `docs/branches/feat/ui-shell/plan.md`, PR 5.
- **Base:** `origin/develop` en `fcba9fd` (PR 4 mergeado).
- **Cierra:** **D7** (dirección visual), con parada de aprobación tras el PR 5.

## 2. Objetivo
Definir la voz visual de la piel v2 (tipografía, radios, sombras, paleta y gráficas) y aplicarla **solo a Dashboard y Calendario**, detrás de `html[data-ui="v2"]`, sin tocar v1, para que el usuario apruebe la dirección antes de extenderla al resto de pantallas en el PR 6.

## 3. Contexto y justificación
- v1 está congelada desde el PR 2: cualquier valor nuevo va detrás de `html[data-ui="v2"]` y necesita capturas propias (RF10/RF11).
- El mecanismo ya existe y está probado (PR 4): `data-ui` se aplica antes del primer pintado y cambia en caliente.
- El hueco `html[data-ui="v2"]` de `src/styles/tokens.css` está vacío. Este PR lo llena, pero **acotado a dos pantallas**: el resto de v2 debe seguir idéntica a v1 hasta el PR 6.
- Dos deudas de color que la Capa 1 dejó abiertas se ven justo en estas pantallas y esta dirección las resuelve: el `#eab308` de TSB (1,87:1 sobre blanco, **no pasa** contraste) y los colores `legacy-*` del Calendario (sky/emerald/red de 2,5–3,3:1 en textos de 9–11 px).

## 4. Dirección propuesta: «Panel»

Una app de entrenamiento leída como **instrumento**, no como juguete: superficies planas con borde explícito, radios contenidos y consistentes, jerarquía tipográfica más ancha, y **un significado = un color** en todas las gráficas y fichas.

1. **Estructura.** Fuera el «globo» de iOS: las tarjetas pasan de 16/24 px de radio a **12 px (móvil) y 14 px (escritorio)**, las fichas interiores a 10 px, y la sombra difusa se cambia por **borde de 1 px + sombra de 1–2 px**. En oscuro, en vez de `shadow-none`, un **anillo** de 1 px.
2. **Tipografía.** El extremo pequeño sube 1 px (9→10, 10→11, 11→12) y el grande 2 px (20→22, 24→26, 30→34): más legible en datos densos y con más jerarquía. Números **tabulares** y tracking negativo en cifras; etiquetas en mayúsculas con tracking abierto. No cambia la familia (la pila del sistema es la misma en macOS y en el contenedor de capturas).
3. **Paleta neutra.** Gris azulado frío en claro (`#e9ebef` de lienzo, tarjeta blanca, borde `#d6dae1`) y grafito en oscuro (`#0b0c0e` / `#14161a`). La rampa de texto se reajusta para que **todo texto pase AA** sobre su superficie (hoy `ink-4` está en 2,57:1).
4. **Semáforo único.** CTL **cobalto**, ATL **carmín**, TSB **ámbar**: los mismos tres colores en las fichas del Dashboard, en la leyenda, en el gráfico de evolución y en la PMC del Calendario (hoy CTL es azul en la gráfica y verde en la ficha, y TSB es amarillo en la gráfica y verde en la ficha: D-07/D-09).
5. **Gráficas.** Rejilla y ejes más recesivos, series de 2 px, áreas al 10 %, tooltip oscuro con borde y **valores `.dark` propios** (D-10) en lugar de repetir los de claro.

### 4.1 Tabla de tokens (claro → oscuro)

| Token | v1 (claro / oscuro) | v2 claro | v2 oscuro | Uso en estas pantallas |
|---|---|---|---|---|
| `--surface-card`, `--surface-5`, `--surface-6` | `#fff` / `#1c1c1e` | `#ffffff` | `#14161a` | Tarjetas y fichas |
| `--surface-2`, `--sunken`, `--sunken-2`, `--sunken-6` | `#f1f5f9` / zinc-800 | `#eef0f4` | `#1c1f24` | Controles, pistas, cabeceras |
| `--line-*`, `--hairline-*` | slate/zinc | `#d6dae1`, hairline 6 % | `#262a31`, hairline 8 % | Bordes |
| `--ink` | `#0f172a` / `#fff` | `#101317` | `#f2f4f7` | Cifras |
| `--ink-2`, `--body`, `--body-soft` | slate / zinc | `#1a1f26`, `#333b47`, `#495462` | `#e6e9ee`, `#d4d9e0`, `#a8b1bd` | Texto |
| `--ink-3` | `#64748b` / `#a1a1aa` | `#4b5563` (7,4:1) | `#9aa3b1` (7,0:1) | Etiquetas |
| `--ink-4` | `#94a3b8` / `#71717a` | `#6b7482` (4,7:1) | `#828b99` (5,3:1) | Micro-etiquetas |
| `--metric-ctl` | `#3b82f6` | `#2563eb` (5,2:1) | `#60a5fa` (7,1:1) | Fitness |
| `--metric-atl` | `#f43f5e` | `#be123c` (6,3:1) | `#fb7185` (6,7:1) | Fatiga |
| `--metric-tsb` | `#eab308` (**1,9:1**) | `#b45309` (5,0:1) | `#fbbf24` (10,9:1) | Forma |
| `--legacy-ctl-sky`, `--legacy-atl-*` | sky/rose/purple | `#0369a1`, `#be123c` | `#7dd3fc`, `#fda4af` | Calendario (PMC semanal) |
| `--legacy-tsb-up`, `-down`, `-low` | emerald/amber/red | `#047857`, `#b45309`, `#be123c` | `#34d399`, `#fbbf24`, `#fb7185` | Calendario (estado) |
| `--metric-*-tile` | iOS (`#30D158`, `#FF9F0A`…) | `#be123c`, `#047857`, `#b45309`, `#4338ca`, `#7e22ce`, `#0e7490` | versión clara +2 pasos | Iconos de ficha |
| `--shadow-card` | `0 2px 12px 3 %` | `0 1px 2px 5 % + 0 0 0 1px 4 %` | `0 0 0 1px 6 %` | Tarjeta agrupada |
| `--radius-*` (lg/xl/2xl/3xl) | 8 / 12 / 16 / 24 | 10 / 10 / 12 / 14 | igual | Tarjetas, fichas, chips |

Contraste medido contra la superficie de la tarjeta (WCAG 2.1, umbral 4,5:1 texto y 3:1 elementos gráficos). **Toda la tabla pasa**; `#eab308` deja de usarse en estas pantallas.

### 4.2 Detalles que dan voz a la dirección
- **Rótulo de sección con marca**: los títulos de sección («Fisiología y Carga», «Tendencia y Capacidad», «Evolución de Rendimiento») llevan una marca de 12×2 px en cobalto delante. Se implementa con una clase `section-header` en `cardClasses.js` (inerte en v1) y CSS de ámbito.
- **Chips de icono neutros**: las fichas de métrica cambian el fondo pastel por un chip neutro y dejan el color en el icono. Menos ruido, mismos significados.
- **Cifras tabulares** en toda la piel y valores +2 px en el extremo grande.

### 4.3 Cómo se revisó antes de escribir código
El 2026-11-11 se generó un **preview sin tocar el código de producción**: la app real con datos simulados, el borrador de CSS inyectado en tiempo de ejecución y el ámbito imitado en las raíces de las dos pantallas. Las 12 capturas (2 pantallas × 2 temas × 3 tamaños) están en `docs/branches/feat/ui-skin-v2-visual/preview/`.

Límites conocidos del preview, para no confundirlo con la implementación:
- Los colores de las series se aproximan con `stroke`/`stop-color` en CSS (las gráficas reales los reciben por `chartTheme`); el tema `.dark` de las gráficas es el que falta en v1 (D-10).
- El **lienzo de la app** (fondo de página) sigue siendo el de v1 a propósito: vive fuera del ámbito y se toca en el PR 6.
- El `data-skin` del preview se marca desde el test; en la implementación es un atributo del componente.

## 5. Requisitos funcionales

- [ ] **RF5.1 Aislamiento.** Todo valor nuevo vive dentro de `html[data-ui="v2"] [data-skin="dashboard"]` / `[data-skin="calendar"]` (y su variante `.dark`). Con `data-ui` ausente, **0 diferencias** de volcado y **0 capturas** de v1 cambiadas.
- [ ] **RF5.2 Marcado.** `data-skin="dashboard"` en la raíz de `AdvancedAnalytics` y `data-skin="calendar"` en la raíz de `CalendarPage`. Es un atributo inerte en v1.
- [ ] **RF5.3 Escala.** Los tokens se consumen por variable: color (ya lo hacía), radio, sombra y tamaño de texto. Para radio/sombra/tamaño, una **capa de piel** (`src/styles/skin-v2.css`, sin `@layer`, importada al final) reescribe las clases de utilidad dentro del ámbito. Sin refactor de `tailwind.config.js`.
- [ ] **RF5.4 Gráficas.** `chartTheme` gana un tema `v2` (claro y oscuro) que solo usan estas dos pantallas, vía contexto (`ChartSkinProvider`), para no tocar las gráficas de Rendimiento, Salud ni Detalle.
- [ ] **RF5.5 Paleta validada.** `scripts/check-palette.mjs` lee los bloques v2 de `tokens.css` y comprueba contraste y separación (ΔE) en claro y oscuro; sale en verde. Se puede ejecutar a mano (`node scripts/check-palette.mjs`).
- [ ] **RF5.6 Sin lógica.** No se tocan `src/services`, `src/store`, `src/utils` ni `src/supabase.js` (RF12 de la capa).
- [ ] **RF5.7 Colores sueltos del Calendario.** Los dos valores del «Ramp» semanal (`text-emerald-500` y `text-red-400`) pasan a tokens con **el mismo valor** en claro y oscuro (`legacy-tsb-up` y `danger-light`): v1 no cambia y v2 hereda el carmín y el verde nuevos. El resto de colores sueltos del Calendario queda como está.
- [ ] **RF5.8 Accesibilidad.** No desaparece ningún `aria-label`/rol usado por los E2E; el informe táctil no empeora (113) y no baja ningún texto por debajo del umbral de su rol.

## 6. Criterios de aceptación

- [ ] `node scripts/style-diff.mjs <develop> <rama>` = **0 diferencias** (v1).
- [ ] Las **48 capturas de v1** no cambian; las 48 de v2 se regeneran en Linux y **solo cambian las 12 de Dashboard y Calendario** (3 tamaños × 2 temas); las 36 restantes siguen byte a byte.
- [ ] La dirección se presenta en capturas (claro/oscuro/móvil/tablet) de las dos pantallas y el usuario la aprueba **antes** de extenderla (D7).
- [ ] `node scripts/check-palette.mjs` en verde; `#eab308` ya no aparece en las gráficas de estas dos pantallas.
- [ ] `lint`, `lint:colors` (no sube), `lint:ui` (14), `test:unit` (192 + nuevas), `test:integration` (10), `build`, E2E macOS y Docker con **0 ✘**, táctil 113.

## 7. Diseño técnico

| Archivo | Cambio |
|---|---|
| `src/styles/tokens.css` | **Nuevo bloque** de piel v2 (dos selectores de ámbito × claro/oscuro) con paleta, radios y sombras. No se tocan los bloques generados. |
| `src/styles/skin-v2.css` | **Nuevo.** Capa de piel: tamaños de texto, radios y sombras de las clases de utilidad dentro del ámbito. |
| `src/index.css` | Importa `skin-v2.css` al final (después de `@tailwind utilities`). |
| `src/components/dashboard/AdvancedAnalytics.jsx` | `data-skin="dashboard"` + `ChartSkinProvider`. |
| `src/components/pages/CalendarPage.jsx` | `data-skin="calendar"` + `ChartSkinProvider`. |
| `src/components/charts/chartTheme.js` | Tema `v2` claro/oscuro (`getChartTheme(theme, skin)`). |
| `src/components/charts/ChartSkin.jsx` | **Nuevo.** Contexto de piel para gráficas (`useChartSkin`, `ChartSkinProvider`). |
| `src/components/charts/useChartTheme.js` | Lee el contexto; por defecto `v1`. |
| `src/__tests__/unit/chartTheme.test.js` | Valida también el tema v2 contra los bloques v2 de `tokens.css`. |
| `scripts/check-palette.mjs` | **Nuevo.** Validador de contraste y ΔE de la paleta v2. |
| `e2e/__screenshots__/visual-v2.spec.js/**` | 12 capturas regeneradas (Dashboard y Calendario). |
| `docs/branches/feat/ui-skin-v2-visual/` | `spec.md` (este), `plan.md`, `tasks.md` tras la aprobación. |

Notas de implementación:
- **Por qué variables y no un refactor de Tailwind:** las clases ya compilan a valores literales; cambiar `tailwind.config.js` afectaría a toda la app (incluidas las pantallas que deben seguir intactas). La capa de piel acota el cambio por ámbito y deja el paso a PR 6 en añadir selectores.
- **Por qué contexto para las gráficas:** Recharts recibe hex por JS, no lee variables; el contexto limita el tema v2 a las dos pantallas sin condicionar el resto.
- **Alternativa descartada:** cambiar `html[data-ui="v2"]` en global. Es más simple, pero en el PR 5 cambiaría las 8 pantallas y la revisión de D7 dejaría de ser sobre dos.

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| El +1 px del extremo pequeño desborda el Calendario (celdas de ~130 px) | Revisión en móvil y tablet; si algo se rompe, el extremo pequeño se queda como está y el cambio se limita al grande |
| La capa de piel gana a variantes `dark:` de las mismas clases | Se declaran los valores de ambos temas dentro del ámbito y el volcado lo comprueba |
| Las 36 capturas de v2 restantes cambian por arrastre (fondo, `body`, tokens globales) | No se toca ningún token global; el diff de capturas se revisa archivo a archivo |
| La dirección no le gusta al usuario | Es una rama de un PR y toda ella vive detrás de `data-ui="v2"`; revertir es no mergear |

## 9. Pruebas

```bash
node scripts/check-palette.mjs
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                 # macOS: visual* se omiten
npm run test:e2e:docker             # capturas de referencia (Linux)
```

Volcado comparativo en serie (`develop` en `wt-develop` con `E2E_PORT=5274`, rama con 5273):

```bash
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-develop" npx playwright test e2e/tools/style-dump.spec.js
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-rama"    npx playwright test e2e/tools/style-dump.spec.js
node scripts/style-diff.mjs "$TMPDIR/dump-develop" "$TMPDIR/dump-rama"
```

## 10. Lo que este PR no hace
- No extiende la piel a Rendimiento, Actividades, Detalle, Salud ni Perfil (PR 6).
- No cambia el lienzo de la app (`body`/`--canvas`): el fondo compartido de las 8 pantallas se toca en el PR 6.
- No toca la landing, el acceso ni la Capa 4/5/6.
- No añade escalas ordinales nuevas (zonas, RPE, sueño): siguen como están hasta que una pantalla del PR 6 las pida.

---
Versión: 0.1.0 — 2026-11-11
