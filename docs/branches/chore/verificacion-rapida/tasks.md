# Tareas — Verificación rápida por carriles

Spec y plan aprobados por el usuario el 2026-11-19; revisión v0.2 aprobada (verificación visual diferida al CI y al cierre de capa) (decisiones D1–D6 como propuestas; D2, público/privado, se resuelve en T1). Una sesión por bloque (AGENTS §8.1).

## Bloque A — Medir y decidir
- [~] T0 Línea base → `medidas.md`: HECHO tamaño del volcado (~240 KB/archivo, ~1 MB comprimido el conjunto) y duración de CI (e2e 18 min 45 s). PENDIENTE: tiempo local del procedimiento completo, a medir con `loadavg` < 8 (la máquina estaba a ~90); se retoma junto a T9
- [x] T1 D2 = repo público (minutos gratis); artifacts con retención 7 días; volcado en CI con workers 4 y sin matriz inicial (ver `medidas.md`)

## Bloque B — Scripts locales
- [ ] T2 `scripts/heavy-lock.sh` + guarda de carga + prueba de concurrencia/huérfano; integrar en `e2e-docker.sh` (`--workers=2`, `E2E_WORKERS`, `--project`)
- [ ] T3 `scripts/changed-lane.mjs` + tests unitarios (tabla de rutas)
- [ ] T4 `style-diff --only` y `STYLE_DUMP_ONLY` (dos volcados completos siguen dando 0)
- [ ] T5 `scripts/verify.mjs` + scripts `verify` y `verify:layer` (pasada completa de cierre de capa, bajo mutex) en `package.json`

## Bloque C — CI
- [ ] T6 `ci.yml`: `workflow_dispatch`, job `changes`, `style-baseline` (push a develop), `style-diff` (PR visual); `scripts/fetch-style-baseline.sh` con regeneración de respaldo. Sin quitar jobs existentes
- [ ] T7 `.github/workflows/update-snapshots.yml` + decisión D3 (PAT/deploy key)

## Bloque D — Documentación y cierre
- [ ] T8 `AGENTS.md` (§8 bis, §8.6), `MEMORY.md` §2, plantilla §7, `guia-sdd.md`
- [ ] T9 Aceptación: PR de prueba visual (falla `style-diff`) y solo-docs (lo salta); `update-snapshots` en rama de prueba; tabla antes/después
- [ ] T10 `CHANGELOG.md`, `MEMORY.md`, spec a «implementada»; PR a `develop` (sin mergear)
