# Forma — sistema de diseño

Reglas para diseñar y revisar pantallas (spec `docs/branches/feat/capa6-v2-premium/spec.md`,
RF-D1, RF-D3, RF-D5 y RF-D6). Los valores viven en el tema (`tailwind.config.js`,
`src/styles/tokens.css`); las primitivas, en `src/components/ui/` (exportadas en `ui/index.js`).
Si una pantalla necesita algo que no está aquí, se añade aquí primero.

## 1. Espacio y rejilla

| Qué | Móvil | Escritorio | Clase |
|---|---|---|---|
| Escala | múltiplos de 4 y 8 px | igual | `gap-2`, `gap-4`, `p-4`, `p-6`… (nada de `p-[13px]`) |
| Entre secciones | 32 px | 48 px | `gap-section md:gap-section-lg` (o `space-y-…`) |
| Padding de tarjeta | 16 px | 24 px | `p-card md:p-card-lg` |
| Márgenes laterales | 16 px | centrado | `px-4` |
| Ancho máximo | — | 1200 px | `max-w-content mx-auto` |
| Columnas | una | las que pida el contenido | `md:grid-cols-…` |

- Nada de huecos vacíos: si una columna se queda sin contenido, la rejilla se recompone.
- Una sola receta de tarjeta (`<Card>`), **nunca una tarjeta dentro de otra**. Para separar
  dentro de una tarjeta: filetes (`divide-y divide-hairline`) o espacio.

## 2. Jerarquía de cada pantalla

1. **La pregunta principal** («¿cómo estoy?», «¿qué hice este mes?») la responde el `Hero`: una
   cifra protagonista, su variación, un chip de estado y una frase.
2. **Métricas clave**: una rejilla de `Stat`.
3. **Detalle plegable**: gráficas, tablas y explicaciones, plegadas en móvil si son largas.

### Un dato, un sitio (RF-D1)
Cada métrica aparece **una vez** por pantalla, donde mejor se entiende. Si hace falta en otro
bloque, se enlaza o se resume sin repetir la cifra. La cifra principal lleva
`data-metric="<clave>"` (las primitivas lo ponen con la prop `metric`): el E2E
`e2e/metrics.spec.js` falla si una clave se ve dos veces (helper `e2e/support/metrics.js`).
Lo que no se ve no cuenta: pestañas fuera de pantalla, tooltips y el readout de un gráfico
mientras no se pasa el cursor (debe estar oculto, no mostrar «hoy»).

Claves en uso: `ctl`, `atl`, `tsb`, `acwr`, `ramp`, `vo2max` (`vo2max-run`, `vo2max-bike` en
las subtarjetas), `load7`, `hrv`, `rhr`, `recovery`, `sleep`, `activities`, `impact`.

### Cada control junto a lo que cambia (RF-D3)
Un selector (rango, pestañas, deporte, zoom) va en la **cabecera del bloque que controla**,
igual en móvil y escritorio. Nunca en el héroe si no cambia la cifra del héroe.

## 3. Detalle de actividad (como Strava)

- Escritorio: mapa grande arriba a la izquierda; cifras clave a la derecha.
- Móvil: primero el mapa, después la rejilla de cifras.
- Una sola barra con volver, pestañas y borrar (borrar dentro de un menú).

## 4. Listas

- Filas de **≥ 56 px**; objetivo táctil ≥ 44 px.
- La acción destructiva, en un menú (no una papelera en cada fila).
- Cifras alineadas a la derecha y tabulares (`tabular-nums`).

## 5. Tipografía y color

- **Inter** para la interfaz; **JetBrains Mono** (`font-mono`, `Stat mono`) para metadatos y
  cifras secundarias (fechas, unidades, ritmos en tablas).
- Cifras siempre tabulares. Escala mínima de 11 px (`npm run lint:type`).
- **Mayúsculas espaciadas solo en eyebrows** (etiqueta encima de una cifra o sección). Títulos y
  cuerpo, en frase.
