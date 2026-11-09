# Lista de paridad — acciones por pantalla (RF7)

Referencia para las capas 1–6 del rediseño: **ninguna acción de esta lista puede desaparecer ni cambiar de resultado** sin decisión explícita del usuario. Cada capa debe recorrerla antes de abrir su PR.

Inventario hecho el 2026-11-06 sobre `test/ui-safety-net` leyendo el código y la app con datos simulados. Marca: **E2E** = ya cubierta por una prueba de `e2e/`; **—** = sin prueba hoy (solo vigilada por las capturas).

## Estructura de rutas

| Ruta | Pantalla | Móvil | Escritorio |
|---|---|---|---|
| `/` (sin sesión) | Landing | — | — |
| `/` (con sesión) | Dashboard | pestaña 1 (`Inicio`) | pestaña `Dashboard` |
| `/stats` | Rendimiento | pestaña 2 (`Forma`) | pestaña `Rendimiento` |
| `/calendar` | Calendario | pestaña 3 | pestaña |
| `/health` | Salud | pestaña 4 | pestaña |
| `/history` | Actividades | botón de búsqueda (satélite) | pestaña |
| `/activity/:id` | Detalle de actividad | subpágina, sin barra inferior | subpágina |
| `/profile?section=general\|zones\|integrations\|security` | Ajustes | subpágina | subpágina |
| `/strava-callback`, `/email-confirmado` | Páginas de servicio | — | — |

Nota: en móvil las 5 pestañas principales viven en `MobileSwipePager` (todas montadas a la vez, con deslizamiento 1:1 y scroll interno propio); en escritorio son rutas normales.

## Barra superior (`Navbar`) — todas las pantallas con sesión

| Acción | Dónde | Prueba |
|---|---|---|
| Abrir menú de perfil/ajustes (`Menú de configuración y perfil`) con las secciones General, Zonas y Umbrales, Cuentas Conectadas, Seguridad y Datos | ambos | E2E (existencia) |
| Cerrar sesión (menú, icono de escritorio y botón móvil) | ambos | E2E |
| Cambiar tema claro/oscuro | ambos | — |
| Navegar: Dashboard, Rendimiento, Calendario, Actividades, Salud | escritorio | E2E |
| Conectar con Strava (si no está conectado) / Sincronizar (si lo está) | ambos | E2E (conexión) |
| Importar CSV | escritorio | E2E (existencia). **Defecto D-03:** ver abajo |
| Añadir actividad manual (`Añadir Manual`) | escritorio (y botón en Actividades) | E2E |
| Borrar toda la base de datos (`Borrar DB`, con `confirm`) | escritorio | — |

## Barra inferior móvil (`BottomNav`)

| Acción | Prueba |
|---|---|
| Ir a Inicio / Forma / Calendario / Salud | — (cubierta en escritorio por ruta) |
| Botón satélite `Buscar actividades` → `/history` | — |
| Se oculta en el detalle de actividad | capturas |
| Gesto lateral entre pestañas (no sobre `.recharts-wrapper`, `.leaflet-container`, `[data-no-swipe]`, `input[type=range]`) | E2E gestos |
| Gesto desde el borde izquierdo: volver en subpáginas | — |

## Landing (`/`, sin sesión)

| Acción | Prueba |
|---|---|
| Abrir el modal de acceso (`Iniciar Sesión`, `Empezar Gratis`, `Crear Cuenta Gratis`) | E2E |
| Iniciar sesión con Email y Contraseña | E2E |
| Alternar entre iniciar sesión, crear cuenta y recuperar clave | — |
| Cerrar el modal | — |
| Cambiar tema | — |
| Secciones informativas y pie de página | capturas |

## Dashboard (`/`)

| Acción | Prueba |
|---|---|
| Cambiar rango temporal 7D / 30D / 3M / Todo | — |
| Ver estado de forma y tarjetas (CTL, ATL, TSB, ratio, rampa, monotonía, volumen, VO2) | capturas |
| Gráfica de evolución: leyenda, valores al pasar/tocar, línea "hoy" | capturas |
| Abrir una actividad desde las listas del dashboard | — |
| Estado vacío (sin actividades) | — |

## Rendimiento (`/stats`)

| Acción | Prueba |
|---|---|
| Tira de secciones: Fisiología, Potencia, VO2 y Marcas, Volumen, Todos (en móvil se desplaza en horizontal) | E2E gestos (**D-01**) |
| Cargar telemetría histórica (`loadHistoricalStreams`) y Deep Sync, con progreso | — |
| Tarjetas: FTP estimado, umbrales, VO2 máx., predicciones de carrera, perfil de potencia, balance de entrenamiento, carga semanal, HRV, MMP/EF | capturas |
| Abrir actividad desde las tarjetas | — |

## Calendario (`/calendar`)

| Acción | Prueba |
|---|---|
| Mes anterior / siguiente / `Hoy` | — |
| Resumen semanal (aptitud, fatiga, forma, rampa, progreso del plan) | capturas |
| Planificar sesión (nombre, tipo, duración, bloques, nota) y guardar | — |
| Importar entreno desde texto | — |
| Editar y eliminar entreno planificado (con `confirm`) | — |
| Abrir actividad realizada desde el calendario | — |
| Conmutar vista `Forma` | — |

## Actividades (`/history`)

| Acción | Prueba |
|---|---|
| Buscar por título | — |
| Filtrar por deporte y por periodo | — |
| Lista virtualizada con scroll interno | capturas |
| Abrir detalle | E2E |
| Eliminar actividad (`Eliminar actividad`, con `confirm`) | existencia en E2E |
| Añadir manual (modal: fecha, deporte, duración, pulso, distancia, desnivel) | E2E |

