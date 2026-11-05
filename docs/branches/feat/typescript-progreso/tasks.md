# Tareas — feat/typescript-progreso (Migración progresiva a TypeScript)

**Spec:** `docs/branches/feat/typescript-progreso/spec.md`
**Plan:** `docs/branches/feat/typescript-progreso/plan.md`
**Rama:** `feat/typescript-progreso` (desde `develop`)

## Tareas

- [x] 1. Crear rama `feat/typescript-progreso` desde `develop`
- [ ] 2. Crear tsconfig.json — configuración base para Vite + React + TypeScript con allowJs
- [ ] 3. Migrar `tssEngine.js` → `tssEngine.ts` — añadir tipos a todas las funciones exportadas
- [ ] 4. Migrar `parser.js` → `parser.ts` — añadir tipos a `parseCSV` y `parseStravaDate`
- [ ] 5. Migrar `formatDuration.js` → `formatDuration.ts` — añadir tipos a `formatDuration` y `formatBlockDuration`
- [ ] 6. Migrar `fitnessStatsEngine.js` → `fitnessStatsEngine.ts` — añadir tipos a las 16 funciones exportadas
- [ ] 7. Migrar `useAppStore.js` → `useAppStore.ts` — tipar estado de Zustand
- [ ] 8. Migrar `ai.js` → `ai.ts` — añadir tipos a `askGemini` y `contextData`
- [ ] 9. Actualizar importaciones — renombrar referencias .js → .ts en todo el proyecto
- [ ] 10. Verificar: `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage`
- [ ] 11. Registrar: `MEMORY.md`, `CHANGELOG.md`; commit `feat(typescript): ...`; PR hacia `develop`

---
Versión: 0.1.0 — 2026-11-05
