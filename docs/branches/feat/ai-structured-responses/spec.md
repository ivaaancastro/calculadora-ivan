# Especificación SDD — spec-001

## 1. Identificación
- **ID:** spec-001
- **Título:** Servicio de IA con Gemini — respuestas estructuradas
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Evolucionar `askGemini` (`src/services/ai.ts`) para que pueda devolver respuestas estructuradas (JSON con schema definido) además del texto libre, permitiendo consumir el análisis del entrenador de forma tipada y robusta en la UI, sin depender de parsear texto.

## 3. Contexto y justificación
- `askGemini` devuelve actualmente un `string` libre (ver `src/services/ai.ts`). La UI debe parsear el texto para mostrar consejos, lo cual es frágil y propenso a romperse si el modelo cambia el formato.
- El informe de auditoría y el roadmap (MEMORY.md, Fase 4 — Estabilidad y tipo) mantienen esta spec como pendiente desde v0.1.0.
- `docs/api/servicios.md` apunta a `docs/specs/spec-001.md` como la evolución hacia respuestas estructuradas.
- El ejemplo de especificación en `docs/sdd/ejemplo-especificacion.md` ya describe esta spec (ID `spec-001`).

## 4. Requisitos funcionales
- [ ] `askGemini` acepta un parámetro opcional `structured?: boolean`.
- [ ] Cuando `structured: true`, Gemini responde con `responseMimeType: "application/json"` y un `responseSchema` definido.
- [ ] Cuando `structured: true`, `askGemini` devuelve `{ text: string, json: GeminiStructuredResponse }`.
- [ ] Cuando `structured` es `undefined`/`false`, el comportamiento actual se mantiene (devuelve `Promise<string>`) — retrocompatibilidad total.
- [ ] Definir interfaz TypeScript `GeminiStructuredResponse` con campos: `analisis`, `recomendacion`, `ajusteEntrenamiento` ('mantener' | 'reducir' | 'aumentar'), `confianza` (0-100), `metas` (string[]).
- [ ] Añadir pruebas unitarias para el modo estructurado y para la retrocompatibilidad en `src/__tests__/unit/ai.test.ts`.
- [ ] Manejo de errores: si Gemini no devuelve JSON válido, fallback amigable sin romper la app.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run test:unit` pasa.

## 5. Criterios de aceptación
- [ ] Llamadas sin `structured` siguen devolviendo `string` (retrocompatibilidad).
- [ ] Llamadas con `structured: true` devuelven objeto con `text` y `json` tipado.
- [ ] El `json` cumple el schema `GeminiStructuredResponse`.
- [ ] Pruebas unitarias pasan (`npm run test:unit`).
- [ ] Lint pasa (`npm run lint`).
- [ ] Build pasa (`npm run build`).
- [ ] Commit con convención estándar: `feat(ai): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-001 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.
- [ ] `docs/specs/README.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (modificados):**
  - `src/services/ai.ts` — añadir parámetro `structured`, schema JSON, modo estructurado y tipo de retorno.
  - `src/__tests__/unit/ai.test.js` — añadir pruebas para modo estructurado y retrocompatibilidad (migración a `.ts` opcional, mantener consistencia con el resto de tests).
  - `docs/api/servicios.md` — documentar la nueva firma y el modo estructurado.
- **Tipos nuevos:** `GeminiStructuredResponse` en `src/services/ai.ts`.
- **Base de datos:** No aplica.
- **Rama:** `feat/ai-structured-responses` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/ai.test.js` — verificar retrocompatibilidad (string por defecto) y modo estructurado (objeto con `text` y `json` válido).
- **Integración:** No aplica directamente.
- **E2E:** No aplica.

## 8. Notas adicionales
- Mantener la instancia singleton lazy de `GoogleGenerativeAI`.
- El modelo sigue siendo `gemini-1.5-flash`.
- No modificar el comportamiento de llamadas existentes al servicio.
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