## Detalle (`/activity/:id`)

| Acción | Prueba |
|---|---|
| Volver (`Volver`) | — |
| Pestañas Análisis / Mapa / Intervalos / Detalle | E2E (existencia) |
| Mapa con capas Light / Dark / Sat | — |
| Explorar gráficas (velocidad, FC, potencia, altitud, cadencia) y picos | E2E gestos (tira de picos) |
| Ver en Strava (si tiene `strava_id`) | — |
| Eliminar actividad | — |

## Salud (`/health`)

| Acción | Prueba |
|---|---|
| Alternar `Hoy` / `Historial` | — |
| Pilares: Recuperación, Carga Diaria, Calidad de Sueño | capturas |
| Banco de energía y biomarcadores (FC reposo, VFC, sueño, TSB, pasos, SpO₂, VO₂, peso) | capturas |

## Ajustes (`/profile`)

| Acción | Prueba |
|---|---|
| Volver (`Volver` / `Atrás`) | — |
| Guardar cambios (`Guardar`) | — |
| General: nombre, peso, FC reposo, calibrar CTL, avatar | capturas |
| Zonas y Umbrales: FC máx./umbral y zonas de carrera y ciclismo, ritmo umbral, FTP | — |
| Cuentas Conectadas: Athlete ID y API Key de Intervals.icu, `Sincronizar Ahora` | — |
| Seguridad y Datos: nueva contraseña, Deep Sync | — |
| Eliminar cuenta (`Eliminar Cuenta`, con `confirm`, RPC `delete_user`) | E2E |

## Servicio

| Acción | Prueba |
|---|---|
| `/strava-callback`: éxito, acceso denegado y sin código | E2E (los dos errores) |
| `/email-confirmado`: pantalla de correo verificado | capturas no incluidas |

## Defectos conocidos (no se corrigen en la Capa 0)

| ID | Defecto | Dónde queda registrado |
|---|---|---|
| D-01 | `MobileSwipePager` no excluye `.hide-scrollbar`: deslizar la tira de secciones de Rendimiento cambia de pestaña en vez de desplazar la tira (`useSwipeNavigation` sí la excluye). | `e2e/gestures.spec.js`, marcada `test.fail()` |
| D-03 | `Dashboard` no pasa `onFileUpload` a `Navbar`: elegir un CSV lanza un error y no importa nada. | Esta lista |
| D-04 | `Dashboard` pasa `fetchActivityStreams` a `ActivityDetailPage`, que espera `fetchStreams`; hoy el detalle solo usa la telemetría que ya viene en la actividad. Entrar al detalle por URL directa antes de que llegue la telemetría en segundo plano deja el análisis vacío. | `e2e/support/ui.js` (los tests entran desde el historial) |
| D-05 | No existe exportación de datos, aunque el E2E original la daba por supuesta. | `e2e/export.spec.js`, `test.fixme` |
| D-06 | Controles táctiles de menos de 44 px (decenas, sobre todo en Calendario). | Informe de `e2e/touch.spec.js` |
| D-07 | La misma métrica tiene colores distintos según la pantalla. **CTL**: azul `#3b82f6` en el Dashboard y `sky-500` en la leyenda de la PMC del Calendario. **ATL**: rosa `#f43f5e` en el Dashboard, `orange-500` en `ChartsSection`, `red-400` y `purple-400`/`purple-600` en el Calendario. **TSB**: amarillo `#eab308` en la serie y `amber` en la etiqueta del Dashboard, y verde/naranja/rojo según el signo en el Calendario y en `TrainingStatusCard`. Hay también dos azules de acción (`blue-500/600` e iOS `#007AFF`/`#0A84FF`) y dos verdes positivos (`emerald` e iOS `#30D158`). Registrado en la Capa 1 (acentos): los usos fuera de las gráficas usan tokens `legacy-*` con su valor actual; se unifican en la Capa 3. | `src/styles/tokens/metrics.json`, `docs/branches/feat/ui-tokens/spec.md` (3.3) |
| D-08 | En modo oscuro, los campos con `border-slate-200 dark:border-zinc-800 focus:border-blue-500` (acceso en la landing, `LoginPage`) no cambian de borde al recibir el foco: `dark:` se genera después de `focus:` y gana. Detectado en la Capa 1 (bordes); el codemod deja esos pares sin migrar para no cambiar el aspecto. | `docs/branches/feat/ui-tokens/tasks.md` (PR 2) |
| D-09 | La misma categoría tiene colores distintos según la pantalla. **Carrera**: naranja en el historial, en las etiquetas de entreno planificado y en el modal de planificar, y verde en los puntos de actividad del Calendario. **Fuerza**: morado en el historial y en las etiquetas, naranja en los puntos del Calendario y verde en el modal de planificar. **FC**: `rose` en todas partes salvo el conmutador FC/potencia de los bloques del Calendario (`red-500`). También hay menores: carga (TSS) índigo en el detalle y ámbar en el historial; FTP verde en Ajustes y ámbar en el resto; velocidad azul en las tarjetas del detalle e índigo en la gráfica. Registrado en la Capa 1 (categorías): los usos distintos del valor del historial llevan tokens `legacy-*` con su valor actual (los menores, aún sin migrar, siguen en la línea base); se unifican en la Capa 3. | `src/styles/tokens/categories.json`, `scripts/codemods/categories.mjs` |

Los IDs se numeran D-01, D-03… (D-02 sin uso).
