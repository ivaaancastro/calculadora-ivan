# Skill: git-release

Gestiona el ciclo de releases y etiquetado de versiones para el proyecto Forma (calculadora-ivan), siguiendo el flujo SDD establecido en `AGENTS.md`.

## Propósito

Automatizar y estandarizar la creación de releases: bump de versión, generación de changelog, creación de etiquetas git y preparación de ramas de release a partir de `develop`.

## Cuándo usar esta skill

- Cuando se va a preparar una nueva versión para desplegar en `main` (Vercel).
- Cuando se necesita crear una rama de release desde `develop`.
- Cuando se debe generar el `CHANGELOG.md` acumulando cambios desde la última release.
- Cuando se va a etiquetar una versión (git tag) antes de hacer merge a `main`.

## Reglas obligatorias

1. **Rama base:** Las ramas de release siempre salen de `develop`.
2. **Nunca commitear directamente a `main`.** `main` es producción, desplegado en Vercel.
3. **Convención de commits:** Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, `build`, `ci`).
4. **Sin spec aprobada = sin código de producción.** Todo cambio parte de una spec en `docs/specs/`.
5. **Cada agente actualiza `MEMORY.md` al finalizar su tarea.**

## Estructura de la skill

```
.opencode/skills/git-release/
├── SKILL.md          # Este archivo: definición y reglas de la skill
├── scripts/          # Scripts de utilidad (bump de versión, changelog, etc.)
└── references/       # Referencias y ejemplos de releases previas
```

## Flujo de release

1. Crear rama de release desde `develop`: `git checkout -b release/vX.Y.Z develop`
2. Actualizar versión en `package.json` y `CHANGELOG.md`.
3. Ejecutar verificaciones: `npm run lint`, `npm run test:coverage`, `npm run build`.
4. Crear etiqueta git: `git tag vX.Y.Z`.
5. Abrir PR hacia `main` (producción, desplegado en Vercel).
6. Tras el merge, hacer merge-back a `develop` si es necesario.

## Versión

0.1.0 — 2026-11-05