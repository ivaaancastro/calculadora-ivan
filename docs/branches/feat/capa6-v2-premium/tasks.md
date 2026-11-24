# Tareas: Capa 6, v2 por defecto, CI rápido y acabado premium

Spec: `spec.md` v0.3 (aprobada 2026-11-24). Plan: `plan.md`. Hallazgos: `auditoria.md`.

**Decisiones aprobadas:** D1–D10 y D12 según la recomendación en negrita de la spec §8.
**D11:** se conservan `.opencode/` y `skills/README.md` (pendiente de confirmar con el usuario junto con la paleta).

**Forma de trabajar:** una rama por PR. Si hay dependencia, la rama sale de la anterior y su PR apunta a `develop` indicando de qué rama depende. Merges agrupados por hitos y siempre con autorización del usuario.

## PR

- [x] **PR 0** (#140) `feat/capa6-v2-premium`: spec, plan, auditoría y este `tasks.md`.
- [x] **PR 1** (#141) `ci/rapido`: CI de < 5 min, sin capturas ni style-diff; E2E funcional; `layout` en DOM; AGENTS §8 y MEMORY §2.
- [x] **PR 2** (#142) `fix/mapa-detalle`: `map_polyline` en `LIGHT_COLS`, streams tardíos, streams por id; E2E por URL directa.
- [x] **PR 3** (#143) `fix/strava-token-edge`: Edge Function `strava-token`; sin `VITE_STRAVA_CLIENT_SECRET`. **Acción del usuario:** rotar secreto, `supabase secrets set`, `supabase functions deploy strava-token`.
- [x] **PR 4** (#144) `feat/v2-por-defecto`: v2 siempre activa; sin interruptor, `useUiMode`, `VITE_UI` ni script de `index.html`.
- [x] **PR 5a** (#145) `refactor/retirar-v1-publico`.
- [ ] **PR 5b** `refactor/retirar-v1-panel`.
- [ ] **PR 5c** `refactor/retirar-v1-analisis`.
- [ ] **PR 6** `chore/limpieza`: huérfanos, raíz, icono, codemods, `docs/branches` cerradas, `lint:orphans`.
- [ ] **PR 7a** `refactor/tema-base`: tipografía ≥ 11 px, mono, `lint:type`, `axisProps`, espaciado y ancho máximo.
- [ ] **PR 7b** `refactor/piel-aplanada`: sin `data-ui`, `skin-v2.css` < 300 líneas, `dark:` a tokens.
- [ ] **PR 8** `fix/bugs-auditoria`: BUG-3, 4, 5, 8, 11.
- [ ] **PR 9** `refactor/utils-comunes`: DUP-1..6, `dates`, `formatNumber`.
- [ ] **PR 10** `fix/estado-forma-y-calendario`: BUG-1, 2, 6, 7, 9, 10, 12.
- [ ] **PR 11** `fix/copy-y-a11y`: COP-1, COP-2, A11Y-1..5.
- [ ] **PR 12** `docs/paleta-propuestas`: 2–3 direcciones en capturas reales. **Parada: el usuario elige.**
- [ ] **PR 13** `feat/paleta`: paleta elegida en tokens y `chartTheme`, contraste AA.
- [ ] **PR 14** `feat/premium-sistema`: `docs/design/forma.md`, `Hero`/`Stat`, `EmptyState` con `tone`, helper `data-metric`.
- [ ] **PR 15** `feat/premium-dashboard`.
- [ ] **PR 16** `feat/premium-detalle`.
- [ ] **PR 17** `feat/premium-salud`.
- [ ] **PR 18** `feat/premium-rendimiento`.
- [ ] **PR 19** `feat/premium-resto`.
- [ ] **PR 20** `chore/cierre`: PWA, CHANGELOG, MEMORY, estados de specs, `lint:orphans` = 0.

## Tiempos de CI (mediana de los 3 primeros PR tras el PR 1)

| PR | Duración del CI | Notas |
|---|---|---|
| antes | 20–30 min | E2E con 1 worker y capturas 3 × 2 + style-dump 9,5 min |
| #141 (PR 1) | 2 min 25 s | `check` 46 s y `e2e` 2 min 25 s en paralelo |
| #142 (PR 2) | 2 min 42 s | `check` 55 s |
| #143 (PR 3) | 2 min 44 s | `check` 56 s |
| #144 (PR 4) | 3 min 18 s | `check` 1 min 2 s |
| **Mediana (#142–#144)** | **2 min 44 s** | Objetivo < 5 min cumplido |

## Registro
- 2026-11-24: spec y plan aprobados; creado este `tasks.md`.
- 2026-11-24: PR 0–5a abiertos. Ramas encadenadas: 1 → (2, 3, 4); 4 → (5a, 5b, 5c). Propuestas de paleta publicadas (https://claude.ai/artifact/2MyXJ8pxjjuYPbUrG1NYvS); a la espera de la elección del usuario.
- Nota para el PR 13: `chartTheme.js` duplica en hex los colores de `tokens.css`; la paleta nueva debe tener una sola fuente.
