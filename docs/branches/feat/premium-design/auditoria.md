# Auditoría de diseño — Fase A (`feat/premium-design`)

- **Estado:** borrador para aprobación del usuario (D7). Sin cambios en `src/`.
- **Alcance:** toda la app en skin v2 «Panel», móvil (390 px) y escritorio, claro/oscuro.
- **Método (y límites):** auditoría **estática y medida**: lectura de `src/styles/tokens.css`, `skin-v2.css`, `components/ui/*`, `components/charts/*` y de las pantallas, más recuentos con `grep`. **No se generaron capturas** (AGENTS §8: solo Docker, sin PNG en bloque) ni se ejecutó lint/tests/E2E. Los hallazgos de «cómo se ve» se infieren del código y de las recetas; en Fase B/C se confirman con capturas D7. Referencias: `make-interfaces-feel-better` (Anexo A de la spec), lenguaje de `bklit-ui`, skills `frontend-design` y `dataviz`. `awwwards.com/websites/dashboard/` se abrió en el navegador integrado, pero la página solo expone nombres de estudios (sin descripciones accesibles como texto); se usa como inspiración de tono, no como fuente de medidas. El plugin `ui-design-review` no está autorizado.

## 1. Veredicto

La base es **sólida y disciplinada** (tokens, 14 primitivas, skin con radios 10/12/14, filete de 1 px, rampa de texto AA). Lo que impide el «premium» no son errores, sino **acabado**:

1. Skin v2 es una **capa de sobrescrituras** (833 líneas de `html[data-ui="v2"] [data-skin] .clase`) sobre clases de v1; no hay un sistema propio de elevación, texto ni movimiento.
2. **Gráficas casi por defecto** de Recharts: sin animación (`isAnimationActive={false}` en 20 sitios), rejilla discontinua `3 3`, degradado simple, tooltip sin tratamiento común.
3. **Tipografía diminuta y sin ritmo**: 206 `text-[10px]`, 99 `[9px]`, 87 `[11px]`, 37 `[8px]` = 429 usos ≤ 11 px; 0 `text-wrap`.
4. **Movimiento sin criterio**: 119 `transition-all`, duraciones sueltas (200/250/300/500/1000/700), 5 familias de `active:scale-*`.
5. **Estados** (vacío/carga/error) casi sin sistema: solo 7 `animate-pulse`, sin esqueletos, `LoadingState` con 3 variantes distintas.

## 2. Medidas de partida (en `src/`)

| Métrica | Valor | Objetivo Fase B/C |
|---|---|---|
| `transition-all` (clases) | **119** (0 `transition: all` en CSS) | 0 en v2 |
| `text-wrap` / `text-balance` / `text-pretty` | **0** | títulos y descripciones cortas |
| `tabular-nums` explícito | 57 (v2 lo aplica global a `[data-skin]`) | verificar en gráficas/SVG |
| Texto ≤ 11 px | **429** usos (v2 los sube +1 px) | mínimo 11–12 px en contenido, 10 solo en rótulos |
| `rounded-*` | `full` 143, `xl` 92, `lg` 54, `2xl` 46, `3xl` 10, arbitrarios 15+ | radios concéntricos |
| `shadow-*` | `sm` 44, `xs` 29, `2xl` 15, `2xs` 12, `lg` 9… | 3 niveles en capas |
| Hex sueltos en componentes | **243** en 12 archivos (calendario, `AdvancedAnalytics`, `Navbar`, `TrainingBalanceCard`, `RacePredictionsCard`, `HistoryTrendChart`, `zonesCalc`) | solo `chartTheme.js` |
| `isAnimationActive={false}` | 20 en 7 archivos | animación de entrada con `reduced-motion` |
| `prefers-reduced-motion` | `index.css`, `skin-v2.css`, `Reveal.jsx`, `useCountUp.js` | cubrir todo lo nuevo |
| `aria-*` | `label` 21, `hidden` 9, `expanded` 4, `pressed` 2, `modal` 2 | alternativa textual en gráficas |
| `role="img"`/`aria-live`/`sr-only` | 6 en total | gráficas y estados |
| `focus-visible` | 2 archivos | anillo de foco global |
| `<h1>/<h2>` | 28 | revisar jerarquía por pantalla |
| `backdrop-blur` | 24 usos | cristal solo en tooltip/modal |

## 3. Hallazgos priorizados

