# Plan — Objetivos táctiles v2

1. **Medir** (línea base): `touch.spec.js` con v2 → JSON de controles < 44 px por pantalla (antes).
2. **Cabecera** (`skin-v2.css`, bloque shell): menú de perfil `min-height:44px`; `icon-btn` 44×44; «Conectar» `min-height:44px` (o `::after` si el aspecto debe quedar igual). Verificar 60 px de cabecera y sin desborde.
3. **Selectores de rango** (Dashboard, Rendimiento): `min-height:44px` en los botones del selector (o contenedor) solo en móvil; ajustar padding para no crecer en horizontal.
4. **Actividades**: buscador, select de deporte y «+ Añadir manual» a 44 px de alto en móvil (dentro de la rejilla de filtros existente).
5. **Perfil**: «Volver» 44×44 con `::after`/min-size sin mover el título.
6. **Medir** (después) + `horizontalOverflow` = 0 en las 8 pantallas.
7. **Verificar**: lint, `lint:colors`, `lint:ui`, unit/integration/build, E2E en Docker (`E2E_PORT` propio, mutex `/tmp/forma-docker.lock`), `style-diff` develop vs rama = 0 en v1.
8. **Capturas v2** que cambien a propósito: regenerar en Docker y **parar en D7** para revisión (una a una).
9. **Registrar**: `tasks.md`, `CHANGELOG.md`, `MEMORY.md` (corto). PR a `develop` con tabla antes/después; sin mergear; avisar con CI verde.

Riesgo: la cabecera y las rejillas de filtros tienen altura contenida; se usa `::after` donde crecer rompa el diseño.
