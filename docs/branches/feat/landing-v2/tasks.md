# Tareas — Capa 4, rama `feat/landing-v2`

Spec: `spec.md`. Plan: `plan.md`. **Aprobada por el usuario el 2026-11-12: «Apruebo recomendadas»** → D1 = tras `data-ui="v2"`, D2 = extender «Panel», D3 = hero con UI real (datos simulados), D4 = retirar el canvas, D5 = retirar «∞», «24/7», «100% gratis» (el mensaje de precio queda fuera hasta que lo confirme), D6 = equivalentes en el repo si la skill no aparece, D7 = borrar `LoginPage.jsx`.
D5 y D6 resueltas el mismo día (ver spec.md): sin promesa de gratuidad; skill clonada en `.taste-skill/` y verificadores leídos (locales, sin red externa).

## PR 1 — `refactor(landing)`: estructura sin cambio visual

Rama `refactor/landing-structure`, sale de `feat/landing-v2` (docs) sobre `develop` (`54443b5`).

- [x] `LandingPage.jsx` 495 → 264 líneas; `AuthModal`, `FadeIn` y `ParticleCanvas` a `src/components/landing/`.
- [x] Cabecera `z-40` → `z-nav` (30). `z-10` del hero y `zIndex: 0` del canvas se quedan: orden interno, no capa de la app.
- [x] Color del canvas: `rgba(96,130,255)` → token `--landing-particle` (claro y oscuro, mismo valor).
- [x] D7: `src/components/auth/LoginPage.jsx` borrado (sin referencias).
- [x] `e2e/public.spec.js`: modal con sus 3 modos y retorno, Escape, `/email-confirmado` → landing.
- [x] Línea base de `lint:colors` movida y bajada (754→743 palette, 9→8 rgb, 168→165 dark).
- [x] PR hacia `develop` (#78, mergeado en `bd7d046`).

### Notas del PR 1
- **Volcado `full` frente a `develop` (`54443b5`):** 104 volcados, 88.718 elementos, **12 diferencias, todas `z-index` 40 → 30 en la cabecera de la landing** (6 volcados de landing + 6 de modal de acceso en móvil y tablet; escritorio no tiene landing). Lo previsto; la cabecera no convive con nada entre 30 y 40.
- **Resultados:** lint ✓, lint:colors ✓ (743/3/100/8/165, baja), lint:ui ✓ (14), unit 195/195, integración 10/10, build ✓, E2E Docker **207 ✓** / 113 omitidas / 0 ✘ (capturas sin cambios).
- Nota de entorno: `node_modules` de este worktree está casi vacío; los comandos resuelven al de la raíz del repo.

## PR 2 — dirección visual (hero + una sección) · parada de aprobación

Rama `feat/landing-direction`, sale de `develop` (`bd7d046`).

- [x] Propuesta visual presentada y aprobada: opción A «panel real» (hero con UI real y datos simulados).
- [x] Implementación: `HeaderV2`, `HeroV2` y `DashboardPreview` (sección «Tu forma de hoy») tras `data-ui="v2"`; sin canvas en v2; copy neutro en el hero; token `--on-action` (texto sobre acción, solo v2); `data-skin="landing"`. Las secciones de abajo siguen siendo las de v1 (PR 3).
- [x] Capturas de v2 (390/768/1440, claro/oscuro) regeneradas en Docker (solo `visual-v2 … landing`; v1 intacto). Revisadas una a una: se corrigió el truncado de las etiquetas de los KPI en móvil (código TSB/CTL/ATL solo desde `sm`).
- [x] Volcado `full` frente a `develop` (`bd7d046`): 104 volcados, 88.718 elementos, **0 diferencias** (landing v1 y app autenticada intactas).
- [x] Verificadores (taste-skill, sobre `vite build` con `VITE_UI=v2` + `vite preview`): `perf` solo falla «JS parsed» (995 KiB, bundle único de la SPA, preexistente y fuera de alcance); `consistency` lista fallos que son de otro tipo de página (plantilla de marketing: `main`/`.wrap`, hero a 100svh, h2 dentro del hero) y el pie «Datos de ejemplo», que se mantiene a propósito por honestidad (datos simulados); `layout/check.mjs` no es aplicable a una SPA (falla al leer secciones). Pendiente real para PR 3: skip-link, metas `og:`/`twitter:`, y el contraste de la etiqueta «FUNCIONES» (3,68:1, sección de v1).
- [x] Lint, `lint:colors` (743/3/100/8/165, sin subir), `lint:ui`, unit 195/195.
- [x] PR #79 hacia `develop`; dirección visual **aprobada por el usuario** (2026-11-12). PR 3 puede empezar.

## PR 3 — resto de secciones (`feat/landing-sections`, #80)
Hecho. Detalle y verificación de afirmaciones (RF6) en `docs/branches/feat/landing-sections/tasks.md`.

## PR 4 — modal de acceso y `EmailConfirmedPage` (`feat/auth-modal-v2`, #81)
Hecho. Detalle en `docs/branches/feat/auth-modal-v2/tasks.md`.

## PR 5 — cierre (`docs/landing-cierre`)

- [x] (1) Verificadores de la taste-skill sobre el build v2 servido: ver «Verificadores» abajo.
- [x] (2) Peso y rendimiento: `Dashboard` pasa a `React.lazy` en `App.jsx` (único cambio de código); ver «Peso».
- [x] (3) Lighthouse y axe en claro/oscuro, móvil/escritorio: ver «Lighthouse y a11y».
- [x] (4) «Strava y CSV» en la landing: **se mantiene** (decisión del usuario, 2026-11-16). Se reescribirá cuando se replantee Strava/Garmin (D5).
- [x] (5) Cierre documental: `CHANGELOG.md`, `MEMORY.md`, specs de la Capa 4 marcadas como implementadas.
- [x] Lint ✓, `lint:colors` ✓ (743/3/100/8/165, sin subir), `lint:ui` ✓ (14), unit 196/196, integración 10/10, build ✓, E2E Docker completo **234 ✓** / 113 omitidas / 0 ✘ (capturas sin cambios). El CSS compilado conserva su hash (`index-CyyghsC8.css`): sin cambio de estilos, volcado = 0 por construcción.

### Peso (medido con `perf.mjs`, build `VITE_UI=v2`, landing sin sesión)
| | Antes (#81) | Después |
|---|---|---|
| JS parseado | 1010 KiB (**FAIL**) | 513 KiB (WARN) |
| JS transferido (gzip) | 303 KiB | 155 KiB |
| Transferencia total (escritorio) | 369 KiB | 221 KiB |
| Ficheros JS en la landing | 6 | 5 |

- **Causa:** `App.jsx` importaba `Dashboard` de forma estática; como `Dashboard` arrastra `recharts`, un visitante sin sesión descargaba la app autenticada entera (`vendor-charts` 388 KB, preparado con `modulepreload`). Las pantallas ya eran perezosas; faltaba la propia `Dashboard`.
- **Cambio:** `const Dashboard = lazy(() => import('./components/Dashboard'))` con `<Suspense fallback={<LoadingState variant="boot" />}>` (el mismo estado de arranque que ya se ve mientras se comprueba la sesión). Sin lógica nueva; mismos datos, mismas rutas.
- **Efecto para el usuario con sesión:** una petición más (chunk `Dashboard`, 122 KB / 39 KB gzip) antes de pintar la app, con el estado de arranque en pantalla; `vendor-charts` ya no se precarga y se pide junto a `Dashboard`.
- **No se divide `AuthModal`:** pesa unos pocos KB dentro del `index`; separarlo añade un salto de red al abrir el acceso (la acción más importante de la landing) para ahorrar casi nada. Descartado con datos.
- **Deuda:** el resto de `JS parsed` (513 KiB: React, Supabase 170 KB, Query, `index`) es la base mínima de una SPA con autenticación; bajarla exige separar el cliente de Supabase de la landing (cambiaría `src/supabase.js`, fuera de alcance, RF9).

### Lighthouse y a11y (build v2 servido con `vite preview`; Lighthouse 12, axe-core 4, Chrome headless)
| Página | Tema | Dispositivo | Perf | A11y | Buenas prácticas | SEO |
|---|---|---|---|---|---|---|
| Landing | claro | móvil / escritorio | 95 / 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| Landing | oscuro | móvil / escritorio | 96 / 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| `/email-confirmado` | claro | móvil / escritorio | 96 / 100 | 100 / 100 | 100 / 100 | 91 / 91 |

- Landing móvil: LCP 2,4 s, TBT 0 ms, CLS 0 (throttling simulado de Lighthouse).
- **axe-core** (WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) sobre landing, modal (entrar, registro, recuperar) y correo confirmado × claro/oscuro × 390/1440: **0 violaciones en las 20 escenas.**
- **SEO 91 → deuda:** `robots.txt` no existe (el servidor devuelve `index.html`) y no hay `og:image` (P3, decisión del usuario). Si se añade `robots.txt` se decide también si la app se indexa: decisión de producto, no se toca aquí.
- **Rendimiento → deuda:** CSS bloqueante (un único `index-*.css`, 150 KB / 24 KB gzip) y JS sin usar; separar el CSS de la landing del de la app es una reestructura de Tailwind, fuera de alcance.

### Verificadores (taste-skill, `.taste-skill/` clonado, sin dependencias; solo build servido en local)
- **`perf.mjs`:** antes, único FAIL «JS parsed» (1010 KiB); **ahora 0 FAIL** (WARN 513 KiB y CSS 150 KiB en móvil). FCP/LCP, CLS, long tasks, imágenes y fuentes en PASS.
- **`consistency.mjs`** (5 anchos): corregido en PR 3 `focus-hidden` y `reduced-motion`; los demás hallazgos son reglas de una plantilla de marketing de pantalla completa y se **descartan con motivo**:
  - `section-height`, `container-edges`, `one-section`, `one-heading`, `hero-screen`, `hero-fill`, `section-gaps`, `section-air`: exigen secciones a pantalla completa, un h2 por sección y el hero terminando en el pliegue. La landing v2 es una página de panel (hero + vista previa + funciones) aprobada por el usuario con ese ritmo.
  - `no-visual`, `text-only`, `cta`: no detecta las maquetas JSX/SVG como «visual» ni los botones de la SPA como CTA (los enlaces están y el E2E los recorre).
  - `visual-caption` «Datos de ejemplo»: se mantiene a propósito, honestidad sobre datos simulados.
  - `copy-headline`, `copy-fact`, `heading-scale` («no visible h1»): falso positivo; el `h1` existe y es único (E2E `public.spec.js`; es el LCP de `perf.mjs`) y el hero lleva cifras en la banda de hechos. Copy aprobado en el PR 2.
  - `share-meta`: sin `og:image` por decisión P3 (PR 3). `effects-fit`: sin tipo de página declarado, no aplica.
  - `hidden-content` (WARN): simula un `IntersectionObserver` que nunca responde; `Reveal` ya deja el contenido visible sin él y sin movimiento reducido; el caso residual (observer presente que no dispara) no ocurre en navegadores reales.
- **`layout/check.mjs`:** no aplicable a una SPA (PR 2).
- **Modal de acceso:** los verificadores solo miden la página; se cubre con axe (0 violaciones), E2E de teclado/foco y las capturas del PR 4.

## Capa 4: cerrada
PR 1 #78, PR 2 #79, PR 3 #80, PR 4 #81, PR 5 (este). Siguiente: **Capa 5 (pantallas)**; D8 sigue abierta.
