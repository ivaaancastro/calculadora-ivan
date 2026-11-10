# Tareas — spec-rediseno-02-c2 (Capa 2: primitivas)

Solo se marca lo verificado. Spec y plan aprobados el 2026-11-09 ("Apruebo todo"), incluidas las propuestas de D1 a D6.

## PR 0 — Infraestructura (`feat/ui-primitives`)
- [x] `src/components/ui/index.js` y `cx.js`, con prueba
- [x] `scripts/ui-inventory.mjs` (recetas por elemento), con pruebas
- [x] `scripts/check-ui.mjs`, `scripts/ui-retired.json`, `npm run lint:ui` y paso en CI, con pruebas
- [x] `style-dump.spec.js`: `STYLE_DUMP_PROPS=full` y estados nuevos (planificador, visor de entreno, tooltip activo en Salud "Historial" y Rendimiento)
- [x] Estabilidad: dos volcados `full` seguidos de `develop` con 0 diferencias
- [x] Detección: un cambio de relleno y uno de radio se ven con `full` y no con el volcado de color; retirados
- [x] Retirar las 14 clases sin uso de `index.css` y `MetricHelp`; volcado `full` frente a `develop` con 0 diferencias
- [x] Verificación completa
- [x] PR hacia `develop` (#60)

### Notas de verificación del PR 0
- **Volcado `full`:** 51 propiedades más (tipografía, relleno, margen, bordes, radios, disposición, transformaciones, transiciones, efectos e interacción) y el tamaño de la caja fuera de los SVG. Estados nuevos: `calendario-planificador`, `calendario-visor`, `salud-historial-punto-activo` (la gráfica de Salud solo existe en la vista "Historial", que antes no se volcaba) y `rendimiento-punto-activo` (solo escritorio y tableta). En total, 104 volcados.
- **Estabilidad:** dos ejecuciones seguidas sobre el código de `develop` (`f77aea0`): 104 volcados, 90.084 elementos, **0 diferencias**. No hizo falta excluir ninguna propiedad.
- **Detección:** con `p-4` → `p-[18px]` en `IosCard` (Salud, móvil) y `rounded-2xl` → `rounded-xl` en `HrvCard` (Rendimiento, escritorio), el volcado de color da 0 diferencias en ambos casos. El `full` da 72 (relleno y tamaño) y 16 (radios). Retirados. Primer intento fallido: el relleno se probó en escritorio, donde `sm:p-6` lo anula.
- **Toque (corrección de la spec, 3.5):** el tooltip de gráfica se abre al tocar en Dashboard, Salud (Historial) y las 4 gráficas de Rendimiento (Todos). La medida presentada con la spec había tocado una gráfica de otra pestaña montada fuera de pantalla por `MobileSwipePager`.
- **Retirado:** 14 clases sin uso de `index.css` (incluida la animación `map-pulse`), `MetricHelp` (y su import sin uso en el detalle) y 5 tokens que solo usaban esas clases (`glass`, `glass-bar`, `sunken-card`, `hairline-5`, `hairline-6`; bloques de `tokens.css` regenerados con `--tokens`).
- `lint:colors`: `palette` 865 → 859 (`ActivitySharedUI`, por `MetricHelp`).
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓, unit 130/130, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01), volcado `full` de la rama frente a `develop`: 104 volcados, 90.084 elementos, **0 diferencias**.

