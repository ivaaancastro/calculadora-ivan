# Plan
1. Extraer la generación de frases a `src/utils/coachInsights.js` (`buildCoachInsights`, pura, con filtro por deporte vía `getBlocksForSport`).
2. `useActivityMetrics.js` la usa (añade `sport` a las dependencias del `useMemo`).
3. `AnalysisSidebar.jsx`: `fitnessAnalysis.insights.length > 0` para pintar la tarjeta.
4. Tests `src/__tests__/unit/coachInsights.test.jsx`.
5. Verificar (lint, lint:colors, lint:ui, vitest, build, E2E Docker, style-diff), CHANGELOG, MEMORY, PR a `develop`.
