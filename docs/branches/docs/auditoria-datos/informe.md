# Informe — Carga de datos en Forma (B8a)

2026-11-27 · commit medido `b4c82d9` (`develop` `0d21f36`) · **datos simulados**, build de producción. Tablas y método: [`mediciones.md`](mediciones.md).

> El perfil «real» (600 actividades con telemetría a 1 Hz) es un supuesto. Las proporciones son fiables; las cifras absolutas se recalibran con [`consultas.sql`](consultas.sql).

## Resumen
- **El auto-sync de Intervals rompe la app** (S1). Va en un `fix` aparte.
- Un arranque descarga **14,1 MB (4,1 MB con gzip)**; el **93 %** son streams de 95 días, en **todas** las pantallas, incluido el Perfil.
- Pedir el rango «Todo» añade **133 MB (40 MB gzip)** y el siguiente cambio de datos lo tira.
- Además del peso hay **cuatro problemas de corrección**: históricos que desaparecen, corte silencioso a 1000 actividades, vueltas guardadas vacías tras un 429 y métricas que dependen de lo que se haya cargado.
- Con 2 arranques al día (supuesto), son unos **250 MB al mes con gzip** (60 × 4,1 MB), sin contar rangos amplios ni sincronizaciones.

## Veredictos

| # | Sospecha | Veredicto | Cifra |
|---|----------|-----------|-------|
| S1 | Bucle de auto-sync | **Confirmada** | ~53 sincronizaciones simultáneas y pantalla de error; si Intervals falla, en cada apertura. Mismo código en `main` |
| S2 | Streams al arrancar; el refetch borra los históricos | **Confirmada** | 13,2 MB por arranque; 300/300 → 55/301 tras un alta manual, y «Todo» ya no los vuelve a pedir |
| S3 | Bienestar repetido y fuera de react-query | **Confirmada** | 4–6 descargas de 180 días al arrancar en las pestañas principales, 1 al cambiar a Inicio, Rendimiento o Salud, 2 por actividad en el deep sync |
| S4 | `activities` sin paginar; `profiles *` con tokens | **Confirmada en el código; efecto real sin verificar** | Con 1500 filas y límite 1000 llegan 1000, sin aviso. Falta saber cuántas filas hay y el límite del proyecto. `profiles *` trae los tres secretos al cliente |
| S5 | Deep sync sin parar con 429 | **Confirmada** | 35 peticiones tras el primer 429; con 429 en `/laps`, 20/20 quedan con vueltas vacías para siempre |
| S6 | Las 5 pestañas montadas siempre (y en escritorio la activa, dos veces) | **Confirmada** | A 1440 px, 23 786 nodos ocultos frente a 274 visibles; explica las repeticiones de S3 |
| S7 | Intervals desde el cliente si no hay bienestar | **Confirmada** | 4–6 llamadas por pantalla |
| S8 | Recortar o cargar streams cambia números | **Confirmada por código** (sin cifra) | `calculateActivityTSS` usa streams si están y medias si no: el TSS de una actividad antigua cambia al pedir «Todo» y vuelve tras un refetch |

S8 sale de `src/utils/tssEngine.ts` (ramas «con stream» y «con media») combinado con la ventana de 95 días. No se midió cuánto se mueven CTL/ATL.

## Recortes priorizados

Ahorro sobre el perfil real; arranque actual: 14 099 KB / 4 139 KB gzip. Orden por (ahorro × certeza) / (esfuerzo × riesgo). Esfuerzo: S < 1 día, M 1–3 días, L más.

