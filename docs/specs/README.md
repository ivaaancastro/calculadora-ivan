# Especificaciones SDD (docs/specs/)

En esta carpeta residen todas las especificaciones (specs) que impulsan el desarrollo del proyecto.
Cada archivo `.md` o `.json` es una spec independiente con su propio ID, título, estado y criterios
de aceptación.

## Estado actual

| ID | Título | Estado | Última actualización |
|----|--------|--------|----------------------|
| spec-001 | Servicio de IA con Gemini — respuestas estructuradas | implementada | 2026-11-05 |
| spec-audit-01 | Seguridad: remover secretos de `.env`, agregar a `.gitignore`, crear `.env.example`, validar env vars al arranque | implementada | 2026-11-05 |
| spec-audit-02 | Cobertura: tests unitarios para utils (tssEngine, parser, formatters, fitnessStatsEngine) | implementada | 2026-11-05 |
| spec-audit-03 | Cobertura: tests para `src/services/ai.js` y `src/store/useAppStore.js` | implementada | 2026-11-05 |
| spec-audit-04 | Refactorizar `Dashboard.jsx` (313 líneas) en componentes más pequeños | implementada | 2026-11-05 |
| spec-audit-07 | Consolidar migraciones SQL y añadir versionado (`schema_migrations`) | implementada | 2026-11-05 |

## Cómo agregar una spec nueva

1. Copia `docs/sdd/plantilla-especificacion.md` a `docs/specs/<id>-<nombre>.md`.
2. Rellena todos los campos.
3. Añade una fila a la tabla de estado de este README.
4. Registra la spec en `MEMORY` (sección "Especificaciones").
5. Un agente implementador la tomará y la llevará a `implementada`.

## Cómo marcar una spec como implementada

1. Cambia el estado a `implementada` en el archivo de la spec y en este README.
2. Actualiza `MEMORY` (sección "Especificaciones" y "Decisiones tomadas").
3. `doc-agent` añade una entrada en `CHANGELOG.md`.

---
Versión: 0.1.0 — 2026-11-05
