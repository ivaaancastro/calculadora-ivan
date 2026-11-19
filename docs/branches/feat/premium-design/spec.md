# Especificación SDD — `feat/premium-design` (Fase Premium)

## 1. Identificación
- **ID:** `spec-premium-01`
- **Título:** Fase Premium: auditoría, tokens y acabado, capa de gráficas Forma y rediseño de pantallas
- **Autor:** agente (sesión `docs/premium-spec`)
- **Fecha:** 2026-11-19
- **Estado:** **aprobada** por el usuario (D1–D10, 2026-11-19, con la ampliación de §3 bis). Esta rama solo documenta; la Fase A empieza cuando #106 esté mergeado.
- **Se inserta:** después del cierre de la Capa 5 y **antes** de la Capa 6 (`docs/branches/feat/webapp-redesign/plan.md`).
- **Base:** `origin/develop` en `c04471b`.

## 2. Objetivo
Llevar Forma de «correcta» a «premium total»: mejores gráficas, colores, bordes y distribución, con un criterio de diseñador senior y no genérico, sin romper la v1 congelada ni la paridad lograda en la Capa 5.

## 3. Contexto y justificación
- Las Capas 0–5 dejaron un sistema sólido (tokens, 14 primitivas, skin v2 «Panel» tras `html[data-ui="v2"]`) pero el resultado visual aún se lee como una app estándar: sombras planas, gráficas Recharts casi por defecto, jerarquía y densidad sin afinar.
- El usuario quiere que se vea cuidada y propia. Referencias aportadas hasta ahora: https://www.awwwards.com (sección `/websites/dashboard/`), el repo https://github.com/bklit/bklit-ui y la skill `make-interfaces-feel-better`. Seguirá aportando más.
- Hacerlo **antes** de la Capa 6 evita activar v2 por defecto para todos y retocarla después con usuarios ya dentro.
- **Restricciones heredadas (relajadas por §3 bis; solo se mantienen flujo SDD, git y D7):** v1 congelada (todo valor nuevo detrás de `html[data-ui="v2"]`, `node scripts/style-diff.mjs` = 0 diferencias en v1); colores solo por tokens (`tokens.css` → `tailwindTokens.cjs`; gráficas por `chartTheme.js` + `useChartTheme()`; `lint:colors` solo baja); primitivas de `src/components/ui/` (`lint:ui`); cabecera exactamente `--nav-h` (60 px); 390 px primero; capturas solo en Docker y sin leer PNG en bloque (AGENTS §8).

## 3 bis. Ampliación aprobada (2026-11-19)
- **Alcance = TODO el diseño de la app**, no solo gráficas: shell y navegación, tipografía, color, bordes, sombras, espaciado, jerarquía, densidad, estados vacíos/carga/error, microinteracciones, landing/acceso y todas las pantallas y componentes. La auditoría (Fase A) los cubre todos.
- **Criterio único:** buena auditoría y resultado muy premium. Las normas previas dejan de ser prohibiciones por inercia.
- **v1 se retira en la Capa 6:** no se invierte esfuerzo en protegerla. «v1 congelada» y «`style-diff` 0 en v1» dejan de ser criterio de aceptación; el aislamiento tras `html[data-ui="v2"]` se mantiene solo mientras v2 sea opt-in.
- **Dependencias y Tailwind:** se evalúan con medida (bundle, rendimiento, mantenimiento) y se pide OK al usuario si aportan valor claro.
- **Se mantiene:** flujo SDD, reglas de git (ramas desde `develop`, PR, nunca mergear sin autorización) y el **D7** del usuario como puerta de revisión visual.

## 4. Estructura de la fase
Cuatro fases secuenciales. Cada una termina con la app funcionando, se puede pausar y lleva su paso **D7** (revisión visual del usuario).

