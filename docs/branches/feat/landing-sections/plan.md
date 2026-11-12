# Plan — spec-rediseno-02-c4-pr3 (secciones de la landing v2)

Spec: `spec.md`. Rama `feat/landing-sections` desde `develop` (`27f28d1`). Un PR hacia `develop`, sin merge sin autorización escrita.

| Paso | Contenido |
|---|---|
| 1 | Tokens v2 mínimos (`tokens.css`, tras `data-ui="v2"`): etiqueta de sección con contraste AA; resto reutiliza tokens existentes. |
| 2 | `src/components/landing/`: `FeaturesV2` (bloques alternados) con maquetas `ZonesPreview`, `CalendarPreview`, `MapPreview` (+ `HealthPreview` según P2), `FactsV2` (cifras verificadas), `CtaV2` y `FooterV2`. Datos de ejemplo escritos en los propios componentes. |
| 3 | `LandingPage.jsx`: en v2 renderiza las secciones nuevas; v1 intacta. Skip-link + `id="main"`. |
| 4 | `index.html`: metas `og:`/`twitter:` (neutras). |
| 5 | `e2e/public.spec.js`: skip-link, un `h1`, ausencia de «Gratis/∞/24/7» en v2. Capturas v2 de landing regeneradas (Docker) y leídas una a una. |
| 6 | Verificación: lint, `lint:colors` (no sube), `lint:ui`, unit, integración, E2E Docker, build; `style-diff` = 0; taste-skill (`consistency`/`perf`) sobre build v2; peso antes/después; tabla de afirmaciones verificadas en el PR. |
| 7 | `tasks.md`, `MEMORY.md` (estado), PR a `develop`, CI verde, parada. |

Orden: 1→2→3 (visible) → 4 → 5 → 6 → 7. `tasks.md` se crea tras la aprobación.

---
Versión: 0.1.0 (borrador) — 2026-11-12
