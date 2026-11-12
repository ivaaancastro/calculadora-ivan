# Especificación SDD — spec-rediseno-02-c4 (Capa 4: landing y acceso)

## 1. Identificación
- **ID:** `spec-rediseno-02-c4`
- **Título:** Capa 4 del rediseño: landing, modal de acceso y página de correo confirmado
- **Autor:** agente Claude Code
- **Fecha:** 2026-11-12
- **Estado:** **borrador, pendiente de aprobación del usuario** (decisiones D1–D7 abiertas, sección 4).
- **Depende de:** `spec-rediseno-02` (roadmap), Capas 0–3 mergeadas en `develop` (último PR #77, `54443b5`).
- **Rama:** `feat/landing-v2` (nombre del roadmap).

## 2. Objetivo
Rediseñar las tres páginas públicas de Forma —`LandingPage`, su modal de acceso y `EmailConfirmedPage`— con la skill de dirección visual aplicada en su alcance completo (spec-rediseno-02, 6.2), manteniendo el flujo de acceso actual, con la UI real de Forma como protagonista y con cada afirmación comercial verificada.

## 3. Contexto

### 3.1 Inventario (2026-11-12, `develop` en `54443b5`)

| Pieza | Archivo | Notas |
|---|---|---|
| Landing | `src/components/pages/LandingPage.jsx` (495 líneas) | Mezcla en un solo archivo: `ParticleCanvas`, `FadeIn`, `AuthModal` (140 líneas), `FeatureCard`, `StatItem` y la página. Se renderiza en `App.jsx` cuando no hay sesión (ruta `*`). |
| Modal de acceso | `AuthModal` dentro de la landing + primitiva `Modal` (`variant="auth"`) | 4 modos: entrar, registrarse, recuperar clave (`supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail`). Redirecciones con `window.location.origin` (RF12: se adapta en la Capa 7, no aquí). |
| Correo confirmado | `src/components/pages/EmailConfirmedPage.jsx` (42 líneas) | Ruta `/email-confirmado`; el botón lleva a `/` (la landing). |
| Código muerto | `src/components/auth/LoginPage.jsx` (152 líneas) | **No se renderiza en ninguna parte**; sin referencias en `src/` ni `e2e/`. |

### 3.2 Pendientes heredados de las Capas 1 y 3
- **Capas (`z-index`) sueltas de la landing:** `LandingPage.jsx:277` (`z-40` en la cabecera fija) y `:318` (`z-10` del contenido del hero), más `style={{ zIndex: 0 }}` en el canvas (`:66`). La Capa 3 dejó cero `z-*` sueltos en el resto de `src/`. (La cabecera pasaría a `z-nav`; el `z-10` y el `0` son orden interno del hero.)
- **Canvas de partículas** (`ParticleCanvas`, `:11-69`): 80 partículas animadas con `requestAnimationFrame` y `rgba(96, 130, 255, …)` en un literal de JS; fuera de alcance de la Capa 1 (no lo ve `lint:colors`). No respeta `prefers-reduced-motion` ni el tema oscuro/claro.
- **Valores visuales sin tokenizar de la landing:** gradientes `from-blue-500/5`, colores de icono `bg-blue-600 / indigo / emerald / orange / amber` en `FeatureCard`, `bg-slate-900 dark:bg-white` del CTA, `text-blue-500` en `StatItem`, campos del acceso con `border-slate-200 dark:border-zinc-800` (D-08 del paridad: no entran en las primitivas de campo) y textos de 10–11 px (RF8 pide ≥ 11 px).
- **Skill de la capa:** la spec raíz (6.2) exige aplicar la skill completa y sus verificadores (`consistency.mjs`, `check.mjs`, `perf.mjs`) sobre la página pública. **No están en el repositorio** (`.taste-skill/` está ignorado y vacío). Hay que confirmar con el usuario dónde están (D6).

### 3.3 Afirmaciones comerciales actuales a verificar
Regla del roadmap: nada se publica sin confirmarlo. Hoy la landing dice:

| Texto | Estado |
|---|---|
| «∞ Actividades», «24/7 Análisis», «5+ Zonas FC», «100% Gratis» (bloque de cifras) | Sin verificar; «∞» y «24/7» son adornos, «100% Gratis» es una promesa de precio. |
| «Empezar Gratis», «Crear Cuenta Gratis», «Crea tu cuenta gratuita» | Igual que la anterior. |
| «Compatible con medidores de potencia», «NP, IF, VI, TSS» | Comprobable contra `src/utils/`. |
| «Pasa el ratón por la gráfica y mira tu posición» (mapas) | Depende de hover; en móvil no aplica (RF10). |
| «Sincronización Strava … automáticamente» | Comprobable contra el flujo real (¿manual o automática?). |
| «Performance Analytics Platform», «Tu laboratorio de rendimiento deportivo», «Entrar al Laboratorio» | Marca: el roadmap fijó **Forma** y quitó «FormaLab»; «laboratorio» es una metáfora que puede quedarse o no (D3). |

## 4. Decisiones que necesito del usuario

Cada una tiene mi recomendación; ninguna está tomada.

- **D1 · ¿La landing nueva se ve para todos o detrás de `data-ui="v2"`?**
  a) **Tras el flag (recomendada):** coherente con D12 (v1 por defecto hasta la Capa 6) y con la regla «v1 congelada». La landing v1 se conserva intacta; la nueva se ve con `VITE_UI=v2` o `localStorage`. Inconveniente: un visitante sin sesión no puede activarlo desde Ajustes, así que nadie la ve hasta la Capa 6 (salvo tú, vía `localStorage`/env).
  b) **Para todos desde el merge:** es lo que dice la tabla del roadmap («cambia lo que se ve: sí, solo páginas públicas»). Las capturas de la landing se regeneran una sola vez; la v1 desaparece de esta pantalla.
