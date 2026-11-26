# Guion — pasada completa en iPhone real (Capa 5, D16/RF10)

Lo ejecuta el usuario; **no la ha ejecutado ningún agente**. Duración estimada: 30–40 min. Anota el resultado de cada casilla (✓ / ✗ + captura si falla) y pásalo a `tasks.md`/PR de la Capa 6.

## 0. Preparación
- [ ] Safari en iPhone (iOS actual), sesión iniciada con una cuenta que tenga actividades, plan en el Calendario y datos de Salud. Ideal: abrir también como PWA («Añadir a pantalla de inicio») y repetir las secciones 1, 2 y 11.
- [ ] Ajustes → General → **Vista previa v2** activado (`role="switch"`); la página no recarga datos ni pierde sesión.
- [ ] Probar en **claro y oscuro** (icono de tema de la cabecera) las secciones 3–10; en vertical y, una vez, en horizontal.
- [ ] Tamaño de texto del sistema normal (y una vez en «Más grande»: nada debe quedar cortado).

## 1. Shell (todas las pantallas)
- [ ] Cabecera de 60 px: no crece, no tapa contenido, sin salto al hacer scroll (barra de Safari incluida).
- [ ] Barra inferior: 4 pestañas + botón de búsqueda; todas se pulsan a la primera; no se solapa con el contenido ni con el indicador de inicio (zona segura).
- [ ] Menú de perfil: abre, cierra al tocar fuera, secciones (General, Zonas, Cuentas, Seguridad) y **Cerrar sesión** funcionan.
- [ ] Botón de tema cambia y recuerda la elección al recargar. «Conectar» (Strava) visible en una línea.
- [ ] Deslizar lateral cambia de pestaña en contenido normal, **no** sobre gráficas, mapa ni la tira de secciones de Rendimiento.
- [ ] Rotar el teléfono: sin desbordamiento horizontal.

## 2. Dashboard (`Inicio`)
- [ ] Sin hacer scroll se ven: Estado de Forma, CTL/ATL/TSB/ratio (2 × 2) y la gráfica de evolución con su selector 7D/30D/3M/Todo.
- [ ] El selector de rango cambia la gráfica; tocar la gráfica muestra el valor (tooltip táctil) sin cambiar de pestaña.
- [ ] «Tendencia y Capacidad» está plegada; el botón (44 px) la abre y cierra (`aria-expanded`).
- [ ] `FuelingPanel`: botón «Por qué» abre/cierra; las fichas de gasto/IF no se desbordan.
- [ ] Abrir una actividad desde una lista del dashboard lleva al Detalle.
- [ ] Cuenta sin actividades: aparece el estado vacío.

## 3. Rendimiento (`Forma`)
- [ ] Orden de tarjetas: Estado de entreno → VFC → Umbrales → Balance; densidad cómoda, ningún texto cortado.
- [ ] La tira de secciones (Fisiología, Potencia, VO2 y Marcas, Volumen, Todos) se desplaza en horizontal sin cambiar de pestaña; cada botón mide ≥ 44 px.
- [ ] Cargar telemetría histórica / Deep Sync muestra progreso y termina.
- [ ] Tocar una actividad desde una tarjeta abre el Detalle.

## 4. Calendario
- [ ] Mes, flechas y «Hoy» a ≥ 44 px; hoy resaltado; días vacíos compactos; la página no se siente más larga que en v1.
- [ ] Mes anterior/siguiente/Hoy funcionan.
- [ ] Resumen semanal (aptitud, fatiga, forma, rampa, progreso del plan) legible.
- [ ] «+» abre **Planificar sesión**: rellenar nombre, tipo, duración, bloques y nota → guardar; aparece como sesión discontinua.
- [ ] **Importar entreno desde texto** funciona; editar y eliminar (con confirmación) un plan.
- [ ] Arrastrar un plan a otro día (si se usa en móvil) y abrir el visor de un entreno planificado: se cierra con ✕ y tocando fuera.
- [ ] Abrir una actividad realizada lleva al Detalle. Conmutar la vista **Forma** y abrir/cerrar la PMC flotante.