**Leyenda:** P0 = define el «premium» y desbloquea lo demás; P1 = alto valor; P2 = pulido. Esfuerzo S (<½ día) / M (1–2 días) / L (>2 días). Impacto A/M/B. Fase destino: B = tokens y acabado, C = gráficas, D = pantallas.

### 3.1 Color

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| COL-1 | P0 | A | M | **243 hex sueltos fuera de `chartTheme.js`** en 12 archivos: rompen tema claro/oscuro y la regla de tokens. Migrar a `useChartTheme()` o tokens. | `calendar/*`, `dashboard/AdvancedAnalytics.jsx`, `dashboard/Navbar.jsx`, `fitness/TrainingBalanceCard.jsx`, `RacePredictionsCard.jsx`, `health/HistoryTrendChart.jsx`, `pages/profile/zonesCalc.js` | B |
| COL-2 | P0 | A | M | **Paleta de series ≈ colores por defecto de Tailwind** (blue-500, rose-500, amber-500, violet-500, emerald-500, orange…). Sin identidad propia; varias series comparten tono (`ctl`/`sleep` azul; `atl`/`hr`/`strain` rosa; `ef`/`tss` violeta). Definir **paleta Forma** de 8–10 tonos con luminosidad pareada y validada con `dataviz` (claro/oscuro, daltonismo). | `styles/tokens/charts.json`, `chartTheme.js`, `tokens.css` | B→C |
| COL-3 | P1 | A | S | **Dos vocabularios de color por deporte** (D-07/D-09 documentados): `SPORTS` (run `#ea580c`, bike `#2563eb`) vs `DISTRIBUTION` (run `#f97316`, bike `#3b82f6`) y `atlOrange` legado. Unificar en una sola escala por deporte. | `chartTheme.js` | B |
| COL-4 | P1 | M | S | Lienzo en claro `238 240 244` con tarjeta blanca: contraste de superficie correcto pero **plano**; falta un tercer nivel (superficie elevada para popovers/tooltip) y un acento secundario. El cobalto es el único acento y se usa a la vez para acción, foco y marca. | `tokens.css` (skin v2) | B |
| COL-5 | P1 | M | S | Oscuro: grafito `20 22 26` correcto; el **anillo `rgba(255,255,255,.08)`** sustituye a la sombra pero el relieve entre tarjeta y lienzo (`26 29 34`) es mínimo → todo se ve «al mismo nivel». Subir separación entre niveles (lienzo/tarjeta/elevada). | `tokens.css` | B |
| COL-6 | P2 | B | S | `--faint` (`154 163 176` claro / `75 82 92` oscuro) queda **por debajo de AA** como texto; usarlo solo en decoración. | `tokens.css` | B |

### 3.2 Bordes y radios

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| RAD-1 | P0 | A | M | **Radios no concéntricos**: la skin mapea `rounded-xl` y `rounded-lg` a 10 px, `2xl` a 12 y `3xl` a 14, de modo que tarjeta (12) → ficha (10) → control (10) pierde la relación `exterior = interior + padding`. Definir escala 6/8/12/16 y regla por anidado. | `skin-v2.css` L44–55, `tokens.css` L882–886 | B |
| RAD-2 | P1 | M | S | **Radios arbitrarios** (`rounded-[8px]`, `[14px]`, 15+) y 143 `rounded-full` sin criterio (chips, botones, avatares mezclados). Fichas cuadradas (shell v2) conviven con píldoras (chips de filtros). | varios | B |
| RAD-3 | P1 | M | S | **Mapas e imágenes sin contorno neutro** (Anexo A·6). Añadir `outline: 1px solid rgb(0 0 0 / .1); outline-offset:-1px` a `ActivityMap` y avatares. | `activity/ActivityMap.jsx`, perfil | B |
| RAD-4 | P2 | B | S | Doble borde: filete `--line` y anillo `0 0 0 1px` de la sombra se acumulan en `.shadow-card.border` (borde + anillo = 2 px visibles en claro). Elegir uno. | `skin-v2.css` L56–65 | B |

