# Especificación SDD — spec-audit-03

## 1. Identificación
- **ID:** spec-audit-03
- **Título:** Cobertura: tests para `src/services/ai.js` y `src/store/useAppStore.js`
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Añadir pruebas unitarias para el servicio de IA (`src/services/ai.js`) con mock de Gemini y para el store global (`src/store/useAppStore.js`) de Zustand, mejorando la cobertura de tests del proyecto.

## 3. Contexto y justificación
- El informe de auditoría (AUDIT_REPORT.md) señala baja cobertura de tests en `src/services/` y `src/store/`.
- `MEMORY.md` (roadmap Fase 2) especifica esta spec tras spec-audit-02.
- `ai.js` depende de Google Gemini (API externa) y debe ser testeado mockeando el cliente para no hacer llamadas reales.
- `useAppStore.js` es el store global de Zustand que gestiona el estado de la aplicación y merece tests que validen sus acciones y selectores.
- Los tests vivirán en `src/__tests__/unit/` siguiendo el patrón existente del proyecto.

## 4. Requisitos funcionales
- [ ] Tests unitarios para `src/services/ai.js` (askGemini con mock de GoogleGenerativeAI, manejo de errores, falta de API key).
- [ ] Tests unitarios para `src/store/useAppStore.js` (acciones y selectores del store Zustand).
- [ ] Los tests usan vitest y corren con `npm run test:unit`.
- [ ] Se mockea `@google/generative-ai` para evitar llamadas reales a la API de Gemini.

## 5. Criterios de aceptación
- [ ] Archivos de test creados en `src/__tests__/unit/` para ai.js y useAppStore.js.
- [ ] Al menos un test por función/acción exportada principal de cada módulo.
- [ ] `npm run test:unit` pasa.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] Commit con convención de commits (ej. `test(services,store): ...`).
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-03 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (nuevos):** `src/__tests__/unit/ai.test.js`, `src/__tests__/unit/useAppStore.test.js`.
- **Archivos de origen (solo lectura):** `src/services/ai.js`, `src/store/useAppStore.js`.
- **Rama:** creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/ai.test.js`, `src/__tests__/unit/useAppStore.test.js` (nuevos).
- **Integración:** `npm run test:coverage` debe pasar.
- **E2E:** no aplica.

## 8. Notas adicionales
- No modificar código de producción fuera del alcance de esta spec (solo añadir tests).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