- **D2 · Dirección visual.** a) **Extender «Panel»** de la Capa 3 (misma paleta, tipografía y radios; identidad única app+landing; recomendada); b) **editorial/marketing** más expresiva (tipografía y paleta propias de la landing); c) **híbrida**: «Panel» como base y un hero más expresivo. La elección se valida con un PR de hero + una sección (como el PR 5 de la Capa 3) antes de extenderla.
- **D3 · Qué ve el visitante.** Hero con **capturas/maqueta de la UI real** de Forma (datos simulados de `e2e/support/mockApp.js`, nunca datos de nadie) en vez de iconos genéricos. ¿Se conserva la metáfora «laboratorio» en el copy?
- **D4 · Canvas de partículas.** a) **Retirarlo (recomendada)**: la UI real lo sustituye; menos JS y sin animación continua; b) conservarlo con color por token, tema claro/oscuro y `prefers-reduced-motion`; c) sustituirlo por un fondo estático (degradado/rejilla).
- **D5 · Bloque de cifras y afirmaciones.** Propongo retirar «∞», «24/7» y «100% Gratis» y sustituirlos por hechos comprobables del código (nº de métricas, zonas, deportes), y que tú confirmes el mensaje de precio (¿es gratis para siempre, hay plan de pago, qué pasa con Strava?). Sin tu confirmación, el texto de precio queda fuera.
- **D6 · Skill y verificadores.** ¿Dónde están la skill de taste y `consistency.mjs`/`check.mjs`/`perf.mjs`? Si no están disponibles, propongo sustituirlos por equivalentes en el repo (tabla de la sección 6.2: contraste, tamaño mínimo, un acento, peso de página, Lighthouse en CI) y lo dejamos anotado.
- **D7 · `LoginPage.jsx` (código muerto).** Eliminarlo (recomendado, en el PR de estructura, con `grep` que lo respalda) o mantenerlo. Aprobar su borrado cuenta como cambio de `src/` sin efecto visible.