### Fase A — Auditoría de diseño (solo análisis, sin código)
Revisión pantalla a pantalla en móvil (390 px) y escritorio como diseñador senior, con las skills `frontend-design` y `dataviz` y, si el plugin «UI Design Review» está activo (requiere autorizarlo en `/mcp`), también sus skills `ui-design-review:*`. Pantallas: landing/acceso (excluidas salvo coherencia de tokens), Dashboard, Rendimiento, Salud, Actividades, Detalle de actividad (por deporte), Calendario, Ajustes y Perfil.
- **Entrega:** `docs/branches/feat/premium-design/auditoria.md`: lista **priorizada** (P0/P1/P2, con esfuerzo S/M/L e impacto) de mejoras en **colores, bordes, jerarquía, densidad, distribución y gráficas**, con ruta de archivo afectada y a qué fase (B, C o D) pertenece cada una.
- **Capturas:** solo en Docker; se miran por píxeles (`style-diff`, Playwright) y se leen con `Read` únicamente las pocas que se citan en la auditoría, una a una y reducidas.

### Fase B — Tokens y acabado (skin v2)
Paleta, bordes, sombras **en capas**, radios **concéntricos** y micro-detalles, solo en v2. Aplica el checklist del Anexo A (`make-interfaces-feel-better`):
- Radios concéntricos (`radio exterior = radio interior + padding`) en tarjeta → ficha → control.
- Números tabulares (`font-variant-numeric: tabular-nums`) en cifras que cambian (ya hay base en v2; se completa y se verifica).
- `text-wrap: balance` en títulos y `text-wrap: pretty` en descripciones cortas (nunca en prosa larga, código ni `pre`).
- **Sin `transition: all`**: hoy hay ~119 usos entre `transition-all` y `transition: all` en `src`. **Solo se tocan los de v2**; los de v1 no se tocan. Mecanismo propuesto: en v2, una regla `html[data-ui="v2"] .transition-all { transition-property: <lista explícita>; }` o clases `transition-[…]` solo en componentes ya v2-específicos (D3). `style-diff` debe dar 0 en v1.
- Hit areas ≥ 44 px (continuación de `fix/touch-targets-v2`), sin solapes.
- Sombras en capas transparentes, bordes para separar y anillos de foco; contornos de imagen neutros; `-webkit-font-smoothing: antialiased` si no está.

### Fase C — Capa de gráficas «Forma»
Adoptar el **lenguaje visual** de bklit-ui (MIT; TypeScript, d3 + Motion, Tailwind 4) **sin instalar el paquete** y portar solo piezas con valor deportivo, en JSX sobre Tailwind 3.4 y las gráficas actuales:
- **Lenguaje:** degradado bajo el área, rejilla tenue con bordes desvanecidos, tooltip «de cristal» (superficie translúcida + borde + desenfoque), animación de entrada (respeta `prefers-reduced-motion`), tokens `--chart-*` (apoyados en los tokens actuales y en `chartTheme.js`) y estados de carga (esqueletos, equivalentes a `area-chart-loading.tsx`).
- **Piezas a portar** (referencia de lectura en `packages/ui/src/charts/` del repo clonado; no se copia código tal cual, se reescribe en JSX con atribución MIT donde se derive): sparkline, gauge, anillos, banda de rango/umbrales (`band*`), línea de proyección para forma/fitness, brush/zoom (`chart-brush*`) en el detalle y heatmap de contribuciones para el calendario.
- **Gráficas actuales afectadas:** `src/components/activity/detail/ActivityCharts.jsx`, `src/components/dashboard/EvolutionChart.jsx`, `src/components/fitness/*Card.jsx`, `src/components/health/HistoryTrendChart.jsx` (y `AppleRingGauge`, `ReadinessRings`).
- **Excepción documentada (no usar el paquete):** el código de bklit-ui está en TypeScript, usa d3 + Motion y **Tailwind 4**. Usarlo directamente exigiría migrar este proyecto de Tailwind 3.4 a 4 y de JSX a TS en las gráficas; es una decisión aparte, de alto riesgo para v1 congelada y **no recomendada ahora**. Si algún día se migra a Tailwind 4, esta spec se revisa.

### Fase D — Rediseño de pantallas (**BLOQUEADA** hasta tener referencias)
Empieza por el **Detalle de actividad** (la pantalla más rica y la que más gráficas usa). Está bloqueada hasta que el usuario aporte webs de referencia (ya dio awwwards `/websites/dashboard/` y bklit-ui; sigue aportando más). Se plantea con **puntos de aprobación**: por cada pantalla, (1) propuesta de dirección con 1–2 maquetas/capturas y referencias citadas, (2) **aprobación del usuario**, (3) implementación, (4) D7. Sin aprobación del punto (2) no hay código. Pantallas siguientes por orden propuesto en D7 de §10.