- **Color solo con significado**: una métrica, un color; estado (bien, vigilar, mal); acción. Una
  cifra neutra va en `text-ink`.

### Métricas de carga

| Métrica | Nombre en pantalla | Token (gráfica / punto) | Texto | `data-metric` |
|---|---|---|---|---|
| CTL | **Fitness (CTL)** | `metric-ctl` | `text-metric-ctl-ink` | `ctl` |
| ATL | **Fatiga (ATL)** | `metric-atl` | `text-metric-atl-ink` | `atl` |
| TSB | **Forma (TSB)** | `metric-tsb` | `text-metric-tsb-ink` | `tsb` |
| Rampa | **Rampa** (pts/sem) | `chart-pmc-ramp` | `chart-pmc-ramp-ink` | `ramp` |

El estado de forma (TSB) usa `form-peak`, `form-productive`, `form-overload` y `form-critical`
(chip del `Hero`, colores de `Delta`). En JS, los mismos valores salen de `chartTheme.js`.

## 6. Movimiento

- Nunca `transition-all` (trinquete `npm run lint:motion`, línea base 0). Se anima solo
  pintura y transformación: `transition-paint`, `transition-colors`, `transition-transform`.
- Duraciones y curva del tema: `duration-fast` (120 ms), `duration-base` (200 ms),
  `duration-slow` (400 ms), `ease-forma`.
- Pulsación: `active:scale-press` (**0,98**; 1 con movimiento reducido). La llevan `Button`
  con fondo, `IconButton` y `Card pressable`.

## 7. Estados (RF-D6)

- Nunca «0», «0.00» ni «--» cuando falta el dato: `EmptyState` con una acción («Conectar
  Strava», «Registrar…»). Si falta la cifra del héroe, no se pinta la cifra.
- Toda pantalla tiene esqueleto de carga (`Skeleton` / `LoadingState`).

## 8. Primitivas

Recetas en `*Classes.js`; las pantallas solo pasan colocación y espaciado en `className`
(`npm run lint:ui`).

### `Hero`
Héroe sin caja, con filete superior (`hero-rule`) teñido por el chip o por `accent`.

| Prop | Qué |
|---|---|
| `eyebrow` | contexto corto (mayúsculas espaciadas) |
| `chip` | `{ label, tone }`, tono `neutral \| peak \| productive \| overload \| critical` |
| `label`, `value`, `unit` | la cifra protagonista (`value` ya formateado; sin valor no se pinta) |
| `delta` | normalmente `<Delta …/>` |
| `metric` | clave `data-metric` de la cifra |
| `line`, `sub` | frase narrativa y línea secundaria |
| `aside` | lo que acompaña a la cifra (no controles que cambian otra cosa) |
| `layout` | `split` (texto \| cifra, por defecto) o `stack` (cifra primero, frase debajo) |
| `accent`, `as`, `className`, `data-*` | color del filete, etiqueta, colocación |

Ejemplo: `dashboard/FormHero.jsx`.

### `Stat`
`label` (eyebrow, opcional), `value` (formateado), `unit`, `delta`, `sub` (una línea de
contexto), `size` `sm | md | lg`, `mono`, `metric`, `as`, `className`. Ejemplos:
`dashboard/KpiCard.jsx` (`lg`, sin etiqueta) y `calendar/MonthHero.jsx` (`md`).

### `Delta`
Una sola variación para toda la app: `value` (número; sin él no pinta nada), `text` (sustituye a
`+3,2` + `unit`), `unit`, `digits`, `flat` (banda neutra: |valor| < flat es estable),
`inverse` (subir es malo: fatiga, FC en reposo), `tone` (`good | bad | warn | flat`, cuando la
regla vive fuera), `label` (contexto para lectores de pantalla), `size` `sm | md`.

### `EmptyState`
`icon`, `title`, `description`, `tone` (`neutral | info | warning | danger`; `danger` es el
estado de error, con `role="alert"`), `action` (o `children`), `surface`, `className`.
