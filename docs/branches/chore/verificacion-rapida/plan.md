# Plan — Verificación rápida por carriles

Derivado de `spec.md` y de `MEMORY.md` (§2: `style-diff` = 0 en v1; capturas solo con la imagen de CI). Una sesión por bloque (AGENTS §8.1). Sin código hasta aprobar spec y plan.

## Orden de trabajo
1. **T0 — Línea base (antes de cambiar nada).** Con el procedimiento actual sobre un PR de referencia reciente (p. ej. #101): medir tiempo total y pico de `loadavg` del E2E Docker completo y de los dos volcados. Medir también el tamaño del volcado (`du`, `tar czf`) y su duración en un runner. Guardar en `tasks.md`/`docs/branches/chore/verificacion-rapida/medidas.md`. *(Una sola ejecución, con el mutex manual; es la única vez que se corre el procedimiento completo.)*
2. **T1 — Decisiones de infraestructura.** Con T0 resolver D2 (público/privado), retención de artifacts y si el volcado en CI va en matriz.
3. **T2 — `heavy-lock.sh` + guarda de carga** y su prueba de concurrencia/huérfano; integrarlo en `e2e-docker.sh` (`--workers=2` por defecto, `E2E_WORKERS`, `--project`).
4. **T3 — `changed-lane.mjs`** + tests unitarios (tabla de rutas).
5. **T4 — `style-diff --only` y `STYLE_DUMP_ONLY`** (el volcado no cambia; comprobar que dos volcados completos siguen dando 0).
6. **T5 — `verify.mjs`** y scripts de `package.json` (`verify`, `verify:layer` para la pasada completa de cierre de capa) con tiempos por paso.
7. **T6 — CI:** `workflow_dispatch`, job `changes`, `style-baseline` (push a `develop`) y `style-diff` (PR visual), `fetch-style-baseline.sh` con regeneración de respaldo. Sin quitar ningún job existente.
8. **T7 — `update-snapshots.yml`** + decisión D3 (PAT).
9. **T8 — Documentación:** `AGENTS.md` (§8 bis y §8.6), `MEMORY.md` §2, plantilla §7, `guia-sdd.md`, referencias en `README` si las hay.
10. **T9 — Aceptación:** PR de prueba visual (debe fallar `style-diff` con un cambio de clase deliberado) y PR solo-docs (debe saltarlo); rama de prueba con `update-snapshots`; medir «después» y rellenar la tabla antes/después. Cerrar los PR de prueba sin mergear.
11. **T10 — Registrar:** `CHANGELOG.md`, `MEMORY.md`, spec a «implementada». PR a `develop` con la tabla antes/después. **No mergear sin autorización.**

## Cambio v0.2
Tras la revisión del usuario: la verificación visual pesada se difiere. Local por feat = carril rápido; `style-diff` en CI por paths; pasada completa (`verify:layer`) al cerrar cada capa. El CI mantiene el E2E completo por PR.

## Dependencias y orden
T0 → T1 → (T2, T3, T4 en paralelo) → T5 → T6 → T7 → T8 → T9 → T10. T6 depende de T3 y T4; T5 de T2–T4.

## Verificación de cada tarea (carril rápido, el que se propone)
`npm run lint`, `lint:ui`, `lint:colors`, vitest y build en local; lo pesado, solo en T0 y T9, con el mutex.

## Commits (Conventional Commits, rutas explícitas, nunca `git add -A`)
`chore(verify): …`, `ci(verify): …`, `docs(agents): …`, `test(verify): …`. Rama `chore/verificacion-rapida` desde `develop`, PR a `develop`.

## Puntos a vigilar
- `ci.yml` escribe la versión de Playwright a mano en `container.image` (`v1.61.1-noble`): mantener sincronizada con `package.json`.
- `ui-mode`/v2: el volcado actual no distingue v1/v2; la regla «v1 = 0» sigue siendo la de hoy.
- `validate-specs` en CI comprueba `MEMORY` y `AGENTS` sin extensión (carpetas): no tocarlas.