## PR 1 — Card y SectionHeader (`feat/ui-primitives-card`)
- [x] Inventario, primitivas, sustitución, retirada de `ios-card`, `ios-touch`, `ios-header` e `IosCard`
- [x] Verificación completa
- [x] PR hacia `develop` (#61)

### Notas del PR 1
- **Cobertura:** `Card grouped` 39 (33 `ios-card` + 6 `IosCard`, 2 de ellas como receta local, abajo), de ellas 13 `pressable` y 3 `divided`; `Card panel` 11 (todas las tarjetas de Rendimiento); `SectionHeader` 13 (`as="p"` en 7). Codemod sobre el AST: cambia el elemento de apertura y el de cierre y conserva los demás atributos (`key`).
- **Se quedan como receta local** (llevan color en `className`, que RF3 no admite; la receta de la tarjeta se escribe con sus clases de tokens): la tarjeta de Salud con degradado (`bg-gradient-to-br from-white…`) y la lista de registros diarios de Salud (`divide-line-soft-3`, un solo uso).
- **Precedencia (corrección de la spec, 6.2):** `ios-card`, `ios-touch` e `ios-header` estaban en `@layer utilities`, que Tailwind emite después de sus utilidades (en el CSS de `develop`, `.ios-header` va detrás de `.mb-3` y `.text-danger-ink-2`, y `.ios-card` detrás de `.border-danger-edge-2`). Por eso nunca se veían, y se retiran sin `tone`: el `border-danger-edge-2` y el `text-danger-ink-2` de "Zona de peligro" (hoy gris con borde normal) y el `mb-3` de 4 títulos de Salud (hoy `mb-2`). Los tokens `danger-edge-2` y `danger-ink-2` siguen en uso en otras pantallas.
- **Token nuevo (D2):** `--shadow-card` en `tokens.css` (claro y oscuro, por la prueba de paridad; en oscuro no se ve, por `dark:shadow-none`) y `shadow-card` en `tailwind.config.js`. Con él, el `rgba()` de la tarjeta sale de `index.css`.
- `pressable` no suma el `transition-all` de la tarjeta: como antes, gana `transition-transform duration-150 ease-out`.
- `lint:colors`: `rgb` 11 → 10 (`index.css`).
- **Volcado `full`:** la rama da 464 claves nuevas `::active`, todas en las 13 fichas `pressable`: el volcado fuerza `:active` en los elementos con `active:` en `class`, y antes esa clase estaba dentro de `.ios-touch`. Repetido el volcado de `develop` forzando también `.ios-touch` (cambio solo en el worktree, sin commit): **104 volcados, 90.548 elementos, 0 diferencias**.
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (2 exportaciones), unit 138/138, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). En la primera ejecución de Docker falló `dashboard.spec.js:33` por tiempo (16 s); repetido 3 veces, 21/21, y la suite completa otra vez, 127 ✓. Informe táctil en macOS: 113 en `develop` y en la rama, igual por pantalla. En Docker las cifras son otras (97) por las fuentes de Linux: se compara siempre en la misma plataforma.

## PR 2 — Stat y StatTile (`feat/ui-primitives-stat`)
- [x] Inventario, primitivas, sustitución, retirada de `MetricCard`
- [x] Verificación completa
- [x] PR hacia `develop` (#62)

### Notas del PR 2
- **Alcance (acordado el 2026-11-09):** `Stat` + `StatTile` solo en el Dashboard. Las 8 fichas de biomarcadores de Salud no son idénticas entre sí: cada una tiene un pie distinto (barra de progreso de pasos, tendencia de peso con icono, texto), valores con color dinámico de paleta, unidad condicional y `gap-0.5` en SpO₂. Se quedan con `Card pressable`, para la Capa 3.
- **Cobertura:** `Stat` 26 (todas las `MetricCard`, en el detalle); `StatTile` 8: `lg` 4 ("Fisiología y Carga") y `sm` 4 ("Tendencia y Capacidad", en bucle).
- **Tokens nuevos (D2):** `hairline-5` (`black/[0.04]`, `white/[0.07]`, el borde de `MetricCard`) en `borders.json`; `metric-atl-tile` (`#FA114F`), `metric-tsb-tile` (`#30D158`), `metric-acwr-tile` (`#FF9F0A`), `metric-ramp-tile` (indigo-500), `metric-monotony-tile` (purple-500) y `metric-volume-tile` (cyan-500) en `metrics.json`. Bloques de `tokens.css` regenerados con `--tokens`. CTL usa `metric-ctl` y `metric-ctl-ink`, y VO2 usa `vo2`, que ya existían con ese valor.
- `accent` del drift: la clase llega de `src/hooks/useActivityMetrics.js` (paleta) y no se toca.
- `lint:colors`: `palette` 859 → 848, `arbitrary` 9 → 3, `dark` 188 → 186 (`AdvancedAnalytics`, `ActivitySharedUI`).
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (4 exportaciones), unit 145/145, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). Volcado `full` frente a `develop`: **104 volcados, 90.548 elementos, 0 diferencias**. Los dos volcados se lanzaron en paralelo y 7 estados fallaron por tiempo en un lado u otro; repetidos solos, los 104 están completos. Informe táctil en macOS: 113, igual que en `develop` por pantalla.

