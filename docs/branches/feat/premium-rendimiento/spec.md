# Spec — `feat/premium-rendimiento` (Fase D3: Rendimiento premium)

Estado: **pendiente de aprobación del usuario**. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre `FitnessStatsPage` y `components/fitness/*`. Resuelve JER-3 (y parte de TIP-1/COL-2/GRA-1…5 vía la capa Forma) de `../premium-design/auditoria.md`. Modelo: `../premium-detalle/spec.md`.

## 1. Referencias
- **Bluejack**: resumen narrativo en tono editorial + fila de KPI con cifra muy grande, etiqueta pequeña en mayúsculas y línea de contexto.
- **Algorithmic Trading**: tarjetas de borde fino y radio generoso, variación verde/rojo con icono, áreas con degradado, barras sólidas.
- **bklit-ui / Fase C**: `ChartSkin`, tooltip cristal, animación de entrada, `Sparkline`. **make-interfaces-feel-better**: radios concéntricos, sombras en capas, `tabular-nums`, `text-wrap: balance`, hit areas ≥ 44 px.

## 2. Problema (JER-3)
10 tarjetas con la misma receta (`Card panel`, rótulo de 10 px, `p-6/8`), alturas dispares y sin agrupación temática. No hay un «¿cómo estoy?» que destaque: el estado de entreno, la VFC y los umbrales pesan igual que el perfil de potencia. Etiquetas de 9–10 px.

## 3. Propuesta

### 3.1 Jerarquía y agrupación
La pantalla se ordena en **4 grupos** con encabezado (rótulo 11/600 mayúsculas + filete + recuento), en lugar de la lista plana:

| Grupo | Tarjetas |
|-------|----------|
| **Hoy** (héroe) | Resumen narrativo + KPI → Estado de entreno, VFC, Balance |
| **Potencia** | Perfil de potencia, eFTP, Potencial y récords (MMP/EF) |
| **Marcas** | Predicciones de carrera, VO2 máx |
| **Volumen y umbrales** | Distribución/volumen semanal, Umbrales |

Las pestañas móviles (`CATEGORIES`) se mantienen y apuntan a los mismos grupos (Fisiología→Hoy, Potencia, VO2 y Marcas→Marcas, Volumen). Los `data-card` / `data-stats` existentes se conservan (e2e y snapshots).

### 3.2 Héroe «Hoy» (nuevo `StatsHero`, solo v2)
- Párrafo narrativo de 2 frases en lenguaje natural generado de datos ya calculados (estado de entreno + TSB + tendencia VFC + diferencia eFTP vs configurado). Util puro `buildStatsNarrative(stats, ftpDiff)` con tests.
- Fila de **4 KPI** (cifra 36–44 px/600, tabular, etiqueta 11 px, línea de contexto): Carga 7d · Forma (TSB, verde/rojo con icono) · VFC · eFTP (± W respecto al configurado). Faltantes se omiten, no se rellenan con «--».
- Filete degradado del color del estado de entreno corona el héroe.
- Sustituye en v2 al título + `TrainingStatusCard` + `ThresholdsCard`-resumen; las tarjetas completas siguen debajo en su grupo (sin perder datos).

### 3.3 Receta de tarjeta única v2
Borde fino, radio concéntrico, sombra en capas (token de la piel), cabecera de tarjeta común (título 13/600 + `InfoTooltip` + acción a la derecha) y rótulos ≥ 11 px. Se aplica por CSS sobre los ganchos `data-card` y, donde haga falta, ajustando clases en cada tarjeta con ramas `isV2` (como el detalle).

### 3.4 Gráficas
Reutiliza la capa de Fase C (`ChartSkin`, `useChartMotion`, tooltip cristal): Perfil de potencia, eFTP/curva, MMP, volumen semanal (barras sólidas con radio superior), enfoque/zonas. Área con degradado en curvas MMP/eFTP. `Sparkline` en VFC (7 días) y Vo2 si hay serie; si no, no se fuerza.

### 3.5 Movimiento y estados
Entrada del héroe y de cada grupo en cascada corta (opacidad + 6 px, 450 ms, 60 ms entre elementos); apagada con `prefers-reduced-motion` y `animations: 'disabled'` en capturas. Estados vacíos por tarjeta con `EmptyState` compacto que dice qué falta («Sin FTP estimado: faltan esfuerzos máximos de 20 min») en lugar de ocultar la tarjeta; esqueleto durante la carga de series históricas.

### 3.6 Escritorio
Ancho máx. 1100 → 1200 px; Hoy a ancho completo; Potencia y Marcas en rejilla de 2 columnas donde las tarjetas son compactas (Predicciones + VO2); gráficas anchas a 1 columna.

## 4. Criterios de aceptación
- v1 sin cambios (`isV2` guarda todo componente/rama nuevos).
- Héroe con ≤ 4 KPI y narrativa correcta en datos completos, parciales y vacíos (tests de `buildStatsNarrative`).
- 4 grupos con encabezado; pestañas móviles siguen filtrando; `data-card` intactos.
- Objetivos táctiles ≥ 44 px, `lint:ui`, `lint:colors` no sube, tests y build verdes; contraste AA.
- Snapshots v2 de Rendimiento regenerados en Docker solo de lo que cambia.

## 5. Fuera de alcance
Cambios en motores/analítica (`useFitnessAnalytics`, `engines`), nuevas métricas, resto de pantallas, `Sparkline` si no hay serie.