## 5. Requisitos funcionales
- [ ] **RF1. Flujo de acceso intacto:** entrar, registrarse y recuperar clave siguen funcionando igual (misma API de Supabase, mismos mensajes de error y éxito, misma ruta `/email-confirmado`). Sin ruta `/login` nueva.
- [ ] **RF2. Estructura primero (RF7 de la raíz):** el PR de estructura (separar `AuthModal`, `FadeIn`, `ParticleCanvas`/sustituto y secciones; `z-*` a tokens; borrar código muerto) no cambia lo que se ve.
- [ ] **RF3. Tokens:** todo valor visual nuevo vive en `tokens.css` (y, según D1, detrás de `html[data-ui="v2"]`); `lint:colors` no sube; `lint:ui` en verde.
- [ ] **RF4. Móvil primero:** diseño aprobado a 390 px, luego 768 y 1440; objetivos táctiles ≥ 44 px; nada depende de `hover`; texto ≥ 11 px; zoom permitido.
- [ ] **RF5. UI real:** la landing muestra la interfaz de Forma (capturas o maqueta con datos simulados), no ilustraciones genéricas.
- [ ] **RF6. Afirmaciones verificadas:** cada texto de la tabla 3.3 se confirma contra el código o contra ti, o se retira.
- [ ] **RF7. Accesibilidad:** contraste AA en claro y oscuro, foco visible, etiquetas asociadas en el acceso, `prefers-reduced-motion` respetado, un solo `h1`.
- [ ] **RF8. Marca:** «Forma» en toda la copia pública.
- [ ] **RF9. Sin lógica:** no se tocan `src/hooks`, `src/utils`, `src/services`, `src/store` ni `src/supabase.js` (RF3 de la raíz). Los `window.location.origin` se quedan para la Capa 7.
- [ ] **RF10. Preparada para nativo:** nada nuevo asume ratón ni barra del navegador; las páginas públicas no dependen de un dominio fijo.

## 6. Criterios de aceptación
- [ ] `lint`, `lint:colors` (sin subir), `lint:ui`, unit, integración, `test:e2e` y `build` en verde, con los resultados en cada PR.
- [ ] Capturas propias de la landing, el modal de acceso (los 3 modos) y `EmailConfirmedPage` a 390/768/1440, claro y oscuro, en Docker (`orbctl start` si OrbStack no corre), revisadas una a una.
- [ ] Volcado de estilos `develop` vs rama = **0 diferencias** en lo que no debe cambiar (toda la app autenticada; y la landing v1 si D1 = a).
- [ ] Prueba E2E nueva del flujo público (landing → modal → los 3 modos → `/email-confirmado` → vuelta a `/`) y paso del test existente `auth.spec.js`.
- [ ] Verificadores de la skill (o sus equivalentes acordados en D6) y la red de la Capa 0 en verde.
- [ ] Peso de la landing medido antes y después (el canvas y las fuentes cuentan).
- [ ] Vista previa de Vercel revisada por ti antes de mergear; ningún merge sin tu autorización.

## 7. Fuera de alcance
- App autenticada, shell y lienzo (Capa 5/6); activar v2 por defecto (Capa 6).
- Login social, ruta `/login`, cambios de Supabase/Edge Functions (Capa 7 en lo que toque a enlaces universales).
- Páginas nuevas (precios, términos, privacidad), salvo que lo decidas aparte: el pie actual no tiene enlaces legales; la Capa 7 los exigirá (5.1.3).

## 8. Riesgos
| Riesgo | Mitigación |
|---|---|
| Skill de marketing aplicada fuera de su alcance (causa del primer intento fallido) | Solo en las 3 páginas públicas; la app autenticada no se toca |
| Promesas comerciales sin respaldo | RF6 y D5 |
| La landing es la única pantalla sin sesión: un fallo aquí bloquea el acceso | PR de estructura sin cambio visual primero; E2E del flujo público |
| Capturas frágiles (animaciones, `FadeIn`, canvas) | Desactivar animaciones en el E2E; D4 retira la fuente de ruido |

---
Versión: 0.1.0 (borrador) — 2026-11-12
