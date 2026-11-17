# Spec — Objetivos táctiles ≥ 44 px en v2 (móvil 390 px)

**Rama:** `claude/fix-touch-44-v2-05e0b6` · **Base:** `develop` · **Tipo:** fix (solo CSS v2; ver «Alcance»).
**Origen:** RF4/RF8 de `docs/branches/feat/screens-v2/spec.md` (objetivos ≥ 44 px); medición WebKit iPhone 14 con v2.

## Problema (medido, ancho×alto)
| Pantalla | Control | Hoy |
|---|---|---|
| Todas (cabecera) | Menú de perfil `Navbar` | 136×36 |
| Todas | Botón de tema `[data-shell="icon-btn"]` | 36×36 |
| Todas | «Conectar» (Strava) | 100×32 |
| Dashboard | Selector de rango 7D/30D/3M/Todo | alto 30 |
| Rendimiento | Selector 7D/30D/90D | alto 27 |
| Actividades | Buscador / select de deporte / «+ Añadir manual» | 36 / 32 / 35 |
| Perfil | «Volver» | 18×18 |

## Requisitos
- **RF1.** Cada control de la tabla mide ≥ 44 px de alto (y ≥ 44 de ancho si es icono) a 390 px **en v2**.
- **RF2.** Todo detrás de `html[data-ui="v2"]` (en `src/styles/skin-v2.css`). v1 intacta: `style-diff` develop vs rama = 0 diferencias.
- **RF3.** La cabecera sigue midiendo `--nav-h` (60 px). En la cabecera el área se amplía con `min-height/min-width: 44px` donde cabe (60 > 44) o con un pseudo-elemento `::after` (inset negativo) cuando no deba cambiar el aspecto visual.
- **RF4.** `horizontalOverflow` = 0 y sin solapes en las 8 pantallas a 390 px.
- **RF5.** Sin colores nuevos (`lint:colors` no sube).

## Alcance y no-alcance
- Cambio puramente CSS acotado a este informe; solo si un control no tiene gancho se añade un atributo `data-*` inerte en JSX (no altera v1).
- Fuera: atribución «Leaflet», inputs de formularios de Perfil (salvo que sea trivial), escritorio (≥ 640 px: reglas dentro de `@media (max-width: 639px)` o con `pointer: coarse` donde proceda).

## Criterios de aceptación
- `e2e/touch.spec.js` con v2: los controles listados desaparecen del informe; sin nuevos < 44.
- Lint, `lint:colors`, `lint:ui`, unit/integration/build, E2E Docker verdes; `style-diff` v1 = 0.
- Capturas v2 que cambien a propósito regeneradas en Docker y revisadas por el usuario (D7).
