# Spec — `feat/premium-calendario` (Fase D5: Calendario premium)

Estado: **pendiente de aprobación del usuario**. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre `pages/CalendarPage.jsx` y `calendar/*` (`CalendarMonthView`, `PmcFloatingChart`, modales solo en piel). Resuelve **JER-5** de `../premium-design/auditoria.md`. Modelo: `../premium-dashboard/spec.md`.

## 1. Referencias
- **Bluejack**: cabecera con resumen narrativo del mes + fila de KPI (etiqueta mínima en mayúsculas, cifra grande, línea de contexto).
- **Algorithmic Trading**: tarjetas de borde fino, radio generoso, variación verde/rojo con icono.
- **Fase C**: `ActivityHeatmap`, `Sparkline`, `ChartSkin`; make-interfaces-feel-better (`tabular-nums`, hit areas ≥ 44 px, `transition` explícitas).

## 2. Problema (JER-5)
- Cabecera = título + botones; el heatmap de constancia (26 semanas) queda como franja suelta, sin relación con el mes.
- La rejilla mezcla todo con el mismo peso: textos de 8–11 px, fichas de sesión planas, panel semanal de 130 px con 4 filas de microtexto (`Aptitud/Fatiga/Forma/Ramp`).
- Hoy / planificado / realizado / cumplido se distinguen solo por un borde discontinuo y un ✓ de 9 px.
- No hay lectura de «cómo va el mes».

## 3. Propuesta

### 3.1 Cabecera narrativa del mes (`MonthHero`, solo v2)
- Eyebrow «{Mes año}», **frase** de 1–2 líneas (p. ej. «Llevas 11 sesiones y 412 TSS este mes, un 8 % más que el anterior; te quedan 3 sesiones planificadas.»), navegación (‹ Hoy ›) y conmutador «Forma».
- **Fila de 4 KPI** (cifra 28–32 px tabular, etiqueta 11/600 mayúsculas, línea de contexto): Sesiones (hechas/planificadas), Carga (TSS) con **delta vs mes anterior** verde/rojo, Tiempo, Cumplimiento del plan (% sesiones planificadas completadas) con barra fina.
- Utilidad pura testeada `buildMonthSummary({activities, plannedWorkouts, year, month, today})` → `{sessions, planned, done, tss, tssPrev, deltaPct, minutes, compliance, sentence}`. Reglas deterministas, sin IA ni red; sin datos → dice qué falta.
- El heatmap de constancia pasa a **tarjeta lateral/inferior** acompañando al héroe (en escritorio a la derecha de los KPI; en móvil debajo, colapsable).

### 3.2 Rejilla del mes
- **Día**: número tabular, hoy = círculo cobalto + filete superior; el fondo de cada día recibe un **tinte de carga** (opacidad proporcional al TSS del día, color de la serie `tss`; leído con `useChartTheme`) → el calendario es en sí un heatmap de carga.
- **Ficha de sesión**: punto/icono del deporte (token de deporte único, COL-3), duración 12/600, nombre truncado, TSS a la derecha; mínimo 11 px. Estados con un lenguaje único: **realizado** (sólido), **cumplido** (check en chip verde), **planificado** (discontinuo + etiqueta «Plan»), **omitido** (planificado en día pasado sin actividad, tono ámbar tenue).
- **Panel semanal**: pasa de 4 filas de microtexto a una cabecera de semana compacta: «S24 · 312 TSS», barra de progreso plan, y CTL/ATL/TSB en una línea con `tabular-nums` (≥ 11 px). Móvil: la cabecera de semana aparece como separador sticky entre bloques de días.
- Escritorio ≥ 1280 px: `max-w` 1440 centrado; altura de fila de semana adaptable (hoy fija 220 px).

### 3.3 Móvil 390 px
Héroe compacto (frase + 2×2 KPI) → mes con días vacíos de 58 px (ya existe) → heatmap plegado. Sin scroll horizontal; objetivos ≥ 44 px (los de 8c se conservan).

### 3.4 PMC flotante y modales
Solo piel/tokens: `PmcFloatingChart` con tooltip cristal y colores por `useChartTheme`; modales `PlannerModal` y `WorkoutViewerModal` sin cambios de lógica (acabado de Fase B ya aplicado). Posible diferido si el PR crece.

### 3.5 Movimiento y estados
Cascada corta de KPI (opacidad + 6 px, 450 ms) y count-up con `health/useCountUp.js`; apagado con `prefers-reduced-motion` y en capturas. Carga/vacío: mes sin sesiones muestra «Sin sesiones este mes» con acción «Planificar» en lugar de la frase.

## 4. Criterios de aceptación
- v1 sin cambios; se conservan todos los `data-cal`, `data-today`, `data-planned` y `data-chart="heatmap"` (e2e y capturas).
- Un único elemento domina (frase + KPI); estados de sesión distinguibles sin depender del borde discontinuo; texto ≥ 11 px.
- Arrastrar-soltar de planificados, abrir plan/actividad y modales siguen funcionando (tests/e2e existentes en verde).
- Sin scroll horizontal en 390 px; sin vacío lateral > 5 % en 1280/1440.
- `lint:ui`, `lint:colors` (no sube; todo por tokens/`useChartTheme`), tests de `buildMonthSummary` por caso (mes vacío, delta ±, mes anterior sin datos, cumplimiento).
- Capturas v2 del Calendario (móvil/escritorio, claro/oscuro) solo si cambian a propósito, con el workflow `Update snapshots`; sin contenido dependiente de «hoy» (ver `e2e/support/visual.js`: el heatmap ya se oculta; el tinte de carga y la frase usan la fecha fija del e2e 2026-06-15).
- Contraste AA, claro y oscuro.

## 5. Decisiones abiertas
- **C-1** Héroe: frase + 4 KPI (propuesta) vs solo frase + 2 KPI (más sobrio).
- **C-2** Tinte de carga por día (propuesta) vs solo punto de carga.
- **C-3** Heatmap de constancia: a la derecha de los KPI en escritorio y plegado en móvil (propuesta) vs quitarlo (el tinte lo sustituye).
- **C-4** Estado «omitido» (plan pasado sin actividad): añadirlo (propuesta) vs mantener solo planificado/realizado.

## 6. Fuera de alcance
Lógica de planificación (`usePlanEditor`, `calendarEngine`), nuevas vistas (semana/día), sincronización de calendario externo, Actividades y Perfil, datos nuevos.
