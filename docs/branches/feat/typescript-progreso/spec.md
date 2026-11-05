# Especificación SDD — spec-audit-06

## 1. Identificación
- **ID:** spec-audit-06
- **Título:** Migración progresiva a TypeScript — tipado de utils, store y servicios
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Migrar progresivamente los archivos JavaScript clave a TypeScript, añadiendo tipado estático a las funciones y estructuras de datos de `src/utils/`, `src/store/` y `src/services/`, sin romper el comportamiento existente.

## 3. Contexto y justificación
- El proyecto usa TypeScript como devDep (`typescript: ^5.9.3`) pero no tiene `tsconfig.json` ni archivos `.ts`.
- `MEMORY.md`, Fase 4 — Estabilidad y tipo: spec-audit-06 especifica "Migración progresiva a TypeScript (utils, store, servicios)".
- La migración progresiva permite tipar archivo por archivo sin detener el desarrollo.
- Los archivos prioritarios son: `tssEngine.js`, `parser.js`, `fitnessStatsEngine.js`, `formatDuration.js` (utils); `useAppStore.js` (store); `ai.js` (services).

## 4. Requisitos funcionales
- [ ] Crear `tsconfig.json` en la raíz con configuración compatible con Vite y el stack actual.
- [ ] Renombrar `src/utils/tssEngine.js` → `tssEngine.ts` y añadir tipos a todas las funciones exportadas.
- [ ] Renombrar `src/utils/parser.js` → `parser.ts` y añadir tipos a `parseCSV` y `parseStravaDate`.
- [ ] Renombrar `src/utils/fitnessStatsEngine.js` → `fitnessStatsEngine.ts` y añadir tipos a las 16 funciones exportadas.
- [ ] Renombrar `src/utils/formatDuration.js` → `formatDuration.ts` y añadir tipos a `formatDuration` y `formatBlockDuration`.
- [ ] Renombrar `src/store/useAppStore.js` → `useAppStore.ts` y tipar el estado de Zustand (settings, timeRange, uploading, etc.).
- [ ] Renombrar `src/services/ai.js` → `ai.ts` y añadir tipos a `askGemini` y `contextData`.
- [ ] Actualizar todas las importaciones en el proyecto que referencien los archivos renombrados (.js → .ts).
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa (Vite con TypeScript).
- [ ] `npm run test:unit` pasa.
- [ ] `npm run test:coverage` pasa.

## 5. Criterios de aceptación
- [ ] `tsconfig.json` creado y configurado.
- [ ] Todos los archivos de utils, store y servicios migrados a `.ts` con tipos estáticos.
- [ ] Sin errores de TypeScript en el build.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run test:unit` pasa.
- [ ] `npm run test:coverage` pasa.
- [ ] Commit con convención estándar: `feat(typescript): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-06 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (renombrados .js → .ts):**
  - `src/utils/tssEngine.ts`
  - `src/utils/parser.ts`
  - `src/utils/fitnessStatsEngine.ts`
  - `src/utils/formatDuration.ts`
  - `src/store/useAppStore.ts`
  - `src/services/ai.ts`
- **Archivo nuevo:**
  - `tsconfig.json` (configuración base para Vite + React + TypeScript)
- **Dependencias de tipo:**
  - `@google/generative-ai` — verificar si incluye tipos o añadir `@types/` si es necesario.
  - `zustand` — ya tiene tipos integrados.
  - `@tanstack/react-query` — ya tiene tipos integrados.
- **Estrategia de migración:** progresiva, archivo por archivo, manteniendo compatibilidad con imports existentes (actualizar referencias).
- **Rama:** `feat/typescript-progreso` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/` (existentes, deben seguir pasando tras la migración).
- **Integración:** `src/__tests__/integration/` (existentes).
- **E2E:** `e2e/` (no aplica; la migración a TypeScript no cambia comportamiento visible).

## 8. Notas adicionales
- La migración es progresiva: no se busca tipado al 100% estricto en el primer paso, sino establecer la base y tipar los archivos prioritarios.
- `allowJs: true` en tsconfig inicial para permitir mezcla .js/.ts durante la transición.
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
