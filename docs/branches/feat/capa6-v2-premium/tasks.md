# Tareas: Capa 6, v2 por defecto, CI rápido y acabado premium

Spec: `spec.md` v0.3 (aprobada 2026-11-24). Plan: `plan.md`. Hallazgos: `auditoria.md`.

**Decisiones aprobadas:** D1–D9 según la recomendación en negrita de la spec §8.
**D10 (paleta):** el usuario elige la **A · Neón profundo** (CTL azul eléctrico, ATL fucsia, TSB lima). Propuestas: https://claude.ai/artifact/2MyXJ8pxjjuYPbUrG1NYvS
**D11:** el usuario usa OpenCode: se conservan `.opencode/`, `skills/README.md` y las referencias de `AGENTS.md`.
**D12 (revisada por el usuario):** `docs/branches/` **se queda en el repositorio**, visible en GitHub. RF-E2 queda anulado; ningún PR de limpieza toca esas carpetas.
**Merges:** el usuario autoriza mergear en `develop` (nunca en `main`) tras revisar el diff y con el CI en verde.

**Forma de trabajar:** una rama por PR. Si hay dependencia, la rama sale de la anterior y su PR apunta a `develop` indicando de qué rama depende. Merges agrupados por hitos y siempre con autorización del usuario.

## PR

