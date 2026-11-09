# Especificación SDD — spec-rediseno-02-c1 (Capa 1: tokens y tema)

## 1. Identificación
- **ID:** `spec-rediseno-02-c1`
- **Título:** Capa 1 del rediseño: tokens de color, tema de Tailwind y tema de gráficas, sin cambio visible
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-09
- **Estado:** aprobada (2026-11-09, por el usuario: "Apruebo todo", incluidas las 5 decisiones de la sección 8)
- **Depende de:** `spec-rediseno-02` (roadmap) y `spec-rediseno-02-c0` (red de seguridad, mergeada en `develop` por el PR #51)

## 2. Objetivo
Que todos los colores de la app salgan de una única capa de tokens (`tokens.css` → `tailwind.config.js` → clases, y `chartTheme` para las gráficas) con los **valores actuales**, para que la piel v2 de la Capa 3 consista en cambiar valores y no en reescribir JSX. Es una refactorización invisible.

## 3. Contexto y justificación

### 3.1 Punto de partida
- `tailwind.config.js` no tiene ninguna extensión de tema (`theme.extend: {}`), con `darkMode: 'class'`. `useTheme` pone `.dark` en `<html>`.
- `src/index.css` define utilidades `ios-*`, `glass-*` y `liquid-glass` con colores sueltos, y el fondo de `body` (`#f2f2f7` / `#000`).
- No existe `src/styles/`.

### 3.2 Medidas del repo (2026-11-09, `develop` en `8ab2963`)
Medido con scripts sobre `src/` sin `__tests__`. Una línea puede contar en varias familias.

| Medida | Valor | Nota |
|---|---|---|
| Líneas con `dark:` | 914 en 35 archivos | La spec general decía 904; la diferencia es de método (aquí se incluyen `index.css` y `App.jsx`) |
| Líneas con grises `bg-*` escritos a mano | 306 | La spec general decía 303 |
| Líneas con hex en JS/JSX/TS | 222 en 23 archivos | 173 en `src/components` + `App.jsx` (21 archivos) y **49 en `src/hooks` y `src/utils`** |
| Clases de color en `src/hooks` y `src/utils` | 25 líneas | `useWellnessAnalytics`, `useActivityMetrics`, `fitnessStatsEngine` |
| Archivos con Recharts | 9 que lo importan | + `MobileSwipePager` y `useSwipeNavigation`, que solo referencian `.recharts-wrapper` (los "10" de la spec general) |
| Gráficas fuera de Recharts | 2 | SVG propio de la PMC en `CalendarPage` y mapa Leaflet en `ActivityMap` |
| Clases de color con prefijo de breakpoint (`sm:`, `md:`…) | **0** | El color no depende del ancho |

**Tamaño por familia** (ámbito migrable: `src/components`, `App.jsx`, `index.css`):

| Familia | Líneas | Archivos | Pares claro/oscuro distintos | Tokens si se toma cada par con ≥ 3 usos | Cobertura de esos tokens |
|---|---|---|---|---|---|
| Bordes | 216 | 32 | 55 | 22 | 81 % |
| Texto | 767 | 37 | 44 | 21 | 94 % |
| Superficies | 351 | 35 | 97 | 30 | 75 % |
| Acentos | 367 | 30 | 102 (+355 clases sin par `dark:`) | se define por significado (3.3) | — |
| Gráficas | 173 líneas con hex | 21 | — | — | — |

Pares más usados (muestra): texto `slate-400 / zinc-500` (146), `slate-500 / zinc-400` (98), `slate-900 / white` (56); bordes `slate-100 / zinc-800/50` (29), `slate-200 / zinc-800` (26); superficies `slate-100 / zinc-800` (27), `white / zinc-900` (20), `white / zinc-700` (19).

### 3.3 Inventario de acentos
Hay 16 familias de Tailwind de acento en uso; **11 con 4 o más usos** (las "11 familias" de la spec general) y 5 marginales. Además hay colores del sistema iOS escritos en hex.

| Familia | Usos / archivos | Para qué se usa hoy |
|---|---|---|
| blue | 224 / 29 | Acción principal (botones, enlaces, foco `ring-blue-500`, carga), CTL, ciclismo. Convive con el azul iOS `#007AFF` / `#0A84FF` (pestañas, iconos) |
| emerald | 120 / 19 | Positivo: éxito, "óptimo", TSB ≥ 0 en Calendario, VO2 |
| amber | 102 / 13 | Aviso, TSS, FTP, sección Seguridad, TSB en la leyenda del Dashboard |
| red | 83 / 14 | Peligro: errores, borrar, cerrar sesión; también ATL en el resumen del Calendario |
| rose | 72 / 8 | Frecuencia cardiaca, ATL en el Dashboard, zonas y umbrales |
| orange | 47 / 12 | Carrera, intensidad alta, ATL en `ChartsSection`, TSB negativo, Strava (`#FC4C02`) |
| indigo | 47 / 7 | Ritmo, integraciones, degradado de ciclismo; sin significado estable |
| purple | 32 / 10 | Anaeróbico, zona 6, monotonía, nivel "élite", ATL en la tabla del Calendario |
| cyan | 16 / 2 | Natación, volumen |
| violet | 9 / 2 | EF, icono de actividad del Calendario |
| sky | 4 / 2 | CTL en el Calendario, Salud |
| yellow, teal, pink, lime, green | 11 en total | Casos sueltos (degradados, deportes del Calendario) |

**Incoherencias detectadas** (no se corrigen aquí, porque corregirlas cambia el aspecto):
- **CTL** es `#3b82f6` en el Dashboard y `#38bdf8` (sky) en el Calendario.
- **ATL** es `#f43f5e` (rose) en `EvolutionChart`, `#f97316` (orange) en `ChartsSection`, `red-400` y `#a78bfa` / `purple` en el Calendario.
- **TSB** es `#eab308` (yellow) en la serie, `amber` en la leyenda, y `#30D158` / `#FF9F0A` (verde y naranja iOS) según el signo.
- Coexisten dos azules de acción (`blue-500/600` de Tailwind y `#007AFF` / `#0A84FF` de iOS) y dos verdes positivos (`emerald` y `#30D158`).

### 3.4 Gráficas
- Las gráficas usan casi los mismos colores en claro y oscuro: rejilla `#cbd5e1` al 30 %, ejes `#64748b`, cursor y línea "HOY" `#94a3b8`, anillo de punto activo `#fff`. Solo `AdvancedAnalytics` lee el tema.
- La skill `dataviz` (validador `validate_palette.js`) sobre la paleta actual del Dashboard (CTL `#3b82f6`, ATL `#f43f5e`, TSB `#eab308`): **falla** la banda de luminosidad (`#eab308`) y avisa de contraste 1,87:1 en claro. En oscuro pasa el contraste. Además, `EvolutionChart` pinta los valores con el color de la serie (antipatrón de la skill: el texto debe usar tokens de texto). Se registra para la Capa 3; corregirlo aquí cambiaría el aspecto.
- Hay colores de zonas y de estado generados en `src/hooks/useFitnessAnalytics.js` y `src/utils/fitnessStatsEngine.ts` (hex y clases), que la Capa 1 no puede tocar por RF3.

### 3.5 Qué vigila la red y qué no
- 32 capturas (8 pantallas × 390/1440 px × claro/oscuro), `maxDiffPixels: 100`, solo en Linux.
- **No vigila:** el canvas de la landing y la rejilla de Recharts (ocultos en la captura), el mapa (las teselas están bloqueadas y la pestaña Mapa no se captura), la vista "Forma" del Calendario con su SVG, menús, modales, `hover` y foco, ni 768 px.
- Una diferencia de color pequeña en una zona reducida puede quedar por debajo de 100 píxeles.

## 4. Requisitos funcionales
- [ ] **RF1. Tokens:** `src/styles/tokens.css` declara los colores como canales RGB (`--ink: 15 23 42`) en `:root` y su valor oscuro en `.dark`, con los **valores exactos de hoy**. Reserva `html[data-ui="v2"]` para la Capa 3 sin definir valores.
- [ ] **RF2. Tema de Tailwind:** `tailwind.config.js` expone los tokens en `theme.extend.colors` como `rgb(var(--x) / <alpha-value>)`, de modo que `bg-surface/80` funcione. Para pares cuyo valor oscuro lleva opacidad propia (p. ej. `zinc-800/50`), se usa `rgb(var(--x) / calc(var(--x-a, 1) * <alpha-value>))`. La paleta de Tailwind por defecto **se mantiene** hasta la Capa 6.
- [ ] **RF3. Tokens exactos:** cada token equivale a un único par (claro, oscuro) que ya existe. Un codemod solo sustituye una clase o un par si coincide exactamente con un token. Los valores parecidos **no se unifican** en esta capa: eso es un cambio visual y corresponde a la Capa 3 o a la 5.
- [ ] **RF4. Significado:** existen tokens semánticos `action`, `positive`, `warning`, `danger`, `metric-ctl`, `metric-atl` y `metric-tsb`, además de los de categoría (deportes, zonas) que el inventario justifique. Su valor es el actual en el Dashboard. Donde otra pantalla usa otro valor para la misma métrica, se migra a un token con nombre `legacy-*` que conserva su valor, y la incoherencia queda registrada como defecto D-07 en `paridad.md`.
- [ ] **RF5. Tema de gráficas:** `src/components/charts/chartTheme.js` exporta los colores de series, ejes, rejilla, cursor, líneas de referencia, puntos activos y tooltip para claro y oscuro, y `useChartTheme()` (en `src/components/charts/`, no en `src/hooks`) devuelve el del tema activo. Sigue la estructura de parámetros de la skill `dataviz` (series, estado, superficies). Una prueba unitaria comprueba que sus valores coinciden con `tokens.css`.
- [ ] **RF6. Migración por familias:** bordes, texto, superficies, acentos y gráficas, en ese orden (sección 6.4), con un codemod reproducible por familia y una rama y un PR por familia.
- [ ] **RF7. Sin regresión de colores:** se mantiene la regla `no se reintroducen valores sueltos` con un script de comprobación (6.5) que se ejecuta en CI.
- [ ] **RF8. 768 px:** se añade un proyecto `tablet` (768 × 1024) a las capturas antes de migrar nada, generado desde `develop` sin cambios y revisado una a una.
- [ ] **RF9. Fuera de alcance explícito:** `src/hooks`, `src/utils`, `src/services`, `src/store`, `src/supabase.js` (RF3 general); el canvas de partículas de la landing (Capa 4); tipografía, radios y sombras (se tokenizarán en la Capa 2 con las primitivas o en la Capa 3).

## 5. Criterios de aceptación
En cada PR:
- [ ] `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run test:e2e:docker` y `npm run build` en verde, con los resultados copiados en el PR. El CI manda si difiere de local.
- [ ] **Capturas: cero diferencias** en las 48 (32 + 16 de 768 px). Si alguna difiere, se justifica una a una en el PR o se corrige; no se regenera ninguna referencia en los PR de migración.
- [ ] **Volcado de estilos idéntico** (6.6) en todas las pantallas y estados extra, en claro y oscuro, comparando `develop` con la rama.
- [ ] El script de colores (6.5) pasa, y la línea base baja en la familia migrada.
- [ ] No hay cambios en las carpetas de RF9 ni en `.opencode/skills/git-release/SKILL.md`.

Al terminar la capa (todas las familias):
- [ ] Cobertura mínima de lo migrado, medida por el script: texto ≥ 90 %, bordes ≥ 80 %, superficies ≥ 75 %; acentos y gráficas, el objetivo que fije su inventario en la tabla del PR (orientativo ≥ 70 %). El resto queda en la línea base con su motivo (par de uso único, valor dentro de lógica protegida…).
- [ ] Pares `dark:` de color en lo migrado: solo los que queden en la línea base.
- [ ] `MEMORY.md`, `CHANGELOG.md` y `paridad.md` (D-07) actualizados.

## 6. Diseño técnico

### 6.1 Archivos
| Archivo | Cambio |
|---|---|
| `src/styles/tokens.css` | Nuevo. Importado desde `src/index.css` antes de `@tailwind base` |
| `tailwind.config.js` | `theme.extend.colors` con los tokens |
| `src/components/charts/chartTheme.js`, `useChartTheme.js` | Nuevos |
| `src/index.css` | Las utilidades `ios-*`, `glass-*`, `liquid-glass`, `body` y scrollbars pasan a tokens (familia superficies). Las clases siguen existiendo hasta la Capa 2 |
| `src/components/**` | Codemods por familia |
| `scripts/codemods/*.mjs` | Un codemod por familia, con su tabla de equivalencias |
| `scripts/check-colors.mjs`, `scripts/color-baseline.json` | Comprobación y línea base |
| `e2e/` y `playwright.config.js` | Proyecto `tablet`; herramienta de volcado de estilos |
| `.github/workflows/ci.yml` | Paso `npm run lint:colors` |

### 6.2 Nombres de tokens (propuesta)
Nombres por función, con pasos numerados cuando hoy hay varias variantes de la misma función. Ejemplos con los pares más usados:

| Token | Claro | Oscuro | Usos |
|---|---|---|---|
| `ink` | `slate-900` | `white` | 56 |
| `ink-2` | `slate-800` | `zinc-100` | 28 |
| `ink-3` (secundario) | `slate-500` | `zinc-400` | 98 |
| `ink-4` (atenuado) | `slate-400` | `zinc-500` | 146 |
| `ink-inverse` | `white` | `zinc-900` | 11 |
| `line` | `slate-200` | `zinc-800` | 26 |
| `line-soft` | `slate-100` | `zinc-800/50` | 29 |
| `canvas` (fondo de `body`) | `#f2f2f7` | `#000000` | — |
| `surface` | `white` | `zinc-900` | 20 |
| `surface-2` | `slate-100` | `zinc-800` | 27 |
| `action` | `blue-600` | `blue-400` | 16 (texto) |
| `metric-ctl` / `metric-atl` / `metric-tsb` | `#3b82f6` / `#f43f5e` / `#eab308` | iguales | Dashboard |

La tabla completa de cada familia la genera su codemod en modo inventario y se adjunta a su PR.

### 6.3 Por qué tokens exactos
Con `maxDiffPixels: 100`, unificar por ejemplo `dark:text-white` y `dark:text-zinc-100` (34 usos) cambiaría muchos más píxeles. Tokens exactos garantizan cero diferencias; la consolidación se hace después cambiando valores, que es justo lo que permite esta capa.

### 6.4 Orden de migración y tamaño
| PR | Rama | Familia | Tamaño | Motivo del orden |
|---|---|---|---|---|
| 1 | `feat/ui-tokens` | Infraestructura: tokens, tema, `chartTheme` vacío de consumidores, script, 768 px, volcado | ~10 archivos, sin cambios en componentes | Base; no cambia nada visible por construcción |
| 2 | `feat/ui-tokens-borders` | Bordes | 216 líneas, 32 archivos | La más pequeña: piloto del codemod y del flujo de verificación |
| 3 | `feat/ui-tokens-text` | Texto | 767 líneas, 37 archivos | La más concentrada (94 % con 21 tokens) |
| 4 | `feat/ui-tokens-surfaces` | Superficies e `index.css` | 351 líneas, 35 archivos | Cola larga (97 pares) y utilidades globales |
| 5 | `feat/ui-tokens-accents` | Acentos y significado | 367 líneas, 30 archivos | Requiere el mapa de significado; las gráficas lo usan |
| 6 | `feat/ui-tokens-charts` | Gráficas: Recharts, SVG del Calendario, Leaflet | 173 líneas con hex, 21 archivos | Consume `metric-*`; lo que menos vigila la red |

Los PR 2-6 son codemods mecánicos y pueden superar las 400 líneas (excepción prevista en la spec general). El de texto se puede partir por carpeta si resulta difícil de revisar.

### 6.5 Evitar que vuelvan los valores sueltos
**Viable con un script propio**, sin dependencias nuevas: `scripts/check-colors.mjs` (`npm run lint:colors`).
- Cuenta por archivo: clases de la paleta de Tailwind (`slate-400`, `blue-500/10`…), clases arbitrarias con hex (`bg-[#2c2c2e]`), literales hex y `rgb()/rgba()`, y pares `dark:` de color.
- Funciona como trinquete: falla si un archivo **supera** su cifra de `color-baseline.json` o si un archivo nuevo tiene colores sueltos. Con `--update` baja la línea base; nunca la sube sin editar el JSON a mano.
- Excluye las fuentes (`tokens.css`, `chartTheme.js`) y cuenta aparte las carpetas protegidas (no pueden crecer, pero no se exige que bajen).
- Alternativas descartadas: `eslint-plugin-tailwindcss` no distingue colores de paleta de otras clases ni permite trinquete; `no-restricted-syntax` de ESLint solo ve literales, no la composición de `className`. Quitar la paleta por defecto de Tailwind sería la regla definitiva, pero rompe todo lo no migrado: se deja para la Capa 6.

### 6.6 Verificación de lo que no ven las capturas
- **Volcado de estilos calculados** (`e2e/tools/style-dump.mjs`): para cada pantalla y tema guarda en JSON `color`, `background-color`, `border-*-color`, `outline-color`, `box-shadow`, `fill`, `stroke` y `stop-color` de todos los elementos visibles, incluidos los de la rejilla de Recharts y los `path` de Leaflet. Se ejecuta en `develop` y en la rama, y el `diff` debe estar vacío. Como compara valores calculados, no depende del sistema operativo, detecta diferencias por debajo de 100 píxeles y cubre los elementos ocultos en las capturas.
- **Estados extra** en el volcado: pestaña Mapa del detalle (polilíneas y marcadores de Leaflet), vista "Forma" del Calendario (SVG de la PMC), menú de perfil abierto, modal de añadir actividad, modal de acceso y `hover` del punto activo de `EvolutionChart`.
- **Rejilla de Recharts:** cubierta por el volcado (`stroke` y `opacity` de `.recharts-cartesian-grid line`).
- **Canvas de la landing:** fuera de alcance (RF9); el PR verifica con `git diff` que `LandingPage.jsx` no cambia en las líneas del canvas.

### 6.7 Hooks, servicios, store, utilidades y base de datos
Sin cambios. Los colores generados en `useWellnessAnalytics`, `useFitnessAnalytics`, `useActivityMetrics` y `fitnessStatsEngine` (74 líneas) quedan en la línea base como "protegidos" y necesitarán su propia spec para devolver claves semánticas en lugar de colores.

## 7. Pruebas
- **Unitarias:** paridad `chartTheme` ↔ `tokens.css`; prueba de los codemods sobre fragmentos (cada par conocido se sustituye, los desconocidos no); prueba del script de colores.
- **Integración:** las actuales.
- **E2E:** las actuales, más el proyecto `tablet` en `visual.spec.js` y `layout.spec.js`.
- **Comprobación de equivalencia en el PR 1:** una página de prueba temporal (no se commitea) con cada token junto a su clase original, volcada en claro y oscuro, para demostrar que `rgb(var(--x) / calc(...))` produce exactamente el mismo color calculado, incluido el caso de opacidad en oscuro.

## 8. Notas adicionales

### Decisiones que necesitan tu aprobación
1. **Tokens exactos y línea base residual** (RF3, 6.3), en lugar de unificar valores parecidos. Consecuencia: unos 73 tokens neutros en v1 (22 de bordes, 21 de texto y 30 de superficie), más los de acento, con nombres numerados poco elegantes, y un resto de pares de un solo uso en la línea base. Es la única forma de garantizar cero diferencias.
2. **Reducción de alcance:** los colores de `src/hooks` y `src/utils` (74 líneas en 4 archivos) quedan fuera, por RF3 de la spec general. "Casi no quedan colores sueltos" se mide sobre `src/components`, `App.jsx` e `index.css`.
3. **768 px:** propongo añadirlo ya en el PR 1. El color no depende del ancho (0 clases de color con breakpoint), así que la Capa 1 no lo necesita estrictamente, pero la referencia debe generarse antes de cualquier cambio, y la Capa 2 sí toca layout. Son 16 capturas más.
4. **Métricas incoherentes** (3.3): los tokens `metric-*` toman el valor del Dashboard; el resto se migra a `legacy-*` y se registra como D-07 para unificarlo en la Capa 3.
5. **Documentación de las ramas de familia:** propongo que esta spec cubra toda la capa y que cada rama de familia lleve solo `tasks.md` y su tabla de equivalencias en el PR, sin una spec propia que aprobar. Si prefieres aprobar cada familia por separado, cada rama tendría una spec corta.

### Hallazgos para capas posteriores
- `TSB #eab308` no pasa la validación de `dataviz` en claro (contraste 1,87:1).
- Valores numéricos pintados con el color de la serie en `EvolutionChart`.
- Colores de estado (rojo, ámbar, verde) reutilizados como colores de zona y de serie, contra la regla de `dataviz` de reservarlos.
- Dos azules de acción y dos verdes positivos (3.3).

---
Versión: 0.1.0 — 2026-11-09
