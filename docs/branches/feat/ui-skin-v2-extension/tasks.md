# Tareas — rama `feat/ui-skin-v2-extension` (PR 6)

Spec y plan **aprobados por el usuario el 2026-11-12** (D9: sin escalas ordinales salvo contraste; D10: un PR, un commit por pantalla; D11: shell y lienzo siguen en v1).

## 1. Ámbito
- [x] Selectores de `tokens.css`, `skin-v2.css`, `chartTheme.test.js` y `check-palette.mjs` a `[data-skin]` genérico; volcado de Dashboard y Calendario idéntico.

## 2. Pantallas (`data-skin` + `ChartSkinProvider` si hay gráficas)
- [x] Perfil
- [x] Actividades (`/history`)
- [x] Rendimiento (`/stats`)
- [x] Salud
- [x] Detalle de actividad
- [x] Pager móvil: altura por pestaña bajo v2

## 3. Gráficas y colores
- [x] `chartTheme.v2`: `zones`, `sports`, `distribution`, `map` con `.dark` propios (D-10) + test
- [x] Colores de métrica/categoría (D-07/D-09) en las 5 pantallas

## 4. Verificación
- [x] `check-palette`, lint, `lint:colors` (sin subir), `lint:ui` (14), unit, integración, build
- [x] E2E macOS (109 ✓) y Docker (205 ✓ tras regenerar) con 0 ✘; volcado v1 = 0 (88.718 elementos); capturas v1 idénticas
- [ ] Capturas de v2 de las 5 pantallas (30) revisadas por el usuario (parada)

## 5. Registro
- [x] `CHANGELOG.md`, `MEMORY.md` (rama actual)
- [ ] PR a `develop`, CI verde, merge con autorización

## Notas
- Pager móvil: no hizo falta tocarlo; las alturas de actividades, rendimiento y salud no cambian respecto a PR 5 (3473 px); solo Detalle crece 34 px.
- D9: no se crearon escalas ordinales; todas las gráficas de v2 pasan 3:1.