## 5. Requisitos funcionales
- [ ] **RF1** `auditoria.md` completo y priorizado (Fase A), aprobado por el usuario antes de abrir la Fase B.
- [ ] **RF2** Tokens v2 nuevos (paleta, borde, sombras en capas, radios concéntricos) definidos en `src/styles/tokens.css` bajo `html[data-ui="v2"]` y expuestos por `tailwindTokens.cjs`; ningún hex suelto.
- [ ] **RF3** Checklist del Anexo A aplicado en v2 y comprobable con un script/regla (p. ej. `grep` de `transition-all` solo permitido fuera de v2).
- [ ] **RF4** Capa `src/components/charts/` (nombre a confirmar en el plan) con las piezas de la Fase C, alimentada por `useChartTheme()`; ningún cambio de dependencias sin aprobación (D4).
- [ ] **RF5** Las gráficas de §4-C migradas a la capa en v2; en v1 se mantienen idénticas.
- [ ] **RF6** Fase D: cada pantalla rediseñada solo tras su punto de aprobación; paridad de funciones con v1 (`docs/branches/test/ui-safety-net/paridad.md`).
- [ ] **RF7** Accesibilidad no baja: contraste AA, `prefers-reduced-motion`, teclado/foco y alternativa textual del valor en gráficas (tooltip accesible o tabla oculta).

## 6. Criterios de aceptación
**Fase A**
- [ ] Todas las pantallas auditadas en móvil y escritorio; cada hallazgo con prioridad, esfuerzo, archivo y fase destino.
- [ ] Cero cambios en `src/`.
**Fase B**
- [ ] Sin regresiones inesperadas en v1 mientras siga activa (`style-diff` informativo, no bloqueante).
- [ ] 0 usos nuevos de `transition: all`; los de v2 sustituidos por propiedades explícitas.
- [ ] Radios concéntricos y cifras tabulares verificados en tarjetas, fichas y controles de v2.
- [ ] `lint:colors` no sube; `lint:ui` verde; hit areas ≥ 44 px en móvil v2 (`touch.spec.js` con `TOUCH_UI=v2`).
- [ ] D7: usuario aprueba las capturas v2 (claro/oscuro, móvil/escritorio) que cambian a propósito.
**Fase C**
- [ ] Cada pieza portada con test unitario (render, valores límite, sin datos) y estado de carga.
- [ ] Animación de entrada desactivable por `prefers-reduced-motion`; en E2E/capturas desactivada (fecha fija, datos simulados).
- [ ] Dependencias nuevas solo con medida y OK del usuario (D4/D9); peso del bundle de las pantallas con gráficas sin crecer más de lo acordado en el plan.
- [ ] D7 del usuario sobre cada gráfica nueva.
**Fase D** (por pantalla)
- [ ] Dirección aprobada antes del código; paridad v1/v2 intacta; capturas D7 aprobadas; verificación del carril correspondiente en verde.

## 7. Riesgos
| Riesgo | Mitigación |
|---|---|
| «Premium» subjetivo: retrabajo infinito | Auditoría priorizada (A), referencias explícitas, aprobación por punto y D7 |
| Estropear v1 mientras convive | Cambios tras `html[data-ui="v2"]`; `style-diff` informativo; v1 se retira en la Capa 6 |
| Capa de gráficas pesada (d3/Motion) | Evaluar con medida de bundle; OK del usuario si aporta valor claro; CSS cuando baste |
| Contraste y accesibilidad en degradados, cristal y rejilla tenue | Validar con la skill `dataviz` y `lint:colors`; AA obligatorio |
| Capturas frágiles por animaciones | Animaciones desactivadas en E2E; fecha fija y datos simulados |
| Licencias | bklit-ui MIT y `make-interfaces-feel-better` MIT: se cita la fuente; la skill **no se instala**, solo texto de referencia |
| Retraso de la Capa 6 y de iOS | Un PR por fase o menos; la fase D se pausa sin dejar nada a medias |
| Rebote con la pasada pendiente en iPhone real (Capa 5) | Sigue siendo del usuario y no bloquea la Fase A |

