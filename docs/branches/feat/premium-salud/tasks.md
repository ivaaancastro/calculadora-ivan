# Tasks — `feat/premium-salud`

## PR 1 — Hero, cabecera y banco de energía
- [x] Spec y plan aprobados (2026-11-23).
- [x] `healthHeadline.js` (frase por estado) + test.
- [x] `HealthHero` (eyebrow, frase, cifra protagonista) montado solo en v2; pestañas a la derecha.
- [x] Banco de energía v2 (cifra grande, marcas 30/60 %); «Pilar 0N» oculto en v2.
- [x] CSS en bloque «Salud D4» de `skin-v2.css`.
- [x] `npm run verify`, CHANGELOG, PR.
- Movido al PR 2: píldoras de estado por tokens (junto a `biomarkerStatus`).

## PR 2 — Biomarcadores
- [x] `biomarkerStatus.js` + test, `BiomarkersGridV2` (estado, variación, Sparkline 7 d, orden por atención). La VFC sí tiene serie diaria (`chartData.hrv`), así que lleva sparkline; TSB, SpO₂ y VO₂ no.
- [x] CSS v2, CHANGELOG, PR (base `feat/premium-salud`).
- Descartado: píldoras por tokens e insights numerados cambiarían v1 (congelada); pasan a PR 3 solo como CSS v2 si procede.

## PR 3 — Historial y cierre
- [ ] Tira de días, DaySpotlight, HistoryTrendChart v2, registro, estados, snapshots v2, MEMORY/CHANGELOG.
