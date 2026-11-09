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
- [ ] PR hacia `develop`

### Notas de verificación del PR 0
- **Volcado `full`:** 51 propiedades más (tipografía, relleno, margen, bordes, radios, disposición, transformaciones, transiciones, efectos e interacción) y el tamaño de la caja fuera de los SVG. Estados nuevos: `calendario-planificador`, `calendario-visor`, `salud-historial-punto-activo` (la gráfica de Salud solo existe en la vista "Historial", que antes no se volcaba) y `rendimiento-punto-activo` (solo escritorio y tableta). En total, 104 volcados.
- **Estabilidad:** dos ejecuciones seguidas sobre el código de `develop` (`f77aea0`): 104 volcados, 90.084 elementos, **0 diferencias**. No hizo falta excluir ninguna propiedad.
- **Detección:** con `p-4` → `p-[18px]` en `IosCard` (Salud, móvil) y `rounded-2xl` → `rounded-xl` en `HrvCard` (Rendimiento, escritorio), el volcado de color da 0 diferencias en ambos casos. El `full` da 72 (relleno y tamaño) y 16 (radios). Retirados. Primer intento fallido: el relleno se probó en escritorio, donde `sm:p-6` lo anula.
- **Toque (corrección de la spec, 3.5):** el tooltip de gráfica se abre al tocar en Dashboard, Salud (Historial) y las 4 gráficas de Rendimiento (Todos). La medida presentada con la spec había tocado una gráfica de otra pestaña montada fuera de pantalla por `MobileSwipePager`.
- **Retirado:** 14 clases sin uso de `index.css` (incluida la animación `map-pulse`), `MetricHelp` (y su import sin uso en el detalle) y 5 tokens que solo usaban esas clases (`glass`, `glass-bar`, `sunken-card`, `hairline-5`, `hairline-6`; bloques de `tokens.css` regenerados con `--tokens`).
- `lint:colors`: `palette` 865 → 859 (`ActivitySharedUI`, por `MetricHelp`).
- Resultados: lint ✓, lint:colors ✓, lint:ui ✓, unit 130/130, integración 10/10, build ✓, E2E macOS 79 ✓, E2E Docker 127 ✓ (48 capturas sin diferencias; el ✘ de `gestures.spec.js:37` es el fallo esperado de D-01), volcado `full` de la rama frente a `develop`: 104 volcados, 90.084 elementos, **0 diferencias**.

## PR 1 — Card y SectionHeader (`feat/ui-primitives-card`)
- [ ] Inventario, primitivas, sustitución, retirada de `ios-card`, `ios-touch`, `ios-header` e `IosCard`
- [ ] Verificación completa y PR

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
