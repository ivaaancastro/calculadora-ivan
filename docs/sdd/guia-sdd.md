# Guía SDD — Specification-Driven Development

Este documento describe el método **Specification-Driven Development (SDD)** utilizado en el proyecto
**Forma** (calculadora-ivan). Cada cambio en el código parte de una especificación escrita.

## 1. ¿Qué es SDD?

SDD es un enfoque en el que, antes de escribir código de producción, se define una **especificación**
(espec) que describe qué se quiere construir, por qué, qué criterios de aceptación debe cumplir y cómo
se verificará. Los agentes consumen esa especificación para implementar y verificar.

## 2. Flujo SDD

```
1. Especificar    → spec-agent escribe la spec en docs/specs/
2. Planificar     → agente lee spec + MEMORY, genera plan de tareas
3. Implementar    → agente escribe/modifica código siguiendo la spec
4. Verificar      → tests, lint, build, type-check
5. Registrar      → CHANGELOG, MEMORY; spec marcada como implementada
```

## 3. Estructura de una spec

Una spec debe contener, como mínimo:

- **ID y título** — identificador único y nombre descriptivo.
- **Objetivo** — qué se quiere lograr.
- **Contexto** — por qué es necesario, a qué parte del sistema afecta.
- **Requisitos funcionales** — qué debe hacer el sistema.
- **Criterios de aceptación** — condiciones que deben cumplirse para dar la spec por terminada.
- **Diseño técnico** — componentes, hooks, servicios, store, rutas afectadas.
- **Pruebas** — qué pruebas unitarias, de integración y E2E se deben añadir.
- **Estado** — pendiente / en curso / implementada / bloqueada.

Usa la plantilla en `docs/sdd/plantilla-especificacion.md`.

## 4. Dónde viven las specs

Todas las specs residen en `docs/specs/`. Cada spec es un archivo independiente (`.md` o `.json`).
El estado de todas las specs se rastrea en `MEMORY`.

## 5. Reglas de oro

1. **No hay código sin spec.** Ningún agente implementa sin una spec aprobada.
2. **MEMORY es fuente de verdad.** Cada agente lee `MEMORY` antes de actuar y lo actualiza al terminar.
3. **Una spec, un propósito.** Cada spec resuelve una cosa concreta.
4. **Verificación obligatoria.** Toda spec implementada debe tener pruebas asociadas y pasar lint + build.
5. **Documentación al cierre.** `doc-agent` actualiza README, CHANGELOG y docs al cerrar una spec.

## 6. Ejemplo

Ver `docs/sdd/ejemplo-especificacion.md` para un ejemplo completo de spec.

---
Versión: 0.1.0 — 2026-11-05