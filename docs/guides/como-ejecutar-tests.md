# Cómo ejecutar las pruebas

## Pruebas unitarias (entorno `node`)
```bash
npm run test:unit
```

## Pruebas de integración (entorno `jsdom`)
```bash
npm run test:integration
```

## Todas las pruebas con cobertura
```bash
npm run test:coverage
```

## Pruebas end-to-end (Playwright)
```bash
npm run test:e2e
```

## Estructura de pruebas

| Tipo | Carpeta | Entorno | Ejemplos |
|------|---------|---------|----------|
| Unitarias | `src/__tests__/unit/` | `node` | `tssEngine.test.js`, `formatDuration.test.js` |
| Integración | `src/__tests__/integration/` | `jsdom` | `ProfilePage.test.jsx`, `AddActivityModal.test.jsx`, `HistoryList.test.jsx` |
| E2E | `e2e/` | navegador real | `auth.spec.js`, `dashboard.spec.js` |

## Configuración

- `vite.config.js` — sección `test` (globals, environmentMatchGlobs, setupFiles, coverage).
- `vitest.setup.js` — archivo de setup global.
- `playwright.config.js` — configuración de Playwright.

---
Versión: 0.1.0 — 2026-11-05