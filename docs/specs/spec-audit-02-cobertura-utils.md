# Especificación SDD — spec-audit-02

## 1. Identificación
- **ID:** spec-audit-02
- **Título:** Cobertura: tests unitarios para utils (tssEngine, parser, formatters, fitnessStatsEngine)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Añadir pruebas unitarias para los módulos de utilidad de cálculo (`src/utils/`): `tssEngine.js`, `parser.js`, `formatDuration.js` (formatters) y `fitnessStatsEngine.js`, mejorando la cobertura de tests del proyecto.

## 3. Contexto y justificación
- El informe de auditoría (AUDIT_REPORT.md) señala baja cobertura de tests en `src/utils/`.
- `MEMORY.md` (roadmap Fase 2) especifica esta spec como prioridad tras spec-audit-01.
- Los motores de cálculo son el core del dominio (rendimiento deportivo) y merecen tests que validen su comportamiento.
- Los tests vivirán en `src/__tests__/unit/` siguiendo el patrón existente del proyecto.

## 4. Requisitos funcionales
- [ ] Tests unitarios para `src/utils/tssEngine.js` (getSportCategory, calcZonesFromLTHR, calculateActivityTSS, computeZoneTssPerHour, estimateTssFromBlocks, getEffectiveTSS, calculatePMC).
- [ ] Tests unitarios para `src/utils/parser.js` (parseCSV, parseStravaDate).
- [ ] Tests unitarios para `src/utils/formatDuration.js` (formatDuration, formatBlockDuration).
- [ ] Tests unitarios para `src/utils/fitnessStatsEngine.js` (funciones exportadas principales).
- [ ] Los tests usan vitest y corren con `npm run test:unit`.

## 5. Criterios de aceptación
- [ ] Archivos de test creados en `src/__tests__/unit/` para cada utilidad.
- [ ] Al menos un test por función exportada principal de cada utilidad.
- [ ] `npm run test:unit` pasa.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] Commit con convención de commits (ej. `test(utils): ...`).
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-02 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (nuevos):** `src/__tests__/unit/tssEngine.test.js`, `src/__tests__/unit/parser.test.js`, `src/__tests__/unit/formatDuration.test.js`, `src/__tests__/unit/fitnessStatsEngine.test.js`.
- **Archivos de origen (solo lectura):** `src/utils/tssEngine.js`, `src/utils/parser.js`, `src/utils/formatDuration.js`, `src/utils/fitnessStatsEngine.js`.
- **Rama:** creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/*.test.js` (nuevos).
- **Integración:** `npm run test:coverage` debe pasar.
- **E2E:** no aplica.

## 8. Notas adicionales
- No modificar código de producción fuera del alcance de esta spec (solo añadir tests).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