- [x] **PR 0** (#140) `feat/capa6-v2-premium`: spec, plan, auditoría y este `tasks.md`.
- [x] **PR 1** (#141) `ci/rapido`: CI de < 5 min, sin capturas ni style-diff; E2E funcional; `layout` en DOM; AGENTS §8 y MEMORY §2.
- [x] **PR 2** (#142) `fix/mapa-detalle`: `map_polyline` en `LIGHT_COLS`, streams tardíos, streams por id; E2E por URL directa.
- [x] **PR 3** (#143) `fix/strava-token-edge`: Edge Function `strava-token`; sin `VITE_STRAVA_CLIENT_SECRET`. **Acción del usuario:** rotar secreto, `supabase secrets set`, `supabase functions deploy strava-token`.
- [x] **PR 4** (#144) `feat/v2-por-defecto`: v2 siempre activa; sin interruptor, `useUiMode`, `VITE_UI` ni script de `index.html`.
- [x] **PR 5a** (#145) `refactor/retirar-v1-publico`.
- [x] **PR 5b** (#146) `refactor/retirar-v1-panel`.
- [x] **PR 5c** (#148) `refactor/retirar-v1-analisis`.
- [x] **PR 6** (#149) `chore/limpieza`: huérfanos, raíz, icono, codemods y `lint:orphans` (las carpetas de `docs/branches` se conservan, D12 revisada).
- [x] **PR 7a** (#153) `refactor/tema-base`: tipografía ≥ 11 px, mono, `lint:type`, `axisProps`, espaciado y ancho máximo.
- [x] **PR 7b** (#154) `refactor/piel-aplanada`: sin `data-ui`, `skin-v2.css` < 300 líneas, `dark:` a tokens.
- [x] **PR 8** (#147; BUG-11 de `AdvancedAnalytics` pasa al PR 10) `fix/bugs-auditoria`: BUG-3, 4, 5, 8, 11.
- [x] **PR 9** (#150) `refactor/utils-comunes`: DUP-1..6, `dates`, `formatNumber`.
- [x] **PR 10** (#151) `fix/estado-forma-y-calendario`: BUG-1, 2, 6, 7, 9, 10, 12.
- [x] **PR 11** (#152) `fix/copy-y-a11y`: COP-1, COP-2, A11Y-1..5.
- [x] **PR 12** `docs/paleta-propuestas` (artefacto con capturas; elegida la A): 2–3 direcciones en capturas reales. **Parada: el usuario elige.**
- [x] **PR 13** (#155; antes/después: https://claude.ai/artifact/47idCtn2UgqUnZGU9FSehR) `feat/paleta`: paleta elegida en tokens y `chartTheme`, contraste AA.
- [x] **PR 14** (#157) `feat/premium-sistema`: `docs/design/forma.md`, `Hero`/`Stat`, `EmptyState` con `tone`, helper `data-metric`.
- [x] **PR 15** (#160) `feat/premium-dashboard`.
- [x] **PR 16** (#159) `feat/premium-detalle`.
- [x] **PR 17** (#158) `feat/premium-salud`.
- [x] **PR 18** (#161) `feat/premium-rendimiento`.
- [x] **PR 19** (#162) `feat/premium-resto`.
- [x] **PR 20** (#163) `chore/cierre`: PWA, CHANGELOG, MEMORY, estados de specs, `lint:orphans` = 0.

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
- 2026-11-24: PR 5b, 5c, 6 y 8 abiertos (CI de 2–3,5 min). `lint:orphans` = 0. En curso: 7a → 7b (tema y piel) y 9 → 10 → 11 (utils, bugs y accesibilidad), en paralelo. Mapa del PR 2 comprobado en vivo con una actividad de dic 2025.
- 2026-11-24: paleta A elegida; D11 y D12 revisadas por el usuario (se conservan `.opencode/` y `docs/branches/`; el #149 restaura las carpetas).
- 2026-11-25: mergeados en `develop` #140–#152 (squash; ramas apiladas integradas con merge de `develop`, comprobando que el diff de cada PR seguía igual).
- 2026-11-25: #143 mergeado. El usuario rotó el secreto; `strava-token` desplegada en FORMA y comprobada en vivo (Strava acepta id + secreto y solo rechaza el token de prueba). La función funciona solo con `STRAVA_CLIENT_SECRET`; `STRAVA_CLIENT_ID` y `ALLOWED_ORIGIN` son opcionales.
- 2026-11-26: #153 (7a), #154 (7b: `skin.css` de 1.634 a 83 líneas, sin `data-ui`, capturas idénticas) y #155 (paleta A con una sola fuente de color; `lint:palette` en el CI) mergeados. En curso: PR 14 (sistema).
- Anotado para el PR 17: en Salud a 390 px, «RECUPERACIÓN» del anillo pisa «Disponibilidad del SNC».
- 2026-11-26: PR 14 (sistema): `docs/design/forma.md`, primitivas `Hero`/`Stat`/`Delta`, `EmptyState` con `tone` (fuera `ErrorState`), pulsación 0,98, `transition-all` a 0 y comprobación E2E de métricas repetidas (`e2e/metrics.spec.js`, con `PENDING_DUPLICATES` por PR 15–19).
- 2026-11-26: pantallas premium mergeadas: Salud #158, Detalle #159, Dashboard #160 (CTL a 88 px en su color), Rendimiento #161 y Calendario/Actividades/Ajustes #162. `PENDING_DUPLICATES` vacío. Capturas antes/después: Salud https://claude.ai/artifact/2Gx5R6qJTNzhfi6cT91X4i · Detalle https://claude.ai/artifact/JrRME43poJtkPNAYKj9eJy · Dashboard https://claude.ai/artifact/LicvEgcM7VaK2TJCHgad3K · Rendimiento https://claude.ai/artifact/SBKZL5dkXC3mzbX6KKyNJC · Resto https://claude.ai/artifact/ENjNEmkcfZ4BVWkitMw82o
- 2026-11-26: PR 20 (cierre): precache de la PWA sin recharts ni leaflet (1.596 → 1.064 KiB), prueba de borrar del detalle sin carreras, CHANGELOG, MEMORY y spec marcada como implementada. `.gitignore` ignora las copias «` 2`» del sincronizador de ficheros (iCloud), que se colaban en commits y en `.git/refs`.

## Criterios de aceptación (spec §5)
- CI < 5 min: mediana 2 min 44 s. ✔
- Arranca en v2 sin `localStorage`; sin `isV2`, `useUiMode` ni `data-ui` en `src`. ✔
- Mapa por URL, desde la lista y en actividades de más de 95 días (E2E y en vivo, dic 2025). ✔
- Ninguna pantalla repite una métrica (`e2e/metrics.spec.js`, sin pendientes); CTL lo primero; rango en la tarjeta de la gráfica. ✔
- Paleta elegida, aplicada y AA (`lint:palette`). ✔
- `CLIENT_SECRET` ni en `src` ni en `dist`; `lint:orphans` = 0. ✔
- lint, colors, ui, type, vitest, build y E2E en verde. ✔
- Capturas antes/después en cada PR de diseño, y pantallas aprobadas por el usuario (2026-11-26). ✔

## Pendiente fuera de esta capa
- Las pestañas Mapa, Intervalos y Detalle del detalle conservan su contenido anterior.
- Zonas de ritmo de carrera con nombres en inglés guardados en el perfil del usuario.
- El conmutador «FORMA» del Calendario aún usa clases de paleta cruda (violeta).
- Merge a `main` (producción) y despliegue: decisión aparte (R2).
- 2026-11-26: el usuario aprueba las pantallas. Capa 6 cerrada; todos los criterios de aceptación cumplidos.
