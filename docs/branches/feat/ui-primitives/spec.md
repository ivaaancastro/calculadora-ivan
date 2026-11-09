# Especificación SDD — spec-rediseno-02-c2 (Capa 2: primitivas)

## 1. Identificación
- **ID:** `spec-rediseno-02-c2`
- **Título:** Capa 2 del rediseño: primitivas de UI en `src/components/ui/`, sin cambio visible
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-09
- **Estado:** en curso. Aprobada el 2026-11-09 por el usuario: "Apruebo todo", incluidas las propuestas de D1 a D6 (sección 8)
- **Depende de:** `spec-rediseno-02` (roadmap, "Capa 2 — Primitivas"), `spec-rediseno-02-c0` (red de seguridad) y `spec-rediseno-02-c1` (tokens, mergeada en `develop` por los PR #52 a #59)

## 2. Objetivo
Que las recetas de UI repetidas (tarjeta, stat, control segmentado, campo, botón, modal y tooltip de gráfica) vivan en un solo sitio, `src/components/ui/`, con los **valores actuales**. Así, la piel v2 de la Capa 3 cambia una variante en lugar de decenas de JSX. Es una refactorización invisible: ni las capturas ni el volcado de estilos cambian.

## 3. Contexto y justificación

### 3.1 Punto de partida
- No existe `src/components/ui/`. Los componentes que ya hacen de primitiva están repartidos por las pantallas (3.3).
- `src/index.css` define 21 utilidades propias. Ya leen tokens desde la Capa 1, pero 14 no tienen ningún uso (3.2).
- Tipografía, radios y sombras siguen escritos a mano en cada componente; la Capa 1 los dejó fuera.
- `npm run lint:colors` es un trinquete **por archivo**, y un archivo nuevo empieza en 0. Por eso una primitiva no puede llevarse un color suelto de la pantalla de origen, aunque el total no suba (decisión D2).
- El volcado de estilos de la Capa 1 (`e2e/tools/style-dump.spec.js`) solo compara 15 propiedades de **color**. Una primitiva puede cambiar el relleno, el radio, el tamaño de letra o la sombra sin que el volcado lo vea, y las capturas toleran 100 píxeles. Antes de migrar hay que ampliarlo (6.5).

### 3.2 Clases de `src/index.css`
Medido en `develop` (`f77aea0`), contando clases completas en `src/` (JS/JSX/TS, sin `__tests__`) y en `e2e/`.

| Clase | Usos / archivos | Dónde | Destino en esta capa |
|---|---|---|---|
| `ios-card` | 33 / 5 | Salud 12 (incluida la definición de `IosCard`), Ajustes 12, `AdvancedAnalytics` 7, `HistoryList` 1, detalle 1 | `Card`; se elimina |
| `ios-touch` | 13 / 2 | Salud 8, `AdvancedAnalytics` 5; siempre junto a `ios-card`, en las fichas de métricas | `Card pressable`; se elimina |
| `ios-header` | 13 / 3 | Ajustes 6, Salud 4, `AdvancedAnalytics` 3 | `SectionHeader`; se elimina |
| `glass-nav` | 2 / 2 | `Navbar`, cabecera del detalle | Se queda para la Capa 3 (D6) |
| `liquid-glass`, `liquid-glass-active` | 2 + 2 / 1 | `BottomNav` | Se queda para la Capa 3 (D6) |
| `glass-panel`, `ios-card-secondary`, `ios-tab-bar`, `ios-segmented`, `ios-squircle`, `apple-label`, `pulse-animation`, `pt-safe`, `pt-safe-top`, `pl-safe`, `pr-safe`, `px-safe`, `pb-safe-nav`, `mb-safe-nav` | **0** | — | Se eliminan (código sin uso) |
| `custom-scrollbar` | 15 / 6 | detalle 8, Calendario 3, otros 4 | Utilidad, no primitiva: se queda |
| `hide-scrollbar` | 6 / 4 | detalle 3, Rendimiento, Salud y **`src/hooks/useSwipeNavigation.js`**; también lo usan como selector `e2e/gestures.spec.js` (4) | Se queda: lo usa una carpeta protegida (RF3) |
| `no-spinner`, `touch-scroll`, `pb-safe`, `overscroll-contain`, `touch-callout-none` | 6, 4, 3, 2, 2 | Calendario, detalle, modal, `BottomNav` | Utilidades: se quedan |

Ninguna clase `ios-*` aparece en los E2E ni en las pruebas unitarias.

### 3.3 Componentes que ya hacen de primitiva
| Componente | Dónde se define | Usos | Nota |
|---|---|---|---|
| `IosCard` | `pages/HealthPage.jsx:15` | 6 (Salud) | `ios-card` + `p-4 sm:p-6` |
| `MetricCard` | `activity/ActivitySharedUI.jsx:5` | 26 (detalle) | Stat compacto |
| `PillTab` | `activity/ActivitySharedUI.jsx:15` | 4 (detalle) | Opción de control segmentado |
| `CustomChartTooltip` | `activity/ActivitySharedUI.jsx:26` | 1 (detalle, zonas) | Tooltip oscuro con colores `zinc` sueltos |
| `MetricHelp` | `activity/ActivitySharedUI.jsx:56` | **0** | Sin uso |
| `InfoTooltip` | `common/InfoTooltip.jsx` | 14 (9 tarjetas de Rendimiento) | Solo con `hover` (incumple RF10) |
| `Card` | `dashboard/ChartsSection.jsx:5` | — | `ChartsSection` no se renderiza (código sin uso, Capa 6) |
| `EmptyState` | `dashboard/EmptyState.jsx` | 1 (`Dashboard`) | Único estado vacío con componente propio |
| `LazyFallback` | `ActivityRouteWrapper.jsx:9` y `ActivitySubRoutes.jsx:10` | 1 + 1 | Duplicado idéntico |
| `CustomTooltip`, `HistoryChartTooltip` | `EvolutionChart.jsx:6`, `HealthPage.jsx:74` | 1 + 1 | Tooltips de gráfica propios |
| `FeatureCard`, `StatItem`, `FadeIn` | `LandingPage.jsx` | 6, 3, 13 | Landing: Capa 4 |
| `DurationInput`, `Row` | `CalendarPage.jsx:40`, `FuelingPanel.jsx` | 3, varios | Locales a su pantalla; no se tocan |

### 3.4 Patrones repetidos
Medido con un recorrido del AST de `src/components/**/*.jsx` y `App.jsx` (2.389 elementos JSX). Una **receta** es el conjunto de clases de un elemento, contando las dos ramas de un ternario y sin contar las de colocación y espaciado externo (márgenes, ancho, `flex-1`, `shrink-0`, posición, `z-`). Dos usos comparten receta si, sin esas clases, son idénticos.

| Patrón | Elementos | Recetas distintas | Recetas con ≥ 2 usos | Lo que muestra |
|---|---|---|---|---|
| Botón (`<button>`) | 119 en 24 archivos (Calendario 38, Ajustes 13, landing 11, `Navbar` 10, detalle 10) | **100** | 14, que cubren 33 botones | Casi cada botón es distinto. Hay grupos claros: acciones de los diálogos del Calendario (`rounded-full`, `bg-inverse` / fantasma), botones de icono redondos (detalle, Calendario, cerrar), borrar en texto (`text-slate-300 hover:text-red-500`) |
| Campo (`input`, `select`, `textarea`) | 44 en 6 archivos (Calendario 20, Ajustes 14, modal 6) | 30 | 11, que cubren 25 | Grupos: modal de añadir (6), acceso (3 + 2, con D-08), filtros del historial (3), bloques del Calendario (4 pares), Ajustes (3 pares y un trío) |
| Tarjeta (`div` con fondo, borde y radio) | 72 + 33 `ios-card` | 43 | La de las tarjetas de Rendimiento (`bg-surface-5 border-line-muted rounded-2xl shadow-sm`) tiene 11 usos; las interiores, 5 + 5 + 4 + 4, cada grupo en un solo archivo | |
| Stat (etiqueta, cifra, unidad) | `MetricCard` 26; fichas `ios-card ios-touch`: Salud 8, `AdvancedAnalytics` 4 + 1 en bucle | 4 | Las 4 | Cada pantalla tiene su tamaño, pero dentro de ella son idénticas |
| Control segmentado (opción activa/inactiva) | ~28 sitios + 4 usos de `PillTab` | 3 familias | Las 3 | **A** "píldora iOS" (`bg-surface-4 text-ink shadow-xs` / `text-ink-3`): 10 sitios + `PillTab`. **B** tarjetas de Rendimiento (`bg-surface-3 … shadow-sm` / `text-slate-500 hover:text-slate-700`, `text-[8–9px]` en mayúsculas): 10. **C** bloques del Calendario (`px-2 py-0.5 text-[10px] rounded-full`): 8. Cambia el color de la opción activa (tono) y, en B, el tamaño |
| Pestañas | Tira de secciones de Rendimiento y menú lateral de Ajustes | 2 | 0 | Una por pantalla, generadas en bucle |
| Badge | ~25 `<span>` pequeños con fondo y radio | ~22 | 2 pares (Calendario) | Casi todos codifican estados o escalas ordinales (RPE, VFC, nivel…), aún sin tokens (Capa 3) |
| Modal | 4 capas `fixed inset-0`: añadir manual (`AddActivityModal`), planificar y ver entreno (Calendario), acceso (landing); más el menú de `Navbar` | 4 | 0 | Solo `AddActivityModal` es hoja inferior en móvil. Ninguno tiene `role="dialog"` ni cierra con Escape (el menú de `Navbar` sí) |
| Skeleton | **0** | — | — | No hay ninguno. La carga es texto con `animate-spin`/`animate-pulse` (2 `LazyFallback` idénticos y 2 pantallas completas: `Dashboard` y `App`) |
| Estado vacío | 8 (`EmptyState`, historial sin resultados, Salud, mapa sin GPS, detalle, Calendario, 2 tarjetas de Rendimiento) | 8 | 0 | Cada uno con su propio diseño y copy |
| Tooltip de gráfica | 18 `<Tooltip>` de Recharts | 6 | 1 (`tooltipStyleFor`, 3 usos) | 5 del detalle con `content={() => null}` (solo cursor sincronizado). Contenido propio en `EvolutionChart`, `CustomChartTooltip`, `HistoryChartTooltip` y 2 en `MmpAndEfCard`; `contentStyle={tooltipStyleFor(ct)}` en 3 tarjetas de Rendimiento |

### 3.5 Tooltips y toque
Medido a 390 px (proyecto `mobile`, Pixel 7 con `hasTouch`) tocando al 60 % del ancho cada gráfica **de la pantalla activa**: el tooltip se abre en el Dashboard, en Salud (vista "Historial") y en las 4 gráficas de Rendimiento (sección "Todos").

**Corrección (2026-11-09, PR 0):** la primera medida, presentada con la spec, decía que en Salud y Rendimiento no se abría. Era un error de método: `MobileSwipePager` monta las otras pestañas fuera de la pantalla, y se tocó la gráfica de una de ellas. En Salud, además, la gráfica solo existe en la vista "Historial". Por tanto, D4 (c) no requiere ningún cambio: el PR 7 solo fija este comportamiento con una prueba.

`InfoTooltip` (14 usos) solo se abre con `group-hover`, así que en un teléfono no se puede leer.

### 3.6 Objetivos táctiles
Informe de `e2e/touch.spec.js` a 390 px en `develop`: **113 controles de menos de 44 px** (Calendario 43, Actividades 21, detalle 16, Rendimiento 10, Ajustes 9, Dashboard 7, Salud 5, landing 2). El roadmap preveía que el informe bloqueara a partir de la Capa 2, pero agrandarlos cambia el aspecto (D5).

### 3.7 Conclusión del inventario
Las recetas de tarjeta, stat, control segmentado y cabecera de sección se repiten de verdad y pueden centralizarse con 0 diferencias. Botones y campos son casi todos distintos: con la regla "mantener el aspecto", una primitiva solo puede absorber los usos que ya son idénticos (28 % de los botones y 57 % de los campos). Unificar el resto es un cambio visual, y le corresponde a la Capa 3 (valores) o a la 5 (pantallas). Skeleton, estado vacío, badge y pestañas no tienen hoy ninguna receta repetida que sustituir (D1, D3).

## 4. Requisitos funcionales
- [ ] **RF1. Ubicación:** las primitivas viven en `src/components/ui/`, un archivo por familia, exportadas desde `src/components/ui/index.js`.
- [ ] **RF2. Centralizar sin unificar:** cada variante de una primitiva reproduce **exactamente** una receta actual. Una receta se convierte en variante si tiene ≥ 2 usos idénticos o si la familia ya tiene una primitiva por otro motivo (Modal, D4). Los usos que no encajan se quedan como están y se listan en `tasks.md`, para la Capa 3 o la 5.
- [ ] **RF3. `className` acotado:** el `className` de una primitiva solo admite colocación y espaciado (margen, relleno, ancho, alto, `flex`/`grid`, posición, `overflow`, `divide-*` sin color). Color, tipografía, radio, borde, sombra y efectos solo pueden venir de una variante. Lo comprueba `lint:ui` (6.6).
- [ ] **RF4. Solo tokens:** las primitivas usan clases de `tokens.css` y, en el tooltip de gráfica, `useChartTheme()`. `npm run lint:colors` no sube en ningún archivo. Si una receta necesita un color que hoy no tiene token, se crea un token exacto (D2).
- [ ] **RF5. Mismo DOM:** una primitiva renderiza la misma etiqueta, el mismo anidamiento y las mismas clases calculadas que el JSX que sustituye. No añade envoltorios. Sí puede añadir atributos ARIA sin efecto visual (`aria-pressed`, `role="dialog"`, `aria-modal`, `aria-labelledby`).
- [ ] **RF6. Migración completa por PR:** cada PR migra todos los usos que encajan en su primitiva y elimina las clases y componentes locales que sustituye (`ios-card`, `ios-touch`, `ios-header`, `IosCard`, `MetricCard`, `PillTab`, `CustomChartTooltip`…).
- [ ] **RF7. Ninguna primitiva sin uso:** cada exportación de `ui/` se usa al menos una vez fuera de `ui/`, y las clases retiradas no vuelven a aparecer. Ambas cosas las comprueba `lint:ui`.
- [ ] **RF8. Sin cambios de lógica:** no se tocan `src/hooks`, `src/utils`, `src/services`, `src/store` ni `src/supabase.js`. Los cambios de comportamiento sin efecto visual (Escape, tooltip al tocar) solo entran si se aprueban en D4.
- [ ] **RF9. Accesibilidad que no se pierde:** se conservan las etiquetas asociadas a los campos (Capa 0), los `aria-label` y los roles que usan los E2E (`getByRole('button', { name })`). Ninguna primitiva cambia el rol de un control.

## 5. Criterios de aceptación (en cada PR)
- [ ] `npm run lint`, `npm run lint:colors`, `npm run lint:ui`, `npm run test:unit`, `npm run test:integration` y `npm run build` en verde.
- [ ] E2E en macOS: 79 ✓ (más las pruebas nuevas). E2E en Docker (`npm run test:e2e:docker`): las 48 capturas sin diferencias. El ✘ de `gestures.spec.js:37` es el fallo esperado de D-01.
- [ ] Volcado de estilos de `develop` frente a la rama, con las propiedades ampliadas (6.5): **0 diferencias**. Si hay alguna, se corrige la primitiva: no se acepta ninguna diferencia en esta capa.
- [ ] Si el CI difiere de local, manda el CI.
- [ ] Ninguna referencia de captura cambia. Si una cambiara, se revisa una a una y se para a consultar.
- [ ] Cobertura de la familia en `tasks.md`: usos migrados, usos fuera de la primitiva y por qué.
- [ ] PR hacia `develop`, de menos de 400 líneas salvo en las sustituciones mecánicas, con los resultados copiados. No se mergea sin autorización explícita.

**Hecho cuando (capa):** existen las primitivas aprobadas, todas con uso; `ios-card`, `ios-touch`, `ios-header` y las 14 clases sin uso han desaparecido de `index.css`; ninguna captura ni volcado ha cambiado.

## 6. Diseño técnico

### 6.1 Archivos
```
src/components/ui/
  index.js          exportaciones
  cx.js             une clases (filtra falsos); sin dependencias nuevas
  Card.jsx          Card, SectionHeader
  Stat.jsx          Stat, StatTile
  Segmented.jsx     Segmented, Segmented.Option
  Field.jsx         Input, Select
  Button.jsx        Button, IconButton
  Modal.jsx         Modal
  ChartTooltip.jsx  ChartTooltip (marco y filas), chartTooltipStyle
  LoadingState.jsx  LoadingState
scripts/check-ui.mjs        npm run lint:ui
scripts/ui-inventory.mjs    inventario de recetas (el de 3.4), por familia
scripts/ui-retired.json     clases y componentes retirados
src/__tests__/unit/ui/*.test.jsx
```
No se añade `clsx` ni `tailwind-merge`: `tailwind-merge` decide qué clase gana y podría cambiar la precedencia (D-08).

### 6.2 API propuesta
Las variantes llevan el nombre de su papel, no el de la pantalla. Si dos recetas solo se distinguen por su tamaño, son tamaños de una misma variante. Entre paréntesis, los usos que absorbe cada una según el inventario; la cifra exacta sale del `--inventory` de cada PR.

**Card y SectionHeader** (PR 1)
```jsx
<Card variant="grouped" pressable className="p-3.5 sm:p-4 flex flex-col justify-between">…</Card>
<SectionHeader as="p" className="mb-3">Biomarcadores clave</SectionHeader>
```
- `variant`: `grouped` (= `ios-card`: 33 + 6 de `IosCard`) | `panel` (tarjetas de Rendimiento: 11).
- `pressable` (= `ios-touch`, 13). `as` (por defecto `div`; también `section`). Sin relleno propio: el relleno sigue en `className`, como hoy.
- `SectionHeader`: `as` (`p` o `div`, como hoy) y `tone="danger"` para "Zona de peligro" (hoy `ios-header text-danger-ink-2`).

**Stat y StatTile** (PR 2)
```jsx
<Stat label="Distancia" value="12,4" unit="km" accent="text-hr" />                // MetricCard (26)
<StatTile size="lg" label="Fitness (CTL)" icon={Activity} iconTone="metric-ctl"
          value={62} sub="+3,1 % vs 28d" />                                       // fichas
```
- `Stat` sustituye a `MetricCard` con la misma API. `accent` solo acepta un token de texto.
- `StatTile` compone `Card grouped pressable`. `size`: `lg` (Fisiología de `AdvancedAnalytics`, 4), `md` (biomarcadores de Salud, 8), `sm` (KPI de `AdvancedAnalytics`, en bucle). `iconTone` elige de una lista cerrada los pares icono/fondo que hoy existen.

**Segmented** (PR 3)
```jsx
<Segmented variant="pill" size="md" value={range} onChange={setRange}
           options={[{ value: '30', label: '30d' }, …]} />
<Segmented.Option active={…} tone="power" onClick={…}>Potencia</Segmented.Option>   // si el contenedor no es común
```
- `variant`: `pill` (familia A, 10 + `PillTab`), `card` (B, 10), `mini` (C, 8). `size` según los tamaños de cada familia. `tone` para el color de la opción activa (`ink`, `action`, `run`, `power`, `hr`…, todos tokens existentes). Cada opción es un `<button>` con `aria-pressed`: el rol no cambia y los E2E siguen funcionando.
- `PillTab` se elimina. Las pestañas de Rendimiento y de Ajustes no entran (D1).

**Input y Select** (PR 4)
```jsx
<Input variant="filled" mono id="tss" … />    <Select variant="filled" …>…</Select>
```
- `variant` con las recetas repetidas: `filled` (modal de añadir, 6), `search` (historial, 3), `cell` y `cell-bare` (bloques del Calendario, 4 pares), `inline` (Ajustes: valores de zonas y fisiología, con `ringTone`). Los campos de acceso (`LoginPage`, landing) no entran: llevan el par descartado de D-08, y moverlos o pasarlos a token cambiaría el foco en oscuro.
- Reenvían `ref` y todas las props nativas (`id`, `aria-*`, `value`, `onChange`, `type`…).

**Button e IconButton** (PR 5)
```jsx
<Button variant="inverse" size="sm" onClick={save} disabled={!valid}>Guardar</Button>
<IconButton variant="ghost" label="Cerrar" icon={X} />          // aria-label obligatorio
```
- Solo las recetas con ≥ 2 usos (unos 33 botones): `inverse` y `ghost` de los diálogos y chips del Calendario, `link-muted`, `danger-text` (borrar en texto), y en `IconButton` `soft`, `ghost-danger`, `ghost` y `close`. Los otros ~86 botones son recetas únicas y se quedan (D1).
- `type="button"` por defecto, salvo que el original sea `submit`: el comportamiento debe ser el mismo en los formularios.

**Modal** (PR 6)
```jsx
<Modal open={isOpen} onClose={close} presentation="sheet" labelledBy="add-title">…</Modal>
```
- `presentation`: `sheet` (hoja inferior en móvil y diálogo desde `sm`: `AddActivityModal`) | `dialog` (centrado: planificador, visor y acceso). Cada uso conserva su fondo, su panel y su z-index (`backdrop` y `panel` con las 4 recetas actuales como variantes con nombre). Ningún modal pasa a hoja inferior en esta capa: sería un cambio visual (Capa 5).
- Añade `role="dialog"`, `aria-modal="true"` y `aria-labelledby`. Cerrar con Escape y bloquear el desplazamiento del fondo dependen de D4.
- Sin portal: crear uno cambiaría el DOM y el apilamiento (RF5).

**ChartTooltip** (PR 7)
```jsx
<Tooltip content={<ChartTooltip variant="glass" title={…} rows={[{ label, value, tone }]} />} />
<Tooltip contentStyle={chartTooltipStyle(ct)} />          // hoy tooltipStyleFor(ct)
```
- Marco (`glass`: `EvolutionChart`; `dark`: zonas del detalle y Salud; `card`: `tooltipStyleFor`) y filas con etiqueta, valor y unidad. Colores de `useChartTheme()` o de tokens.
- Sustituye a `CustomTooltip`, `CustomChartTooltip`, `HistoryChartTooltip` y a los dos `render…Tooltip` de `MmpAndEfCard`. `tooltipStyleFor` pasa a `ui/` y deja de estar en `chartTheme.js`.
- **Toque:** una prueba E2E nueva fija el comportamiento actual: el tooltip se abre al tocar en todas las pantallas (3.5).
- `InfoTooltip` entra en esta familia solo si D4 aprueba abrirlo al tocar. Si no, se queda como está.

**LoadingState** (PR 8)
```jsx
<LoadingState />                                     // LazyFallback (2)
<LoadingState fullscreen label="Cargando métricas..." />   // Dashboard y App, si sus recetas encajan
```
Sustituye a Skeleton (D1).

### 6.3 Cómo se escribe una primitiva sin cambiar el aspecto
1. `scripts/ui-inventory.mjs <familia>` lista los usos y sus recetas (archivo:línea).
2. Cada variante copia las clases de su receta en el **mismo orden de importancia**. En Tailwind el orden en el atributo no importa, pero sí qué clases hay: no se añade ni se quita ninguna. Las clases sin efecto que hoy están (`animate-in`, `fade-in`, `zoom-in-95`: no hay plugin que las genere) se conservan en esta capa, para que el volcado compare lo mismo.
3. La sustitución en las pantallas es mecánica y se revisa con `git diff --word-diff`.
4. Pruebas unitarias de cada primitiva: clases por variante (instantánea de `className`), props nativas reenviadas, `aria-*`, y que `className` rechaza en desarrollo las clases de color o tipografía (RF3).

### 6.4 Precedencia y tokens nuevos
- Una primitiva junta en un solo literal clases que antes estaban en uno o varios. Si eso cambia qué clase gana (mismo caso que D-08: `dark:` frente a `hover:`/`focus:`), el volcado lo detecta y la receta se deja fuera.
- Los colores sueltos que hoy tiene una receta (`text-slate-500 hover:text-slate-700` en la familia B, los fondos de los modales, el `zinc-900/95` del tooltip oscuro) solo pueden entrar en `ui/` como token exacto (D2). Se crean con las reglas de la Capa 1: mismo valor en claro y oscuro, tabla en `src/styles/tokens/<familia>.json` y bloque regenerado con `--tokens`.

### 6.5 Verificación ampliada
- **Volcado:** `style-dump.spec.js` acepta `STYLE_DUMP_PROPS=full`, que añade a las 15 de color: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `font-family`, `font-variant-numeric`, `padding-*`, `margin-*`, `border-*-width`, `border-*-style`, `border-*-radius`, `display`, `gap`, `width` y `height` redondeados (salvo dentro de `svg`), `transform`, `transition-property`, `transition-duration`, `backdrop-filter`, `cursor`, `user-select`, `touch-action`, `z-index` y `position`. Las claves siguen siendo la ruta en el DOM, así que un envoltorio de más o de menos aparece como diferencia.
- **Estabilidad:** antes del PR 1, dos volcados seguidos de `develop` con `full` deben dar 0 diferencias. Si alguna propiedad no es estable (animaciones de Recharts, Leaflet), se excluye solo en ese ámbito y se documenta.
- **Estados nuevos del volcado:** modal de planificar y visor de entreno (Calendario), tooltip de gráfica activo en Salud (vista "Historial", que antes no se volcaba) y en Rendimiento (solo escritorio y tableta: en móvil la sección inicial no tiene gráficas), y `group-hover` de `InfoTooltip` (ya cubierto por el `:hover` forzado en los `.group`).
- **Comando:** el de `MEMORY.md` con `STYLE_DUMP_PROPS=full`, en `develop` y en la rama, y `node scripts/style-diff.mjs <antes> <después>`.

### 6.6 `lint:ui`
`scripts/check-ui.mjs`, en CI junto a `lint:colors`:
- Cada exportación de `src/components/ui/index.js` se importa fuera de `ui/` (RF7).
- Ninguna clase ni componente de `scripts/ui-retired.json` vuelve a aparecer en `src/` (RF6).
- El `className` literal que se pasa a una primitiva no contiene clases de color, tipografía, radio, borde ni sombra (RF3). Las expresiones dinámicas se revisan a mano.

### 6.7 Áreas afectadas
- **Componentes:** `src/components/ui/` (nuevo) y las pantallas que usan cada familia.
- **Estilos:** `src/index.css` (se retiran clases), `src/styles/tokens.css` y `src/styles/tokens/*.json` solo para tokens exactos nuevos (D2).
- **Pruebas y CI:** `e2e/tools/style-dump.spec.js`, una prueba E2E de tooltip al tocar, `src/__tests__/unit/ui/`, `.github/workflows/ci.yml` (`lint:ui`).
- **Hooks, servicios, store, utilidades, `supabase.js` y base de datos:** sin cambios.

## 7. Pruebas
- **Unitarias:** una por primitiva (6.3, punto 4), `check-ui.mjs` y `ui-inventory.mjs`.
- **Integración:** las actuales (`AddActivityModal`, `HistoryList`, `ProfilePage`) deben pasar sin cambios. Usan las primitivas de Input, Select, Button y Modal, así que validan que se reenvían las props.
- **E2E:** las actuales sin cambios de selectores, más el tooltip al tocar (3.5).
- **Visual:** capturas en Docker sin diferencias y volcado ampliado con 0 diferencias.

## 8. Notas adicionales

### Decisiones (aprobadas el 2026-11-09 tal como se proponen)
- **D1. Alcance reducido respecto al roadmap.** No se crean `Skeleton` (no hay ninguno: crearlo cambia el aspecto), `EmptyState` (8 estados distintos, cada uno con su diseño), `Badge` (sin recetas repetidas con tokens: son escalas ordinales de la Capa 3) ni `Tabs` (dos tiras, una por pantalla). `Button` y los campos solo absorben las recetas repetidas (~33 de 119 botones y ~25 de 44 campos), y el resto se queda listado para la Capa 3 o la 5. A cambio, se añade `LoadingState`. **Propuesta:** aceptarlo así. La alternativa sería unificar botones y campos ya, lo que cambiaría capturas y rompería la regla de esta capa.
- **D2. Tokens exactos nuevos.** Para que una receta con colores sueltos (familia B del segmentado, fondos de modal, tooltip oscuro) pueda entrar en `ui/` sin que `lint:colors` suba, se crean tokens con su valor actual y las reglas de la Capa 1. **Propuesta:** sí. La alternativa es dejar esas recetas fuera, y entonces la familia B y el tooltip oscuro no se centralizan.
- **D3. Card y Stat en dos PR.** El roadmap los agrupaba en una rama. Por separado, cada PR se revisa en menos de 400 líneas. **Propuesta:** dos PR.
- **D4. Comportamiento sin cambio visual.** (a) `role="dialog"`, `aria-modal` y `aria-labelledby` en los modales, y `aria-pressed` en el segmentado. (b) Cerrar los modales con Escape y bloquear el desplazamiento del fondo. (c) Abrir el tooltip de gráfica al tocar donde hoy no se abre (corregido en 3.5: hoy se abre en todas, no hay nada que cambiar). (d) Abrir `InfoTooltip` al tocar. **Propuesta:** (a) sí, porque no cambia nada visible ni los roles. (b), (c) y (d) cambian la interacción: los haría en esta capa, pero cada uno en un commit propio dentro del PR de su familia y con su prueba E2E, nunca junto a una sustitución mecánica. Si prefieres que la Capa 2 sea refactor puro, pasan a la Capa 3.
- **D5. Objetivos táctiles.** Que `touch.spec.js` bloquee obliga a agrandar 113 controles, y eso cambia el aspecto. **Propuesta:** el informe sigue sin bloquear y cada PR anota su cifra. Las primitivas quedan listas para que la Capa 3 suba el mínimo en un solo sitio.
- **D6. Lo que se queda en `index.css`.** `glass-nav` y `liquid-glass(-active)` son cromo de navegación y los reorganiza la Capa 3 (`feat/ui-shell`). Las utilidades (`custom-scrollbar`, `hide-scrollbar`, `no-spinner`, áreas seguras…) no son primitivas, y `hide-scrollbar` lo usan `src/hooks` y los E2E. **Propuesta:** se quedan. Las 14 clases sin uso y `MetricHelp` se eliminan en el PR 0. `ChartsSection` (sin uso) no se migra (Capa 6).

### Hallazgos para capas posteriores
- Tipografía, radios y sombras siguen sin token: las primitivas los concentran, y así la Capa 3 puede tokenizarlos en pocos archivos.
- 17 etiquetas con `text-[9px] font-bold uppercase tracking-widest text-slate-400` (tarjetas de Rendimiento y detalle) y otras 30 recetas de etiqueta en mayúsculas: candidatas a una escala tipográfica en la Capa 3 (RF8 del roadmap: nada por debajo de 11 px).
- `overscroll-contain` está definido en `index.css` y también existe en Tailwind.
- Tarjetas interiores: 4 recetas casi iguales (`bg-sunken*`, `border-line-soft*`), cada una en un solo archivo. Unificarlas es un cambio de valor (Capa 3).

---
Versión: 0.1.0 — 2026-11-09
