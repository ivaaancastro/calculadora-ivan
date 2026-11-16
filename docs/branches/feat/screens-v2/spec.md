# Especificación SDD — rama `feat/screens-v2` (Capa 5: pantallas)

## 1. Identificación
- **ID:** `spec-rediseno-02-c5`
- **Título:** Llevar las pantallas de la app autenticada a v2, de menor a mayor riesgo, con v1 congelada
- **Fecha:** 2026-11-16
- **Estado:** borrador, **pendiente de aprobación del usuario** (no existe `tasks.md` ni se toca código).
- **Roadmap:** `docs/branches/feat/webapp-redesign/plan.md`, Capa 5.
- **Base:** `origin/develop` en `1616ab3` (incluye #82, cierre de la Capa 4).
- **Precedentes:** `ui-shell/` (estructura y mecanismo), `ui-skin-v2*/` (piel «Panel», D7, D9–D11), `landing-v2/` (Capa 4), `test/ui-safety-net/paridad.md` (lista de paridad por pantalla).

## 2. Objetivo
Que **cada pantalla de la app autenticada funcione y se vea bien en v2** (primero 390 px, luego pantallas grandes), con lo que se ve «en el primer vistazo» definido, con su lista de paridad completa y probada en un iPhone real. Se entrega **una a una**, siempre opt-in (`data-ui="v2"`); la v1 no cambia. **Activar v2 por defecto NO es esta capa: es la Capa 6 (D12).**

## 3. Contexto: dónde estamos de verdad
La piel «Panel» (Capa 3) ya llega a **todas** las pantallas: `data-skin` existe en la raíz de las 7 (`dashboard`, `calendar`, `stats`, `history`, `detail`, `health`, `profile`), los tokens y `chartTheme.v2` cubren sus gráficas y v2 tiene capturas propias (8 pantallas × 2 temas × 3 tamaños). Por tanto la Capa 5 **no es repintar**; lo que falta es:

1. **Shell y lienzo en v1 bajo v2** (D11): `Navbar`, `BottomNav` y el fondo siguen v1 aunque la pantalla sea v2. Conviven dos lenguajes en la misma vista.
2. **Estructura:** cuatro archivos gigantes (`CalendarPage` 2.348 líneas, `ProfilePage` 1.048, `ActivityDetailPage` 1.017, `HealthPage` 964) mezclan datos, lógica y presentación; no se puede diseñar «primer vistazo móvil» sin trocearlos.
3. **Jerarquía móvil:** la piel cambió tipografía, radios y color, no qué se muestra primero ni qué se pliega. El roadmap exige definirlo por pantalla.
4. **Rutas y pager:** `TAB_PATHS` duplicado en `Dashboard.jsx` y vistas de escritorio/móvil separadas (`DesktopRoutesView`, `MobileTabsView`, `MobileSwipePager`); la extensión de la piel dejó anotada su unificación para esta capa.
5. **Modales y flujos secundarios** (`AddActivityModal`, `WorkoutViewerModal` dentro del Calendario, `PmcFloatingChart`, `FuelingPanel`) no están auditados bajo v2.
6. **Paridad e iPhone real:** el criterio de «hecho» del roadmap (lista de paridad completa + prueba en iPhone) aún no se ha aplicado a ninguna pantalla.

## 4. Inventario de pantallas (estado en v2 a 2026-11-16)

| # | Pantalla (ruta) | Archivos principales | Líneas | Piel v2 | Gráficas v2 | Estructura | Pendiente en Capa 5 |
|---|---|---|---|---|---|---|---|
| 0 | **Shell** (todas) | `dashboard/Navbar` 236, `layout/BottomNav` 95, `MobileSwipePager` 205, fondo en `Dashboard` | ~540 | **No** (v1, D11) | — | Aceptable | Piel v2 de barras y lienzo; `--nav-h` intacto |
| 1 | **Ajustes** (`/profile`) | `pages/ProfilePage` | 1.048 | Sí | — | **Monolito** | Trocear por secciones; jerarquía móvil; conmutador v2 (D8) |
| 2 | **Actividades** (`/history`) | `dashboard/HistoryList` 255, `modals/AddActivityModal` | ~255 | Sí | — | Buena | Lista móvil, filtros, modal de alta bajo v2 |
| 3 | **Dashboard** (`/`) | `Dashboard` 254, `dashboard/AdvancedAnalytics` 227, `EvolutionChart` 249, `ChartsSection`, `FuelingPanel` 304 | ~1.100 | Sí | Sí | Ya dividida (SRP) | Primer vistazo móvil: forma + 3–4 métricas + gráfica principal, resto desplegable |
| 4 | **Rendimiento** (`/stats`) | `pages/FitnessStatsPage` 206 + 10 tarjetas en `fitness/` (~900) | ~1.100 | Sí | Sí | Buena | Tarjetas pequeñas, orden y densidad móvil |
| 5 | **Salud** (`/health`) | `pages/HealthPage` | 964 | Sí | Sí | **Monolito** | Trocear; primer vistazo (HRV/sueño/recuperación) |
| 6 | **Detalle** (`/activity/:id`) | `pages/ActivityDetailPage` 1.017, `activity/ActivityMap` 130, `ActivitySubRoutes` | ~1.250 | Sí | Sí + mapa | **Monolito** | Trocear; mapa y gráficas en móvil; Detalle mide 34 px más alto en móvil |
| 7 | **Calendario** (`/calendar`) | `pages/CalendarPage` | 2.348 | Sí | PMC flotante | **Monolito crítico** | Dividir **antes** de tocar nada; vista móvil, `WorkoutViewerModal`, gestos |
| — | Landing, acceso, `EmailConfirmedPage` | — | — | Capa 4 | — | — | **Fuera de alcance** (hecha) |
| — | `StravaCallback`, `LoadingState`, `ErrorBoundary` | — | — | — | — | — | Revisar estados de carga/error bajo v2 en cada PR |

Fuente de verdad de acciones por pantalla: `docs/branches/test/ui-safety-net/paridad.md` (secciones Navbar, BottomNav, Dashboard, Rendimiento, Calendario, Actividades, Detalle, Salud, Ajustes).

## 5. Requisitos funcionales

- **RF1. v1 congelada.** En cada PR, `node scripts/style-diff.mjs <develop> <rama>` da **0 diferencias** y las 48 capturas de v1 no cambian. Toda regla visual nueva va detrás de `html[data-ui="v2"]` (hoja `skin-v2.css` / bloques `@tokens:skin-v2`).
- **RF2. Estructura sin cambio de comportamiento.** Los trozos de archivos gigantes (Ajustes, Salud, Detalle, Calendario) se separan en un PR `refactor` propio, **sin cambio visual en v1 ni en v2** (volcado = 0 y capturas v2 idénticas), antes de su PR visual.
- **RF3. Primer vistazo móvil por pantalla.** Cada pantalla define, en 390 px, qué se ve sin hacer scroll ni desplegar y qué va plegado; queda escrito en la sección de la pantalla del `tasks.md` y se valida con las capturas móviles.
- **RF4. Shell y lienzo v2 (D13).** `Navbar`, `BottomNav` y el fondo adoptan «Panel» bajo v2. `--nav-h` (60 px), `--nav-h-total`, `z-*` tokenizados, objetivos táctiles de 44 px y las acciones de la paridad no cambian.
- **RF5. Primitivas.** Se usan solo las 14 de `src/components/ui/` (`lint:ui`); una primitiva nueva solo si ≥2 pantallas la necesitan y con todos sus usos migrados en el mismo PR.
- **RF6. Colores.** Solo tokens; `chartTheme.js`/`useChartTheme()` para gráficas; `lint:colors` **no sube** (se aprovecha para bajarlo en lo que se toque, sin objetivo numérico). `check-palette.mjs` en verde si hay tokens nuevos.
- **RF7. Paridad.** Cada PR visual marca en `paridad.md` las acciones de su pantalla comprobadas en v2 (E2E donde ya hay prueba, manual documentado donde no). Ninguna acción desaparece; los cambios de ubicación se anotan.
- **RF8. Móvil y táctil.** Objetivos ≥ 44 px, sin solape de barras, gestos de deslizamiento sin pelearse con gráficas ni filtros horizontales (red de Capa 0 en verde para v2 también).
- **RF9. Sin lógica de negocio.** No se tocan `src/services`, `src/store`, `src/utils` ni `src/supabase.js` salvo extraer hooks de presentación sin cambiar su contrato.
- **RF10. iPhone real.** Cada pantalla pasa una comprobación en iPhone real (o, si no se dispone, en el simulador de iOS) antes de darse por cerrada; la prueba la hace el usuario o se le pide con una lista corta (D16).
- **RF11. v2 sigue opt-in.** No se cambia el valor por defecto (`VITE_UI`, `localStorage`, Ajustes). Eso es la Capa 6.

## 6. Criterios de aceptación (por PR y de la capa)
- [ ] `lint`, `lint:colors` (sin subir), `lint:ui` (14), `check-palette` si aplica, unit, integración, `build`: en verde, salida filtrada.
- [ ] E2E macOS y Docker con 0 ✘; capturas solo en Docker.
- [ ] Volcado `develop` vs rama = 0 diferencias en v1; capturas v1 idénticas.
- [ ] PR visual: solo cambian las capturas v2 de **su** pantalla, listadas una a una; el usuario las aprueba (D7) antes de seguir.
- [ ] PR `refactor`: capturas v1 **y** v2 idénticas.
- [ ] Capa: las 7 pantallas + shell cumplen RF1–RF8, paridad completa y prueba en iPhone; roadmap, `MEMORY.md` y `CHANGELOG.md` actualizados; v2 sigue sin ser el valor por defecto.

## 7. Decisiones que necesitan tu aprobación

- **D8. Dónde vive el conmutador de v2.** *Nota: `ui-shell/spec.md` y `ui-skin-v2/spec.md` la dan por resuelta e implementada en #73 (fila «Vista previa v2» en Ajustes → General), pero `MEMORY.md` la lista abierta; la dejo formalmente cerrada o reabierta con tu respuesta.* Opciones:
  - **A.** Dejarlo como está hasta la Capa 6: fila `role="switch"` en Ajustes → General, visible para todos, más `VITE_UI` y `localStorage`. Sin trabajo extra.
  - **B.** Solo entorno y `localStorage` (sin interruptor visible): se pierde la prueba por parte de quien no despliega.
  - **C.** Interruptor visible solo con un flag (p. ej. `VITE_UI_SWITCH`) o para ti/rol de prueba: menos exposición, más código y estado a limpiar luego.
  - **Recomendación: A durante toda la Capa 5** (la prueba en iPhone real y la revisión necesitan el interruptor a mano y ya cuesta cero) y **decidir su destino en la Capa 6** (propuesta: al activar v2 por defecto, pasa a «Volver a la vista clásica» durante el periodo acordado y se retira con v1).
- **D13. Shell y lienzo en v2 dentro de la Capa 5.** Hoy se dejaron en v1 (D11). *Recomendación: sí, como PR 1,* porque afecta a todas las capturas y diseñar el primer vistazo móvil con barras v1 da una imagen falsa. Alternativa: dejarlos para la Capa 6 (riesgo: la Capa 6 se vuelve visual y grande).
- **D14. Refactor y visual separados en los 4 monolitos.** *Recomendación: sí* (PR `refactor` sin cambio visible, luego PR visual). Alternativa: un solo PR por pantalla (menos PRs, pero imposible revisar capturas distinguiendo un fallo de estructura de uno de diseño).
- **D15. Orden.** *Recomendación:* Shell → Ajustes → Actividades → Dashboard → Rendimiento → Salud → Detalle → Calendario → cierre (orden del roadmap, con el shell primero). Alternativa: Dashboard antes que Ajustes (es la más vista), a costa de validar las primitivas con la pantalla de más riesgo.
- **D16. Prueba en iPhone real.** *Recomendación:* una pasada por parada de aprobación con una lista de comprobación de 5–8 puntos que te preparo en cada PR (tú la ejecutas, no bloquea el merge de los intermedios) y una pasada completa en el cierre. Alternativa: solo al final.
- **D17. Unificar `TAB_PATHS` y las vistas de escritorio/móvil.** *Recomendación:* sí, dentro del PR del Dashboard como commit aparte sin cambio visible. Alternativa: aplazar a la Capa 6 (la unificación toca el pager que usan todas las pestañas).

## 8. Riesgos
| Riesgo | Mitigación |
|---|---|
| Calendario (2.348 líneas): trocear rompe gestos o el modal | Dividir en 2 PR `refactor` (datos/lógica, luego vistas), E2E de calendario y capturas v1/v2 idénticas antes del PR visual |
| Cambios de v1 por accidente al editar archivos compartidos | Volcado de estilos = 0 en cada PR; reglas nuevas solo bajo `data-ui="v2"` |
| Volumen de capturas (6 por pantalla × cambios) | Una pantalla por PR visual; leer solo las que cambian, una a una y reducidas |
| Shell v2 desplaza contenido o rompe `--nav-h` | Test de solapes de la Capa 0; la altura sigue en el token |
| Mapa y gráficas lentas o con gestos conflictivos en WebView/iPhone | Prueba en iPhone real por PR; tooltip táctil ya cubierto por `tooltip-touch.spec.js` |
| Dos lenguajes visuales conviviendo meses | v2 es opt-in; la Capa 6 tiene fecha; D13 elimina la mezcla shell/pantalla |
| Sesiones largas y caras | Una sesión por fase de `tasks.md` (ver `plan.md`) |
| Paridad incompleta | RF7: marcar en `paridad.md` por PR |

## 9. Fuera de alcance
Activar v2 por defecto y limpiar v1 (Capa 6); app iOS/Capacitor (Capa 7); landing, acceso y `EmailConfirmedPage` (Capa 4, hecha); cambios de datos, Strava, IA, Supabase o lógica de negocio; escalas ordinales de color (D9) salvo fallo de contraste; funciones nuevas de producto.

---
Versión: 0.2.0 (aprobada) — 2026-11-16
