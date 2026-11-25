# Spec — `feat/premium-charts` (Fase Premium C: capa de gráficas Forma)

Deriva de `docs/branches/feat/premium-design/spec.md` §4-C y D6. Autorización del usuario: abrir PRs y mergear con CI verde; sin dependencias nuevas (D4/D9: SVG + Recharts + CSS, sin d3/Motion).

## Piezas y orden (un PR por bloque)
1. **PR 1 — Lenguaje base + `EvolutionChart`:** rejilla continua desvanecida (CSS v2), tooltip cristal común (`[data-chart-tooltip]`), `useChartMotion` (entrada 700 ms; apagada con `prefers-reduced-motion` y `navigator.webdriver`), `ChartFigure`/`summarizeSeries` (alternativa textual), `ChartSkeleton`.
2. **PR 2 — Sparkline, gauge/anillos** (`AppleRingGauge`, `ReadinessRings`) con animación y accesibilidad.
3. **PR 3 — Banda de rango/umbrales y proyección** en forma/fitness.
4. **PR 4 — Brush/zoom** en `ActivityCharts.jsx`.
5. **PR 5 — Heatmap** de contribuciones en el Calendario.

## Reglas
- Todo detrás de `html[data-ui="v2"]` / `useChartSkin()==='v2'`; v1 sin cambios (`style-diff` v1 = 0).
- Colores solo por `useChartTheme()`; atribución MIT de bklit-ui donde se derive de su diseño.
- Verificación: tests unitarios por pieza; CI (lint, test, build, e2e, style-diff).
