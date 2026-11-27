# Mediciones — B8a

Fuente de cada tabla indicada en su apartado. Los scripts están en el scratchpad de la sesión (no se versionan).

## S1 · Auto-sync de Intervals — **CONFIRMADA**

**Fuente: simulada.** `e2e/support/mockApp.js` con perfil con credenciales falsas; `intervals.icu` interceptado (respuesta a 150 ms, salvo el caso lento) y toda la red externa abortada. Vite en 5184, a 1440 y 390 px, ventana de 30 s, desarrollo y build de producción. Los hooks, `main.jsx`, el store y `ErrorBoundary` son iguales en `origin/main`.

Build de producción (en desarrollo: 54 en lugar de 53; mismo resultado):

| Caso | Sincronizaciones lanzadas | `upsert` de bienestar | Escrituras en `profiles` | Lecturas de `profiles` | Pantalla de error |
|------|--------------------------:|----------------------:|-------------------------:|-----------------------:|:-----------------:|
| Control: sin credenciales | 0 | 0 | 0 | 1 | no |
| Control: ya sincronizado hoy | 0 | 0 | 0 | 1 | no |
| Éxito | 53 | 106 | 53 | 54 | **sí** |
| Éxito lento (3 s) | 53 | 106 | 53 | 54 | **sí** |
| Intervals responde 401 | 53 | 0 | 0 | 54 | **sí** |
| Falla guardar `wellness_data` (500) | 53 | 53 | 0 | 54 | **sí** |
| Falla guardar `intervals_last_synced` (500) | 53 | 106 | 53 | 54 | **sí** |

- Referencia sana: **1** sincronización. Salen ~53 y todas quedan en vuelo a la vez (2 peticiones a Intervals cada una).
- La app cae a «Vaya, algo se ha roto» con `Maximum update depth exceeded` (React #185). **Eso es lo que corta el bucle**; no hay condición de parada propia.
- Con 61 días simulados son 2 lotes por sincronización. Con 181 días reales serían 4: **unas 212 escrituras** (estimado: 53 × 4).

Tras recargar (build, 8 s más):

| Caso | Sincronizaciones nuevas | Pantalla de error |
|------|------------------------:|:-----------------:|
| Éxito | 0 | no |
| Intervals 401 | 53 | **sí** |
| Falla guardar `wellness_data` | 53 | **sí** |
| Falla guardar `intervals_last_synced` | 53 | **sí** |

Es decir: con éxito, la primera apertura del día rompe la app y al recargar funciona; si la sincronización falla de forma persistente (clave caducada, por ejemplo), la app se rompe en cada apertura.

**No verificado:** comportamiento con la API real de Intervals (límites, CORS) ni con datos reales.

### Causa
1. `useIntervalsAutoSync.js` depende de `profileQuery`, nuevo en cada render, así que el efecto corre en cada render.
2. No hay guarda «en curso» ni marca de «ya intentado».
3. El propio efecto llama a `setUploadState`; `useProfileQuery` consume el store sin selector, así que vuelve a renderizar y a ejecutar el efecto de forma síncrona.

### Propuesta para el `fix` aparte (D3)
- Guarda fuera del render (en curso + intentado hoy, también si falla).
- Quitar `profileQuery` de las dependencias (usar solo `refetch`).
- Comprobar el error del `update` de `intervals_last_synced`.
- Prueba: E2E con credenciales falsas que exija exactamente 1 sincronización en éxito y en 401, sin pantalla de error. La fixture actual tiene las credenciales a `null`, por eso el CI no lo ve.
