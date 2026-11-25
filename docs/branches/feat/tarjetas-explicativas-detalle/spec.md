# Spec: Tarjetas explicativas en cada dato del resumen del detalle

## 1. Identificación
- **ID:** spec-tarjetas-explicativas-detalle
- **Título:** Tarjetas explicativas (popover/bottom-sheet) por métrica del resumen del detalle de actividad
- **Autor:** agente forma (OpenCode)
- **Fecha:** 2026-11-18
- **Estado:** implementada

## 2. Objetivo
Que cada métrica del resumen superior del detalle de actividad (Carga/TSS, IF, NP, Trabajo, FC Media, etc.) sea pulsable y al pulsarla muestre una tarjetita explicativa (popover en escritorio, bottom-sheet en móvil) con un texto sencillo que explique qué es ese dato, reutilizable luego en Dashboard y Rendimiento, y accesible (teclado, foco, Escape para cerrar, área táctil ≥ 44 px en v2).

**Diseño (revisado):**
- No hay ícono `?` visible. El área táctil es todo el `Stat`; al pulsar cualquier parte del dato se abre directamente la tarjeta explicativa.
- Cada `Stat` del resumen superior del detalle pierde el borde perimetral y gana una rayita inferior (`border-b`) bajo toda la ficha. Esto solo afecta al detalle de actividad; `Stat` en otros lugares de la app se deja intacto.

## 3. Contexto y justificación
- El detalle de actividad (`src/components/pages/ActivityDetailPage.jsx`) muestra métricas como Carga/TSS, IF, NP, Trabajo, etc. en una cuadrícula de componentes `Stat`.
- Muchos usuarios no saben qué significan esos datos. Hoy no hay forma de obtener una explicación desde la UI.
- La espec se centra en la tarea 1 de las pendientes; las tareas 2 (detalle por tipo de deporte), 3 (botón borrar) y 4 (pasada en iPhone) se abordarán por separado.
- Los textos explicativos deben vivir en un único módulo centralizado para poder reusarlos en Dashboard y Rendimiento, y deben estar cubiertos por tests unitarios.

## 4. Requisitos funcionales

### RF1 — Métricas pulsables
Cada `Stat` del resumen superior del detalle debe poder pulsarse (zona táctil ≥ 44 px en v2) y abrir una tarjeta explicativa con el texto de esa métrica. **No hay ícono `?` visible:** el área táctil es todo el `Stat` (etiqueta + número + unidad).

### RF2 — Tarjeta explicativa (popover / bottom-sheet)
- En escritorio: popover anclado a la métrica pulsada.
- En móvil (por debajo de `sm`): bottom-sheet que ocupa ancho completo y parte inferior de la pantalla.
- Contenido: título de la métrica + texto explicativo en lenguaje sencillo.

### RF3 — Textos centralizados y reutilizables
- Todos los textos explicativos viven en un único módulo: `src/utils/activityMetricDescriptions.js` (o similar, a definir en el plan).
- El módulo exporta un objeto que clavea por `metricId` (ej. `tss`, `if`, `np`, `work`, `hrAvg`, `pace`, `speed`, `distance`, `elevation`, `cadence`, `wattsAvg`, `ef`, `decoupling`).
- Cada entrada tiene: `id`, `label` (nombre corto de la métrica) y `description` (texto explicativo, 1-3 frases, lenguaje sencillo).
- Los textos deben poder usarse después en Dashboard y Rendimiento sin duplicar.

### RF4 — Accesibilidad
- Teclado: la métrica es focusable (pulsable con Tab/Enter).
- Foco: al abrir la tarjeta, el foco se mueve a ella.
- Escape cierra la tarjeta.
- Clic/tocar fuera cierra la tarjeta.
- `role="tooltip"` o `role="dialog"` según corresponda, con `aria-describedby`/`aria-labelledby` apropiados.
- Área táctil ≥ 44 px en v2 (coherente con #99).

### RF5 — Integración en ActivityDetailPage
- Las métricas del resumen superior (desktop en el header, y móvil en la cuadrícula bajo el mapa) usan el nuevo comportamiento.
- Cada `Stat` del detalle **no tiene borde perimetral ni rayita inferior** (se deja tal como estaba originalmente en v1). Esto solo afecta al detalle de actividad; `Stat` en otras partes de la app se deja intacto.
- No se rompe el comportamiento existente de `Stat` en otras partes de la app.

## 5. Criterios de aceptación

- [ ] Cada métrica del resumen superior del detalle es pulsable y abre su tarjeta explicativa.
- [ ] En móvil la tarjeta es bottom-sheet; en escritorio es popover anclado.
- [ ] Los textos viven en un único módulo centralizado y reutilizable.
- [ ] Existen tests unitarios para el módulo de textos (todas las métricas tienen `label` y `description` no vacíos).
- [ ] Existen tests unitarios de la tarjeta explicativa (abre/cierra, Escape cierra, clic fuera cierra, foco).
- [ ] Área táctil ≥ 44 px en v2 para cada métrica pulsable.
- [ ] `style-diff.mjs` entre develop y la rama da 0 diferencias en v1.
- [ ] Lint, `lint:colors`, `lint:ui`, tests unitarios e integración, y build pasan.

## 6. Diseño técnico

- **Componentes afectados:**
  - `src/components/pages/ActivityDetailPage.jsx` — envolver las métricas `Stat` del resumen superior con el componente de tarjeta explicativa. Cada `Stat` se envuelve en un contenedor con `border-b` (rayita inferior bajo toda la ficha), solo en el detalle.
  - `src/components/ui/` — componente `MetricTooltip` para popover/bottom-sheet. **Sin ícono `?` visible:** el disparador es el `Stat` completo. Reutilizar `Modal` (variante `sheet`) para el bottom-sheet en móvil.
  - `src/components/ui/Stat.jsx` — no se modifica; se usa tal cual, envolviéndolo en el detalle.
  - `src/components/ui/metricTooltipClasses.js` — receta del disparador (`trigger`) con zona táctil ≥ 44 px en v2, **sin `border-b`** (no hay rayita inferior en el detalle).
- **Hooks afectados:** ninguno nuevo.
- **Utilidades afectadas:**
  - Nuevo módulo `src/utils/activityMetricDescriptions.js` con los textos centralizados.
- **Base de datos:** ninguna.
- **Rutas afectadas:** ninguna.

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/activityMetricDescriptions.test.js` (textos del módulo) y `src/__tests__/unit/uiMetricTooltip.test.jsx` (componente de tarjeta).
- **Integración:** `src/__tests__/integration/activityDetailMetricTooltip.test.jsx` (abrir/cerrar tarjeta desde una métrica real del detalle).
- **E2E:** no aplica inicialmente (se cubre en la pasada de iPhone, tarea 4).

## 8. Notas adicionales
- El mapeo métrica → `metricId` debe cubrir al menos: Carga/TSS, IF, NP, Trabajo, FC Media, Vel. Media / Ritmo Medio, W Media, Cadencia, Distancia, Tiempo, Desnivel, EF, Drift.
- La tarea 2 (detalle distinto por tipo de deporte) filtrará qué métricas se muestran; los textos de esta spec deben seguir siendo válidos para las métricas que se mantengan.
- No se debe tocar el estilo de v1: todo lo nuevo va detrás de `html[data-ui="v2"]` o es neutral para v1.
- Versión: 0.1.0 — 2026-11-18