| P | Recorte | Ahorro estimado | Esf. | Riesgo | Depende de |
|--:|---------|-----------------|:----:|:------:|------------|
| 0 | Arreglar S1 (en curso aparte) | de ~53 a 1 sincronización; ~200 escrituras menos | S | bajo | — |
| 1 | **Una sola consulta de bienestar** en react-query, con columnas explícitas, sin depender de las actividades | −5 peticiones y −290 KB por arranque; −2 peticiones (~160 KB) por actividad sincronizada | S | bajo | — |
| 2 | **Montar solo el árbol visible** (móvil o escritorio) y las pestañas al visitarlas | −~22 000 nodos en el árbol sobrante; menos instancias y trozos en el arranque. Tiempo de CPU sin aislar | S–M | medio (gesto de deslizar) | B3/B5 tocan las mismas vistas |
| 3 | **Streams en su propia consulta**, que un refetch no borre | −13,2 MB (−3,9 MB gzip) en cada alta, sync o refetch; arregla S2 | M | medio | B1 |
| 4 | **Pedir al arrancar solo `time`, `heartrate`, `watts`, `velocity_smooth`** (selección por ruta JSON, sin migración) y el stream completo al abrir el detalle | −9,2 MB (−2,6 MB gzip) por arranque, **−65 %** del total; «Todo» bajaría ~70 % | M | medio: `useActivityStreams` daría por completo un stream parcial | B1, tras P3 |
| 5 | `map_polyline` solo en el detalle y fuera las columnas sin uso | −470 KB (−244 KB gzip) por arranque; la ligera queda en 138 KB | S | bajo | confirmar `description` |
| 6 | **Paginar** `activities` (`order` + `range`) y la consulta de pendientes | Corrección, no ahorro. Sube a P1 si `consultas.sql` da más de 1000 filas | S | bajo | SQL |
| 7 | **Strava:** parar al primer 429, no guardar vueltas si `/laps` falla, leer el token una vez | −35 peticiones desperdiciadas por tanda de 20; evita datos incompletos | S | bajo | adelantable a B8b |
| 8 | Guardar los streams en IndexedDB y pedir solo los nuevos | recargas: de 13,2 MB a casi 0 | M | medio (invalidación, cierre de sesión) | P3 |
| 9 | **Resumen por actividad en la base** (TSS, NP, mejores marcas, tiempo en zonas) calculado al sincronizar; streams solo en el detalle | arranque ≈ 0,5–1,2 MB (−91 % o más; tamaño del resumen supuesto); «Todo» pasa de 133 MB a KB; resuelve S8 | L | alto: migración, relleno y recálculo al cambiar zonas o FTP | B1, B8b |
| 10 | Quitar la segunda descarga de planificados y la llamada a Intervals desde el cliente | −1 petición; −4 a −6 con bienestar vacío | S | bajo | — |
| 11 | `profiles` con columnas explícitas y secretos solo en el servidor | peso despreciable; mejora de seguridad | M–L | medio | B8b |

Los ahorros **no se suman**: P4, P8 y P9 atacan los mismos bytes. Secuencia propuesta: P1 + P2 + P5 (rápidos) → P3 → P4 → P6/P7 → P9 dentro de B8b, que dejaría P4 y P8 casi sin valor si se hace pronto.

## Notas para B8b (sincronización con Strava)
- Cada actividad cuesta 2 llamadas (streams y vueltas): el límite de 100 cada 15 minutos que cita la app da unas 50 actividades por tanda. Confirmar las cuotas vigentes antes de diseñar.
- Mover el deep sync al servidor, con cola, reintentos y lectura de las cabeceras de cuota; hoy es un bucle en la pestaña que se pierde al cerrarla.
- Marcar por separado «sin vueltas» y «vueltas pendientes»; revisar las filas ya guardadas con `laps: []` (apartado 8 de `consultas.sql`).
- Paginar antes de sincronizar: `existingIds` y el parámetro `after` salen de la lista del cliente. Si está cortada, **podrían insertarse duplicados** (por lectura de código; el apartado «strava_id repetidos» lo comprueba, y los índices dicen si hay unicidad).
- Calcular el resumen por actividad al ingerir (P9) y guardar los streams aparte de la tabla `activities`.

## Lo que no está verificado
- Ningún dato real: tamaños, número de filas, límite de filas, compresión y latencia de Supabase.
- APIs reales de Intervals y Strava.
- Tiempos en un móvil real; el coste de CPU de S6 no está aislado (las tareas largas de 1,5–2,3 s con el perfil real mezclan cálculo y montaje).
- La app con 600 actividades al pedir «Todo»: el navegador de la prueba se cerró.

## Siguiente paso
Ejecutar [`consultas.sql`](consultas.sql) en el editor SQL de Supabase (solo lectura, sin valores personales) y pegar el resultado, junto con «Max rows» de la configuración de la API, para recalibrar las cifras.
