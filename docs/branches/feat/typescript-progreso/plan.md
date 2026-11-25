# Plan de tareas — spec-audit-06 (Migración progresiva a TypeScript)

**Spec:** `docs/branches/feat/typescript-progreso/spec.md`
**Rama sugerida:** `feat/typescript-progreso` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/typescript-progreso develop` | completado |
| 2 | Crear tsconfig.json | Configuración base para Vite + React + TypeScript con allowJs | pendiente |
| 3 | Migrar tssEngine.js → tssEngine.ts | Añadir tipos a todas las funciones exportadas | pendiente |
| 4 | Migrar parser.js → parser.ts | Añadir tipos a parseCSV y parseStravaDate | pendiente |
| 5 | Migrar formatDuration.js → formatDuration.ts | Añadir tipos a formatDuration y formatBlockDuration | pendiente |
| 6 | Migrar fitnessStatsEngine.js → fitnessStatsEngine.ts | Añadir tipos a las 16 funciones exportadas | pendiente |
| 7 | Migrar useAppStore.js → useAppStore.ts | Tipar estado de Zustand | pendiente |
| 8 | Migrar ai.js → ai.ts | Añadir tipos a askGemini y contextData | pendiente |
| 9 | Actualizar importaciones | Renombrar referencias .js → .ts en todo el proyecto | pendiente |
| 10 | Verificar | `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage` | pendiente |
| 11 | Registrar | Actualizar `MEMORY.md`, `CHANGELOG.md`; commit `feat(typescript): ...`; PR hacia `develop` | pendiente |

## Alcance

### ✅ SÍ
- Migración progresiva de 6 archivos clave a TypeScript.
- Creación de tsconfig.json.
- Actualización de importaciones en todo el proyecto.
- Tipado estático de funciones, parámetros y retornos.

### ❌ NO
- Migración de componentes React (.jsx → .tsx) en esta fase.
- Tipado estricto al 100% (no estricto en primer paso).
- Añadir tests nuevos (migración sin cambio de comportamiento).

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
