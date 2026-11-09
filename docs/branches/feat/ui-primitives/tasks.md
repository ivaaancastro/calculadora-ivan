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
- [ ] Inventario, primitivas, sustitución, retirada de `MetricCard`
- [ ] Verificación completa y PR

## PR 3 — Segmented (`feat/ui-primitives-segmented`)
- [ ] Inventario, primitiva, sustitución, retirada de `PillTab`
- [ ] Verificación completa y PR

## PR 4 — Input y Select (`feat/ui-primitives-field`)
- [ ] Inventario, primitivas, sustitución
- [ ] Verificación completa y PR

## PR 5 — Button e IconButton (`feat/ui-primitives-button`)
- [ ] Inventario, primitivas, sustitución
- [ ] Verificación completa y PR

## PR 6 — Modal (`feat/ui-primitives-modal`)
- [ ] Inventario, primitiva, sustitución, ARIA (D4 a) y Escape y bloqueo de desplazamiento en commit propio (D4 b)
- [ ] Verificación completa y PR

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
