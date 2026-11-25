# Plan — `feat/premium-salud`

Deriva de `spec.md`. PRs pequeños a `develop`; el root mergea con CI en verde. Sin tocar tokens compartidos salvo imprescindible (otras sesiones: Dashboard y Rendimiento).

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-salud` | Spec+plan+tasks; `HealthHero` (frase + cifra protagonista), cabecera v2, píldoras por tokens, banco de energía v2, CSS en `skin-v2.css`. |
| 2 | `feat/premium-salud-biomarcadores` | `biomarkerStatus.js` + test, jerarquía por estado, variación, `Sparkline` 7 d, orden por atención, insights numerados. |
| 3 | `feat/premium-salud-historial` | Tira de días, `DaySpotlight`, `HistoryTrendChart` v2 (área, banda óptima, zoom), registro diario, estados de carga/vacío. |
| 4 | (en PR 3 si cabe) | Snapshots v2 de Salud (Docker/CI), CHANGELOG, MEMORY, marcar D4 en `premium-design/tasks.md`. |

Verificación por PR: `npm run verify` (carril visual); E2E y `style-diff` en CI. Snapshots solo en el PR que cambie capturas, revisando 2–3 reducidas.
Riesgo: colisión en `skin-v2.css` con Dashboard/Rendimiento → bloque propio al final bajo `/* Salud D4 */` y rebase frecuente.
