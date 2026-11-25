# Plan — `feat/premium-dashboard`

Deriva de `spec.md`. PRs pequeños a `develop`; el root mergea con CI en verde. Solo se tocan `Dashboard.jsx`, `dashboard/AdvancedAnalytics.jsx`, `dashboard/EvolutionChart.jsx` (contenedor), `src/utils/formSummary.js`, estilos v2 del dashboard en `skin-v2.css` y componentes nuevos en `src/components/dashboard/`. Tokens compartidos, solo si es imprescindible.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-dashboard` | Spec+plan+tasks; `buildFormSummary` + tests; `FormHero` (frase + TSB + rango) solo v2; CSS del héroe; CHANGELOG. |
| 2 | `feat/premium-dashboard-kpis` | `KpiCard` v2 (delta verde/rojo, Sparkline 28 d, count-up, entrada escalonada); secundarios en «libro»; estados sin datos. |
| 3 | `feat/premium-dashboard-rejilla` | Rejilla de 12 col en escritorio (gráfica 8 + lateral 4 sticky), contenedor de `EvolutionChart`, revisión móvil 390; snapshots v2 (Docker) solo del Dashboard; MEMORY/CHANGELOG; marcar D2 en `premium-design/tasks.md`. |

Verificación por PR: `npm run verify` (carril visual); E2E y `style-diff` en el CI. Snapshots v2: `npm run test:e2e:update` (Docker) solo en el PR 3 y solo los del Dashboard, revisando como mucho 2–3 reducidas una a una (AGENTS §8). Sin ejecutar E2E completo en local.

Riesgos: (1) `data-dash` y orden CSS móvil (`skin-v2.css` ~l.291–345) los usan e2e/capturas: se conservan los atributos; (2) las sesiones de Rendimiento y Salud pueden tocar `skin-v2.css`: añadir un bloque nuevo y aislado «Dashboard D2» para evitar conflictos; (3) `chartData` debe traer `ctl/atl/tcb` por día: verificar antes del PR 2.