## PR 3 — Segmented (`feat/ui-primitives-segmented`)
- [x] Inventario, primitiva, sustitución, retirada de `PillTab`
- [x] Verificación completa
- [x] PR hacia `develop` (#63)

### Notas del PR 3
- **Alcance (acordado el 2026-11-09):** `pill` copia solo la receta de `PillTab` (pestañas del detalle en escritorio). Los otros 9 sitios de la familia A son 8 recetas distintas entre sí (radio, negrita de la activa, hover de la inactiva, `duration-200`, compresión, tamaño de letra) y quedan con su receta local para la Capa 3. También quedan fuera las pestañas de la `Navbar` (son `Link`), las categorías de Rendimiento en móvil (`bg-inverse`) y las pestañas con subrayado de MMP (D1).
- **Cobertura:** `pill` 4 opciones (detalle). `card` 10 sitios: `md-wide` 4 (Perfil de potencia ×2, VO2, Balance), `md` 1 (deporte de MMP, con tonos `action` y `run`), `sm` 2 (periodo de MMP, Distribución de foco) y `xs` 1 (Periodo/Histórico de MMP). `mini` 8 opciones en 4 conmutadores del Calendario (KM/MIN, FC/W con tonos `hr` y `power`), con `Segmented.Option` porque KM es condicional.
- **Tokens nuevos (D2):** `segmented-off` (slate-500), `segmented-off-hover` (slate-700), `segmented-mini-off` (slate-400; en el PR 4 pasa a `ink-4-fixed`) y `segmented-mini-off-hover` (slate-600), con el mismo valor en claro y oscuro, como antes; y `fill-segmented-2` (`slate-200/60`, `zinc-800/80`), el contenedor de `pill`.
- **D4 (a):** cada opción lleva `aria-pressed`. Rol y nombre no cambian (los E2E y el volcado las buscan por `button` y nombre), y no se añade `type`.
- `lint:colors`: `palette` 848 → 810, `dark` 186 → 185.
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (5 exportaciones), unit 151/151, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). Volcado `full` frente a `develop`: **104 volcados, 90.548 elementos, 0 diferencias** (un estado falló por tiempo y se repitió solo). El volcado no llega a los conmutadores `mini` (el planificador se abre sin bloques): una prueba temporal sin commit añade un calentamiento y un circuito de ciclismo y compara los estilos calculados de los 4 conmutadores en reposo y con `:hover` forzado, en claro y oscuro: 0 diferencias en los 15 elementos. `PowerProfileCard` no se pinta con los datos de prueba; usa la misma receta `md-wide` que VO2 y Balance, que sí están en el volcado. Informe táctil en macOS: 113, igual que en `develop`.