### 3.3 Sombras y elevación

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| SOM-1 | P0 | A | S | Las sombras v2 son **de una sola capa** (`0 1px 2px … + 0 0 0 1px`): correcto pero sin profundidad. Definir 3 niveles en capas (`--elev-1/2/3`): reposo, flotante (popover/tooltip), modal; transparentes con tinte frío en claro. | `tokens.css` L887–889 | B |
| SOM-2 | P1 | M | S | **Escala de sombras de Tailwind sin tokenizar fuera de `data-skin`** (`shadow-2xl` 15, `shadow-xl` 7, `shadow-lg` 9, `shadow-2xs` 12): modales, menús y `ChartTooltip` (`shadow-xl`/`shadow-2xl`) no pasan por la skin. | `ui/modalClasses.js`, `chartTooltipClasses.js`, `Navbar.jsx` | B |
| SOM-3 | P2 | B | S | `--shadow-chart-tooltip` `0 8px 32px rgba(0,0,0,.12)` idéntico en claro y oscuro (el propio token lo dice); en oscuro es invisible → usar borde/anillo. | `tokens.css` L33/L81 | B |

### 3.4 Tipografía

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| TIP-1 | P0 | A | M | **429 usos de texto ≤ 11 px** (`[10px]` 206, `[9px]` 99, `[11px]` 87, `[8px]` 37). La skin sube +1 px pero en móvil el cuerpo de datos sigue siendo ilegible para muchos usuarios y rompe jerarquía (todo es «etiqueta»). Escala propuesta: 11 (rótulo mínimo) / 12 / 13 / 15 / 18 / 24 / 32; evitar 8–9 px. | transversal | B→D |
| TIP-2 | P0 | A | S | **0 `text-wrap`**. Títulos con huérfanas en móvil. `balance` en h1–h3, rótulos y tarjetas; `pretty` en descripciones cortas (no en prosa). Una regla global en v2 cubre el 90 %. | `skin-v2.css` | B |
| TIP-3 | P1 | A | M | **Familia y pesos**: pila `-apple-system … "SF Pro" … Inter`; el cuerpo usa `font-bold/black` y MAYÚSCULAS con `tracking-widest` en 10 px por doquier («rótulo gritando»). Jerarquía plana por peso. Pasar a tres roles: cifra (semibold, tabular), rótulo (medium, 11–12 px, `tracking-wide`, sin mayúsculas en cuerpo), cuerpo (regular). Evaluar una fuente variable propia para cifras (p. ej. **Geist/Inter variable**, medido). | `index.css`, `tokens.css`, `index.html` | B |
| TIP-4 | P1 | M | S | **Cifras tabulares**: la skin las aplica a `[data-skin]`, pero los textos SVG de Recharts y los de anillos/`useCountUp` no heredan; verificar en ejes, tooltips y gauges. | `charts/*`, `health/*` | B/C |
| TIP-5 | P2 | B | S | `font-smoothing: antialiased` presente en la raíz de `index.css`; confirmar en `html` y portales (modales/tooltip). | `index.css` | B |

### 3.5 Jerarquía y densidad

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| JER-1 | P0 | A | L | **Dashboard**: título de sección con marca de cobalto 12×2 px y recuento en rótulos; el elemento «héroe» (Estado de Forma / CTL-ATL-TSB) no se distingue del resto de fichas; 8–10 bloques con el mismo peso visual. Definir 1 héroe + 2 secundarios + resto colapsable. | `Dashboard.jsx`, `dashboard/*` | D |
| JER-2 | P0 | A | L | **Detalle de actividad**: es la pantalla más rica y la que más pesa; estadísticas, picos, mapa, gráficas y panel lateral compiten. Falta cabecera con la métrica clave (distancia/tiempo/ritmo) a gran tamaño y secundarias en segundo plano. | `pages/ActivityDetailPage.jsx`, `activity/detail/*` | D |
| JER-3 | P1 | A | M | **Rendimiento**: 10 tarjetas con idéntico estilo y altura variable; sin agrupación por tema (carga / potencia / eficiencia / predicciones). Encabezados de grupo y tarjeta héroe. | `pages/FitnessStatsPage.jsx`, `fitness/*` | D |
| JER-4 | P1 | M | M | **Salud**: banco de energía y anillos son los mejores elementos (medidor, resplandor); biomarcadores en rejilla homogénea sin jerarquía por estado (normal/atención). Destacar el estado. | `health/BiomarkersGrid.jsx`, `ReadinessRings.jsx` | D |
| JER-5 | P1 | M | M | **Calendario**: la vista mes tiene mucha densidad (389 + 428 + 289 líneas); sesiones como fichas planas; falta heatmap de carga y distinción clara de hoy/planificado/realizado más allá del borde discontinuo. | `calendar/*` | C/D |
| JER-6 | P2 | M | M | **Actividades (lista)**: filas de 64 px correctas; sin miniatura de deporte con peso, sin agrupación por semana, cifras alineadas a la izquierda. | `dashboard/HistoryList.jsx` | D |
| JER-7 | P2 | M | S | **Ajustes/Perfil**: patrón agrupado iOS reutilizado sin escala de importancia; «Zona de peligro» se separa solo por texto. | `pages/ProfilePage.jsx`, `profile/*` | D |

