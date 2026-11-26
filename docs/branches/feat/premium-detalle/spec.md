# Spec — `feat/premium-detalle` (Fase D1: detalle de actividad premium)

Estado: aprobación delegada por el usuario («te doy permiso para todo», 2026-11-20). Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre `ActivityDetailPage` y `components/activity/detail/*` para todos los deportes. Resuelve JER-2, GRA-8 (parcial), EST-4 de `../premium-design/auditoria.md`.

## 1. Referencias y principios
- **awwwards/dashboard**: una cifra protagonista a gran escala, mucho aire, jerarquía por tamaño y peso (no por cajas), contraste tipográfico.
- **bklit-ui** (ya en la capa de Fase C): rejilla desvanecida, tooltip cristal, trazo que se dibuja, cursor compartido.
- **make-interfaces-feel-better**: radios concéntricos, sombras en capas, `tabular-nums`, `text-wrap: balance`, pulsación única, entradas escalonadas cortas, hit areas ≥ 44 px.
- **frontend-design / dataviz**: identidad por deporte con un solo tono; datos como protagonistas, el cromo recesivo; color solo con significado.

## 2. Problema
Hoy el detalle es una pared de fichas iguales (14 `Stat` de 16 px con el mismo peso), título de 14 px en una cabecera de vidrio y panel lateral con 4 estilos de tarjeta. Nada dice «esto es lo importante».

## 3. Propuesta

### 3.1 Jerarquía (Análisis)
1. **Hero** (nuevo `DetailHero`, solo v2): eyebrow (punto de color del deporte + deporte · fecha), título grande (26–32 px, `tracking -0.03em`, `text-wrap: balance`) y **tres cifras protagonistas** (40–52 px, peso 600, tabulares, separadas por filetes verticales) elegidas por deporte: bici distancia·tiempo·velocidad; carrera distancia·tiempo·ritmo; senderismo distancia·tiempo·desnivel; fuerza tiempo·kcal·FC media; genérico tiempo·distancia·kcal; si falta alguna se completa con las siguientes disponibles. Un filete degradado del color del deporte corona el hero.
2. **Libro de métricas** («ledger»): el resto de métricas sin caja, filas etiqueta · valor con filete inferior, 2 columnas en móvil y hasta 4 en escritorio. Conservan `MetricTooltip` y los `data-detail="stats"`.
3. Telemetría (picos + HUD) → gráficas → panel lateral, en ese orden.

### 3.2 Distribución
- **Móvil 390 px**: cabecera compacta (Volver · acciones, pestañas 44 px) → hero → mapa → ledger → picos/HUD → gráficas → impacto. Sin título duplicado en la cabecera.
- **Escritorio**: cabecera de una sola fila (Volver · pestañas · acciones); columna izquierda con hero, picos/HUD y gráficas; columna derecha (380 px) con mapa e impacto. El resumen deja de vivir en la cabecera.
- Pestañas Mapa/Laps/Detalle: la cabecera conserva un título compacto (no hay hero).

### 3.3 Capa de gráficas
Reutiliza Fase C (`ChartSkin`, `useChartMotion`, `ZoomRange`, tooltip cristal). PR 2: cursor compartido y sombreado de la selección entre las gráficas y el mapa, HUD como «lectura» fija (sin saltos de altura), picos como chips con color del dato. Sparkline en la tira de laps (PR 3).

### 3.4 Tipografía
Inter ya cargada, sin fuentes nuevas (peso de bundle). Escala: eyebrow 11/600 mayúsculas `+0.08em`; título 28/700; cifra protagonista 44/600 `tracking -0.04em` con `font-feature-settings: "tnum","cv11"`; ledger 13/600 valor, 11/500 etiqueta.

### 3.5 Movimiento
Entrada del hero en cascada (opacidad + 6 px de subida, 450 ms `cubic-bezier(.22,1,.36,1)`, 60 ms entre cifras). Apagada con `prefers-reduced-motion` y por `animations: 'disabled'` en las capturas. Sin animar layout.

### 3.6 Estados
- Carga: esqueleto del hero y de las gráficas (`Skeleton`) en lugar del spinner de pantalla completa (PR 2).
- Parciales (EST-4): bloques sin dato explican qué falta («Sin potencia: este registro no trae medidor») con `EmptyState` compacto (PR 2).
- Error de telemetría: `ErrorState` con reintento.

### 3.7 Panel lateral (PR 3)
Impacto del entrenamiento como dos medidores con escala 0–5 y marcas, Coach Insights como lista numerada con filete; una sola receta de tarjeta.

## 4. Criterios de aceptación
- v1 sin cambios (el hero y la cabecera nueva solo se montan con `isV2`).
- 5 deportes (bici, carrera, senderismo, fuerza, genérico) muestran hero con 3 cifras y sin duplicados.
- Objetivos táctiles ≥ 44 px, `lint:ui`, `lint:colors` (no sube), tests verdes; snapshots v2 del detalle regenerados en Docker y fecha/datos deterministas.
- Contraste AA de cifras y etiquetas en claro/oscuro.

## 5. Fuera de alcance
Resto de pantallas (Fase D2), series de fuerza, cambios de datos/motores.
