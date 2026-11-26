# Ejemplo de especificación SDD

## 1. Identificación
- **ID:** spec-001
- **Título:** Servicio de IA con Gemini — respuestas estructuradas
- **Autor:** spec-agent
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Estandarizar las respuestas del servicio de IA (`src/services/ai.js`) para que devuelvan datos
estructurados además del texto, facilitando su consumo en la UI.

## 3. Contexto y justificación
Actualmente `askGemini` devuelve un string libre. La UI necesita parsear el texto para mostrar
consejos, lo que es frágil. Esta spec añade un modo estructurado (JSON opcional) y actualiza
los tests asociados.

## 4. Requisitos funcionales
- [ ] `askGemini` debe aceptar un parámetro opcional `structured: boolean`.
- [ ] Cuando `structured: true`, la respuesta debe incluir un campo `json` con datos válidos.
- [ ] Mantener retrocompatibilidad con llamadas existentes.
- [ ] Añadir pruebas unitarias para el modo estructurado.

## 5. Criterios de aceptación
- [ ] Llamadas sin `structured` siguen devolviendo string (retrocompatibilidad).
- [ ] Llamadas con `structured: true` devuelven objeto con `text` y `json`.
- [ ] Pruebas unitarias pasan (`npm run test:unit`).
- [ ] Lint pasa (`npm run lint`).

## 6. Diseño técnico
- **Servicio afectado:** `src/services/ai.js`
- **Pruebas afectadas:** `src/__tests__/unit/ai.test.js` (nuevo)

## 7. Pruebas
- **Unitarias:** verificar que `askGemini` devuelve string por defecto y objeto cuando `structured: true`.

## 8. Notas adicionales
Ninguna.

---
Versión: 0.1.0 — 2026-11-05