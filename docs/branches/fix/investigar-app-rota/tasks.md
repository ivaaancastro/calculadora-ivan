# Tareas — fix/investigar-app-rota (Corregir imports faltantes en Dashboard refactor)

**Spec:** `docs/branches/fix/investigar-app-rota/spec.md`
**Plan:** `docs/branches/fix/investigar-app-rota/plan.md`
**Rama:** `fix/investigar-app-rota` (desde `develop`)

## Tareas

- [x] 1. Diagnosticar imports faltantes en Dashboard.jsx y ActivitySubRoutes.jsx
- [x] 2. Corregir Dashboard.jsx: añadir imports de `AdvancedAnalytics` y `HistoryList`; remover imports lazy no usados
- [x] 3. Corregir ActivitySubRoutes.jsx: añadir import de `ActivityRouteWrapper`
- [x] 4. Verificar: `npm run lint` ✓, `npm run build` ✓, `npm run test:unit` ✓ (52), `npm run test:coverage` ✓ (62)
- [x] 5. Registrar: actualizar `MEMORY.md`, `CHANGELOG.md`; commit `fix(dashboard): ...`; PR #42 abierto hacia `develop`

---
Versión: 0.1.0 — 2026-11-05
