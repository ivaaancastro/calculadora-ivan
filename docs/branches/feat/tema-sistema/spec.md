# Spec: tema del sistema y mapa según el tema

## 1. Identificación
- **ID:** `spec-b3-tema-sistema`
- **Título:** Seguir el tema del sistema por defecto y teselas del mapa según el tema
- **Autor:** agente B3 (Oleada 1)
- **Fecha:** 2026-11-27
- **Estado:** implementada (aprobada por el usuario el 2026-11-27, D1–D5 en A)

## 2. Objetivo
Por defecto Forma sigue el tema del sistema, también cuando cambia con la app abierta, y el mapa del detalle usa teselas claras u oscuras según el tema activo.

## 3. Contexto y justificación
Estado actual, confirmado en el código:

| Hallazgo | Dónde |
|----------|-------|
| `prefers-color-scheme` solo se lee al cargar; nadie escucha cambios | `useTheme.js:7-11`, `index.html:29-33` |
| El primer toque del interruptor fija la preferencia para siempre; no hay «Sistema» | `useTheme.js:23-38`, `Navbar.jsx` |
| El mapa arranca siempre en claro | `ActivityMap.jsx:92` (`useState('light')`) |
| `theme-color` fijo oscuro en las dos apariencias | `index.html:28`, `vite.config.js:34-35` |
| `localStorage` sin `try` (si lanza, el script falla y `useTheme.js` rompe la carga) | `index.html`, `useTheme.js` |
| Nuevo: `color-scheme: light dark` hace que los controles nativos (fechas, selectores, barras) sigan al sistema y no al tema de la app | `src/index.css:15` |
| Nuevo: `useTheme.js` llega con trozos cargados en diferido; un cambio del sistema en las páginas públicas necesita iniciar el tema desde `main.jsx` | `App.jsx:14` |

## 4. Requisitos funcionales
Las letras D remiten a las decisiones de la sección 8 (aquí, la opción recomendada).

- [x] **RF1 — Preferencia.** Tres valores: Sistema, Claro, Oscuro. Sistema es el valor por defecto y se representa sin clave `theme` en `localStorage`; Claro y Oscuro guardan `light` / `dark`. Un valor desconocido equivale a Sistema.
- [x] **RF2 — En vivo.** En Sistema, cambiar el tema del sistema cambia la app sin recargar, en cualquier ruta. Con Claro u Oscuro, no.
- [x] **RF3 — Preferencias guardadas.** Quien ya tiene `theme` guardado lo conserva (D4).
- [x] **RF4 — Interruptor de la cabecera.** Alterna claro/oscuro. Si el resultado coincide con el sistema, vuelve a Sistema; si no, queda fijo (D2).
- [x] **RF5 — Ajustes.** En Ajustes → General, grupo «Apariencia» con control segmentado Sistema · Claro · Oscuro. Se aplica al instante, es de este dispositivo y no cuenta como «Cambios sin guardar» (D1).
- [x] **RF6 — Mapa.** Las teselas empiezan en el tema activo y le siguen en vivo. El selector Claro · Oscuro · Satélite se mantiene: una elección distinta del tema activo dura mientras el mapa está abierto; elegir la del tema activo vuelve a seguirlo (D3). El halo de la ruta acompaña a las teselas.
- [x] **RF7 — Barra del navegador.** `meta theme-color` toma el valor de `--canvas` del tema activo, desde la primera pintura y en cada cambio. El manifest no cambia (D5).
- [x] **RF8 — Controles nativos.** `color-scheme` coincide con el tema activo.
- [x] **RF9 — Robustez.** Si `localStorage` o `matchMedia` fallan o no existen, la app carga (Sistema o claro) y el interruptor funciona durante la sesión.

