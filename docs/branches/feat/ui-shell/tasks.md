# Tareas — Capa 3, rama `feat/ui-shell`

Spec: `spec.md` (esta carpeta). Plan de la capa completa: `plan.md`.
Aprobada por el usuario el 2026-11-10: "Apruebo todo (D1–D8)".

## PR 1 — `refactor(ui-shell)`: tokens, z-index y D-01

Rama `feat/ui-shell`, sale de `develop` (`06ac9e3`). **0 diferencias** de volcado y capturas.

- [x] `tokens.css`: `--nav-h` (3.5rem), `--nav-h-total`, `--bottom-nav-h` (3.375rem), `--bottom-nav-gap` (0.75rem), `--bottom-nav-reserve` (8rem) y la escala `--z-*`.
- [x] `tailwind.config.js`: `zIndex` con los tokens.
- [x] `MobileSwipePager.jsx`: alto y hueco inferior con tokens.
- [x] `UploadStatusBanner.jsx`: `top` con token.
- [x] `BottomNav.jsx`: cápsula y satélite con `--bottom-nav-h`.
- [x] z-index: 12 elementos a tokens (8 × `z-50`, `z-[60]`, `z-[100]` ×2, `z-[200]`, `z-[400]` ×2) y las marcas internas de `TrainingBalanceCard` a 10/20.
- [x] D-01: `.hide-scrollbar` en las exclusiones del pager y `test.fail()` fuera.
- [x] `e2e/shell.spec.js` (3 pruebas × 3 proyectos) y `src/__tests__/unit/shellTokens.test.js` (5 pruebas).
- [x] Verificación completa.
- [x] PR hacia `develop` (#70).

### Notas del PR 1

- **Reparto con el PR 2 (decidido al implementar):** corregir las alturas **mueve píxeles**, así que este PR solo cablea tokens con los valores de hoy. `--nav-h` = 56 px (lo que ya asumían el pager y el banner), `--bottom-nav-reserve` = 128 px (el `pb-32` del pager) y `--bottom-nav-h` = 54 px: los tres dan exactamente el mismo resultado que antes. El desfase de 3 px de la cabecera real (~59 px), `Dashboard.jsx:172` (170/250 px) y `ActivityDetailPage.jsx:133,712,791` (4rem/70px/130px/pb-32) se tokenizan en el PR 2, con las capturas.
- **Escala de capas (D5, ajustada al implementar):** `sticky 20`, `nav 30`, `nav-menu 40` (menú y barra inferior; no se solapan), `sheet 50`, `tooltip 55`, `modal 60`, `floating 80`, `map 400`, `toast 9999`. `tooltip` sube de 50 a 55 para deshacer el empate con la hoja y `floating` baja de 100 a 80: el panel "Proyección de Forma" del Calendario no convive con el tooltip de `MmpAndEfCard` (Rendimiento), así que el cambio de ganador no se puede dar.
- **Marcas internas:** `TrainingBalanceCard.jsx:71` estaba en `z-30` y, con la cabecera en 30, habría empatado con ella al hacer scroll. Pasa a `z-20` y la barra de valor de `:80` a `z-10` (la cápsula sigue por encima). El resto de `z-10`/`z-20` internos siguen siendo menores que la cabecera.
- **Banner de subida:** `top-[52px]` → `top-[var(--nav-h-total)]` (52 → 56 px). Solo existe durante una subida y no aparece en ninguna captura ni en el volcado, y hoy ya quedaba 7 px por debajo de la cabecera.
- **Fuera de alcance:** la landing (`LandingPage.jsx:277 z-40`, `:318 z-10`) es Capa 4 y no se toca; conserva sus valores literales.
- **Volcado `full` frente a `develop` (`06ac9e3`): 104 volcados, 90.548 elementos, 538 diferencias, todas de la propiedad `z-index`** (excepción aprobada el 2026-11-10). Reparto: `40 → 30` cabecera (92), `100 → 80` panel del Calendario (4), `50 → 55` tooltips (220), `50 → 30` cabecera del detalle (12), `50 → 40` menú y barra inferior (30), `30 → 20` y `20 → 10` las dos marcas de `TrainingBalanceCard` (90 + 90). El orden por pares que de verdad se solapan lo fija `shellTokens.test.js`.
- **Nota de método:** el primer volcado de `develop` perdió 8 estados móviles por tiempos de espera (el resumen lo tapaba el `tail`); repetido solo `--project=mobile`, 32/32, y los 104 volcados quedaron completos en los dos lados.
- **Resultados:** lint ✓, lint:colors ✓ (760/3/100/9/170, sin cambios), lint:ui ✓ (14 exportaciones), unit 187/187 (182 + 5 de `shellTokens`), integración 10/10, build ✓, E2E macOS 94 ✓ / 159 omitidas / 0 ✘, E2E Docker 142 ✓ / 111 omitidas / 0 ✘ (48 capturas de v1 sin diferencias). **El ✘ de `gestures.spec.js:37` (D-01) desaparece** y `shell.spec.js` suma 7 ✓ (2 omitidas por tamaño).
- Informe táctil en macOS: 113 en `develop` y en la rama, igual por pantalla (2 + 43 + 7 + 10 + 21 + 5 + 9 + 16).

## PR 2 — `refactor(ui-shell)`: cabecera y acciones

Rama `feat/ui-shell-header`, sale de `develop` (`e6f8456`, merge del PR 1). **Único PR de la capa que cambia capturas de v1 a propósito (D1).**

- [x] Cabecera móvil ligera (identidad + menú, tema, Strava).
- [x] Escritorio sin los 4 iconos de utilidad ni el cierre de sesión duplicado.
- [x] Altura real: cabecera a **60 px** (`--nav-h` = `3.75rem`, D4 revisado) y `Dashboard.jsx` / `ActivityDetailPage` a tokens.
- [x] Ajustes: "Borrar actividades" (con `confirm`). "Importar CSV" **retirado** (D3 revisado: nunca implementado).
- [x] Paridad recorrida y anotada.
- [x] Pruebas: paridad, destructiva, tema.
- [x] Capturas afectadas regeneradas y revisadas una a una.
- [x] Verificación completa.
- [x] PR hacia `develop` (#71).

### Notas del PR 2

- **D3 cambia al implementar (decidido el 2026-11-10): "Importar CSV" se retira.** No había nada que cablear: `processFile` era un `console.log("Lógica de CSV pendiente", file)`, se borró en `f8114a6` y `Dashboard` nunca pasó `onFileUpload`, así que el icono solo lanzaba un error. Se documenta en `paridad.md` como **D-03 «acción retirada: nunca implementada»**; la importación, cuando se especifique su formato, será funcionalidad nueva. `e2e/export.spec.js` pierde la prueba que exigía el botón y conserva la nota y el `test.fixme` de exportación (D-05).
- **D4 se ajusta al medir la cabecera real: 60 px, no 56.** Con Playwright antes de tocar código: **81 px en móvil y 63,5 en tablet/escritorio**. Los 81 px no eran relleno: el botón de Strava se partía en dos líneas porque el icono de cerrar sesión le quitaba 30 px justo en el límite. Sin él y con altura fija, mide 60 px en los tres tamaños (`shell.spec.js` lo comprueba contra el token).
- **Cabecera (`Navbar.jsx`):** `h-[calc(var(--nav-h)+env(safe-area-inset-top,0px))]` + `pt-[env(safe-area-inset-top,0px)]` + `flex items-center`; fuera `pb`, `mt-0.5`, el bloque `hidden md:flex` de utilidades y el cierre de sesión móvil. Props de 7 a 4 (`settings`, `uploading`, `isStravaConnected`, `onSync`); imports de lucide de 18 a 15.
- **Strava (`StravaConnect.jsx`):** `aria-label="Conectar con Strava"` (lo usa `strava.spec.js`), `whitespace-nowrap`, `px-3 sm:px-4` y texto «Conectar» en móvil / completo desde `sm`. Sin el `nowrap` el botón vuelve a partirse y la cabecera crece.
- **Histórico (`Dashboard.jsx`):** `h-[calc(100dvh-var(--nav-h-total)-7.125rem)] sm:h-[…-11.875rem]`, que conserva los 674/650 px de antes. Efecto lateral bueno: el pager móvil medía 788 px bajo una cabecera de 81 (25 px de más); ahora mide 784 bajo una de 60 y encaja.
- **Detalle (`ActivityDetailPage.jsx`):** la raíz usa `calc(100dvh-var(--nav-h-total))` (+`-1rem` desde `sm`) en lugar de `4rem`/`70px`; el mapa pasa de `h-[calc(100dvh-130px)] lg:h-full` a `flex-1 min-h-[480px]` y llena justo lo que queda. En Análisis, escritorio mantiene **caja fija y paneles con scroll propio** (`lg:h-…`): sin ese `lg:h` la página entera se desplaza y la captura del detalle crece 100 px.
- **Ajustes (`ProfilePage.jsx`):** recibe `onClearDb` (vía `ActivitySubRoutes`) y pinta «Borrar todas las actividades» en Seguridad y Datos → ZONA DE PELIGRO, con el `confirm` de `useActivitiesData.js:59` (borra actividades, no la cuenta). Los dos botones de la zona pasan a `min-h-[44px]` (RF13).
- **Paridad recorrida** (`paridad.md:23-44`): cerrar sesión → solo en el menú (los dos iconos fuera); tema → sigue en la cabecera; Strava → sigue en la cabecera; importar CSV → **retirado**; añadir manual → sigue en Actividades; borrar DB → Ajustes → Seguridad y Datos; eliminar cuenta, contraseña, Deep Sync e Intervals → sin cambios en Ajustes; identidad y menú → sin cambios. `BottomNav` no se toca.
- **Pruebas:** `e2e/shell.spec.js` pasa a 6 casos × 3 proyectos (19 ✓ + 2 omitidas): altura medida contra `--nav-h-total`, pager y barra inferior, reserva inferior, cabecera sin utilidades ni acciones destructivas, cerrar sesión solo en el menú, tema que persiste tras navegar y «Borrar Actividades» con confirmación. `e2e/auth.spec.js` abre el menú antes de cerrar sesión. `shellTokens.test.js` fija `--nav-h: 3.75rem`.
- **Capturas (D1):** 42 de 48 regeneradas en Docker (todas menos la landing, que no cambia) y revisadas una a una por tamaño y tema. Alto: −21 px en móvil y tablet (81 → 60) y −3/−4 en escritorio (63,5 → 60); 0 en las pantallas que ya medían justo la ventana (perfil, actividades en tablet/escritorio) y −16 en el detalle de escritorio (caja fija: 830 → 824 px). Las 42 pasan `npm run test:e2e:docker` contra las referencias nuevas.
- **Volcado `full` frente a `develop` (`e6f8456`): 104 volcados, 90.640 elementos, 4.038 diferencias, ninguna de color.** Por propiedad: `size` 1.076, `white-space` 368 (`normal → nowrap` del botón), `padding-top`/`padding-bottom` 92 cada una (el relleno de la cabecera a 0), `display`/`align-items` 92 (a `flex`/`center`), `padding-left`/`padding-right` 56 (16 → 12 px del botón), `margin-top` 28 (`mt-0.5` fuera) y `transform` 6 (el encuadre del mapa se desplaza 1 px al cambiar el alto de la caja). Añadidos 92 (los dos `span` del texto de Strava) y retirados 1.988 (los 5 controles de escritorio con sus iconos y sus `:hover`, y el cierre de sesión móvil con su `svg`).
- **Resultados:** lint ✓, lint:colors ✓ (palette 756, arbitrary 3, hex 100, rgb 9, dark 168; bajan 4/2 solo en `Navbar.jsx`), lint:ui ✓ (14 exportaciones), unit 187/187, integración 10/10, build ✓, E2E macOS **105 ✓** / 159 omitidas / 0 ✘, E2E Docker **153 ✓** / 111 omitidas / 0 ✘, informe táctil 113 (2 + 7 + 43 + 10 + 21 + 5 + 9 + 16; sin cambios: el cierre de sesión de 36 px que desaparece lo compensa el botón de Strava, que pasa de 130×45 a 100×32).

## PR 3 — `docs(ui-shell)`: cierre

Rama `feat/ui-shell-close`, sale de `develop` (`fadb304`, merge del PR 2). Solo documentación: **0 cambios de código y 0 diferencias** de volcado y capturas.

- [x] Cobertura, `MEMORY.md`, `CHANGELOG.md`, `paridad.md` (D-01 y D-03), roadmap.
- [x] Spec: casillas de RF y criterios de aceptación que ya se cumplen.
- [x] PR hacia `develop` (#72).

### Notas del cierre

**Qué entrega la rama `feat/ui-shell` (PRs #70 y #71), en números**

- **Alturas:** `--nav-h` (60 px), `--nav-h-total`, `--bottom-nav-h`, `--bottom-nav-gap` y `--bottom-nav-reserve` en `src/styles/tokens.css`, y los usan 6 archivos: `Navbar`, `MobileSwipePager`, `UploadStatusBanner`, `BottomNav`, `Dashboard` (histórico) y `ActivityDetailPage` (raíz y mapa). El `grep` de 6.2 no devuelve ninguna altura de barra fuera de `tokens.css`; sus tres `130px` son anchos de columna del Calendario (`min-w-[130px]` y `grid-cols-[130px_…]`) y el cuarto es el propio regex de `shellTokens.test.js`.
- **Capas:** 31 usos con token (`z-tooltip` 7, `z-sheet` 6, `z-modal` 4, `z-nav` 3, `z-nav-menu` 3, `z-map` 3, `z-floating` 3, `z-sticky` 2) y **cero `z-50`/`z-[…]` sueltos** en `src/`. La landing conserva `z-40`/`z-10` literales por ser Capa 4.
- **Cabecera:** de 7 props a 4 y de 18 iconos de `lucide` a 15; fuera los 5 controles de escritorio (importar CSV, añadir manual, borrar DB, separador y cerrar sesión) y el cierre de sesión móvil. Cerrar sesión pasa de **3 sitios a 1** (el menú); «Borrar todas las actividades» vive en Ajustes → Seguridad y Datos con su `confirm`.
- **Colores:** `lint:colors` cierra la Capa 3 en **756/3/100/9/168** (la Capa 2 cerró en 760/3/100/9/170: −4 palette y −2 dark, todas de `Navbar.jsx`). `lint:ui` sigue en 14 exportaciones.
- **Pruebas:** unit 187 (182 al cerrar la Capa 2; +5 de `shellTokens`), integración 10, E2E macOS **105 ✓** (87 al cerrar la Capa 2: +18 de `shell.spec.js` y +1 al quitar el `test.fail()` de D-01), Docker **153 ✓**. Informe táctil 113, igual que en `develop`.
- **Red de seguridad:** volcado `full` acumulado de la rama frente a `develop` (`06ac9e3`): PR 1 **538 diferencias, todas de `z-index`** (excepción D5) y PR 2 **4.038, ninguna de color**. Capturas de v1: 48 idénticas en el PR 1 y 42 regeneradas en el PR 2 (D1), revisadas una a una; desde entonces, congeladas.

**Lo que este cierre NO marca como hecho:** los RF9–RF11 y los criterios "al terminar la capa" de v2 (mecanismo `data-ui`, conmutador, capturas propias de v2) pertenecen a `feat/ui-skin-v2`; la spec sigue viva para esa rama y el roadmap deja la Capa 3 a medias a propósito.

**Verificación de este PR (solo docs):** lint ✓, lint:colors ✓ (756/3/100/9/168), lint:ui ✓ (14), unit 187/187, integración 10/10, build ✓, E2E macOS **105 ✓** / 159 omitidas / 0 ✘. Sin capturas ni volcado: el árbol de `src/` es idéntico a `develop`.

## PR 7 — `docs(ui-shell)`: cierre de la Capa 3

Rama `docs/ui-capa3-cierre`, sale de `develop` (`1b6975f`, merge del PR 6). Solo documentación.

- [x] RF9–RF11 y criterios «al terminar la capa» marcados en `spec.md`; `MEMORY.md`, `CHANGELOG.md` y roadmap al día.
- [x] **D12 (vista por defecto): v1 hasta la Capa 6**, decidido por el usuario entre tres opciones (v1 / v2 ya / v2 en preview). v2 queda opt-in (Ajustes → «Vista previa v2» o `VITE_UI=v2`).

### Cierre de la Capa 3

| PR | Contenido |
|---|---|
| #70–#72 | Estructura: tokens de altura y capas, cabecera de 60 px, acciones a Ajustes, paridad (D-01, D-03) |
| #73 | Mecanismo `data-ui="v2"` (entorno, `localStorage`, conmutador en caliente) y capturas de v2 |
| #75 | Dirección visual «Panel» en Dashboard y Calendario, `chartTheme.v2` |
| #76 | Piel en Perfil, Actividades, Rendimiento, Salud y Detalle; `chartTheme.v2` completo (D-10); colores de deporte unificados (D-09) |

**Cifras finales (PR 6):** volcado `full` frente a `develop` = 0 diferencias (88.718 elementos); unit 195, integración 10, E2E macOS 109 ✓, Docker 205 ✓; `lint:ui` 14; `lint:colors` 754 en palette (756 al cerrar la estructura).

**Pendiente para capas siguientes:** shell y lienzo siguen en v1 (D11) y se tocan en la Capa 5/6; activar v2 por defecto y retirar el conmutador (Capa 6, D12).
