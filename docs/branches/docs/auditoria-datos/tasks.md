# Tareas — Auditoría de carga de datos (B8a)

Aprobado el 2026-11-27 (D-1 = A: simulado + `consultas.sql`, sin sesión real; D-2 = A; D-3 sí). Detalle en [`plan.md`](plan.md).

- [x] 1. Banco de medida (`npm ci`, tres perfiles de datos, PostgREST simulado, registro)
- [x] 2. S1: bucle de auto-sync → **confirmada**; avisada la PM (D-2)
- [x] 3. Matriz por pantalla y flujos (RF1–RF3; S2–S7). Alta de actividad medida; el borrado, solo por código (actualiza la caché sin pedir nada)
- [ ] 4. `consultas.sql` escrita, **pendiente de que la ejecute el usuario** y recalibrar. Sin probar contra Postgres
- [x] 5. Uso de columnas/streams y caché (RF4, RF5, S8)
- [x] 6. `informe.md` y `mediciones.md`
- [x] 7. Actualizar con `develop`, `CHANGELOG.md`, `MEMORY.md`, PR a `develop` sin mergear
