# Spec — Detalle de actividad: «Volver» y capas Light/Dark del mapa

**Rama:** `claude/fix-detail-back-map-b6741d` · **Base:** `develop` · **Tipo:** fix (lógica + URL de teselas; sin CSS).

## Bug 1 — «Volver» no hace nada
**Causa raíz (reproducida con Playwright: tras pulsar Volver la URL sigue en `/activity/a-85`).**
`ActivityRouteWrapper.jsx` (extraído de `Dashboard.jsx` en `83a4a44`) renderiza `<ActivityDetailPage>` sin `onBack`, y pasa `fetchActivityStreams`/`deleteActivity` cuando la página espera `fetchStreams`/`onDelete`. El test de integración solo comprueba que `onBack` se llama, no quién lo cablea.
- RF1. Volver regresa a la pantalla de origen (`navigate(-1)`) cuando la entrada se hizo dentro de la app (`location.key !== 'default'`); si se entró por URL directa o no hay historial, va a `/history` (Actividades).
- RF2. Se cablea `fetchStreams` (mismo desajuste de nombres; sin él la telemetría de actividades de Strava sin `streams_data` nunca se descarga).
- RF3. Funciona igual en v1 y v2 (el fallo es de lógica, no de estilos).
- Fuera de alcance: el botón de borrar del detalle tampoco está cableado (`onDelete`); `deleteActivity` no pide confirmación, así que cablearlo exige diseño → seguimiento aparte.

## Bug 2 — Mapa: solo se ve «Sat»
**Causa raíz (evidencia en navegador real, Playwright sin mocks para teselas):** las teselas `basemaps.cartocdn.com/{light,dark}_all` responden HTTP 200 pero la imagen es una marca de agua «API KEY REQUIRED» (CARTO exige clave para su basemap). Es un cambio externo; el código y `{s}`/`{r}` están bien.
- RF4. Light y Dark pasan a las teselas de Esri `Canvas/World_Light_Gray_Base` y `Canvas/World_Dark_Gray_Base` (sin clave, CORS `*`, mismo proveedor que «Sat»), atribución «Esri», `maxNativeZoom` 16.
- RF5. Sin cambios en colores de ruta (`chartTheme.js`) ni en el aspecto de v1/v2 salvo el fondo del mapa.

## Criterios de aceptación
- E2E de regresión: Volver desde Actividades y desde Calendario deja la URL/pantalla de origen; por URL directa va a `/history`.
- Unit/integración: el wrapper cablea `onBack`; la URL del mapa no contiene `cartocdn`.
- Lint, `lint:colors`, `lint:ui`, tests, build y E2E Docker verdes.
