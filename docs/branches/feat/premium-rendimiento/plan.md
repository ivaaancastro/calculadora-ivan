# Plan — `feat/premium-rendimiento`

Deriva de `spec.md` (+ `docs/branches/feat/premium-detalle/plan.md` como modelo). PRs pequeños a `develop`; el coordinador raíz mergea con CI verde. Otras sesiones tocan Dashboard y Salud: solo ficheros de Rendimiento; tokens compartidos solo si imprescindible.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-rendimiento` | Spec+plan+tasks; `buildStatsNarrative` + tests; `StatsHero` (narrativa + 4 KPI); agrupación con encabezados y pestañas móviles; CSS del héroe/grupos. |
| 2 | `feat/premium-rendimiento-tarjetas` | Receta de tarjeta única v2 (cabecera, rótulos ≥ 11 px), rejilla de escritorio, estados vacíos y esqueleto. |
| 3 | `feat/premium-rendimiento-graficas` | Gráficas con la capa Forma (degradados, barras, tooltip), `Sparkline` si hay serie; snapshots v2 (Docker), CHANGELOG/MEMORY/tasks al día. |

Verificación por PR: `npm run verify` (salida filtrada); E2E y style-diff en el CI. Snapshots v2 de Rendimiento con `npm run test:e2e:update` (Docker) solo en el PR que cambie capturas, revisando como mucho 2–3 reducidas.
