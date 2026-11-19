# Plan — spec-rediseno-02 (Roadmap por capas)

> **➡️ Siguiente paso:** cerrar lo en curso (PR #103 Coach Insights y PR #105 verificación rápida) y, con la spec de la Fase Premium aprobada (D1–D10), abrir la **Fase A (auditoría de diseño)** cuando #106 esté mergeado. Actualizar esta línea al terminar cada paso.

## Orden de trabajo (roadmap vigente, actualizado 2026-11-19)
1. **Cerrar lo en curso:** PR #103 (Coach Insights) y PR #105 (verificación rápida por carriles).
2. **Fase Premium A–D** (`docs/branches/feat/premium-design/`): A auditoría de diseño, B tokens y acabado, C capa de gráficas Forma, D rediseño de pantallas (empieza por el detalle de actividad; bloqueada hasta tener webs de referencia).
3. **Capa 6:** activar v2 por defecto, retirar v1 y decidir el destino del interruptor «Vista previa v2» en Ajustes → General.
4. **Capa 7:** app iOS.
5. **Deudas de la Capa 4:** `robots.txt`, `og:image`, CSS bloqueante y base JS del SPA desde el cliente Supabase.
6. **Opcionales:** Series de fuerza (requiere capturar `series_count`), cálculo real del estado de recuperación, reutilizar los textos explicativos de métricas en Dashboard y Rendimiento, límites de Strava y Garmin.

Cada capa termina con la app funcionando y se puede pausar sin dejar nada a medias. Cada una tendrá su spec detallada antes de implementarse.

| Capa | Resultado | ¿Cambia lo que se ve? | Se puede publicar |
|---|---|---|---|
| Previa | Producción sin tocar, por decisión del usuario | No | — |
| 0 | Red de seguridad | No | Sí |
| 1 | Tokens y tema | No | Sí |
| 2 | Primitivas | No, o mínimo | Sí |
| 3 | Navegación y piel v2 tras flag | Solo con flag | Sí |
| 4 | Landing y acceso con la skill | Sí, solo páginas públicas | Sí |
| 5 | Pantallas, de menor a mayor riesgo | Solo con flag | Sí, una a una |
| Premium | Auditoría, tokens, gráficas Forma y pantallas (A–D), antes de la Capa 6 | Solo con flag | Sí, por fases |
| 6 | Activar v2 y limpiar | Sí, para todos | Sí |
| 7 | App iOS en TestFlight y App Store | App nueva | Sí |

**Regla transversal:** cada capa se diseña primero para 390 px y después se adapta a pantallas grandes.

## Previa — Producción
**Decisión del usuario (2026-11-06):** "por ahora no vamos a tocar producción, vamos a seguir con las feat en develop".
- El trabajo continúa en ramas hacia `develop`. No se autoriza ningún rollback, promoción ni merge a `main`.
- El último despliegue de producción (2026-11-05 19:34) corresponde a `cda7df1`, un commit de febrero. Antes de cualquier merge a `main` hay que volver a revisar este punto.
- Antes de ese merge también hay que resolver `VITE_GEMINI_API_KEY`: `src/main.jsx` impide arrancar sin ella en un build de producción.

## Capa 0 — Red de seguridad
**Rama:** `test/ui-safety-net`
- Crear datos simulados compartidos y fijar la fecha en los E2E.
- Añadir capturas de referencia de landing, dashboard, rendimiento, calendario, actividades, detalle, salud y perfil, a 1440 y 390 px, en claro y oscuro.
- Añadir la prueba automática de solapes de barras fijas y desbordamiento.
- Añadir comprobaciones móviles: objetivos táctiles de 44 px y gestos de deslizamiento que no interfieran con gráficas ni filtros horizontales.
- Permitir el zoom en el viewport y sustituir "FormaLab" por "Forma" en los 4 archivos afectados.
- Cambiar los selectores E2E a rol y etiqueta, y asociar las etiquetas de los formularios.
- Inventariar las acciones de cada pantalla como lista de paridad.
- Dejar de versionar `playwright-report` y `test-results`, e ignorar `.playwright-mcp` y `.taste-skill`.

**Hecho cuando:** la red pasa en CI y detecta un solape introducido a propósito.

## Capa 1 — Tokens y tema
**Ramas:** `feat/ui-tokens`, y una por familia en la migración.
- Crear `tokens.css` con los valores actuales y exponerlos en Tailwind con soporte de opacidad.
- Definir el significado de los colores: acción, positivo, aviso, peligro y las métricas CTL, ATL y TSB.
- Crear `chartTheme` para Recharts, que no puede leer clases de Tailwind, siguiendo la skill `dataviz`.
- Migrar con codemods por familia: superficies, texto, bordes, acentos y gráficas.

**Hecho cuando:** las capturas no cambian y casi no quedan colores sueltos ni pares `dark:` en lo migrado.

## Capa 2 — Primitivas
**Una rama por familia:** `Button`, `Card` y `Stat`, `Input` y `Select`, `Segmented` y `Tabs`, `Badge`, `Modal` (hoja inferior en móvil), `Skeleton`, `EmptyState`, además de un tooltip de gráfica que funcione al tocar.
- Crear solo lo que vaya a usarse, y migrar todos sus usos en el mismo PR.
- Sustituir `ios-card`, `ios-touch`, `ios-header` y similares.
- Mantener el aspecto actual; cualquier diferencia en capturas se justifica en el PR.

**Hecho cuando:** ninguna primitiva queda sin uso y las clases antiguas han desaparecido.

**Hecho (2026-11-10):** PRs #60 a #68. 14 exportaciones en `src/components/ui/` (8 familias, todas con uso) y sin clases `ios-*` ni `MetricHelp`, `IosCard`, `MetricCard`, `PillTab`, `tooltipStyleFor` ni `LazyFallback`. En los 9 PR el volcado `full` frente a `develop` dio 0 diferencias y las capturas no cambiaron. Detalle y pendientes en `docs/branches/feat/ui-primitives/tasks.md`.

## Capa 3 — Navegación y piel v2
**Ramas:** `feat/ui-shell`, `feat/ui-skin-v2`
- Definir la altura de barra con `--nav-h`, para que ninguna pantalla dependa de un número fijo.
- Aligerar la cabecera móvil, que hoy reúne perfil, tema, Strava y cierre de sesión, y llevar lo secundario a Ajustes.
- Reorganizar `Navbar` y `BottomNav` conservando todas las acciones. Las destructivas, como "Borrar DB", pasan a Ajustes con confirmación. Es una decisión a validar en la vista previa.
- Crear `data-ui="v2"`, activable por entorno y por `localStorage`, con la escala de texto, los radios y la paleta nuevos.
- Elegir la dirección visual sobre dos pantallas reales, Dashboard y Calendario, antes de extenderla.

**Hecho cuando:** v1 no cambia ni una captura *(matizado por D1: se admite un único PR de estructura que las regenere y las revise; desde entonces quedan congeladas)*, y v2 puede activarse y desactivarse sin recargar datos ni perder sesión.

**Hecho (2026-11-11), estructura:** `feat/ui-shell` cerrada con los PRs #70, #71 y #72. `--nav-h` (60 px) y `--nav-h-total` con la barra inferior tokenizada; **0 números de altura de barra y 0 `z-*` sueltos** en `src/`; cabecera con identidad, menú, tema y Strava; «Borrar todas las actividades» en Ajustes → Seguridad y Datos con `confirm`; cierre de sesión en un solo sitio (el menú); **D-01 cerrado** y **D-03 retirado** (nunca estuvo implementado). Capturas de v1 regeneradas una sola vez (D1: 42 de 48, la landing no cambia) y congeladas desde entonces; volcado del PR 1 solo en `z-index` y el del PR 2 sin ninguna diferencia de color. Cobertura y notas en `docs/branches/feat/ui-shell/tasks.md`.

**Hecho (2026-11-12), piel v2:** PRs #73 (mecanismo `data-ui`, conmutador en Ajustes), #75 (dirección visual «Panel») y #76 (extensión a 5 pantallas y gráficas); cierre en `docs/ui-capa3-cierre`. v1 congelada (volcado = 0) y v2 con capturas propias. v1 sigue por defecto hasta la Capa 6 (D12). Detalle en `docs/branches/feat/ui-shell/tasks.md`.

**Pendiente de la capa:** la piel (`feat/ui-skin-v2`, PRs 4–7): `data-ui="v2"` por entorno y `localStorage`, conmutador en Ajustes, capturas propias de v2 y la dirección visual elegida sobre Dashboard y Calendario (D7, con parada de aprobación).

## Capa 4 — Landing y acceso
**Rama:** `feat/landing-v2`
- Aquí se aplica la skill completa, incluidos sus verificadores: `LandingPage`, modal de acceso y `EmailConfirmedPage`.
- El flujo de acceso actual se mantiene, sin ruta `/login` nueva salvo que se especifique aparte.
- Se muestra la UI real de Forma, y cada afirmación comercial se confirma antes de publicarla, como "10.000 actividades" o "prueba gratis" del primer intento.

**Hecho cuando:** los verificadores de la skill y la red de la Capa 0 pasan en verde.

## Capa 5 — Pantallas
Se hace un PR de estructura (si hace falta), seguido de otro visual, y se comprueba la lista de paridad.

| Orden | Pantalla | Riesgo | Motivo |
|---|---|---|---|
| 1 | Perfil y ajustes | Bajo | Formularios; valida las primitivas |
| 2 | Actividades | Bajo | Una lista acotada |
| 3 | Dashboard | Medio | La más vista; ya está dividida |
| 4 | Rendimiento | Medio | Tarjetas pequeñas y muchas gráficas |
| 5 | Salud | Medio | 967 líneas |
| 6 | Detalle de actividad | Alto | Mapa, gráficas y 1.009 líneas |
| 7 | Calendario | Alto | 2.353 líneas; dividir antes de tocar el estilo |

En cada pantalla se define qué se ve en el primer vistazo en el móvil. En Dashboard, por ejemplo: estado de forma, tres o cuatro métricas clave y la gráfica principal, con el resto desplegable.

**Hecho cuando:** cada pantalla funciona en v2, se ha probado en un iPhone real y su lista de paridad está completa.

**Hecho (2026-11-17), implementada:** 14 PR de código (#84–#97: shell, Ajustes, Actividades, Dashboard, Rendimiento, Salud, Detalle y Calendario, con sus refactors previos) y cierre documental (`docs/screens-cierre`). Lista de paridad completa en `docs/branches/test/ui-safety-net/paridad.md`; D8 cerrada (el interruptor «Vista previa v2» sigue en Ajustes → General hasta la Capa 6). **Pendiente:** la pasada completa en iPhone real, con el guion `docs/branches/feat/screens-v2/guion-iphone.md` (la ejecuta el usuario). Detalle en `docs/branches/feat/screens-v2/tasks.md`.

## Fase Premium (A–D) — antes de la Capa 6
**Estado:** spec y plan **aprobados** (2026-11-19): `docs/branches/feat/premium-design/{spec,plan}.md`. A auditoría (solo análisis), B tokens y acabado v2, C capa de gráficas Forma (lenguaje de bklit-ui sin instalarlo), D pantallas (bloqueada hasta referencias). v1 congelada y `style-diff` 0 en v1.

## Capa 6 — Activación y limpieza
**Estado:** posterior a la Fase Premium (A–D). Requiere la pasada en iPhone real sin fallos bloqueantes.
- **Decidir el destino del interruptor «Vista previa v2»** (propuesta de D8: al activar v2 por defecto pasa a «Volver a la vista clásica» durante el periodo acordado y se retira con v1).
- Activar v2 primero para ti y después para todos, con v1 disponible durante un periodo acordado.
- Tener en cuenta que la PWA usa `autoUpdate`: una marcha atrás llega cuando el cliente vuelve a cargar.
- Retirar el flag, los valores v1, las utilidades antiguas y las fuentes sin usar.
- Actualizar `MEMORY.md`, `CHANGELOG.md` y `README.md`.

## Capa 7 — App iOS
**Estado:** posterior a la Capa 6. Parte de v2 como única piel.
**Rama:** `feat/ios-app`. Tendrá su propia spec, y puede empezar con una prueba técnica breve al terminar la Capa 3.
- **Base:** añadir Capacitor y el proyecto iOS, con URLs configurables en lugar de `window.location.origin`.
- **Enlaces:** resolver con Universal Links los correos de confirmación, la recuperación de contraseña y el retorno de Strava.
- **Valor nativo (guideline 4.2):** Apple Health, notificaciones y navegación y gestos nativos. El plugin `capacitor-health` es pequeño y hay que evaluarlo antes de depender de él.
- **Requisitos de App Store:**
  - Borrado de cuenta dentro de la app (5.1.1): existe, pero hay que confirmar que `delete_user` funciona en producción y retirar el mensaje de "contacta con soporte".
  - Datos de salud (5.1.3): no usarlos para publicidad y publicar una política de privacidad.
  - IA de terceros (5.1.2): si se activa Gemini, pedir permiso explícito y llamar a la API desde una Edge Function, sin clave en el cliente.
  - Pagos (3.1.1): si se venden funciones dentro de la app, usar compras integradas.
  - Acceso (4.8): solo afecta si se añade login social; hoy es por correo y contraseña.
  - Strava: revisar sus condiciones de API y de marca antes de publicar.
- **Necesario por tu parte:** cuenta de Apple Developer, además del Mac con Xcode que ya tienes.

**Hecho cuando:** la app se instala por TestFlight, los flujos de acceso y Strava funcionan en un iPhone real y pasa la revisión de Apple.

## Deudas y opcionales (sin capa asignada; ver orden 5 y 6 arriba)
- **Strava y Garmin:** replantear la conexión con Strava por los límites de su API y estudiar añadir Garmin (API nueva). Hasta entonces «Strava y CSV» se mantiene en la landing (decisión 2026-11-16). Forma tendrá funciones de pago: no prometer gratuidad.
- **Deuda de la Capa 4 (landing):** `robots.txt` y `og:image` ausentes (SEO 91 en Lighthouse) CSS bloqueante en la carga inicial y base JS del SPA cargada desde el cliente Supabase. Detalle en `docs/branches/feat/landing-v2/tasks.md`.
- **Opcionales:** Series de fuerza (requiere capturar `series_count`), cálculo real del estado de recuperación y reutilizar los textos explicativos de métricas (`activityMetricDescriptions.js`) en Dashboard y Rendimiento.
- **Cobertura:** E2E en `data-ui="v2"` para las acciones que hoy solo se prueban a mano (ver «Huecos reconocidos» en `paridad.md`).

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Rechazo de Apple por ser una web empaquetada | Funciones nativas reales desde la primera versión |
| Rendimiento de gráficas y mapas en WebView | Prueba técnica en un iPhone real antes de comprometer la Capa 7 |
| Convivencia larga de v1 y v2 | Los tokens evitan duplicar componentes; la Capa 6 tiene fecha |
| Capturas frágiles | Fecha fija, datos simulados y animaciones desactivadas |
| Codemods demasiado amplios | Una familia por PR y comparación de capturas |
| Conflictos con otras funcionalidades | PR cortos e integración frecuente con `develop` |

## Primer paso tras la aprobación
1. Crear `tasks.md` y la spec de la Capa 0.
2. Crear `test/ui-safety-net` desde `develop`.
3. Llevar por PR el commit `6459138` (reglas de `.gitignore`), hecho directamente sobre `develop` local.

No se debe hacer `git pull` en `feat/webapp-redesign`: el remoto conserva el primer intento.

---
Versión: 0.2.0 — 2026-11-06
