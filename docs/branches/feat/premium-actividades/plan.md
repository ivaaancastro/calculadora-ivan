# Plan — `feat/premium-actividades`

Deriva de `spec.md`. PRs pequeños a `develop`; el root mergea con CI en verde. Solo se tocan `dashboard/HistoryList.jsx`, el bloque `renderHistory` de `Dashboard.jsx` (cambio acotado; el Dashboard comparte fichero), `src/utils/activityGroups.js`, componentes nuevos en `src/components/dashboard/history/` y un bloque aislado «Actividades D6» al final de `skin-v2.css`. Tokens compartidos solo si es imprescindible.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-actividades` | Spec+plan+tasks; `groupByWeek` y `summarizeActivities` + tests; `ActivitiesSummary` (cifra + secundarias + sparkline) solo v2; CSS; CHANGELOG. |
| 2 | `feat/premium-actividades-lista` | Lista aplanada con cabeceras de semana sticky (virtualizador heterogéneo), fila v2 (miniatura sólida, cifras a la derecha, barra de carga TSS, borrar en hover); tests de `HistoryList`. |
| 3 | `feat/premium-actividades-filtros` | Chips de deporte (`Segmented`), `max-w` 1100 y panel lateral sticky ≥ 1280 (reparto por deporte), estado vacío con «Quitar filtros»; snapshots v2 de `/history` (workflow `Update snapshots`); MEMORY/CHANGELOG; marcar D6 en `premium-design/tasks.md`. |

Verificación por PR: `npm run verify` (carril visual); E2E y `style-diff` en el CI (AGENTS §8 bis). Snapshots v2 solo en el PR 3 y solo los de `/history`, revisando 2–3 reducidas una a una. Sin E2E completo en local.

Riesgos: (1) el virtualizador con filas de dos alturas: probar en jsdom con `initialRect` y el camino no virtual; (2) `skin-v2.css` lo editan otras sesiones: un bloque nuevo al final y fusionar con `origin/develop` antes de pedir merge (conservar todas las entradas de CHANGELOG y comprobar llaves); (3) `Dashboard.jsx` comparte fichero con el Dashboard: solo se toca `renderHistory`; (4) fechas: agrupar por la fecha del dato, nunca por «hoy», para capturas deterministas; (5) semanas ISO con `date` en UTC vs local: normalizar a fecha local `YYYY-MM-DD` en la utilidad y cubrir con test.
