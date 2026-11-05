# Plantilla de especificación SDD

Copiar este archivo a `docs/specs/<id>-<nombre>.md` y rellenar todos los campos.

---

## 1. Identificación
- **ID:** `<id-unico>` (ej. `spec-001`)
- **Título:** `<nombre descriptivo>`
- **Autor:** `<agente o persona>`
- **Fecha:** `<YYYY-MM-DD>`
- **Estado:** pendiente | en curso | implementada | bloqueada

## 2. Objetivo
Describir en una o dos frases qué se quiere lograr con esta spec.

## 3. Contexto y justificación
- ¿Por qué es necesaria esta spec?
- ¿Qué parte del sistema afecta?
- ¿Qué problema resuelve?

## 4. Requisitos funcionales
Lista de requisitos que debe cumplir la implementación:
- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Requisito 3

## 5. Criterios de aceptación
Condiciones que deben cumplirse para dar la spec por terminada:
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## 6. Diseño técnico
- **Componentes afectados:** `src/components/...`
- **Hooks afectados:** `src/hooks/...`
- **Servicios afectados:** `src/services/...`
- **Store afectado:** `src/store/useAppStore.js`
- **Rutas afectadas:** `src/App.jsx` o rutas de React Router
- **Utilidades afectadas:** `src/utils/...`
- **Base de datos:** migraciones en `migrations/` o Edge Functions en `supabase/functions/`

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/...`
- **Integración:** `src/__tests__/integration/...`
- **E2E:** `e2e/...`

## 8. Notas adicionales
Cualquier información relevante para la implementación.

---
Versión: 0.1.0 — 2026-11-05