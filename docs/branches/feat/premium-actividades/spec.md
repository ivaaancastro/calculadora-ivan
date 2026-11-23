# Spec — `feat/premium-actividades` (Fase D6: Actividades premium)

Estado: **pendiente de aprobación del usuario**. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre la pestaña «Actividades» (`/history`): `dashboard/HistoryList.jsx` y el bloque `renderHistory` de `Dashboard.jsx` (botón «Añadir Manual» y altura de la lista). Resuelve **JER-6** de `../premium-design/auditoria.md`. Modelo: `../premium-dashboard/spec.md`.

## 1. Referencias y principios
- **Bluejack**: jerarquía de cifras (etiqueta pequeña en mayúsculas, cifra grande, contexto en una línea), mucho aire.
- **Algorithmic Trading**: tarjetas de borde fino, radio generoso, variación verde/rojo, filas limpias con cifras alineadas a la derecha.
- **Fase C / make-interfaces-feel-better**: `Sparkline`, `tabular-nums`, `text-wrap: balance`, radios concéntricos, hit areas ≥ 44 px, sin `transition-all`.

## 2. Problema (JER-6)
Filas de 64 px correctas, pero: (a) la miniatura de deporte no pesa (cuadrado de 36–40 px con tinte al 15 %); (b) lista plana sin agrupar: 200 filas iguales, sin noción de «semana»; (c) las cifras (tiempo, distancia, kcal, TSS) tienen el mismo peso y TSS solo cambia de color; (d) el recuento («N Actividades») es el único resumen; (e) filtros de deporte en un `<select>` que oculta las opciones; (f) en escritorio la lista ocupa 1800 px con huecos enormes entre nombre y cifras.

## 3. Propuesta

### 3.1 Cabecera de resumen (nuevo `ActivitiesSummary`, solo v2)
Encima de la lista, sobre los datos **filtrados**: eyebrow «Actividades · {periodo}», cifra protagonista = **nº de sesiones** (36–44 px, 600, tabular) y tres cifras secundarias en línea: **tiempo total**, **distancia**, **TSS**, cada una con etiqueta 11/600 mayúsculas. A la derecha, una **Sparkline** del TSS semanal (últimas 12 semanas del filtro) con el color de acción. Sin datos: la cabecera se oculta y queda el estado vacío.

### 3.2 Agrupación por semana
Cabeceras de semana (ISO, lunes) sticky dentro de la lista: «Semana del 17 nov» + a la derecha «4 act · 5 h 20 · 210 TSS» en `tabular-nums`. Utilidad pura `groupByWeek(activities)` → `[{key, start, items, totals}]` testeada (cambio de año, domingos, semana vacía no aparece). La lista virtualizada pasa a filas heterogéneas (cabecera 36 px, fila 64 px): se aplana a un array `[{kind:'week'|'row'}]` y `estimateSize` por tipo. v1 conserva la lista plana.

### 3.3 Fila
- Miniatura: **squircle de 40 px con el color del deporte como relleno sólido suave** (token `sport-*`, ya unificado por COL-3) e icono más grande; es el ancla visual de la fila.
- Título 14/600; subtítulo «dom 22 nov · Carrera» 12 `ink-3` (la fecha corta; el año solo si no es el actual).
- **Columna de cifras alineada a la derecha**, anchos fijos y `tabular-nums`: la cifra principal (duración, 15/600 `ink`) y secundaria (distancia o kcal, 12 `ink-3`); en ≥ md aparecen además Dist · Kcal · **TSS** con etiquetas solo en la cabecera de semana, no en cada fila (menos ruido).
- **TSS como carga relativa**: pequeño chip/barra de 3 px bajo la cifra, escalada a la sesión más fuerte del filtro (token ámbar → rojo por tramos), sustituye al color plano.
- Borrar: 44 px, visible siempre en táctil; en ≥ md solo al `hover`/`focus-within` de la fila (el chevron se mantiene). Se conserva `data-history="delete"`.

### 3.4 Filtros
- Deporte: **Segmented** (`ui/Segmented`) con chips «Todo · Carrera · Ciclismo · Natación · Fuerza» en v2 (scroll horizontal sin barra en móvil, sin ocultar); en v1 se queda el `<select>`.
- Periodo: `Select` actual. Búsqueda: se queda, a ancho completo en móvil.
- Los `data-history` existentes se conservan para e2e.

### 3.5 Distribución
- **Móvil 390 px**: resumen compacto (cifra + 3 secundarias en 2×2, sin sparkline) → filtros (2 filas) → lista. Sin scroll horizontal.
- **Escritorio ≥ 1024 px**: contenido en `max-w` 1100 px centrado (hoy 1800: DIS-1), lista a una columna con cifras alineadas; ≥ 1280 px el resumen pasa a **panel lateral sticky de 4 col** (reparto de tiempo por deporte en barras finas + sparkline) y la lista ocupa 8 col.

### 3.6 Movimiento y estados
Entrada de la cabecera en cascada corta (opacidad + 6 px, 450 ms) y count-up (`health/useCountUp.js`) de la cifra; apagados con `prefers-reduced-motion` y en capturas. Filtrar no anima filas (la lista es virtualizada). Estados: vacío con filtros → `EmptyState` existente con acción «Quitar filtros»; carga: se mantiene la global.

## 4. Criterios de aceptación
- v1 sin cambios (todo se monta con `isV2`; `data-history` conservados; e2e `activities.spec.js` verde sin editar).
- Jerarquía: un elemento domina (cifra de sesiones), semanas legibles, TSS distinguible de un vistazo.
- Móvil 390: sin scroll horizontal, objetivos ≥ 44 px; escritorio 1280/1440: sin hueco central > 5 % del ancho de contenido.
- `lint:ui`, `lint:colors` (no sube; colores por tokens/`useChartTheme`), tests: `groupByWeek`, resumen (totales y semanas) y render de cabeceras en `HistoryList.test.jsx`.
- Capturas v2 de `/history` (móvil/escritorio, claro/oscuro) regeneradas solo con el workflow `Update snapshots`/Docker bajo mutex; fecha fija 2026-06-15 y sin contenido dependiente del «hoy» (el rango por defecto es «Todo» y las etiquetas salen de las fechas de los datos).
- Contraste AA en cifras y etiquetas, claro y oscuro.

## 5. Decisiones abiertas (confirmar al aprobar)
- **D-1** Cifra protagonista = **nº de sesiones** (propuesta) vs tiempo total. Propuesta: sesiones; el tiempo es la primera secundaria.
- **D-2** Agrupación por **semana** (propuesta) vs por mes. Semana encaja con el Calendario y la carga.
- **D-3** Panel lateral sticky ≥ 1280 px (propuesta) vs cabecera superior en todos los anchos. El lateral cuesta más (reparto por deporte) pero resuelve DIS-1.

## 6. Fuera de alcance
Detalle (D1), Dashboard, Rendimiento, Salud, Calendario y Perfil; el modal «Añadir Manual» (solo se reubica el botón dentro de la cabecera); tombstones de borrado; cambios de datos/motores; paginación servidor.