## PR 4 — Input y Select (`feat/ui-primitives-field`)
- [x] Inventario, primitivas, sustitución
- [x] Verificación completa
- [x] PR hacia `develop` (#64)

### Notas del PR 4
- **Cobertura:** 22 de los 44 campos. `filled` 6 (modal de añadir: 5 `Input`, 4 con `mono`, y 1 `Select`). `search` 3 (historial: el buscador y los 2 selectores, cada uno con su receta). `cell` 6 y `cell-bare` 2 (bloques y pasos del Calendario: `Input` `md` con `mono` para la distancia, `Input` `sm` para el objetivo, `Select` `cell` para la zona y `Select` `cell-bare` para el tipo de objetivo). `inline` 5 (Ajustes: `md` para peso, FC en reposo y CTL, con `ringTone` `action-bright`, `hr` y `positive`; `sm` para el mínimo y el máximo de cada zona).
- **Fuera de la primitiva:** los campos de acceso (`LoginPage` 3, landing 2; D-08); los umbrales de cada deporte en Ajustes (FC umbral, FC máx., ritmo y FTP: sin anillo de foco y con el color del valor distinto en cada uno) y los de integraciones (`section-integrations`), que la spec no incluye; y 11 campos de receta única (Calendario 9: los 3 checkboxes del filtro, título, descripción, repeticiones del circuito, tipo de paso y las 2 notas de bloque y paso; Ajustes 2: nombre y contraseña). 22 + 5 + 4 + 2 + 11 = 44.
- **Tokens:** el anillo `emerald-500` pasa a `positive` (mismo valor) y el placeholder `slate-400` del buscador a `ink-4-fixed`. Ese par ya existía como `segmented-mini-off` (PR 3) y `text.json` admite un token por par: se renombra a un nombre neutro en un commit propio, sin cambio de valor (acordado el 2026-11-09).
- **Props:** `Input` y `Select` pasan `ref` (prop normal en React 19) y el resto de props nativas al elemento. Las pruebas de integración de `AddActivityModal`, `HistoryList` y `ProfilePage` pasan sin tocarlas.
- `lint:colors`: `palette` 810 → 808 (`HistoryList`, `ProfilePage`).
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (7 exportaciones), unit 159/159, integración 10/10 (sin tocar), build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). Volcado `full` frente a `develop`: **104 volcados, 90.548 elementos, 0 diferencias** (los dos volcados en serie, sin repeticiones). El volcado no llega a los bloques del Calendario ni a las zonas en modo manual: una prueba temporal sin commit abre el planificador con un bloque y un circuito de ciclismo (distancia en KM y objetivo de ritmo), Ajustes y las zonas manuales de carrera y ciclismo, el historial y el modal, y compara los estilos calculados de todos los campos (y el color del `::placeholder`) en reposo y con `:hover`, `:focus` y `:focus-visible` forzados, en claro y oscuro: **528 elementos, 0 diferencias** (sin contar las variables `--*`, que cambian por el renombrado). Informe táctil en macOS: 113, igual que en `develop`.

## PR 5 — Button e IconButton (`feat/ui-primitives-button`)
- [x] Inventario, primitivas, sustitución
- [x] Verificación completa
- [x] PR hacia `develop`: [#65](https://github.com/ivaaancastro/calculadora-ivan/pull/65)

### Notas del PR 5
- **Inventario:** 101 botones, 89 recetas, 9 con ≥ 2 usos que cubren 21. Tras la sustitución quedan 86 elementos `<button>` y 2 recetas repetidas fuera de `ui/` (4 botones, abajo); la tercera que da el inventario son los `<button>` de las propias primitivas.
- **Cobertura:** 17 botones. `Button`: `ghost` 4 y `inverse` 2 (chips de añadir bloque del planificador), `link-muted` 2 (+ Trabajo, + Descanso), `danger-text` 3 (quitar bloque o paso). `IconButton`: `soft` 2 (volver del detalle, móvil y escritorio), `ghost` 2 (mes anterior y siguiente) y `bare` 2 (volver de la contraseña olvidada en la landing y en `LoginPage`, que no se renderiza en ninguna parte: código sin uso, Capa 6).
- **Fuera de la primitiva:** borrar actividad del detalle (2, D-08: en oscuro su color de base gana al hover rojo), las 2 opciones de la familia A de Salud (control segmentado, Capa 3). El resto son recetas únicas (D1).
- **Tokens:** `faint-fixed` (slate-300) y `fill-hover` (`slate-200/70`, `zinc-700`) nuevos. `segmented-mini-off-hover` pasa a `body-soft-fixed` (mismo valor), en un commit propio, como `ink-4-fixed` en el PR 4. El resto ya existía: `surface-2`, `fill`, `danger`, `body-2`, `ink-4-fixed`.
- **Accesibilidad:** `IconButton` exige `label` (`aria-label`). Los que tenían `title` lo conservan con el mismo texto, así que el nombre accesible no cambia. El de volver de la landing no tenía nombre y ahora se llama "Volver". `type="button"` por defecto: ningún botón migrado está en un `<form>`.
- `lint:colors`: `palette` 808 → 780, `dark` 185 → 177.
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (9 exportaciones), unit 164/164, integración 10/10 (sin tocar), build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). Volcado `full` frente a `develop`: **104 volcados, 90.548 elementos, 0 diferencias** (el de `develop` se repitió entero porque la primera ejecución se cortó). El volcado no llega a los bloques del planificador ni al formulario de contraseña olvidada: una prueba temporal sin commit abre el planificador con bloques y un circuito, el detalle de actividad y la contraseña olvidada de la landing, y compara los estilos calculados de todos los botones migrados en reposo y con `:hover`, `:focus-visible` y `:active` forzados, en claro y oscuro: **704 elementos, 0 diferencias** (sin contar las variables `--*`). Informe táctil en macOS: 113, igual que en `develop`.

