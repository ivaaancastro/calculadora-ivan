# Plan — `feat/premium-design` (Fase Premium)

Deriva de `spec.md` (`spec-premium-01`) y de `MEMORY.md`. **Estado:** pendiente de aprobación; `tasks.md` solo se crea tras ella (AGENTS §2). Un PR por fase o menos.

## Dónde encaja
Cerrar en curso (PR #103, PR #105) → **Fase Premium A–D** → Capa 6 → Capa 7. Ver el roadmap en `docs/branches/feat/webapp-redesign/plan.md`.

## Fase A — Auditoría (rama `docs/premium-audit`, 1 PR, sin código)
1. Levantar la app v2 con datos simulados y generar capturas **solo en Docker** (móvil 390 px y escritorio, claro/oscuro), sin leer PNG en bloque.
2. Revisar pantalla a pantalla con las skills `frontend-design` y `dataviz` (y `ui-design-review:*` si el plugin está activo): Dashboard, Rendimiento, Salud, Actividades, Detalle (bici, carrera, senderismo, fuerza), Calendario, Ajustes y Perfil.
3. Escribir `auditoria.md`: tabla priorizada (P0/P1/P2, esfuerzo S/M/L, archivo, fase destino B/C/D) por colores, bordes, jerarquía, densidad, distribución y gráficas.
4. **Parada:** presentar al usuario para aprobar prioridades antes de la Fase B.
- **Verificación:** solo docs (lint no aplica a `src/`). **D7:** el usuario lee la auditoría.

## Fase B — Tokens y acabado (rama `feat/premium-tokens`, 1 PR)
1. Spec de rama con los tokens exactos (paleta, borde, sombras en capas, radios concéntricos) derivados de la auditoría.
2. Tokens en `src/styles/tokens.css` bajo `html[data-ui="v2"]` → `tailwindTokens.cjs`.
3. Aplicar el Anexo A en v2: radios concéntricos, `tabular-nums`, `text-wrap`, sustitución de `transition: all` solo en v2, hit areas 44 px, anillos de foco.
4. Regla de lint o script que impida nuevos `transition: all` en v2.
- **Verificación:** carril rápido (si #105 mergeado) o flujo actual; `style-diff` = 0 en v1; `lint:colors` no sube; `touch.spec.js` v2.
- **Riesgo clave:** que un cambio global afecte a v1 → todo con selector `html[data-ui="v2"]`.
- **D7:** capturas v2 que cambian a propósito, una a una.

## Fase C — Capa de gráficas Forma (rama `feat/premium-charts`, 1 PR; 2 si > ~800 líneas)
Orden (D6): 1) tokens `--chart-*`, tooltip cristal, rejilla desvanecida, degradado bajo el área y animación de entrada + estados de carga, aplicados a `EvolutionChart`; 2) sparkline, gauge y anillos (`AppleRingGauge`, `ReadinessRings`, tarjetas de `fitness/`); 3) banda de rango/umbrales y línea de proyección (forma/fitness); 4) brush/zoom en `ActivityCharts.jsx`; 5) heatmap de contribuciones en el Calendario.
- Capa nueva `src/components/charts/` en JSX, alimentada por `chartTheme.js` + `useChartTheme()`. Sin instalar bklit-ui ni añadir d3/Motion (D4, D9); atribución MIT donde se derive de su código.
- **Verificación:** tests unitarios por pieza; `style-diff` 0 en v1; medir bundle de pantallas con gráficas; animaciones desactivadas en E2E.
- **Riesgos:** contraste de degradados/rejilla; rendimiento en WebView (afecta a Capa 7).
- **D7:** cada gráfica nueva en claro/oscuro y móvil/escritorio.

## Fase D — Pantallas (**bloqueada**, ramas `feat/premium-<pantalla>`, 1 PR por pantalla)
Se desbloquea cuando el usuario aporte webs de referencia. Por pantalla: propuesta de dirección + referencias → **aprobación** → implementación → verificación → D7. Orden propuesto (D7): Detalle de actividad → Dashboard → Rendimiento → Salud → Calendario → Actividades → Ajustes/Perfil.

## Decisiones D1..D10
Ver `spec.md` §10 (tabla con recomendación). Resumen: D1 antes de Capa 6; D2 A solo análisis; D3 B solo v2; D4 lenguaje bklit sin instalar; D5 no migrar a Tailwind 4; D6 orden de piezas; D7 Fase D bloqueada y por aprobación; D8 un PR por fase; D9 sin dependencias nuevas; D10 verificación y D7.

## Primer paso tras la aprobación
1. Crear `tasks.md` con las fases A–D (checkboxes).
2. Abrir `docs/premium-audit` desde `develop` y empezar la Fase A.

---
Versión: 0.1.0 — 2026-11-19