### 3.6 Distribución y shell

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| DIS-1 | P1 | A | M | **Escritorio**: contenido en columna estrecha con mucho vacío lateral en pantallas ≥ 1280 px; la rejilla de 2–3 columnas se queda corta. Ancho máx. y rejilla de 12 columnas con paneles que se reparten. | `Dashboard.jsx`, `layout/*` | D |
| DIS-2 | P1 | M | S | **Ritmo vertical**: gaps `gap-3/4/6` y `p-3/4/5` mezclados sin escala; unificar en 4/8/12/16/24. | transversal | B |
| DIS-3 | P2 | M | M | **Navbar y BottomNav** (v2 plano con filete) correctos; falta estado activo con indicador animado y tamaño del icono 24 px con etiqueta ≥ 11 px (hoy 8–10 px). | `dashboard/Navbar.jsx`, `layout/BottomNav.jsx` | B/D |

### 3.7 Gráficas (skill `dataviz`)

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| GRA-1 | P0 | A | M | **Lenguaje común de gráfica inexistente**: cada una arma su `CartesianGrid` (`3 3`, opacidad .3), ejes (`fontSize 10`), `activeDot` y tooltip a mano. Crear `components/charts/` con primitivas (`ChartFrame`, `Grid`, `Axis`, `GlassTooltip`, `Legend`) alimentadas por `useChartTheme()`. | `components/charts/*` | C |
| GRA-2 | P0 | A | M | **Sin animación de entrada**: 20 `isAnimationActive={false}`. Añadir revelado (clip/trazo, 600–800 ms, `ease-out`) con `prefers-reduced-motion` y desactivado en E2E. | `EvolutionChart`, `ActivityCharts`, `fitness/*` | C |
| GRA-3 | P0 | A | M | **Tooltip**: 4 recetas distintas (`glass`, `dark`, `dark-history`, `card`) con 11/10 px y sombras distintas. Unificar en «cristal»: superficie translúcida, borde, desenfoque 12 px, cifras tabulares, punto de color por serie. | `ui/chartTooltipClasses.js`, `ChartTooltip.jsx`, `MetricTooltip.jsx` | C |
| GRA-4 | P1 | A | M | **Rejilla**: líneas discontinuas `3 3` al 30 %; en bklit y estándar premium van continuas finísimas y **se desvanecen en los bordes**. Eje Y con ticks mínimos y unidades. | `EvolutionChart` y resto | C |
| GRA-5 | P1 | A | S | **Degradado bajo el área** presente en `EvolutionChart` (`colorCtl`, `colorTcb`) pero ausente en `ActivityCharts`, `HistoryTrendChart`, `MmpAndEfCard`: dos estilos de área. Un token `--chart-area-opacity` por serie. | varios | C |
| GRA-6 | P1 | A | M | **Sparkline, gauge y anillos**: `AppleRingGauge`/`ReadinessRings` buenos (resplandor); las tarjetas de `fitness/` no usan sparklines ni delta ni «vs semana anterior». Añadir sparkline + delta a las fichas y KPI de Dashboard. | `fitness/*`, `health/*`, `ui/Stat.jsx` | C |
| GRA-7 | P1 | A | L | **Zonas, banda de rango y proyección**: CTL/ATL/TSB sin banda de «zona óptima» ni proyección de forma; `ReferenceLine` discontinua es lo único. | `EvolutionChart`, `PmcFloatingChart` | C |
| GRA-8 | P1 | M | L | **Detalle (telemetría)**: sin brush/zoom ni sincronización de cursor entre FC/potencia/ritmo/altitud/mapa. | `ActivityCharts.jsx`, `TelemetryPanel.jsx`, `ActivityMap.jsx` | C |
| GRA-9 | P2 | M | L | **Heatmap de contribuciones** en el Calendario. | `calendar/*` | C |
| GRA-10 | P1 | A | S | **Accesibilidad de gráficas**: sin `role="img"` ni tabla/descripción alternativa; solo 6 usos de `role/aria-live/sr-only` en toda la app. Cada gráfica: `aria-label` con resumen y tabla oculta o tooltip por teclado. | todas | C |

