# Plan: Detalle de actividad por deporte

Deriva de `spec.md` (spec-detalle-por-deporte) y `MEMORY.md`. **Decisiones D1–D8 y celdas M1–M9 cerradas (2026-11-18). Sin tasks.md hasta que el usuario apruebe spec + plan en el chat.**

Rama: `feat/detalle-por-deporte` (sobre `feat/tarjetas-explicativas-detalle`, PR #101; PR a `develop` tras #101 o rebasado). Commits Conventional. Una sesión por fase (AGENTS §8). Salidas de lint/test/build filtradas (`| tail -20`).

## Fase 0 — Cierre de decisiones (hecha)
- D1–D8 y M1–M9 resueltas por el usuario; matriz de la spec actualizada.

## Fase 1 — Núcleo puro (sin UI)
| Tarea | Detalle |
|---|---|
| T1 | Recuperar `activityMetricsBySport.js` del borrador (`git show wip/detalle-por-deporte:…`) y reescribirlo: `detectSportType` (`bike/run/hike/strength/generic`, con `ride`, `weighttraining`, `virtualride`, `hike`), `getMetricsForSport`, `getTabsForSport`, tabla de datos `SPORT_BLOCKS` con la matriz cerrada. |
| T2 | Tests unitarios (`it.each` de detección + recorrido de toda la matriz + filtrado por dato + Kcal 0). Primero en rojo. |
| T3 | `activityMetricDescriptions.js`: añadir `kcal` (+ test del módulo existente). |

## Fase 2 — Hook de métricas y zonas
| Tarea | Detalle |
|---|---|
| T4 | `useActivityMetrics`: `isPaceBased` vía `detectSportType` (incluye senderismo); no calcular `climbPro`/potencia fuera de bici (opcional, medir). |
| T5 | Separar `exactPaceZoneAnalysis` (usa `calcPaceZones(settings.run.thresholdPace)`, rango min/km, aviso de umbral por defecto) y `exactPowerZoneAnalysis` (FTP); mantener compatibilidad temporal del nombre antiguo hasta T8. Tests con streams sintéticos. |
| T6 | `detailUtils.js`: `getSportTheme` y `getSpeedOrPace` apoyados en `detectSportType`; tests existentes verdes. |

## Fase 3 — Resumen y pestañas
| Tarea | Detalle |
|---|---|
| T7 | `ActivityDetailPage`: calcular `sport`, `blocks`, `tabs`; volver a `analyze` si la pestaña activa desaparece. |
| T8 | `DetailHeader` + `DetailMobileHero`: un único render a partir de `getMetricsForSport` (con `MetricTooltip`); barra de pestañas escritorio/móvil desde `getTabsForSport`; móvil con 3 o 4 columnas. |
| T9 | Fuerza/sin GPS: sin pestaña Mapa/Intervalos, sin mapa en `AnalysisSidebar` ni `DetailMobileHero`. |

## Fase 4 — Análisis y Detalle
| Tarea | Detalle |
|---|---|
| T10 | `TelemetryPanel` (Picos) y `ActivityCharts` (potencia solo bici, cadencia bici/carrera, altitud con dato, ritmo vs velocidad) condicionados por `blocks`. |
| T11 | `DataTab`: ClimbPro solo bici; Eficiencia/Hitos de potencia solo bici; Perfil metabólico (IF en bici, % FC en carrera/senderismo, oculto en fuerza/genérico); Recuperación oculta. |
| T12 | Selector de zonas (`Segmented`: FC/Ritmo en carrera, FC/Potencia en bici) en `DataTab`; estado en `ActivityDetailPage` sustituyendo el `zoneType` fijo; estilo v2 bajo `html[data-ui="v2"]`. |

## Fase 5 — Pruebas y verificación
| Tarea | Detalle |
|---|---|
| T13 | Integración por deporte (bici, carrera, senderismo, fuerza, natación) + regresión de `MetricTooltip` del detalle y de `ActivityDetailPage.test.jsx`. |
| T14 | E2E `e2e/detail-by-sport.spec.js` (pestañas por deporte, ClimbPro solo bici, selector FC/Ritmo, móvil 3 pestañas). Capturas v2 solo de lo que cambia; style-diff v1 = 0 por píxeles. |
| T15 | `npm run lint`, `npm test`, `npm run build`, type-check (salida filtrada). |

## Fase 6 — Registro
| Tarea | Detalle |
|---|---|
| T16 | `CHANGELOG.md`, `MEMORY.md` (estado corto), marcar spec «implementada», `tasks.md` al día. |
| T17 | Commit(s) Conventional, push y PR a `develop` (después de #101 o rebasado). **No mergear sin autorización del usuario.** Tras abrir el PR: `get_status`/`bind_pr` y CI vía herramientas ccd_pr. |

## Orden y dependencias
Fase 0 → 1 → 2 → 3 → 4 → 5 → 6. T1–T3 son independientes de UI y se pueden revisar solos. La matriz (`SPORT_BLOCKS`) es la única fuente: cualquier cambio posterior de celda se hace ahí.

## Riesgos principales (detalle en spec §9)
Tipos de Strava sin traducir (R1) · `series_count` inexistente (R2) · cambio visible para v1 (R3) · senderismo pasa a ritmo (R5) · umbral de ritmo por defecto (R6).

## Esfuerzo/modelo (AGENTS §8)
Sonnet. Esfuerzo medio en T1, T5, T12 (diseño de datos y zonas); bajo en el resto (cableado, tests, docs).
