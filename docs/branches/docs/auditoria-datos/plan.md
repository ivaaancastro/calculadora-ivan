# Plan — Auditoría de carga de datos (B8a)

> **Para agentes:** ejecución en esta sesión, sin subagentes. Spec: [`spec.md`](spec.md). `tasks.md` se crea tras la aprobación.

**Meta:** cifras por pantalla y recortes priorizados, sin tocar código ni datos.

**Método:** Playwright contra Vite (puerto 5184) con `e2e/support/mockApp.js` para contar peticiones y reproducir fallos; agregados SQL de solo lectura para dar tamaños reales; lectura de código para el uso de columnas.

## Restricciones globales
- Escribir solo en `docs/branches/docs/auditoria-datos/` (`CHANGELOG.md` y `MEMORY.md` al final, tras actualizar con `develop`). Scripts en el scratchpad.
- Sin escrituras ni sincronizaciones contra datos reales. No leer ni repetir `.env`, tokens ni claves; no volcar cuerpos.
- Puerto 5184. PR a `develop`, sin mergear. Conventional Commits.

## Decisiones para aprobar

**D-1 · De dónde salen las cifras reales**
| Opción | Cómo | A favor / en contra |
|--------|------|---------------------|
| **A (recomendada)** | Simulado + `consultas.sql` que ejecutas tú en el editor SQL de Supabase y me pegas el resultado (solo recuentos y bytes) | Sin sesión, sin auto-sync, sin tokens. No mide compresión real ni latencia |
| B | A + sesión real: inicias sesión tú en el navegador integrado (`localhost:5184`) | Mide la red real. **Abrir la app puede disparar el auto-sync** (escribe en `wellness_data` y `profiles`, y con S1 en bucle) y no puedo bloquearlo ahí sin tocar código. Requiere tu OK expreso y que pongas tú el `.env` |
| C | Solo simulado | Cero intervención; tamaños orientativos |

Si eliges B, antes de abrir: confirmar en Perfil/SQL que la última sincronización de Intervals es de hoy, y pedirte el OK en ese momento. No pulsaré «sincronizar» ni guardaré nada.

**D-2 · Aviso de S1:** recomendado, si se confirma, avisar a la PM al terminar la tarea 2 (sin esperar al informe) para abrir el `fix` aparte (D3).

**D-3 · Dependencias:** el worktree no tiene `node_modules`; hace falta `npm ci` (según `package-lock.json`) y, si falta, Chromium de Playwright.

## Foco de revisión
1. El mock devuelve todas las columnas aunque `select` pida menos → el medidor debe proyectar según `select`.
2. El mock no limita filas → simular el corte a 1000 con 1500 actividades.
3. StrictMode duplica efectos en desarrollo → contar peticiones también con `vite build` + `preview`.
4. Streams de prueba de 120 puntos → escalar a la longitud real (SQL, o 1 Hz × duración).
5. Fecha fija del mock (2026-06-15): la ventana de 95 días y «sincronizado hoy» dependen de ella.

## Tareas

### 1. Preparar el banco de medida
- [ ] `npm ci` (D-3).
- [ ] `scratchpad/medir/datos.mjs`: perfiles de datos *pequeño* (mock actual), *real* (según agregados) y *grande* (1500 actividades).
- [ ] `scratchpad/medir/mock.mjs`: sobre `setupApp`, proyección por `select`, corte de filas, respuestas simuladas de `intervals.icu` y `strava.com` (éxito, 401, 429, lento) y perfil con credenciales falsas. Toda la red externa restante, abortada.
- [ ] `scratchpad/medir/registro.mjs`: por petición, pantalla, momento, método, ruta sin parámetros sensibles, `select`, filas, bytes y gzip.
- Hecho cuando: dos pasadas del arranque dan el mismo recuento.

### 2. S1: bucle de auto-sync (prioritaria)
- [ ] Casos: éxito, 401, error al guardar y respuesta de 3 s; ventana de 30 s; 1440 y 390 px; desarrollo y build.
- [ ] Contar peticiones a Intervals, `upsert` de `wellness_data`, lecturas de `profiles` y avisos en pantalla. Referencia sana: 1 sincronización.
- [ ] Aviso a la PM según D-2.
- Hecho cuando: veredicto con tabla de recuentos y condición de parada observada.

### 3. Matriz por pantalla (RF1–RF3; S3, S6, S7)
- [ ] Recorrer pantallas y flujos de la spec en los tres perfiles de datos.
- [ ] S6: instancias montadas por vista y peticiones atribuibles a cada una.
- [ ] S2: cargar `all`, forzar refetch (alta manual) y comprobar si los históricos desaparecen y no vuelven.
- [ ] S4 (perfil grande) y S5 (429 en la petición n.º 5; contar las posteriores).

### 4. Agregados reales (D-1 A o B)
- [ ] `consultas.sql`: filas por tabla; `pg_column_size`/`octet_length` por columna; `streams_data` por clave, dentro y fuera de 95 días; puntos por actividad; filas de bienestar en 180 días; actividades sin streams. Sin `user_id`, nombres, coordenadas ni valores de credenciales.
- [ ] Entregártelo, recibir el resultado y recalibrar el perfil *real*.
- [ ] Solo con B: pedir OK y medir arranque y pantallas, registrando tamaños y nunca cuerpos.

### 5. Uso de columnas y caché (RF4, RF5, S8)
- [ ] Tabla columna/clave → consumidores (`fichero:línea`); marcar sin uso.
- [ ] Inventario de consultas: clave, `staleTime`, invalidaciones, fuera de react-query, PWA.

### 6. Informe (RF6, RF7)
- [ ] `informe.md`: resumen de una pantalla, veredictos S1–S8, recortes ordenados por (ahorro × certeza) / (esfuerzo × riesgo), y notas para B8b (cuotas de Strava, paginación, streams bajo demanda).
- [ ] `mediciones.md` con las tablas y cómo repetir la medida.

### 7. Registrar y abrir PR
- [ ] Actualizar la rama con `origin/develop`; `CHANGELOG.md` y `MEMORY.md` (corto).
- [ ] Comprobar el diff (criterios de la spec), PR a `develop`, sin mergear.