## 5. Criterios de aceptación
- [x] Sin preferencia guardada, emular claro/oscuro con la app abierta cambia la clase `dark`, las teselas y `theme-color` sin recargar.
- [x] Elegir Oscuro en Ajustes con el sistema en claro sobrevive a recargar; volver a Sistema borra la clave.
- [x] Dos toques en el interruptor dejan la preferencia en Sistema.
- [x] No hay destello del tema contrario al cargar.
- [x] Control de Ajustes con objetivos ≥ 44 px a 390 px y sin desbordamiento.
- [x] `npm run verify` en verde, sin subir líneas base; CI < 5 min.
- [x] Capturas antes/después a 390 y 1440 px, claro y oscuro (Ajustes y detalle con mapa), en el PR.

## 6. Diseño técnico
- **Hooks:** `src/hooks/useTheme.js`: almacén compartido `{ preference, theme }`, lectura y escritura protegidas, un solo oyente de `matchMedia`, `setPreference`, `toggleTheme`, `initTheme`. Aplica clase `dark` y `theme-color` (leído de `--canvas`, sin colores sueltos). Sigue devolviendo `theme` y `toggleTheme`: los consumidores actuales no cambian.
- **Arranque:** el script de `index.html` replica la lectura (protegida) y pone clase y `theme-color` antes de pintar. `src/main.jsx` llama a `initTheme()`.
- **Componentes:** `Navbar.jsx` (solo si cambia la etiqueta accesible; la lógica vive en el hook); nuevo `src/components/pages/profile/AppearanceGroup.jsx` con `Segmented`, incluido en `GeneralSection.jsx`; `ActivityMap.jsx` (elección manual `null` = seguir tema); `mapTiles.js` sin cambios de URL salvo que haga falta.
- **Estilos:** `src/index.css`, solo `color-scheme` (`:root` claro, `.dark` oscuro).
- **Fuera de alcance:** `tokens.css`, `docs/design/forma.md`, `vite.config.js` (con D5 recomendada), métricas, tarjetas, tooltips; sincronizar la preferencia entre pestañas o dispositivos.
- **Base de datos:** nada.

## 7. Pruebas
- **Unitarias/integración:** `useTheme` (valores, oyente, interruptor, almacenamiento que lanza); `index.html` (script ejecutado con almacenamiento roto; sus colores iguales a `--canvas` de `tokens.css`); `AppearanceGroup`; teselas del mapa según tema y elección manual.
- **E2E:** en `e2e/layout.spec.js`, caso con `emulateMedia` (sin preferencia sembrada: opción nueva en `e2e/support/mockApp.js`); el caso actual del interruptor sigue valiendo. En `e2e/detail-map.spec.js`, teselas oscuras con tema oscuro.
- **Verificación:** `AGENTS.md` §8 bis.

## 8. Decisiones (aprobadas: todas en A)

| # | Decisión | Opciones | Recomendación |
|---|----------|----------|---------------|
| D1 | Dónde se elige «Sistema» | **A** Ajustes → General · **B** el botón de la cabecera cicla los tres · **C** menú desplegable en el botón | **A**: explícito, no complica la cabecera ni pisa los popovers de B5 |
| D2 | Interruptor de la cabecera | **A** vuelve a Sistema si coincide con él · **B** siempre fija claro/oscuro | **A**: nadie queda atrapado sin querer; para fijar el mismo tema del sistema está Ajustes |
| D3 | Selector del mapa | **A** se mantiene y sigue al tema hasta que se elija otro · **B** se reduce a Mapa · Satélite · **C** como A, recordando la elección | **A**: cambio mínimo sin perder opciones |
| D4 | Preferencias ya guardadas | **A** respetarlas · **B** pasar a todos a Sistema una vez | **A**: fueron un toque del usuario; vuelve a Sistema desde Ajustes |
| D5 | Manifest (`theme_color`, `background_color`) | **A** dejarlo oscuro (pantalla de arranque de marca; la meta manda ya dentro de la app) · **B** claro · **C** negro `#000000`, igual que `--canvas` oscuro | **A**: el manifest no admite variar por tema de forma fiable |

## 9. Notas
- En la PWA instalada en iOS, `apple-mobile-web-app-status-bar-style: black-translucent` deja el texto de la barra de estado en blanco también en tema claro. Se anota para la Capa 7 (iOS); no se cambia aquí.
