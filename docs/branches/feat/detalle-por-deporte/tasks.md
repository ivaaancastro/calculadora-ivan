# Tasks: detalle por deporte (spec aprobada por el usuario)

## F1 Núcleo puro
- [x] T1 `activityMetricsBySport.js` (detectSportType, getMetricsForSport, getTabsForSport, SPORT_BLOCKS)
- [x] T2 Tests unitarios
- [x] T3 `kcal` en activityMetricDescriptions
## F2 Hook
- [x] T4 isPaceBased vía detectSportType
- [x] T5 Zonas de ritmo con calcPaceZones + zonas de potencia separadas
- [x] T6 detailUtils (getSportTheme)
## F3 Resumen y pestañas
- [x] T7 ActivityDetailPage (sport/blocks/tabs)
- [x] T8 DetailHeader + DetailMobileHero
- [x] T9 Sin mapa en fuerza/sin GPS
## F4 Análisis y Detalle
- [x] T10 Picos y gráficas
- [x] T11 DataTab (ClimbPro bici, eficiencia, metabólico, recuperación oculta)
- [x] T12 Selector de zonas
## F5 Pruebas
- [x] T13 Integración por deporte
- [x] T14 E2E
- [x] T15 lint/test/build
## F6 Registro
- [x] T16 CHANGELOG, MEMORY, spec implementada
- [x] T17 Commit, push, PR (no mergear)

Nota: E2E `e2e/detail-by-sport.spec.js` (v1 y v2) en verde. Capturas Docker regeneradas solo para «detalle» (12: visual y visual-v2 × desktop/mobile/tablet × light/dark): cambian el orden de métricas del resumen y la pestaña Detalle (sin «Estado de recuperación»).