### 3.8 Estados vacío / carga / error

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| EST-1 | P0 | A | M | **Carga**: `LoadingState` tiene 3 variantes (girador a pantalla completa, solo texto pulsante, `inline`) con textos «Cargando métricas…» / «Iniciando sistema…». Sin **esqueletos** con la forma del contenido (solo 7 `animate-pulse`). Sustituir por esqueletos por pantalla y gráfica. | `ui/LoadingState.jsx`, `loadingStateClasses.js` | B/C |
| EST-2 | P1 | A | M | **Vacío**: textos sueltos («No hay…/Sin datos») en 8+ archivos sin patrón; algunos con tarjeta (Actividades), otros con texto plano. Una receta `EmptyState` (icono, título, 1 línea, acción) en tono de la marca. | `ui/*` (nueva), `HistoryList`, `HealthPage`, `fitness/*` | B/D |
| EST-3 | P1 | A | M | **Error**: `ErrorBoundary` y errores de red sin tratamiento visual propio (reintento, causa humana). Receta `ErrorState` y aviso en línea dentro de la tarjeta, no pantalla entera. | `common/ErrorBoundary.jsx`, hooks de datos | B |
| EST-4 | P2 | M | S | Estados parciales: «sin datos de potencia/FC» en el detalle debería explicar qué falta y cómo obtenerlo. | `activity/detail/*` | D |

### 3.9 Movimiento

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| MOV-1 | P0 | A | M | **119 `transition-all`** (receta `Card` agrupada, botones, chips). Sustituir en v2 por listas explícitas (`transform, background-color, border-color, box-shadow, opacity`). Mecanismo: regla `html[data-ui="v2"] .transition-all{transition-property:…}` + clases explícitas en primitivas. Añadir script que bloquee nuevos. | `cardClasses.js`, `buttonClasses.js`, … | B |
| MOV-2 | P1 | M | S | **Tokens de movimiento**: duraciones 150/200/250/300/500/700/1000 sueltas; `ease-out` en 7 sitios, el resto `ease` por defecto. Definir `--dur-fast 120 / base 200 / slow 400` y `--ease-out`. | `tokens.css` | B |
| MOV-3 | P1 | M | S | **Pulsación**: 5 variantes de `active:scale` (`90`, `95`, `98`, `[0.97]`, `[0.98]`). Una (`0.97`) con `transition-transform`. | transversal | B |
| MOV-4 | P1 | M | M | **Entradas de pantalla y listas**: `Reveal` solo en landing; el resto aparece de golpe. Entrada (opacidad + `translateY(4px)`, escalonada ≤ 40 ms) y salida corta (150 ms) en modales y popovers. Respeta `prefers-reduced-motion`. | `ui/Modal.jsx`, listas | B |
| MOV-5 | P2 | B | S | `useCountUp` (1200 ms, retraso 150 ms) bien resuelto, solo en Salud; extender a KPI del Dashboard y Rendimiento. | `health/useCountUp.js` | B |

### 3.10 Accesibilidad

| ID | Prio | Imp. | Esf. | Hallazgo | Archivos | Fase |
|---|---|---|---|---|---|---|
| ACC-1 | P0 | A | S | **Foco**: solo 2 archivos con `focus-visible`; sin anillo global coherente (clave en navegación por teclado y escritorio). Regla global `:focus-visible` con anillo de 2 px del acento + offset. | `index.css`, `skin-v2.css` | B |
| ACC-2 | P1 | A | M | **Texto ≤ 11 px y contraste**: 8–9 px es ilegible a 390 px; combinar con TIP-1. Revisar `--faint`, texto sobre tarjetas tintadas y series claras (amarillo `tsb`) sobre blanco. | transversal | B |
| ACC-3 | P1 | M | M | Hit areas: v2 ya fuerza 44 px en móvil con reglas de `[data-…]` puntuales; en vez de parches, hacerlo en las primitivas (`Button`, `Segmented`, `Field`) y comprobar con `touch.spec.js`. | `ui/*`, `skin-v2.css` | B |
| ACC-4 | P1 | M | S | `aria-pressed` (2) y `aria-expanded` (4) escasos para los muchos segmentados y plegables; `role="tablist"` en pestañas del detalle y Salud. | `ui/Segmented.jsx`, páginas | B |
| ACC-5 | P2 | B | S | `prefers-reduced-motion` ya presente en `Reveal`, `useCountUp` y la skin; extender al resto de movimiento nuevo. | — | B/C |