## PR 6 — Modal (`feat/ui-primitives-modal`)
- [x] Inventario, primitiva, sustitución, ARIA (D4 a) y Escape y bloqueo de desplazamiento en commit propio (D4 b)
- [x] Verificación completa
- [x] PR hacia `develop`: [#66](https://github.com/ivaaancastro/calculadora-ivan/pull/66)

### Notas del PR 6
- **Inventario:** 4 capas `fixed inset-0`, todas con receta propia: añadir manual (`AddActivityModal`, hoja inferior en móvil), acceso (landing, velo en una capa aparte), planificador y visor (Calendario). Solo acceso y visor se cerraban al tocar fuera. Ninguno tenía `role="dialog"` ni Escape. El menú de `Navbar` no es un modal: se queda.
- **API:** `<Modal open onClose variant labelledBy closeOnBackdrop>`. Una `variant` por modal (`sheet`, `auth`, `planner`, `viewer`) en lugar de `presentation` + `backdrop`/`panel` de la spec: cada fondo va con su panel, así que separar los dos solo daría combinaciones que no existen. Mismo DOM: fondo, capa del velo (solo `auth`) y panel; el panel lleva `role="dialog"`, `aria-modal="true"` y `aria-labelledby` (D4 a) con el `id` nuevo del título (`add-activity-title`, `auth-modal-title`, `plan-modal-title`, `plan-viewer-title`). Sin portal.
- **Tokens:** `scrim` (`slate-900/60`), `scrim-2` (`black/40`), `scrim-3` (`black/40`, `black/70`) y `scrim-4` (`slate-900/60`, `black/80`), uno por par.
- **D4 b (commit propio):** Escape cierra el modal de arriba (una pila, por si se abren dos) y el documento no se desplaza mientras haya uno abierto: `overflow: hidden` en `<html>` y, si había barra, `scrollbar-gutter: stable` para que el contenido no se mueva. Prueba nueva `e2e/modal.spec.js` (4 pruebas, solo escritorio): rol y nombre, bloqueo y Escape en añadir, acceso y planificador, y en el visor Escape y tocar fuera. Las capturas no abren modales y el volcado solo recorre `body *`, así que el cambio en `<html>` no les afecta.
- `lint:colors`: `palette` 780 → 774, `dark` 177 → 175.
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓ (10 exportaciones), unit 170/170, integración 10/10 (sin tocar), build ✓, E2E macOS 83 ✓ (79 + 4 de `modal.spec.js`), E2E Docker 131 ✓ (127 + 4; 48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es D-01). Volcado `full` frente a `develop`: **104 volcados, 90.548 elementos, 0 diferencias** (en serie, sin repeticiones). El volcado ya abre los 4 modales (`modal-anadir`, `modal-acceso`, `calendario-planificador`, `calendario-visor`), así que no hace falta prueba temporal. Informe táctil en macOS: 113, igual que en `develop`.

## PR 7 — ChartTooltip (`feat/ui-primitives-tooltip`)
- [ ] Prueba E2E del toque actual (hoy se abre en todas las pantallas, spec 3.5), primitiva, sustitución; `InfoTooltip` al tocar (D4 d) en commit propio
- [ ] Verificación completa y PR

## PR 8 — LoadingState (`feat/ui-primitives-loading`)
- [ ] Inventario, primitiva, sustitución, retirada de `LazyFallback`
- [ ] Verificación completa y PR

## Cierre
- [ ] Cobertura final por familia, `MEMORY.md`, `CHANGELOG.md`, roadmap; spec marcada como implementada

---
Versión: 0.1.0 — 2026-11-09