## 8. Verificación
- **Carril rápido** de `chore/verificacion-rapida` (PR #105, abierto al redactar esto) cuando esté mergeado: `npm run verify` (lint, `lint:ui`, `lint:colors`, vitest, build) en local; E2E completo y `style-diff` automático en CI, y pasada completa manual al cerrar la fase. **Si #105 aún no está mergeado:** flujo actual (lint, `lint:colors`, `lint:ui`, unit, integración, build, `style-diff` y capturas en Docker).
- Capturas solo en Docker (`npm run test:e2e:docker`, `:update` a propósito); nunca PNG en bloque (AGENTS §8.2).
- **Paso D7:** el usuario revisa las capturas v2 que cambian a propósito, una a una, en móvil y escritorio, claro y oscuro.

## 9. Diseño técnico (provisional, se concreta en cada rama)
- **Componentes afectados:** `src/components/ui/*`, `src/components/activity/detail/ActivityCharts.jsx`, `dashboard/EvolutionChart.jsx`, `fitness/*Card.jsx`, `health/*` (`HistoryTrendChart`, `AppleRingGauge`, `ReadinessRings`), calendario y actividades.
- **Estilos/tokens:** `src/styles/tokens.css`, `tailwindTokens.cjs`, `src/utils/chartTheme.js`, `useChartTheme()`.
- **Nuevo:** `src/components/charts/` (capa Forma) y `docs/branches/feat/premium-design/auditoria.md`.
- **Hooks, servicios, store, rutas, BD:** sin cambios.
- **Ramas propuestas:** `docs/premium-audit` (A), `feat/premium-tokens` (B), `feat/premium-charts` (C), `feat/premium-detail` y siguientes (D); todas desde `develop`.

## 10. Decisiones D1..D10 — **APROBADAS** (2026-11-19)
| # | Decisión | Recomendación |
|---|---|---|
| **D1** | Colocar la Fase Premium **antes** de la Capa 6 | **Sí:** v2 llega a todos ya pulida y se retoca una sola vez |
| **D2** | Fase A solo análisis, con entrega `auditoria.md` priorizada y aprobada antes de B | **Sí**; sin código ni PNG en bloque |
| **D3** | ~~v1 intacta~~ **(relajada)**: B se aplica en v2; `transition: all` se sustituye en v2; v1 no se protege (se retira en la Capa 6) | **Sí**; mecanismo: reglas bajo `html[data-ui="v2"]` o clases explícitas en componentes v2 |
| **D4** | Fase C: **adoptar el lenguaje visual** de bklit-ui y portar piezas propias en JSX sobre Recharts/SVG, **sin instalar** el paquete ni añadir d3/Motion | **Sí**; excepción: si una pieza (brush, proyección) lo exige, proponer d3 submódulos (`d3-scale`, `d3-shape`) por separado con medida de bundle |
| **D5** | **(relajada)** Tailwind 4 se evalúa con medida (coste/beneficio) y se pide OK si aporta valor claro | No migrar por defecto; reconsiderar tras la auditoría |
| **D6** | Orden de piezas de C: (1) tokens `--chart-*`, tooltip cristal, rejilla y degradado + `EvolutionChart`; (2) sparkline, gauge y anillos; (3) banda/umbrales y proyección (forma/fitness); (4) brush/zoom en detalle; (5) heatmap del calendario | **Ese orden**, ajustable tras la auditoría |
| **D7** | Fase D bloqueada hasta referencias; **primero el Detalle de actividad**, luego Dashboard → Rendimiento → Salud → Calendario → Actividades → Ajustes/Perfil; punto de aprobación por pantalla antes del código | **Sí**; el usuario sigue aportando webs |
| **D8** | Un PR por fase o menos: A=1, B=1, C=1 (partible en 2 solo si supera ~800 líneas), D=1 por pantalla | **Sí** |
| **D9** | **(relajada)** Dependencias: se evalúan con medida y se pide OK si aportan valor claro; respetar `prefers-reduced-motion` | **Sí** |
| **D10** | Verificación: carril rápido si #105 está mergeado, si no flujo actual; D7 del usuario en cada fase | **Sí**; AGENTS §8 se respeta |

## 11. Pruebas
- **Unitarias:** `src/__tests__/unit/` para cada pieza de gráficas (render, sin datos, carga) y utilidades de geometría.
- **Integración:** `src/__tests__/integration/` para pantallas migradas.
- **E2E:** `e2e/` con capturas v2 (animaciones desactivadas) y `touch.spec.js` (`TOUCH_UI=v2`); `style-diff` informativo.

## 12. Notas adicionales
- Esta rama (`docs/premium-spec`) **solo** documenta: spec, plan, roadmap, `MEMORY.md` y `CHANGELOG.md`. No hay `tasks.md` hasta la aprobación del usuario (AGENTS §2).
- Referencia local del repo clonado (solo lectura): `scratchpad/ref/bklit-ui` (si no existe, se vuelve a clonar). Atribución MIT al portar.

---

## Anexo A — Checklist de referencia: `make-interfaces-feel-better`
Fuente: repo `affaan-m/ecc`, `skills/make-interfaces-feel-better/SKILL.md` (licencia MIT; origen comunidad, PR #1659 de `linus707`). **Solo texto de referencia, no se instala como skill.** Resumen fiel en español:

**Principios**
1. **Radio concéntrico:** en superficies redondeadas anidadas, `radio exterior = radio interior + padding`. Con padding grande, tratarlas como superficies separadas; busca coherencia óptica, no fórmula.
2. **Alineación óptica:** el centrado geométrico no siempre es visual (iconos, triángulos de play, flechas, estrellas); corregir el SVG o con un desplazamiento de píxel.
3. **Sombras y bordes:** bordes para separar y para anillos de foco; sombras **en capas**, transparentes y sutiles, para dar profundidad a tarjetas, botones, menús y popovers.
4. **Ajuste de texto:** `text-wrap: balance` en títulos y textos cortos; `text-wrap: pretty` en cuerpo corto/medio, pies y listas; ninguno en prosa larga, código ni preformateado. `font-variant-numeric: tabular-nums` en contadores, temporizadores, precios, tablas y números que se actualizan.
5. **Suavizado de fuente (macOS):** `-webkit-font-smoothing: antialiased` y `-moz-osx-font-smoothing: grayscale` en la raíz si no existe.
6. **Contorno de imágenes:** contorno interior sutil neutro (negro o blanco con alfa ≈ 10 %, `outline-offset: -1px`), nunca teñido con la marca.
7. **Movimiento:** transiciones CSS para cambios interactivos (se pueden reorientar); keyframes solo para entradas puntuales o secuencias de carga. Entrada: opacidad + pequeño `translateY` (y opcionalmente desenfoque). Salida: más corta y discreta, ≈ 150 ms. Pulsación: `scale(0.96)` con forma de desactivarlo. Cambio de iconos: fundido con opacidad, escala y desenfoque.
8. **Alcance de las transiciones:** **nunca `transition: all`**; listar propiedades (`transition-property: transform, background-color, box-shadow`) con duración y easing. `will-change` solo para tirones en el primer fotograma y solo en `transform`, `opacity`, `filter`; nunca `will-change: all`.
9. **Áreas táctiles:** ≥ 40×40 px, idealmente 44×44; ampliar con pseudoelemento si el icono es menor, sin solapes.

**Checklist de revisión**
- [ ] Elementos redondeados anidados ópticamente coherentes.
- [ ] Iconos centrados visualmente.
- [ ] Bordes o sombras usados por la razón correcta.
- [ ] Títulos y textos cortos sin cortes feos.
- [ ] Números dinámicos con cifras tabulares.
- [ ] Imágenes con contorno neutro donde haga falta.
- [ ] Entradas y salidas separadas, sutiles e interrumpibles.
- [ ] Botones con estado activo táctil sin exagerar.
- [ ] Sin `transition: all` ni `will-change: all`.
- [ ] Controles pequeños con área táctil usable.

**Formato de salida de revisión:** tabla `Principio | Antes | Después` con ruta de archivo y propiedad; omitir los principios revisados que no cambian.

---
Versión: 0.2.0 — 2026-11-19 (D1–D10 aprobadas, alcance ampliado)
