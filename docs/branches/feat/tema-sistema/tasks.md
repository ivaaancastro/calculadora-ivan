# Tareas: tema del sistema (`feat/tema-sistema`)

Aprobado por el usuario el 2026-11-27 (D1–D5 en A). Detalle en `plan.md`.

- [x] 0. Capturas «antes» (Ajustes y mapa del detalle; 390 y 1440 px; claro y oscuro)
- [x] 1. `useTheme`: Sistema por defecto, oyente, interruptor y robustez; `initTheme` en `main.jsx`
- [x] 2. Primera pintura y `theme-color` en `index.html`; `color-scheme` en `index.css`
- [x] 3. Grupo «Apariencia» en Ajustes → General
- [x] 4. Teselas del mapa según el tema
- [x] 5. E2E de DOM: cambio del sistema y mapa oscuro
- [x] 6. Revisión visual y capturas «después»
- [x] 7. Actualizar con `develop`, `CHANGELOG.md`, `MEMORY.md`, PR a `develop`

## Notas de cierre (2026-11-27)
- `useTheme` usa `useSyncExternalStore` (la regla `set-state-in-effect` no admite resincronizar en un efecto).
- Capturas con una prueba temporal de Playwright sobre `mockApp.js` y teselas reales; no se commitea.
- `.claude/launch.json`: configuración local temporal en el puerto 5182, ya retirada.