## 5. Salud
- [ ] Sin scroll: título, selector Hoy/Historial (44 px), los tres pilares (recuperación, carga diaria, sueño) y el banco de energía; los anillos se dibujan y no se cortan.
- [ ] Hoy ↔ Historial cambia sin recargar; en Historial: 7D/14D/30D y fichas de día (44 px) abren el día.
- [ ] Biomarcadores y aspectos destacados debajo; sin datos → estado vacío; con error de sincronización → mensaje.
- [ ] Con «Reducir movimiento» activado en iOS no hay animaciones de anillos ni contadores.

## 6. Actividades
- [ ] Buscador a ancho completo; deporte y periodo en una fila; recuento visible.
- [ ] Buscar por título, filtrar por deporte y por periodo; la lista hace scroll interno fluido.
- [ ] Abrir una fila lleva al Detalle; el botón de borrar (44 px) pide confirmación y **no** abre el detalle.
- [ ] Alta manual: abrir el modal, rellenar fecha, deporte, duración, pulso, distancia y desnivel; duración obligatoria; guardar; cerrar con ✕ (44 px) y tocando fuera.
- [ ] Teclado de iOS: el modal no queda tapado y no hay zoom automático en los campos.

## 7. Detalle de actividad
- [ ] Volver, Strava (si hay `strava_id`) y Eliminar a 44 px; sin barra inferior.
- [ ] Pestañas Análisis / Mapa / Intervalos / Detalle cambian el contenido.
- [ ] Mapa: arrastrar y pellizcar mueven el mapa, no la página ni las pestañas; capas Light / Dark / Sat cambian; rendimiento fluido.
- [ ] Gráficas (velocidad, FC, potencia, altitud, cadencia): tocar muestra el valor; la tira de picos se desplaza sin cambiar de pestaña.
- [ ] Eliminar pide confirmación.

## 8. Ajustes
- [ ] Selector de sección en la página (General · Zonas · Cuentas · Seguridad) cambia de sección; el menú de la cabecera lleva a las mismas.
- [ ] «Guardar» a la vista; nombre, peso, FC reposo, calibrar CTL y avatar se editan y persisten tras guardar y recargar.
- [ ] Zonas y Umbrales: FC máx./umbral, ritmo umbral y FTP; las zonas se recalculan.
- [ ] Cuentas Conectadas: Athlete ID y API Key de Intervals.icu; «Sincronizar ahora».
- [ ] Seguridad y Datos: nueva contraseña, Deep Sync, **Borrar todas las actividades** (confirmación; **no** confirmar con datos reales) y **Eliminar cuenta** (solo comprobar que pide confirmación y cancelar).
- [ ] «Vista previa v2» se puede desactivar y volver a la v1 sin perder sesión.

## 9. Pantallas de servicio y acceso (Capa 4, ya en v2)
- [ ] Cerrar sesión → landing v2; abrir el modal de acceso (entrar / crear cuenta / recuperar clave), teclado sin tapar los campos, cerrar el modal.
- [ ] `/strava-callback` con acceso denegado muestra el error (opcional).

## 10. Transversal
- [ ] Sin desbordamiento horizontal en ninguna pantalla, ni solape de barras con contenido.
- [ ] Todos los controles tocables a la primera (≥ 44 px), sin zoom accidental.
- [ ] Modo oscuro: contraste legible en gráficas y tarjetas; sin parpadeo blanco al cambiar de pantalla.
- [ ] Sin tirones notables en mapa y gráficas (anota el modelo de iPhone e iOS).

## 11. PWA (si se instala)
- [ ] Arranca a pantalla completa, la zona segura se respeta y, tras un despliegue nuevo, se actualiza al reabrir (`autoUpdate`).

## Resultado
- iPhone / iOS: _______________  Fecha: _______________
- Fallos encontrados (sección, qué pasó, captura): _______________
- ¿Bloquea activar v2 por defecto (Capa 6)? Sí / No
