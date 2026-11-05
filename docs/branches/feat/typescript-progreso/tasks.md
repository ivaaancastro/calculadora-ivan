# Tareas — feat/typescript-progreso (Migración progresiva a TypeScript)

**Spec:** `docs/branches/feat/typescript-progreso/spec.md`
**Plan:** `docs/branches/feat/typescript-progreso/plan.md`
**Rama:** `feat/typescript-progreso` (desde `develop`)

## Tareas

- [x] 1. Crear rama `feat/typescript-progreso` desde `develop`
- [x] 2. Crear tsconfig.json — configuración base para Vite + React + TypeScript con allowJs
- [x] 3. Migrar `tssEngine.js` → `tssEngine.ts` — añadir tipos a todas las funciones exportadas
- [x] 4. Migrar `parser.js` → `parser.ts` — añadir tipos a `parseCSV` y `parseStravaDate`
- [x] 5. Migrar `formatDuration.js` → `formatDuration.ts` — añadir tipos a `formatDuration` y `formatBlockDuration`
- [x] 6. Migrar `fitnessStatsEngine.js` → `fitnessStatsEngine.ts` — añadir tipos a las 16 funciones exportadas
- [x] 7. Migrar `useAppStore.js` → `useAppStore.ts` — tipar estado de Zustand
- [x] 8. Migrar `ai.js` → `ai.ts` — añadir tipos a `askGemini` y `contextData`
- [x] 9. Actualizar importaciones — renombrar referencias .js → .ts en todo el proyecto
- [x] 10. Verificar: `npm run lint` ✓, `npm run build` ✓, `npm run test:unit` ✓ (52), `npm run test:coverage` ✓ (62)
- [x] 11. Registrar: `MEMORY.md`, `CHANGELOG.md`; commit `feat(typescript): ...`; PR #44 abierto hacia `develop`

---
Versión: 0.1.0 — 2026-11-05