## 4. Dependencias y Tailwind 4 (tarea A7)

Recomendación basada en el código actual, sin instalar nada:

| Opción | Valor | Coste | Recomendación |
|---|---|---|---|
| **No instalar `bklit-ui`** | — | requiere TS + Tailwind 4 | Confirmado (D4): portar lenguaje y piezas |
| **`d3-scale` + `d3-shape` + `d3-array`** (sueltos) | Escalas e interpoladores para banda, proyección, brush, heatmap | ~8–12 KB gzip (sin d3 completo) | **Solo si** una pieza lo exige en Fase C; medir antes de pedir OK |
| **Motion (framer-motion)** | Entradas y layout animado | ~15–35 KB gzip | **No por ahora**: CSS + `Reveal` cubren la entrada; revaluar para brush |
| **Tailwind 4** | Tokens nativos `@theme`, menos CSS | migración amplia, v1 aún viva | **No migrar** antes de la Capa 6; v1 se retira, mejor revaluarlo tras ella |
| **Fuente variable** (Geist/Inter variable) | Jerarquía y cifras | ~30–60 KB woff2, ya se carga Inter | Evaluar en Fase B con medida |

Las cifras de peso son estimaciones de orden de magnitud: **se medirán en Fase B/C antes de pedir OK**.

## 5. Plan por fase (propuesta de prioridades)

**Fase B — Tokens y acabado (1 PR, tras spec de rama con tokens exactos).** MOV-1, TIP-2, ACC-1, SOM-1, RAD-1, COL-1, COL-2 (solo definición de tokens), COL-3, COL-4/5, TIP-1 (escala), TIP-3, MOV-2/3, ACC-3/4, EST-1/2/3 (recetas de UI), RAD-2/3, SOM-2/3, DIS-2. *Riesgo:* tocar muchas clases a la vez; se mitiga con reglas bajo `html[data-ui="v2"]` y D7 por captura.

**Fase C — Gráficas Forma (1 PR; 2 si > ~800 líneas).** Orden D6: GRA-1/2/3/4/5 + `EvolutionChart` → GRA-6 → GRA-7 → GRA-8 → GRA-9; GRA-10 en todas. COL-2 se aplica aquí a las series.

**Fase D — Pantallas (bloqueada).** Orden D7: Detalle (JER-2, GRA-8) → Dashboard (JER-1, DIS-1) → Rendimiento (JER-3) → Salud (JER-4) → Calendario (JER-5) → Actividades (JER-6) → Ajustes/Perfil (JER-7). Cada una exige propuesta y aprobación.

### Quick wins (≈ 1 día, máximo efecto/esfuerzo)
`text-wrap` (TIP-2) · foco global (ACC-1) · `transition-all` → listas en v2 (MOV-1) · una sola `active:scale` (MOV-3) · sombras en capas (SOM-1) · unificar color por deporte (COL-3) · tooltip único (GRA-3).

## 6. Pendiente de verificar con capturas (Fase B/C, Docker)
Lo siguiente es **inferencia del código**, no observado en pantalla: separación de niveles en oscuro (COL-5), doble borde (RAD-4), huérfanas en títulos (TIP-2), densidad real del Calendario móvil (JER-5) y anchos en escritorio ≥ 1280 px (DIS-1). Cada uno se confirmará con 1–2 capturas reducidas, una a una, al abrir la Fase B.

## 7. Decisiones que necesito del usuario
1. **Aprobar o reordenar prioridades** (P0 de §3 y plan de §5).
2. **Escala tipográfica:** ¿subir el mínimo a 11 px (recomendado) aunque cambie la densidad actual?
3. **Paleta Forma (COL-2):** ¿partir de los tonos actuales afinados (recomendado, menos riesgo) o definir una paleta nueva?
4. **Fuente:** ¿mantener la pila actual o medir una variable propia (TIP-3)?
5. **Dependencias:** ¿autorizar medir `d3-*` sueltos en Fase C? (Motion y Tailwind 4: no por ahora.)
6. **Capturas previas:** ¿quieres que antes de la Fase B genere las capturas Docker de las zonas «pendientes de verificar» (§6)?

---
Versión: 0.1.0 — 2026-11-19 (borrador Fase A)
