# Tasks: Borrar actividad con confirmación

Spec y plan aprobados por el usuario (2026-11-19) con D1–D7 según las recomendaciones.

- [x] T1 `deleteActivity` devuelve `true`/`false` + test
- [x] T2 `useConfirmDeleteActivity` + tests
- [x] T3 Variante `confirm` en `modalClasses.js`; variantes `danger` y `secondary` de `Button`
- [x] T4 `ConfirmDeleteActivityModal` + test de accesibilidad
- [x] T5 `Dashboard` → `ActivityRouteWrapper` (`onDelete`, `useRef`, navegar) + test
- [x] T6 `ActivityDetailPage` usa hook/diálogo; actualizar test
- [x] T7 `HistoryList` usa hook/diálogo + test
- [x] T8 `mockApp.js`: `DELETE` real y fallo forzable
- [x] T9 `e2e/detail-delete.spec.js` (v1 y v2)
- [x] T10 lint, lint:ui, lint:colors, tests, build, E2E no visuales (148 verdes). style-diff: ver nota. Capturas Docker: no hay captura nueva del diálogo (pendiente opcional, `test:e2e:docker:update`).
- Nota: el diálogo no se añadió a `visual-v2`; `aria-describedby` no se añadió porque `Modal` no lo soporta.
- [x] T11 CHANGELOG, MEMORY, spec «implementada»
- [ ] T12 Push y PR a `develop` (sin merge)
