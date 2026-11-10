# Especificación SDD — spec-rediseno-02-c3 (Capa 3: navegación y piel v2)

## 1. Identificación
- **ID:** `spec-rediseno-02-c3`
- **Título:** Capa 3 del rediseño: shell de navegación (`feat/ui-shell`) y piel v2 tras `data-ui="v2"` (`feat/ui-skin-v2`)
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-10
- **Estado:** pendiente de aprobación
- **Depende de:** `spec-rediseno-02` (roadmap), `spec-rediseno-02-c0` (red de seguridad, PR #51), `spec-rediseno-02-c1` (tokens, PRs #52–#58) y `spec-rediseno-02-c2` (primitivas, PRs #60–#68), todas mergeadas en `develop`.
- **Rama de esta carpeta:** `feat/ui-shell`. La segunda rama de la capa, `feat/ui-skin-v2`, usará este mismo documento como spec (no se duplica) y tendrá su propia carpeta con `tasks.md`.

## 2. Objetivo
Que la estructura de navegación tenga **una sola fuente de verdad para la altura de las barras** (`--nav-h`) y una cabecera móvil ligera, y que exista una **piel v2 activable** (`html[data-ui="v2"]`, por entorno y por `localStorage`) que se pueda encender y apagar sin recargar datos ni perder la sesión, sin tocar ni una captura de v1 después de este primer PR de estructura.

## 3. Contexto y justificación

### 3.1 Punto de partida
La Capa 2 dejó las recetas en `src/components/ui/` y los colores en tokens, pero **la estructura de la shell sigue con números escritos a mano** y la cabecera móvil acumula cuatro grupos de acciones. Las dos ramas de la capa atacan eso:

- `feat/ui-shell`: estructura (alturas, z-index, reorganización de `Navbar`/`BottomNav`).
- `feat/ui-skin-v2`: valores (tipografía, radios, paleta) detrás de un atributo.

### 3.2 Inventario de la shell (2026-11-10, `develop` en `06ac9e3`)

**`Navbar` — `src/components/dashboard/Navbar.jsx` (261 líneas)**

| Qué | Dónde | Nota |
|---|---|---|
| `<nav>` contenedor | `:73` | `glass-nav px-3.5 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2.5 sm:pb-3 sticky top-0 z-40` |
| Disparador del menú (avatar 36×36 + "Forma" + chevron + nombre) | `:78-117` | `aria-label="Menú de configuración y perfil"`, `aria-expanded` |
| Menú emergente | `:121-188` | `w-72 sm:w-80`, `z-50`; 4 secciones (`:57-62`): General, Zonas y Umbrales, Cuentas Conectadas, Seguridad y Datos |
| Cerrar sesión en el pie del menú | `:178-187` | |
| Pestañas de escritorio (5) | `:193-210` | `hidden md:flex`; etiquetas ocultas hasta `lg` |
| Cambiar tema | `:215-217` | **visible en móvil y escritorio** |
| Conectar / sincronizar Strava | `:219-228` | **visible en móvil y escritorio** |
| Importar CSV, Añadir manual, Borrar DB, separador, cerrar sesión | `:231-252` | **solo `md:`** (`hidden md:flex`) |
| Cerrar sesión (icono) | `:255-257` | **solo móvil** (`md:hidden`) |

La cabecera móvil reúne hoy cuatro grupos: identidad/menú, tema, Strava y cierre de sesión. En escritorio, además, tres utilidades y otro cierre de sesión (dos iconos de cerrar sesión conviven en `md`+).

**`BottomNav` — `src/components/layout/BottomNav.jsx` (95 líneas)**

| Qué | Dónde | Nota |
|---|---|---|
| Se oculta en el detalle | `:10-12` | `currentPath.startsWith('/activity/')` |
| 4 pestañas (Inicio, Forma, Calendario, Salud) | `:15-20` | `index` 0–3 |
| Satélite de búsqueda → `/history` | `:23`, `:77-92` | `index` 4 |
| Contenedor | `:33-36` | `md:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-50` |
| Cápsula 54 px y satélite 54×54 | `:39`, `:81` | `liquid-glass`, `liquid-glass-active` |

**Pestañas y gestos**

| Qué | Dónde |
|---|---|
| `MobileSwipePager` (arrastre 1:1, rubber-banding, umbral 45 px / velocidad 0,25) | `src/components/layout/MobileSwipePager.jsx` |
| Exclusiones del pager: `.leaflet-container`, `.recharts-wrapper`, `input[type="range"]`, `[data-no-swipe]` | `MobileSwipePager.jsx:47-52` |
| Exclusiones de `useSwipeNavigation` (borde para volver): las mismas **más `.hide-scrollbar` y `input, textarea, select, button`** | `src/hooks/useSwipeNavigation.js:22-31` |
| Pestañas móviles (5 montadas a la vez) | `src/components/dashboard/MobileTabsView.jsx` |
| Rutas de escritorio | `src/components/dashboard/DesktopRoutesView.jsx:17-23` |
| Rutas del orden superior | `src/App.jsx:46-78`, `src/components/Dashboard.jsx:85-99`, `ActivitySubRoutes.jsx` |

`MOBILE_TABS`/`TAB_PATHS`/`MAIN_TABS` están declarados en **tres sitios**: `Dashboard.jsx:85`, `useSwipeNavigation.js:4` y (con otras etiquetas) `Navbar.jsx:64-70` y `BottomNav.jsx:15-20`.

**Alturas fijas** (todas distintas para la misma barra)

| Valor | Archivo:línea | Qué asume |
|---|---|---|
| `56px` | `MobileSwipePager.jsx:195` (`h-[calc(100dvh-56px)]`) | alto de la cabecera |
| `52px` | `dashboard/UploadStatusBanner.jsx:12` (`sticky top-[52px]`) | alto de la cabecera (**otro**) |
| `4rem` = 64 px | `pages/ActivityDetailPage.jsx:133` (`min-h-[calc(100dvh-4rem)]`, `h-[calc(100dvh-4rem)]`) | alto de la cabecera del detalle |
| `70px` | `pages/ActivityDetailPage.jsx:133` (`lg:h-[calc(100vh-70px)]`) | alto en escritorio |
| `130px` | `pages/ActivityDetailPage.jsx:712` | cabecera + visor |
| `170px` / `250px` | `Dashboard.jsx:172` | cabecera + barra inferior (móvil) / cabecera + márgenes (escritorio) |
| `54px` | `BottomNav.jsx:39`, `:81` | alto de la barra inferior |
| `8rem` (`pb-32`) | `MobileSwipePager.jsx:195`, `ActivityDetailPage.jsx:791` | hueco para la barra inferior flotante |
| `5rem`/`4rem` (`pb-20`/`pb-16`) | `pages/HealthPage.jsx:289,305,320`, `pages/FitnessStatsPage.jsx:78` | respiro inferior de la página; en móvil va **dentro** del pager, que ya reserva el hueco de la barra |
| `64px` (`h-16`) | `pages/LandingPage.jsx:278` | cabecera de la landing (Capa 4, no se toca aquí) |

Con las clases actuales, la cabecera móvil mide **~59 px** (`0.75rem` + avatar de 36 px + `0.625rem` + borde) más la safe area: ni 56 ni 52 son correctos, así que hoy el contenido se solapa ~3 px con la barra y el pager deja 3 px de contenido por debajo del pliegue.

**z-index**

| Valor | Dónde | Elemento |
|---|---|---|
| `z-0` | `activity/ActivityMap.jsx:92,104` | mapa |
| `z-10` | `fitness/Vo2MaxCard.jsx:46`, `CalendarPage.jsx:310,1419,1554,2125`, `LandingPage.jsx:318` | marcas internas y elementos decorativos |
| `z-20` | `fitness/TrainingBalanceCard.jsx:80`, `CalendarPage.jsx:1221`, `ActivityDetailPage.jsx:245` | marcas internas y velo de carga |
| `z-30` | `upload/UploadStatusBanner.jsx:12`, `TrainingBalanceCard.jsx:71` | banner de subida, marca interna |
| `z-40` | `Navbar.jsx:73`, `LandingPage.jsx:277` | cabeceras |
| `z-50` | `Navbar.jsx:121` (menú), `BottomNav.jsx:35`, `ActivityDetailPage.jsx:135` (cabecera del detalle), `ui/chartTooltipClasses.js:11`, `ui/infoTooltipClasses.js:6`, `ui/modalClasses.js:14,19,25` (3 modales) | **8 usos del mismo valor con jerarquías distintas** |
| `z-[60]` | `ui/modalClasses.js:7,30` | visor del Calendario (debe ir por encima del menú) |
| `z-[100]` | `CalendarPage.jsx:174` | hoja del planificador |
| `z-[200]` | `fitness/MmpAndEfCard.jsx:63` | tooltip `card` que sobresale de la tarjeta |
| `z-[400]` | `activity/ActivityMap.jsx:93`, `ActivityDetailPage.jsx:719` | controles de Leaflet y botón sobre el mapa |

Conflictos reales: la cabecera del detalle (`z-50`) y los modales (`z-50`) empatan; el tooltip `card` (`z-[200]`) puede pintar por encima de la hoja del planificador (`z-[100]`); el menú de la cabecera (`z-50`) empata con la barra inferior (`z-50`).

**Acciones secundarias y destructivas**

| Acción | Hoy | Prueba |
|---|---|---|
| Cerrar sesión | menú (`Navbar.jsx:178`), icono de escritorio (`:249`) e icono móvil (`:255`) — **tres sitios** | E2E (existencia) |
| Cambiar tema | `Navbar.jsx:215` y `LandingPage` | — |
| Conectar Strava / Sincronizar | `Navbar.jsx:219-228` | E2E (conexión) |
| Importar CSV | `Navbar.jsx:235` | **D-03: roto.** `Dashboard.jsx:186-194` no pasa `onFileUpload`. **Retirado en el PR 2** (D3): nunca estuvo implementado |
| Añadir manual | `Navbar.jsx:239` y botón en Actividades (`Dashboard.jsx:164-171`) | E2E |
| **Borrar DB** (`confirm`) | `Navbar.jsx:243` | — |
| Eliminar cuenta, contraseña, Deep Sync, Intervals | `pages/ProfilePage.jsx` sección `security` (`:909-996`) | — |

`ProfilePage` ya recibe secciones por URL (`?section=general|zones|integrations|security`, `:304-350`), así que **Ajustes ya puede ser el destino** de cualquier acción movida.

**Pruebas que hoy dependen de la shell**

| Prueba | Qué fija |
|---|---|
| `e2e/dashboard.spec.js:21` | `getByRole('button', { name: 'Menú de configuración y perfil' })` visible |
| `e2e/dashboard.spec.js:25-28` | las 5 pestañas de escritorio navegan |
| `e2e/gestures.spec.js` (4) | el deslizamiento no cambia de pestaña sobre gráficas ni filtros; **`:37` es `test.fail()` por D-01** |
| `e2e/layout.spec.js` (16) | ninguna barra fija tapa contenido arriba y no hay desbordamiento |
| `e2e/touch.spec.js` | informe de objetivos < 44 px (**113**) |
| `e2e/visual.spec.js` (48) | capturas de 8 pantallas × 2 temas × 3 tamaños |
| `e2e/support/ui.js:29-48` | `gotoReady` espera a que desaparezcan "Iniciando sistema|Cargando métricas|Cargando..." |
| `docs/branches/test/ui-safety-net/paridad.md:23-44` | lista de paridad de `Navbar` y `BottomNav` |

### 3.3 Defectos que esta capa puede cerrar
- **D-01** (`paridad.md:141`): `MobileSwipePager` no excluye `.hide-scrollbar`, así que deslizar la tira de secciones de Rendimiento cambia de pestaña. Se arregla **en esta capa** porque es navegación (D6).
- **D-03** (`paridad.md:142`): importar CSV está roto. Al mover la acción a Ajustes se decide si se cablea o se retira (D3): **se retira en el PR 2** porque nunca hubo implementación que cablear (ver D3).
- **D-07/D-09/D-10** (colores fuera de rol y modo oscuro de las gráficas): se resuelven al definir la paleta v2 (`feat/ui-skin-v2`), no en la shell.

### 3.4 Qué vigila la red y qué no
- Las capturas y el volcado cubren la shell en v1 (8 pantallas × 2 temas × 3 tamaños) y el menú de perfil (`menu-perfil-*`), pero **no existe ninguna captura de v2**: hay que crearla antes de tocar la piel.
- `layout.spec.js` solo vigila las barras ancladas **arriba**; la barra inferior es flotante por diseño.
- No hay prueba del cambio de tema, de "Borrar DB" ni del cierre de sesión más allá de su existencia.

## 4. Requisitos funcionales

- [ ] **RF1. `--nav-h`:** la altura de la cabecera es un token en `src/styles/tokens.css` (`--nav-h`, alto de la caja, y `--nav-h-total`, lo mismo más `env(safe-area-inset-top)`) y **ninguna pantalla vuelve a escribir un número para la cabecera**. Lo mismo para la barra inferior (`--bottom-nav-h`, 54 px hoy) y el hueco que reserva (`--bottom-nav-gap`).
- [ ] **RF2. Alturas derivadas:** `MobileSwipePager` y `UploadStatusBanner` usan los tokens desde el primer PR **sin mover un píxel** (`--nav-h` = 56 px y `--bottom-nav-reserve` = 128 px, que son los valores que ya aplican; el PR 2 sube `--nav-h` a 60 px, D4). `Dashboard` (historial) y `ActivityDetailPage` pasan a tokens en el PR 2, junto con la corrección de la altura real: son las que hoy asumen 64/70/130/170/250 px y cambiarlas mueve contenido, así que van con las capturas. Se comprueba con `grep`: fuera de `tokens.css` no queda ningún número de altura de barra.
- [ ] **RF3. Cero solape:** en móvil y escritorio, el contenido empieza justo debajo de la cabecera y termina justo encima de la barra inferior (más el margen actual). `layout.spec.js` sigue en verde y el volcado no detecta contenido tapado.
- [ ] **RF4. Escala de z-index:** los valores sueltos pasan a tokens (`--z-nav`, `--z-nav-menu`, `--z-bottom-nav`, `--z-sheet`, `--z-modal`, `--z-tooltip`, `--z-map`) siguiendo la tabla de 6.3, sin cambiar qué elemento gana hoy salvo los empates documentados.
- [ ] **RF5. Cabecera móvil ligera:** en móvil la cabecera conserva **identidad + menú**, la acción principal de sincronización y el cambio de tema; las utilidades secundarias (importar CSV, añadir manual, Borrar DB) pasan a Ajustes y el **cierre de sesión queda en un solo sitio**: el menú de la cabecera, que ya lo tiene y se ve en los dos tamaños (hoy hay tres).
- [ ] **RF6. Destructivas a Ajustes:** "Borrar DB" vive en Ajustes → Seguridad y Datos, junto a "Eliminar cuenta", y **mantiene su confirmación**. No queda ninguna acción destructiva en la cabecera.
- [ ] **RF7. D-01:** `MobileSwipePager` añade `.hide-scrollbar` a sus exclusiones, igual que `useSwipeNavigation`. La prueba `gestures.spec.js:37` deja de ser `test.fail()` y pasa a verde como prueba normal.
- [ ] **RF8. Paridad intacta:** ninguna acción de `paridad.md:23-44` desaparece ni cambia de resultado. "Cerrar sesión" sigue existiendo en el menú y las acciones que se mueven lo hacen con su prueba o con una nueva.
- [ ] **RF9. Activación de v2:** `html[data-ui="v2"]` se activa por **entorno** (`VITE_UI=v2`) y por **`localStorage`** (`ui`), se aplica antes del primer pintado (script en línea de `index.html`, como el tema) y se puede **cambiar en caliente sin recargar ni perder datos ni sesión**.
- [ ] **RF10. v1 congelada:** con `data-ui` ausente o distinto de `v2`, la app se ve exactamente como tras el PR de estructura: **0 diferencias** en el volcado de estilos y en las capturas de referencia.
- [ ] **RF11. v2 con red propia:** existe un proyecto de capturas con `data-ui="v2"` (mismas 8 pantallas, 2 temas, 3 tamaños) y su volcado, para que la piel tampoco derive sin avisar.
- [ ] **RF12. Sin cambios de lógica:** no se tocan `src/services`, `src/store`, `src/utils` ni `src/supabase.js`. Los únicos cambios de comportamiento permitidos son los de RF5–RF7 y el conmutador de RF9.
- [ ] **RF13. Accesibilidad conservada:** se mantienen los `aria-label`, roles y `title` que usan los E2E (`Menú de configuración y perfil`, `Buscar actividades`, `Navegación móvil flotante estilo Apple`, `Cambiar tema`, `Cerrar sesión`). Los controles nuevos de Ajustes llevan etiqueta asociada y objetivo táctil ≥ 44 px.
- [ ] **RF14. Fuera de alcance:** la landing y el modal de acceso (Capa 4), la reescritura de pantallas (Capa 5) y las escalas ordinales de color, que solo se definen si la dirección visual elegida las necesita (D7).

## 5. Criterios de aceptación

En cada PR:
- [ ] `npm run lint`, `npm run lint:colors`, `npm run lint:ui`, `npm run test:unit`, `npm run test:integration`, `npm run build`, E2E en macOS y en Docker en verde, con los resultados copiados en el PR.
- [ ] **Volcado de estilos de `develop` frente a la rama: 0 diferencias** en todos los PR **menos el PR 2** (reorganización de la cabecera), donde las diferencias se revisan una a una y se justifican en el PR.
  - **Excepción del PR 1 (decidida el 2026-11-10):** la renumeración de D5 cambia el valor calculado de `z-index` aunque conserve qué elemento gana. Se acepta siempre que **todas** las diferencias del volcado sean de la propiedad `z-index` (`style-diff | grep '^ *[a-z-]*:' | sort | uniq -c` debe dar solo `z-index`) y que el orden por pares se mantenga, cosa que fija `src/__tests__/unit/shellTokens.test.js`.
- [ ] **Capturas:** en todos los PR menos el 2, las 48 referencias no cambian. En el PR 2 se regeneran **solo** las pantallas afectadas, se revisan una a una y la lista va en el PR.
- [ ] `npm run lint:colors` no sube en ningún archivo; los tokens nuevos de `tokens.css` no cuentan como color suelto.
- [ ] Informe táctil: se documenta el número por pantalla. Sube solo donde se añada un control en Ajustes; no se acepta un aumento en la cabecera.
- [ ] Recorrido de `paridad.md` (RF8) anotado en `tasks.md`.

Al terminar la capa:
- [ ] `grep` de 6.2 sin resultados: ningún número de altura de barra fuera de `tokens.css`.
- [ ] v1 y v2 tienen capturas de referencia propias y las dos comparan sin diferencias en Docker.
- [ ] Con `VITE_UI=v2` y con el conmutador de Ajustes se llega a la misma pantalla, y apagar v2 devuelve a v1 **sin recargar** y con la sesión intacta.
- [ ] `MEMORY.md`, `CHANGELOG.md`, `paridad.md` (D-01 y D-03 cerrados) y el roadmap actualizados.

## 6. Diseño técnico

### 6.1 Archivos

| Archivo | Cambio |
|---|---|
| `src/styles/tokens.css` | `--nav-h`, `--nav-h-total`, `--bottom-nav-h`, `--bottom-nav-gap`, `--z-*` y, en `html[data-ui="v2"]`, la escala de texto, radios y paleta |
| `tailwind.config.js` | `zIndex` y `borderRadius` con tokens; nada de `colors` nuevo en la shell |
| `src/components/dashboard/Navbar.jsx` | Cabecera móvil ligera; utilidades fuera; un solo cierre de sesión (en el menú) |
| `src/components/layout/BottomNav.jsx` | Altura con token; se conservan 4 pestañas + satélite |
| `src/components/layout/MobileSwipePager.jsx` | `h-[calc(100dvh-var(--nav-h-total))]`, `.hide-scrollbar` en las exclusiones |
| `src/components/dashboard/UploadStatusBanner.jsx` | `top-[var(--nav-h-total)]` |
| `src/components/Dashboard.jsx`, `src/components/pages/ActivityDetailPage.jsx`, `FitnessStatsPage.jsx`, `HealthPage.jsx` | Alturas con tokens |
| `src/hooks/useUiMode.js` | **Nuevo**: lee y cambia `data-ui` sin recargar |
| `index.html` | Script en línea que aplica `data-ui` antes del primer pintado |
| `src/components/pages/ProfilePage.jsx` | Recibe "Borrar DB" y el conmutador de v2; controles con etiqueta (el importar CSV se retiró en el PR 2, D3) |
| `e2e/shell.spec.js` | **Nuevo**: alturas, solapes, paridad de la cabecera |
| `e2e/visual-v2.spec.js` | **Nuevo**: capturas de v2 (RF11) |
| `e2e/gestures.spec.js` | D-01: quitar `test.fail()` |
| `docs/branches/...` | `spec`, `plan`, `tasks` y `paridad.md` |

### 6.2 Cómo se define `--nav-h`
En `:root`, junto a las sombras:

```css
:root {
  /* Shell (spec-rediseno-02-c3): alto de la cabecera sin la safe area y con ella. */
  --nav-h: 3.5rem;                                /* PR 1: 56 px, lo que ya asumían pager y banner;
                                                     PR 2: 3.75rem = 60 px, el alto real corregido (D4) */
  --nav-h-total: calc(var(--nav-h) + env(safe-area-inset-top, 0px));
  --bottom-nav-h: 3.375rem;                       /* 54 px, la cápsula actual */
  --bottom-nav-gap: 0.75rem;                      /* separación inferior actual */
}
```

- La cabecera **se ajusta al token**, no al contrario: medía 81 px en móvil y 63,5 en escritorio mientras el pager asumía 56. Si el diseño pide otro alto, se cambia el token y las tres pantallas que dependen de él se mueven solas; la decisión del valor va en D4.
- Fuera de `tokens.css` no queda ningún `56px`, `52px`, `54px`, `170px`, `250px`, `130px` ni `4rem` de cabecera. Se comprueba con:
  `grep -rn "56px\|52px\|170px\|250px\|130px\|(100dvh-4rem)\|h-\[54px\]" src/`

### 6.3 Escala de z-index (propuesta)

| Token | Valor | Quién |
|---|---|---|
| `--z-base` | 0 | mapa y marcas internas |
| `--z-sticky` | 10 | elementos pegajosos dentro de una pantalla |
| `--z-nav` | 30 | cabecera y banner de subida |
| `--z-nav-menu` | 40 | menú de la cabecera |
| `--z-bottom-nav` | 40 | barra inferior flotante |
| `--z-sheet` | 50 | hoja del planificador |
| `--z-modal` | 60 | los 4 modales y el visor |
| `--z-tooltip` | 70 | `ChartTooltip`, `InfoTooltip` |
| `--z-map` | 400 | controles de Leaflet (los fija la librería) |
| `--z-toast` | 9999 | `Toaster` de react-hot-toast (valor de la librería: se documenta, no se cambia) |

Los tokens se exponen en `theme.extend.zIndex` para poder usar `z-nav`, `z-modal`… y `z-[var(--z-map)]` donde Tailwind lo exija.

### 6.4 Cabecera móvil: propuesta (D2)
| Grupo | Hoy (móvil) | Propuesta |
|---|---|---|
| Identidad + menú de Ajustes | sí | **sí** |
| Cambiar tema | sí | **sí** |
| Strava (conectar / sincronizar) | sí | **sí** (acción principal de la app) |
| Cerrar sesión | sí (icono) + menú + escritorio | **solo en el menú** (un clic más, un icono menos en la cabecera) |
| Importar CSV | no (solo escritorio) | **retirado** (D3: nunca implementado) |
| Añadir manual | no (solo escritorio) | se queda en Actividades, que ya lo tiene |
| Borrar DB | no (solo escritorio) | **Ajustes → Seguridad y Datos** (RF6) |

En escritorio el resultado es simétrico: las pestañas siguen en el centro, tema y Strava a la derecha, y toda la utilidad secundaria en Ajustes (desaparecen los 4 iconos de la derecha y el cierre de sesión duplicado).

### 6.5 Activación de v2 (RF9)
1. **Antes del pintado** (`index.html`, junto al script del tema):
   ```js
   const ui = localStorage.getItem('ui') || '%VITE_UI%';
   if (ui === 'v2') document.documentElement.dataset.ui = 'v2';
   ```
   El valor de entorno se inyecta con `vite` (`define` o `import.meta.env` en el script de arranque, según C7).
2. **En caliente** (`src/hooks/useUiMode.js`): `useUiMode()` devuelve `{ ui, setUi }`, escribe `document.documentElement.dataset.ui` y `localStorage`, y avisa a los suscriptores (mismo patrón que `useTheme`). No desmonta ni recarga: el cambio es de CSS, así que los datos de React Query y la sesión siguen intactos.
3. **Conmutador** en Ajustes → General, con `role="switch"` y etiqueta "Vista previa v2". Sigue visible hasta que v2 sea la vista por defecto (D8).

### 6.6 Piel v2 (la define `feat/ui-skin-v2`, aquí solo se reserva el sitio)
`html[data-ui="v2"]` sobreescribe: escala tipográfica (`--text-*`), radios (`--radius-*`), sombras y paleta (incluidos los valores `.dark` de `chartTheme` que hoy faltan, D-10, y las escalas ordinales que la dirección visual necesite). Nada de esto entra en `feat/ui-shell`: aquí solo se crea el mecanismo, vacío, para que el PR de piel sea un cambio de valores.

## 7. Pruebas

| Prueba | Qué fija | PR |
|---|---|---|
| `e2e/shell.spec.js` — alturas | la cabecera mide `--nav-h-total` en móvil y escritorio; ninguna pantalla tiene contenido tapado arriba (**ya lo hace `layout.spec.js`**) ni hueco muerto | 1 |
| `e2e/shell.spec.js` — paridad | las 9 acciones de `paridad.md:23-44` existen y hacen lo mismo, en sus nuevas ubicaciones | 2 |
| `e2e/shell.spec.js` — destructiva | "Borrar DB" está en Ajustes y pide confirmación | 2 |
| `e2e/shell.spec.js` — tema | el tema cambia, se guarda en `localStorage` y sobrevive a la navegación | 2 |
| `e2e/gestures.spec.js:37` | D-01: deslizar `.hide-scrollbar` ya no cambia de pestaña (sin `test.fail()`) | 1 |
| `e2e/ui-mode.spec.js` | `data-ui="v2"` se activa por `localStorage` antes del pintado; el conmutador cambia sin recargar y conserva la sesión | 4 |
| `e2e/visual-v2.spec.js` | capturas de v2 (8 pantallas × 2 temas × 3 tamaños) | 4+ |
| Unitaria: `uiMode.test.js` | `useUiMode` aplica y retira el atributo y sincroniza a los suscriptores | 4 |
| Unitaria: `shellTokens.test.js` | `tokens.css` declara `--nav-h`, `--nav-h-total` y la escala `--z-*` completa | 1 |
| Volcado de estilos | 0 diferencias en v1 en todos los PR salvo el 2 (en el 1, solo `z-index`, por D5) | todos |

## 8. Notas adicionales

### Decisiones que necesitan tu aprobación

- **D1. Las capturas de v1 cambian una vez, en el PR de estructura.** `--nav-h` corrige el desfase de 3 px y la reorganización quita iconos de la cabecera: es imposible hacerlo sin cambiar capturas. **Propuesta:** el PR 2 regenera las referencias afectadas, las reviso una a una y las listo en el PR; a partir de ahí, v1 queda congelada y la piel va solo tras `data-ui="v2"`. La alternativa es meter también la estructura detrás de v2, y entonces la cabecera seguiría sobrecargada hasta que v2 sea la vista por defecto.
- **D2. Composición de la cabecera móvil.** La de 6.4: identidad + menú, tema y Strava se quedan; cierre de sesión e utilidades pasan a Ajustes. **Propuesta:** aceptarla. Alternativa: dejar también el cierre de sesión en la cabecera (menos limpio, pero menos clics para una acción frecuente).
- **D3. Importar CSV.** Hoy está roto (D-03). **Decidido el 2026-11-10 (al implementar el PR 2): se retira el icono.** No había nada que cablear: `processFile` era un `console.log("Lógica de CSV pendiente", file)` y se borró en `f8114a6`, y `Dashboard` nunca pasó `onFileUpload`, así que el icono solo lanzaba un error. D-03 se documenta como **«acción retirada: nunca implementada»**; la importación, cuando se especifique su formato (export de Strava, Garmin…), será una funcionalidad nueva y no parte de esta capa. Alternativa descartada: implementar el parser y la inserción en este PR.
- **D4. Valor de `--nav-h`.** **Decidido el 2026-11-10: 60 px (`3.75rem`)**, medido con Playwright antes de tocar el código: la cabecera real medía **81 px en móvil** y **63,5 px en escritorio**. Los 81 px no eran relleno: el botón de Strava se partía en dos líneas al no caberle 30 px del icono de cerrar sesión. Sin ese icono y con altura fija mide 60 px en los tres tamaños, con el contenido de 36 px y 12 px arriba y abajo. Alternativas descartadas: 56 px (D4 original, más apretada) y 64 px.
- **D5. Numeración de la escala `z-*`.** La de 6.3 (30/40/50/60/70). **Propuesta:** aceptarla; deja libres 10 y 20 para lo interno y 400/500 para mapa y toasts.
- **D6. D-01 en esta capa.** **Propuesta:** sí, en el PR 1 (es una línea y una prueba que pasa a normal). Alternativa: dejarlo como defecto conocido.
- **D7. Dirección visual de v2.** Se elige sobre **Dashboard y Calendario** antes de extender, como dice el roadmap. **Propuesta:** en `feat/ui-skin-v2`, PR 1, con las dos pantallas y el volcado comparativo de v1; aprobación tuya antes de seguir con el resto.
- **D8. Dónde vive el conmutador de v2.** **Propuesta:** Ajustes → General, visible para todos hasta que v2 sea la vista por defecto. Alternativa: solo por entorno y `localStorage` (sin interruptor visible), y entonces la vista previa se prueba con `VITE_UI=v2`.

### Lo que esta capa NO hace
- No toca la landing ni el acceso (Capa 4).
- No reescribe pantallas (Capa 5).
- No cambia la barra inferior de sitio ni su diseño en v1: solo su altura pasa a token.
- No define todavía la paleta v2 concreta: eso es `feat/ui-skin-v2`, tras aprobar D7.

### Hallazgos para capas posteriores
- `TAB_PATHS`/`MAIN_TABS`/`tabs` están en tres archivos con etiquetas distintas ("Rendimiento" en escritorio, "Forma" en móvil). Unificarlos es un cambio de copy: queda para la Capa 5.
- El botón "Añadir manual" existe dos veces (cabecera y Actividades).
- El detalle de actividad tiene su propia cabecera con `z-50` y `glass-nav`, fuera de `Navbar`: cualquier cambio de `--nav-h` debe mirarlo también.
