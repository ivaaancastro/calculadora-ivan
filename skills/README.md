# Skills del proyecto — Forma (calculadora-ivan)

Las skills de OpenCode para este proyecto viven en `.opencode/skills/`. Cada skill es un directorio independiente con su propio `SKILL.md`, scripts y referencias.

## Skills instaladas en el proyecto

| Skill | Ruta | Propósito |
|-------|------|-----------|
| `git-release` | `.opencode/skills/git-release/` | Gestiona el ciclo de releases y etiquetado de versiones (bump, changelog, tags, ramas de release). |

## Cómo usar una skill

Desde el cliente OpenCode, invoca la skill por su ID. Por ejemplo, para gestionar una release:

```
skill: git-release
```

## Reglas generales

- Toda skill debe vivir en `.opencode/skills/<nombre>/` con su `SKILL.md`.
- Ninguna skill puede referenciar skill IDs que hayan sido descontinuadas.
- Las skills no sostituyen el flujo SDD: todo cambio parte de una spec en `docs/specs/`.

---
Versión: 0.1.0 — 2026-11-05