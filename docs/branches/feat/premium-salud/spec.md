# Spec — `feat/premium-salud` (Fase D4: Salud premium)

Estado: **pendiente de aprobación del usuario**. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre `HealthPage` y `components/health/*` (pestañas Hoy e Historial). Resuelve JER-4 y EST-2 (parcial) de `../premium-design/auditoria.md`.

## 1. Referencias y principios
- **Bluejack**: resumen narrativo arriba («Tu cuerpo está listo…») y KPIs con cifra grande, mucho aire.
- **Algorithmic Trading**: tarjetas de borde fino, variación verde/rojo junto a la cifra, áreas con degradado.
- **Fase C (bklit-ui)**: rejilla desvanecida, tooltip cristal, trazo que se dibuja, `Sparkline`, `ZoomRange`.
- **make-interfaces-feel-better**: `tabular-nums`, `text-wrap: balance`, radios concéntricos, pulsación única, hit areas ≥ 44 px.

## 2. Problema
Anillos y banco de energía son lo mejor de la pantalla, pero: (a) los 8 biomarcadores son una rejilla homogénea de cifras de 24 px que no distingue normal de atención; (b) el mensaje de estado vive como subtítulo de 12 px; (c) hay tres «píldoras» de estado con colores hex/Tailwind sueltos (rose, blue); (d) el historial usa un `ComposedChart` v1 (barras + línea) sin lenguaje Forma; (e) sin sparklines ni variación en los biomarcadores.

## 3. Propuesta

### 3.1 Hoy
1. **Hero narrativo** (nuevo `HealthHero`, solo v2): eyebrow «Hoy · fecha», frase de estado grande (26–30 px, `text-wrap: balance`) derivada de `readinessInfo` («Estás **óptimo** para una sesión intensa») y la cifra de recuperación como protagonista (48–56 px, tabular). Sustituye al subtítulo; pestañas Hoy/Historial a la derecha (44 px).
2. **Anillos**: se conservan (AppleRingGauge). Se unifica la receta de píldora de estado en tokens (`positive/warning/danger/info`), se quita el «Pilar 01/02/03» como texto decorativo en v2 y el pie pasa a una línea de contexto con variación vs. base.
3. **Banco de energía**: se conserva el medidor; en v2 cifra a 56 px, marcas 30/60 % y el tramo de color por tokens.
4. **Biomarcadores con jerarquía por estado**: cada tarjeta lleva un indicador de estado (`ok` · `atención` · `sin dato`) con punto + etiqueta y borde/tinte solo cuando requiere atención (FC reposo > base+5, VFC desequilibrada, SpO₂ < 95, TSB < −10, peso +). El estado se calcula en `biomarkerStatus.js` (puro, con test). Las tarjetas «atención» suben al principio de la rejilla; el resto mantiene el orden. Cifra a 28–32 px, variación (`▲ +3` verde/rojo según sentido bueno/malo) y, **solo donde existe serie** (FC reposo, sueño, peso, TSB, pasos en `wellnessMetrics.chartData`), `Sparkline` de 7 días. HRV y VO₂ sin serie: sin sparkline (ya anotado en MEMORY).
5. **Insights**: lista numerada con filete, una receta de tarjeta.

### 3.2 Historial
- Tira de días con anillo de recuperación mini por día (color por tramo), día seleccionado destacado.
- `DaySpotlight`: cifra de recuperación protagonista + 3 cifras secundarias (VFC, FC reposo, sueño) como el hero del detalle.
- **`HistoryTrendChart` v2**: área con degradado para recuperación, línea de sueño con segundo eje discreto, rejilla/tooltip/animación Fase C, banda de «óptimo» (≥ 67 %) y `ZoomRange` para 30 días. v1 conserva el `ComposedChart` actual.
- Registro diario: filas sin caja, filete inferior, píldora de estado con tokens.

### 3.3 Estados (EST-2)
Carga: esqueleto del hero + anillos (en vez del spinner centrado). Sin datos: `EmptyState` existente con acción. Parciales: tarjeta con «Sin dato» y una línea de por qué.

### 3.4 Movimiento y tipografía
Inter existente. Cascada de entrada del hero y KPIs (opacidad + 6 px, 450 ms, 60 ms entre elementos); `useCountUp` se reutiliza en la cifra del hero. Apagado con `prefers-reduced-motion` y `animations: 'disabled'` en capturas. Sin animar layout.

## 4. Criterios de aceptación
- v1 sin cambios (los componentes nuevos solo se montan con `isV2`).
- Biomarcadores: las tarjetas en atención se distinguen sin depender solo del color (icono/etiqueta).
- `lint`, `lint:ui`, `lint:colors` (no sube), vitest y build verdes; test de `biomarkerStatus`.
- Objetivos táctiles ≥ 44 px; contraste AA claro/oscuro.
- Snapshots v2 de Salud regenerados en Docker/CI solo los que cambian a propósito.

## 5. Fuera de alcance
Cambios en motores/datos de bienestar, series de HRV/VO₂ nuevas, otras pantallas, v1.
