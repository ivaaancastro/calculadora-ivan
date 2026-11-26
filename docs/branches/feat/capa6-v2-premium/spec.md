# Especificación SDD: Capa 6, v2 por defecto, CI rápido y acabado premium

## 1. Identificación
- **ID:** `spec-capa6-v2-premium`
- **Título:** Activar v2 para todos, retirar v1, aligerar el CI, limpiar el repositorio y dejar v2 al nivel premium, cómoda de usar y sin bugs.
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-24
- **Estado:** implementada (2026-11-26; PR #140–#163). Aprobada por el usuario el 2026-11-24 (versión 0.3).
- **Sustituye a:** `spec-auditoria-rediseno-01`. Esta spec es la Capa 6 del `plan.md` de `webapp-redesign`.

## 2. Objetivo
Una sola interfaz, la v2, por defecto y sin código v1. Debe ser **cómoda de ver y de usar, como Strava**, con colores más modernos y vivos, sin datos repetidos en una misma pantalla, con cada control junto a lo que cambia y sin bugs conocidos (incluido el mapa del detalle).

El repositorio queda sin ficheros que no se usan, y el CI de cada PR tarda **menos de 5 minutos**.

## 3. Contexto y justificación

### 3.1 Decisiones y feedback del usuario (2026-11-24)
1. Eliminar v1 y dejar v2 por defecto (cierra D12; la regla «v1 congelada» deja de aplicar).
2. Acabar con el CI lento y con las comparaciones entre versiones.
3. El **CTL es el protagonista**, lo primero que se ve.
4. **No repetir el mismo dato en una pantalla.** Por ejemplo, la recuperación aparece varias veces en Salud.
5. **Colores más modernos y llamativos**, tomando referencias de otras webs.
6. **El mapa no se ve** en el detalle de una actividad.
7. **Espacios mejor repartidos**, que sea cómodo de usar como Strava.
8. **Borrar todo lo que no se usa.**
9. El E2E, más limpio.
10. **Cada control junto a lo que cambia.** El selector de rango del Dashboard tiene que ir con la gráfica.

### 3.2 Hallazgos
- **El CI es el cuello de botella.** Cada PR tarda entre 20 y 30 minutos, y el push a `develop` repite el proceso otros ~22. El E2E solo se lleva ~20 minutos, y el volcado de estilos 9,5 más. 37 de los últimos 100 runs fallaron.
- **El mapa (causa confirmada con el arnés E2E):**
  1. `useActivitiesQuery.ts:18` (`LIGHT_COLS`) **no pide `map_polyline`**, así que el mapa depende solo de los streams.
  2. Los streams solo se cargan en segundo plano para los últimos 95 días.
  3. `useActivityStreams.js` guarda el `id` en la primera pasada y **no vuelve a leer** los streams cuando llegan después.

  Resultado: el detalle se queda sin mapa (y sin gráficas) en las actividades de más de 95 días y cuando se entra antes de que terminen de cargar. Con los streams cargados, el mapa sí se pinta (1406 × 698 px en la pestaña Mapa).
- **El selector de rango no está con lo que cambia.** `timeRange` solo afecta a la gráfica de evolución y a los totales del periodo (`usePMCMetrics.js:51-85`). CTL, ATL, TSB y los KPI son valores de hoy. Aun así, en escritorio el selector está en el héroe, junto al CTL, y parece que lo cambia.
- **Datos repetidos en la misma pantalla:**

  | Pantalla | Dato repetido | Dónde |
  |---|---|---|
  | Dashboard | CTL, ATL y TSB | héroe, KPI y el readout del gráfico (que además da otros valores: BUG-1) |
  | Salud | Recuperación 80 % | cifra del héroe, anillo y banco de energía (80 % «disponible») |
  | Salud | Sueño | anillo «79 % · 7 h» y biomarcador «Sueño 7 h · Score 79 %» |
  | Rendimiento | Carga 7 d y TSB | héroe y tarjeta «Estado de entreno» |
  | Rendimiento | VFC 64 | héroe y tarjeta «Estado de VFC» |
  | Rendimiento | VO₂max 65,2 | cifra grande y subtarjeta «VO₂ carrera 65,2» en la misma tarjeta |
  | Detalle | «Mantenimiento» | chip de impacto y primera frase del Coach |
  | Actividades | 85 actividades | resumen «85 sesiones» y cabecera «85 actividades» |
- **Ficheros que no se usan** (grafo de imports desde `main.jsx`, más una revisión de la raíz):
  - **En `src/`:**
    - `App.css` (vacío) y `assets/react.svg`;
    - `dashboard/ChartsSection.jsx`, `dashboard/FuelingPanel.jsx` y `hooks/usePlanner.js`;
    - `services/ai.ts` y `utils/parser.ts` (solo los usan sus tests).
  - **En la raíz:** `AGENTS` y `MEMORY` (duplicados desfasados), `CHANGELOG.md-e` (copia de seguridad de `sed`) y `AUDIT_REPORT.md` (auditoría antigua).
  - **En `public/`:** `apple-touch-icon-precomposed.png`, idéntico a `apple-touch-icon.png`.
  - **En `scripts/`:** los 9 codemods de la Capa 1, que ya se aplicaron, y los scripts de comparación visual.
  - **En `e2e/`:** las capturas (16 MB) y los specs visuales.
  - **En `docs/branches/`:** 52 carpetas de ramas ya cerradas (2,3 MB en total en `docs/`).
  - **Después de retirar v1:** los componentes solo-v1 y unos 10 tests.
- **Diagnóstico de diseño** (capturas v2, landing en vivo y awwwards: dashboards, *data visualization* y deportes):
  - **Lo que v2 ya hace bien:** frase narrativa, cifra protagonista, gráficas con rejilla tenue y modo oscuro.
  - **Lo que suena a «SaaS genérico»:**
    - tarjetas blancas iguales, a veces anidadas;
    - mayúsculas espaciadas por todas partes y cifras coloreadas sin significado;
    - Rendimiento mide unos 5.000 px;
    - zonas vacías (columna derecha del Dashboard, cabecera del detalle) y ceros falsos;
    - KPI apretados en móvil.
  - **Lo que hacen las referencias:**
    - **FieldRank:** monoespaciada para datos, tablas con filetes y color con significado.
    - **Strava:** el mapa protagonista en el detalle, cifras grandes en rejilla y listas cómodas.
    - **Whoop, Oura y Apple Fitness:** colores saturados sobre fondos profundos, un color por métrica y anillos vivos.

## 4. Requisitos funcionales

### A. CI rápido y E2E limpio (va primero)
- [x] **RF-A1.** Un solo workflow con `concurrency` y `cancel-in-progress`, con dos jobs en paralelo:
  - `check`: `npm ci` con caché, lint, `lint:colors`, `lint:ui`, vitest y build.
  - `e2e`: Chromium en escritorio, 4 workers, `retries: 1`, sin capturas.

  Objetivo: **menos de 5 minutos** por PR.
- [x] **RF-A2.** Se borran:
  - los jobs `changes`, `style-*` y `validate-specs`;
  - `update-snapshots.yml`;
  - los specs `visual`, `visual-v2`, `access-visual-v2`, `ui-mode` y `tools/style-dump`, junto con `e2e/__screenshots__`;
  - `e2e/support/visual.js`;
  - los scripts de comparación y de Docker (`ci-style-dump.sh`, `style-diff.mjs`, `fetch-style-baseline.sh`, `verify-layer.sh`, `changed-lane.mjs`, `e2e-docker.sh` y `heavy-lock.sh`).
- [x] **RF-A3.** El E2E queda en specs funcionales con una sola responsabilidad: acceso, Dashboard, Actividades, detalle (volver, por deporte, borrar y **mapa visible**), Strava, exportar, cuenta y modal.
  - `layout` pasa a ser una prueba de DOM a 390 y 1440 px: barras fijas, desbordamiento, solapes entre bloques y objetivos táctiles de al menos 44 px.
  - `shell`, `touch`, `gestures` y `tooltip-touch` se funden en `layout` o en `mobile`.
  - Sin `waitForTimeout`; las esperas son por estado.
- [x] **RF-A4.** Se reescriben para el flujo nuevo `AGENTS.md` (§8 y §8 bis, más las referencias a OpenCode según D11) y `MEMORY.md` §2. El flujo queda así: `npm run verify` en local, el CI rápido y la revisión visual del agente en el navegador integrado.

### B. Retirar v1
- [x] **RF-B1.** v2 siempre activa. Desaparecen el interruptor «Vista previa v2», `useUiMode`, `VITE_UI` y el script de `index.html`.
- [x] **RF-B2.** Se eliminan las 84 ramas `isV2` (24 ficheros) y los componentes solo-v1. Los `*V2.jsx` pierden el sufijo.
- [x] **RF-B3.** La piel se aplana:
  - sin prefijo `data-ui` y sin redefinir utilidades de Tailwind;
  - escala `fontSize` con un mínimo de 11 px, más `borderRadius`, `boxShadow` y curvas definidos en el tema;
  - `skin-v2.css` por debajo de 300 líneas.
- [x] **RF-B4.** Los pares `dark:` manuales pasan a tokens.

### C. Bugs, seguridad y calidad (IDs en `auditoria.md`)
- [x] **RF-C0 (BUG-13, mapa). Prioridad alta.**
  - `map_polyline` entra en `LIGHT_COLS`.
  - `useActivityStreams` vuelve a evaluar cuando cambian los `streams_data` de la actividad (sin la guarda por `id`).
  - Si faltan streams, el detalle pide **solo los de esa actividad** a Supabase antes de recurrir a Strava.
  - Lo cubre un E2E: mapa visible al entrar por URL directa y en una actividad de hace más de 95 días.
- [x] **RF-C1 (SEG-1).** Edge Function `strava-token`. `VITE_STRAVA_CLIENT_SECRET` desaparece del código y del bundle, y el usuario rota el secreto.
- [x] **RF-C2.** Se corrigen BUG-1 a BUG-12 (tabla en `auditoria.md`). Entre otros:
  - una única fuente de estado de forma (`utils/formState.js`);
  - fechas en hora local (`utils/dates.js`);
  - «sesiones» y la comparación con los mismos días del mes anterior;
  - `toast.error`;
  - historial en O(n).
- [x] **RF-C3.**
  - **COP-1:** `formatNumber` en es-ES y un nombre único por métrica: Fitness (CTL), Fatiga (ATL), Forma (TSB), Rampa, y el deporte en español.
  - **COP-2:** el origen de cada VO₂max.
- [x] **RF-C4. Accesibilidad.**
  - Ningún texto por debajo de 11 px, con `lint:type`.
  - `InfoTooltip` como botón.
  - Foco visible en los campos.
  - `aria-label` en los botones de solo icono y filas utilizables con teclado.
  - Resumen textual en las gráficas.
- [x] **RF-C5. Rendimiento del detalle.** Cursor gestionado con rAF, gráficas memoizadas y `SyncedAreaTrack`.
- [x] **RF-C6. Duplicación de código.**
  - `formatDuration(seconds)` y `formatMinutes(minutes)`.
  - Una sola clasificación de deporte con su icono.
  - Primitivas `Hero` y `Stat`.
  - `EmptyState` con `tone`.
  - `useCountUp` y `heatmapGrid` pasan a `hooks` y `utils`.
  - Los botones y tarjetas hechos a mano pasan a `Button` y `Card`.

### D. Diseño: coherencia, comodidad y color
- [x] **RF-D1. Un dato, un sitio.** En cada pantalla, cada métrica aparece **una sola vez**, en el sitio donde mejor se entiende. Se aplica la tabla del §3.2:
  - **Dashboard:** el readout del gráfico solo aparece al pasar el cursor o tocar, y muestra el punto señalado, nunca los valores de hoy.
  - **Salud:** la recuperación queda solo como cifra protagonista del héroe. Los anillos se quedan en Carga y Sueño, sin un anillo de Recuperación. El banco de energía pasa a ser su barra de contexto, sin repetir la cifra.
  - **Rendimiento:** el héroe absorbe «Estado de entreno» y «Estado de VFC».
  - **Detalle:** el chip de impacto no se repite en el Coach.
  - **Actividades:** una sola cifra de actividades.

  Lo comprueba un test: un helper de E2E cuenta las cifras con `data-metric` por pantalla y falla si alguna aparece duplicada.
- [x] **RF-D2. El CTL, protagonista.** En el Dashboard, lo primero que se ve, en móvil y en escritorio, es **Fitness (CTL)**: la cifra grande, su variación y el chip de estado de forma. La frase narrativa va debajo, como contexto.
- [x] **RF-D3. Cada control junto a lo que cambia.**
  - El selector 7D · 30D · 3M · Todo va **en la cabecera de la tarjeta de la gráfica de evolución**, igual en móvil y en escritorio.
  - Los totales del periodo (volumen y sesiones) se muestran en esa misma tarjeta, al pie de la gráfica.
  - Se aplica la misma regla a todos los selectores de la app (Salud Hoy/Historial, Rendimiento 7D/30D/90D, Carrera/Bici, zoom del detalle). Cada uno se revisa y se coloca en la cabecera del bloque que controla.
- [x] **RF-D4. Paleta nueva, más moderna y viva.**
  - Se proponen **dos o tres direcciones**, inspiradas en Strava, Whoop, Oura, Apple Fitness y FieldRank. Por ejemplo:
    - **Neón sobre profundo:** CTL azul eléctrico, ATL coral o fucsia, TSB lima o ámbar.
    - **Cálido editorial:** fondo cálido, acentos saturados y un color de marca intenso.
  - Se presentan como **capturas reales de Dashboard, Detalle y Salud**, en claro y oscuro, antes de tocar el código.
  - El usuario elige una, y entonces se aplica a los tokens.
  - Contraste AA verificado con `check-palette.mjs`, y un color por métrica mantenido en toda la app.
- [x] **RF-D5. Comodidad tipo Strava.** Las reglas se escriben en `docs/design/forma.md` y se aplican a todas las pantallas:
  - **Escala de espaciado** de 4 y 8 px:
    - separación entre secciones: 32 px en móvil y 48 px en escritorio;
    - padding de tarjeta: 16 px en móvil y 24 px en escritorio;
    - márgenes laterales: 16 px en móvil.
  - **Ancho máximo** de contenido de 1200 px centrado en escritorio; una columna en móvil.
  - **Jerarquía por pantalla:** pregunta principal, después métricas clave, después detalle plegable. Nada de huecos vacíos.
  - **Detalle como Strava:**
    - en escritorio, el mapa grande arriba a la izquierda y las cifras clave a la derecha;
    - en móvil, primero el mapa y después la rejilla de cifras;
    - una sola barra con volver, pestañas y borrar.
  - **Listas cómodas:** filas de al menos 56 px, la acción destructiva en un menú, y cifras alineadas a la derecha en tabular.
  - **Tipografía:** Inter para la interfaz y una monoespaciada para metadatos y cifras secundarias (D8). Mayúsculas espaciadas solo en eyebrows. Color solo con significado. Una receta de tarjeta, nunca anidada.
  - **Movimiento:** transiciones concretas (sin `transition-all`) y pulsación con escala 0,98.
- [x] **RF-D6. Estados.** Nada de «0», «0.00» ni «--» cuando falta el dato; se muestra `EmptyState` con una acción. Todas las pantallas tienen esqueleto de carga.
- [x] **RF-D7. Rendimiento.** Resumen fijo arriba y pestañas Carga · Potencia · Carrera · Volumen (D9). La página mide menos de la mitad que hoy.
- [x] **RF-D8. Resto de pantallas.**
  - Calendario: semana más ligera, «Sin plan» y heatmap visible.
  - Actividades: la papelera pasa a un menú.
  - Ajustes: una receta de sección.
  - Cabecera: el CTA de Strava solo aparece si no hay conexión.

### E. Limpieza del repositorio
- [x] **RF-E1.** Se borra todo lo listado en §3.2 «Ficheros que no se usan»:
  - incluidos `services/ai.ts` y `utils/parser.ts`, con sus tests (D4);
  - los codemods ya aplicados;
  - el icono duplicado, que también se quita de `index.html` y `vite.config.js`.
- [x] ~~**RF-E2.**~~ Anulado por el usuario (D12 revisada: `docs/branches/` se queda). `docs/branches/` conserva solo las ramas abiertas y esta. Lo demás se borra; queda en el historial de git, y `CHANGELOG.md` mantiene el resumen (D12).
- [x] **RF-E3.** Después de cada bloque se vuelve a pasar el grafo de imports: **0 ficheros huérfanos** en `src/`. Se añade como `npm run lint:orphans`, que tarda menos de un segundo.

## 5. Criterios de aceptación
- [x] El CI de PR tarda menos de 5 minutos (mediana de 3 PR).
- [x] La app arranca en v2 sin `localStorage`. `grep -r "isV2\|useUiMode\|data-ui" src` no devuelve nada.
- [x] El mapa se ve en el detalle al entrar por URL, desde la lista y en actividades de más de 95 días, comprobado por E2E y en vivo con datos reales.
- [x] Ninguna pantalla repite una métrica, comprobado por el helper `data-metric`. Al cargar el Dashboard, lo primero que se ve es el CTL. El selector de rango está en la tarjeta de la gráfica.
- [x] El usuario elige la paleta, se aplica y supera el contraste AA.
- [x] `grep -r CLIENT_SECRET src dist` no devuelve nada. `lint:orphans` da 0.
- [x] `lint`, `lint:colors`, `lint:ui`, `lint:type`, vitest, build y el E2E funcional pasan en verde.
- [x] Cada PR de diseño adjunta capturas antes y después a 390 y 1440 px, en claro y oscuro (enlazadas en cada PR: #155, #158–#162). El usuario aprobó las pantallas el 2026-11-26.

## 6. Diseño técnico
- **CI y herramientas:**
  - `.github/workflows/ci.yml`;
  - `playwright.config.js` (un proyecto de escritorio más uno móvil para `layout` y `mobile`);
  - `scripts/` (se borran 16 y se añaden `check-type.mjs` y `check-orphans.mjs`);
  - `package.json`, `AGENTS.md` y `MEMORY.md`.
- **Datos:** `hooks/queries/useActivitiesQuery.ts` (`map_polyline`, y streams bajo demanda por id) y `activity/detail/useActivityStreams.js`.
- **Piel, tema y paleta:** `index.html`, `skin-v2.css` (aplanado), `tokens.css` y `tokens/*.json` (paleta nueva), `tailwind.config.js` (fuentes, tamaños, radios y sombras) y `chartTheme.js`.
- **Componentes:**
  - las 24 ramas `isV2`;
  - las primitivas de `ui/`;
  - `charts/` (`axisProps`);
  - `dashboard/` (`FormHero`, `EvolutionChart` con el selector en su cabecera, `KpiCard`);
  - `health/` (héroe, anillos y banco de energía sin repetir);
  - `fitness/` (pestañas);
  - `activity/detail/` (disposición tipo Strava).
- **Utils:** nuevos `formState`, `dates` y `formatNumber`; se unifica `formatDuration`/`formatMinutes`.
- **Supabase:** `supabase/functions/strava-token`.
- **Store y rutas:** sin cambios.

## 7. Pruebas
- **Unitarias e integración:** las existentes, actualizadas, más tests de cada bug, de `formState`, `dates`, `formatNumber`, `formatDuration`, `InfoTooltip`, `useActivityStreams` (streams que llegan tarde) y la Edge Function.
- **E2E:** los funcionales (incluido el mapa), `layout`/`mobile` en DOM y el helper de métricas no repetidas.
- **Visual:** el agente revisa en el navegador integrado con datos reales (sesión del usuario) y con el arnés simulado.

## 8. Decisiones para el usuario (recomendación en negrita)

| ID | Decisión | Recomendación |
|---|---|---|
| D1 | Secreto de Strava | **Edge Function, y tú rotas el secreto** |
| D2 | Variación mensual de TSS | **Mismos días del mes anterior** |
| D3 | Umbrales de TSB | **Los de `formSummary`** |
| D4 | `ai.ts` y `parser.ts` (sin uso) | **Borrarlos** (quedan en el historial de git) |
| D5 | Lint de props duplicadas | **Comprobación propia en `check-ui`** |
| D6 | Precache de la PWA | **Excluir recharts y leaflet** |
| D7 | E2E en CI | **Solo funcional y DOM, sin capturas** |
| D8 | Monoespaciada para datos | **JetBrains Mono, solo 400 y 500** |
| D9 | Rendimiento | **Pestañas** con el resumen fijo arriba |
| D10 | Paleta | Elegida la **A · Neón profundo** |
| D11 | `.opencode/` y `skills/README.md` (configuración de OpenCode) | **Se quedan** (el usuario usa OpenCode) |
| D12 | `docs/branches/` de ramas cerradas | **Se quedan** en el repositorio, visibles en GitHub (decisión del usuario) |

## 9. Fuera de alcance
- La app iOS (Capa 7).
- Merge a `main` y despliegue.
- Garmin y los límites de Strava.

---
Versión: 0.3.0 — 2026-11-24
