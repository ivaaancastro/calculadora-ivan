# Plan — spec-rediseno-02 (Roadmap por capas)

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

## Capa 6 — Activación y limpieza
- Activar v2 primero para ti y después para todos, con v1 disponible durante un periodo acordado.
- Tener en cuenta que la PWA usa `autoUpdate`: una marcha atrás llega cuando el cliente vuelve a cargar.
- Retirar el flag, los valores v1, las utilidades antiguas y las fuentes sin usar.
- Actualizar `MEMORY.md`, `CHANGELOG.md` y `README.md`.

## Capa 7 — App iOS
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
