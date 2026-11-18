# Tareas: Tarjetas explicativas en cada dato del resumen del detalle

Rama: `feat/tarjetas-explicativas-detalle` | Spec: `spec.md` (aprobada, diseño revisado) | Plan: `plan.md`

- [x] T1. Módulo de textos centralizados `src/utils/activityMetricDescriptions.js` (id, label, description por métrica)
- [x] T2. Componente `MetricTooltip` sin ícono `?`: disparador = Stat completo, popover escritorio / bottom-sheet móvil, área táctil ≥ 44 px en v2 + border-b inferior (rayita bajo toda la ficha)
- [x] T3. Integración en `ActivityDetailPage.jsx`: envolver cada Stat del resumen superior con MetricTooltip + border-b debajo de cada Stat (solo en el detalle)
- [x] T4. Test unitario del módulo de textos (`activityMetricDescriptions.test.js`) — ya existe, verificar
- [x] T5. Test unitario del componente `MetricTooltip` (`uiMetricTooltip.test.jsx`) — actualizado tras quitar HelpCircle
- [x] T6. Test de integración (`activityDetailMetricTooltip.test.jsx`) — ya existe, verificar
- [x] T7. Verificación: lint, lint:colors, lint:ui, tests unitarios + integración, build (style-diff pendiente volcado Docker/CI)
- [x] T8. Registro: marcar spec como implementada, actualizar CHANGELOG.md y MEMORY.md, actualizar PR hacia develop
