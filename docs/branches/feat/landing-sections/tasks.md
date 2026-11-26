# Tareas — Capa 4, PR 3 (`feat/landing-sections`)

Spec y plan aprobados por el usuario el 2026-11-12: «Apruebo recomendadas» (P1 maquetas JSX/SVG, P2 con bloque de salud, P3 sin `og:image`, P4 cifras en banda).

- [x] Etiqueta «FUNCIONES» con `text-action` (AA en claro y oscuro): no hizo falta token nuevo; `lint:colors` no sube.
- [x] `FeaturesV2` + maquetas (`FeaturePreviews`: zonas/potencia, calendario, mapa, salud), `SectionsV2` (`FactsV2`, `CtaV2`, `FooterV2`).
- [x] `Reveal` (v2): el contenido nace visible y solo se oculta si hay IntersectionObserver, sin `prefers-reduced-motion` y bajo la primera pantalla. (La spec decía que `FadeIn` ya respetaba el movimiento reducido: era falso; `FadeIn` es de v1 y no se toca.)
- [x] `LandingPage.jsx`: v2 con `<main id="main">`, skip-link (visible bajo la cabecera al enfocar) y secciones nuevas; v1 intacta.
- [x] `index.html`: metas `og:` y `twitter:` (sin imagen, P3).
- [x] `e2e/public.spec.js`: skip-link, un `h1`, sin «gratis/∞/24/7/laboratorio/Garmin» en v2.
- [x] Etiquetas de los KPI del hero: el código (CTL…) solo desde `xl` (se truncaba a 820–1024 px).
- [x] Capturas v2 de landing regeneradas en Docker (solo las 6) y revisadas por tramos.
- [x] Volcado `full` `develop` vs rama: 104 volcados, 88.718 elementos, **0 diferencias**.
- [x] Lint ✓, `lint:colors` ✓ (743/3/100/8/165, sin subir), `lint:ui` ✓ (14), unit 195/195, integración 10/10, build ✓, E2E Docker completo **208 ✓** / 113 omitidas / 0 ✘ (antes del último ajuste de KPI; después, visual v1+v2+public: 99 ✓).
- [x] taste-skill sobre `vite build` con `VITE_UI=v2` (variables E2E falsas): `perf` solo falla «JS parsed» (1003,5 KiB, +8 KiB frente a #79; bundle único preexistente); `consistency`: corregidos `focus-hidden` y `reduced-motion`; el resto son reglas de plantilla de marketing (secciones a pantalla completa, un h2 por sección, «sin h1/sin botón» que no detecta en una SPA, `hidden-content` que simula IntersectionObserver ausente) y se anotan sin «arreglar».

## Verificación de afirmaciones (RF4)
| Texto | Respaldo |
|---|---|
| 7 zonas de FC | `LTHR_ZONE_PCT` en `src/utils/tssEngine.ts` (Friel, 7) |
| CTL · ATL · TSB | PMC (`usePMCMetrics`, `fitnessStatsEngine.ts`) |
| NP · IF · TSS | `np` en `tssEngine.ts`; IF y NP en `FuelingPanel.jsx`. **VI se retiró** (no verificado) |
| Strava y CSV | `useStravaSync.js`; `parser.ts` (CSV manual) |
| Mapa y gráfica | `ActivityMap.jsx` (sin promesa de hover) |
| Salud: sueño, VFC, FC reposo | `HealthPage.jsx`, `useWellnessData` |
| Sin «gratis», «∞», «24/7», Garmin, límites de Strava | comprobado por E2E en v2 |
