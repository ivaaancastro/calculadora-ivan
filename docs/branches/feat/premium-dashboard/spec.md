# Spec — `feat/premium-dashboard` (Fase D2: Dashboard premium)

Estado: **aprobada por el usuario (2026-11-23)** con un cambio en D-1: la cifra protagonista es **CTL** (no TSB). D-2 y D-3 aprobadas tal cual. Todo detrás de `html[data-ui="v2"]`; v1 no cambia. Cubre la pestaña principal (`Dashboard.jsx` shell y `dashboard/AdvancedAnalytics.jsx`, `EvolutionChart.jsx`). Resuelve **JER-1**, **DIS-1**, GRA-6 (sparkline + delta en KPI) y MOV-5 (count-up en KPI) de `../premium-design/auditoria.md`. Modelo: `../premium-detalle/spec.md`.

## 1. Referencias y principios
- **Bluejack** (memoria `reference-design-inspiration`): cabecera con **resumen narrativo** en lenguaje natural + fila de KPI con etiqueta pequeña en mayúsculas, cifra muy grande y una línea de contexto; mucho aire, casi sin bordes.
- **Algorithmic Trading**: tarjetas de borde fino y radio generoso, icono + **variación verde/rojo**, área con degradado para la evolución.
- **Fase C**: `Sparkline`, `ChartSkin`, `useChartMotion`, `ZoomRange`, tooltip cristal; **make-interfaces-feel-better**: `tabular-nums`, `text-wrap: balance`, radios concéntricos, hit areas ≥ 44 px.

## 2. Problema (auditoría)
- **JER-1**: 3 secciones con el mismo peso (Estado de Forma, 4 KPI, 4 KPI secundarios, gráfica); el «héroe» es una tarjeta con un badge de 10 px, y los KPI son `StatTile` iguales sin tendencia.
- **DIS-1**: columna única hasta 1800 px: en ≥ 1280 px queda vacío lateral y la gráfica se estira sin acompañamiento.
- GRA-6 / MOV-5: KPI sin sparkline, sin delta ni animación de cifra.

## 3. Propuesta

### 3.1 Jerarquía: 1 héroe + 2 secundarios + resto plegable
1. **Héroe «Estado de forma»** (nuevo `FormHero`, solo v2): eyebrow «Estado de forma · {rango}»; **frase narrativa** de 1–2 líneas (p. ej. «Estás en zona productiva: tu fitness sube un 4,2 % en 28 días y la fatiga está controlada. Buen momento para sumar carga.»); a la derecha la **cifra protagonista** CTL (Fitness; 44–56 px, 600, tabular) con su variación a 28 días y el estado de forma (derivado del TSB) como chip de color. Selector de rango (7D/30D/3M/Todo) en el héroe, ya en móvil (hoy solo escritorio). Filete degradado superior del color del estado.
2. **KPI primarios** (Fatiga ATL, Forma TSB, Ratio de carga ACWR; CTL vive en el héroe): tarjeta de borde fino con etiqueta 11/600 mayúsculas, **cifra 32–36 px**, **delta** con icono y verde/rojo según el sentido útil (CTL ↑ = verde; ATL ↑ y ACWR fuera de 0,8–1,3 = ámbar/rojo), **Sparkline** de los últimos 28 días con el color de la métrica y **count-up** de la cifra.
3. **Secundarios** (Rampa, Monotonía, Volumen 30D, VO2 Max): «libro» sin caja (fila etiqueta · valor con filete), plegado en móvil (ya existe el toggle) y fijo en escritorio.

### 3.2 Distribución
- **Móvil 390 px**: héroe → KPI 2×… (CTL/ATL en dos columnas, ACWR a ancho completo con sparkline) → gráfica → secundarios plegados. Orden actual conservado; sin scroll horizontal.
- **Escritorio ≥ 1024 px** (rejilla de 12 columnas, `max-w` 1440 px centrado): héroe 12 col; fila de 3 KPI; debajo **gráfica 8 col + panel lateral 4 col** (secundarios en libro + «Qué hacer hoy» con la frase de recomendación del estado). ≥ 1280 px el panel lateral queda fijo (sticky) junto a la gráfica.

### 3.3 Narrativa (utilidad pura, testeada)
`buildFormSummary({ctl, atl, tsb, acwr, rampRate, loadTrend})` → `{state, headline, sentence, advice}` con reglas deterministas sobre los umbrales que `AdvancedAnalytics` ya usa (TSB −30/−10/5/25), más una cláusula de tendencia (loadTrend ±2 %) y otra de riesgo (ACWR > 1,5 o < 0,8; rampa > 8). Sin IA ni red. Textos en español, sin promesas médicas.

### 3.4 Tipografía y movimiento
Inter ya cargada. Eyebrow 11/600 `+0.08em`; héroe 48/600 `tracking -0.04em` con `"tnum","cv11"`; KPI 34/600; etiquetas 11–12. Entrada del héroe y KPI en cascada corta (opacidad + 6 px, 450 ms, 60 ms entre tarjetas), count-up 1200 ms reutilizando `health/useCountUp.js`; ambos apagados con `prefers-reduced-motion` y `animations: 'disabled'` en capturas.

### 3.5 Estados
Carga: esqueleto del héroe y KPI (`Skeleton`) en lugar del spinner de pantalla completa **solo si es barato** (si `useActivities` sigue dando `loading` global, se queda el actual). Sin datos suficientes (CTL = 0 o < 14 días): el héroe dice qué falta en vez de un «Pico de forma» falso; sparkline oculto con < 3 puntos.

### 3.6 Gráfica de evolución
Se mantiene `EvolutionChart` v2 de Fase C (banda óptima, proyección, zoom). Cambios solo de contenedor: ancho 8 col, altura 340–380 px en escritorio, tarjeta sin doble borde (RAD-4). Ajuste del degradado del área CTL al lenguaje «Algorithmic Trading» si no choca con la banda.

## 4. Criterios de aceptación
- v1 sin cambios (todo lo nuevo solo se monta con `isV2`; los `data-dash` existentes se conservan para e2e).
- Un solo elemento domina la pantalla (la cifra CTL + frase); KPI con delta y sparkline; secundarios sin caja.
- Escritorio 1280 y 1440 px: sin vacío lateral > 5 % del ancho de contenido; móvil 390 px sin scroll horizontal.
- Objetivos táctiles ≥ 44 px, `lint:ui`, `lint:colors` (no sube; colores por tokens/`useChartTheme`), tests verdes (`buildFormSummary` con casos por estado).
- Snapshots v2 del Dashboard (móvil y escritorio, claro/oscuro) regenerados en Docker; fecha/datos deterministas.
- Contraste AA en cifras y etiquetas, claro y oscuro.

## 5. Decisiones abiertas (confirmar al aprobar)
- **D-1 (resuelta)** Protagonista = **CTL**; el TSB pasa a KPI primario y a chip de estado.
- **D-2 (aprobada)** Frase narrativa por reglas (propuesta) vs IA Gemini. Reglas: gratis, determinista, testeable.
- **D-3 (aprobada)** El selector de rango pasa al héroe también en móvil (hoy oculto en móvil).

## 6. Fuera de alcance
Rendimiento (`FitnessStatsPage`), Salud, Calendario, Actividades y Perfil (D3–D7); cambios de motores (`tssEngine`, `fitnessStatsEngine`); barra de navegación; datos nuevos (VO2/HRV con serie → Sparkline pendiente).
