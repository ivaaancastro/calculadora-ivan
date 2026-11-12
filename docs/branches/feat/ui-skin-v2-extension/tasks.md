# Tareas — rama `feat/ui-skin-v2-extension` (PR 6)

Spec y plan **aprobados por el usuario el 2026-11-12** (D9: sin escalas ordinales salvo contraste; D10: un PR, un commit por pantalla; D11: shell y lienzo siguen en v1).

## 1. Ámbito
- [ ] Selectores de `tokens.css`, `skin-v2.css`, `chartTheme.test.js` y `check-palette.mjs` a `[data-skin]` genérico; volcado de Dashboard y Calendario idéntico.

## 2. Pantallas (`data-skin` + `ChartSkinProvider` si hay gráficas)
- [ ] Perfil
- [ ] Actividades (`/history`)
- [ ] Rendimiento (`/stats`)
- [ ] Salud
- [ ] Detalle de actividad
- [ ] Pager móvil: altura por pestaña bajo v2

## 3. Gráficas y colores
- [ ] `chartTheme.v2`: `zones`, `sports`, `distribution`, `map` con `.dark` propios (D-10) + test
- [ ] Colores de métrica/categoría (D-07/D-09) en las 5 pantallas

## 4. Verificación
- [ ] `check-palette`, lint, `lint:colors` (sin subir), `lint:ui` (14), unit, integración, build
- [ ] E2E macOS y Docker con 0 ✘; volcado v1 = 0; capturas v1 idénticas; capturas v2 revisadas una a una

## 5. Registro
- [ ] `CHANGELOG.md`, `MEMORY.md` (rama actual), PR a `develop`, CI verde
