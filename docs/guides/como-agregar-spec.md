# Cómo agregar una especificación (spec)

## 1. Crear el archivo

Copia la plantilla:
```bash
cp docs/sdd/plantilla-especificacion.md docs/specs/<id>-<nombre>.md
```

Rellena todos los campos: ID, título, objetivo, contexto, requisitos, criterios de aceptación,
diseño técnico, pruebas y notas.

## 2. Registrar la spec

- Añade una fila a la tabla de estado en `docs/specs/README.md`.
- Añade una entrada en `MEMORY` (sección "Especificaciones").

## 3. Estado de la spec

Los estados válidos son: `pendiente` | `en curso` | `implementada` | `bloqueada`.

Cuando un agente comience a trabajar en la spec, cambia el estado a `en curso`.
Cuando termine y pase las verificaciones, cámbialo a `implementada`.

## 4. Cerrar la spec

Una vez implementada y verificada:
1. Marca la spec como `implementada` en su archivo y en `docs/specs/README.md`.
2. Actualiza `MEMORY`.
3. `doc-agent` añade una entrada en `CHANGELOG.md`.

---
Versión: 0.1.0 — 2026-11-05