# Especificación SDD — spec-rediseno-02-c4-pr3 (Capa 4, PR 3: secciones de la landing v2)

## 1. Identificación
- **ID:** `spec-rediseno-02-c4-pr3` · **Rama:** `feat/landing-sections` (desde `develop` en `27f28d1`, incluye #79).
- **Estado:** borrador, pendiente de aprobación. Amplía `docs/branches/feat/landing-v2/spec.md` (D1–D7 ya resueltas; no se reabren).
- **Fecha:** 2026-11-12.

## 2. Objetivo
Completar la landing v2 (`html[data-ui="v2"]`) con las secciones que siguen al hero, con la UI real de Forma y datos simulados (D3), copy neutro y verificable (D5), y cerrar los pendientes de accesibilidad/SEO que dejó el PR 2. La landing v1 no cambia.

## 3. Estado de partida (v2 hoy)
`HeaderV2` + `HeroV2` (hero, `DashboardPreview` y 3 fichas) y, debajo, **las secciones de v1 sin rediseñar**: «Funciones» (bento con iconos de color), cifras («∞», «24/7», «5+», «100% Gratis»), CTA final («Crear Cuenta Gratis») y pie. Falta skip-link, metas `og:`/`twitter:` y la etiqueta «FUNCIONES» tiene contraste 3,68:1.

## 4. Alcance
### 4.1 Secciones nuevas (solo en v2; en v1 se conservan las actuales)
1. **Funciones** (`id="features"`): 4 bloques alternados, cada uno con texto + **maqueta real con datos simulados** (como `DashboardPreview`, SVG/HTML con tokens, sin imágenes ni canvas):
   - Análisis de actividad: zonas de FC (7 zonas, Friel; `tssEngine.ts`), curva y métricas de potencia (NP, IF, VI, TSS).
   - Calendario: mes con carga diaria y entrenos planificados/ejecutados.
   - Mapa y gráfica sincronizada: **sin «pasa el ratón»** (RF10: nada depende de hover); texto «Recorrido y gráfica juntos».
   - Salud/recuperación (`HealthPage`) — a confirmar con el usuario (P2).
2. **Cifras → hechos comprobables** (sustituye «∞/24/7/100% Gratis»): «7 zonas de FC», «NP · IF · VI · TSS», «CTL · ATL · TSB», «Strava y archivos de actividad» (formatos de `parser.ts`, se verifica al implementar). Cada cifra enlaza con un archivo del código en la tabla de verificación del PR.
3. **CTA final y pie**: «Crear cuenta» / «Empezar» (sin «gratis»); pie con enlaces solo a secciones de la propia página (sin páginas legales inexistentes), texto ≥ 11 px.
4. **Fichas del hero** (`SIGNALS`): se mantienen; si solapan con «Funciones» se funden (se decide con las capturas).

### 4.2 Copy (D5, RF6)
- Retirados: «∞», «24/7», «100% Gratis», «Empezar Gratis», «Crear Cuenta Gratis», «Crea tu cuenta gratuita», «pasa el ratón…», «automáticamente» de Strava. Comprobado en el código: la sincronización de Strava la inicia el usuario y solo la telemetría posterior es automática (`useStravaSync.js`), así que se dice «Conecta Strava y trae tus actividades».
- **No** se mencionan límites de Strava ni Garmin. Se conserva «Datos de ejemplo» en las maquetas.
- «Laboratorio» ya salió del hero v2; tampoco aparece en las secciones.

### 4.3 Accesibilidad y SEO
- **Skip-link** «Saltar al contenido» (primer foco, visible al enfocar, `main` con `id`), solo en v2.
- **Contraste de «FUNCIONES»**: etiqueta con token de texto que pase AA (≥ 4,5:1) en claro y oscuro.
- **Metas** `og:title`, `og:description`, `og:type`, `og:site_name`, `twitter:card`/`title`/`description` en `index.html` (copy neutro, sin imagen `og:image` salvo que exista un asset; si no, se anota como pendiente — P3).
- Un solo `h1`; `h2` por sección; objetivos ≥ 44 px; texto ≥ 11 px; `prefers-reduced-motion` (los `FadeIn` ya lo respetan; se comprueba).

### 4.4 Skill (D6)
Clonar `.taste-skill/` si falta (gitignored); leer `consistency.mjs`, `check.mjs` y `perf.mjs` antes de ejecutarlos; aplicar solo a las 3 páginas públicas sobre `vite build` con `VITE_UI=v2` + `vite preview`. Los fallos de tipo «plantilla de marketing» o del bundle único se anotan, no se «arreglan».

## 5. Requisitos
- [ ] **RF1** Todo valor visual nuevo tras `html[data-ui="v2"]`; tokens en `tokens.css`; `lint:colors` no sube; `lint:ui` verde.
- [ ] **RF2** v1 y app autenticada intactas: volcado `develop` vs rama = 0 (`style-diff.mjs`).
- [ ] **RF3** Móvil primero (390 → 768 → 1440), claro y oscuro; sin dependencia de hover.
- [ ] **RF4** Cada afirmación del copy, verificada contra el código (tabla en el PR).
- [ ] **RF5** Sin tocar `src/hooks`, `src/utils`, `src/services`, `src/store`, `supabase.js` ni `AuthModal` (PR 4).
- [ ] **RF6** `public.spec.js` y el resto del E2E en verde; capturas solo en Docker, regenerando solo las de landing v2 y leyéndolas una a una, reducidas.

## 6. Fuera de alcance
Modal de acceso y `EmailConfirmedPage` (PR 4); verificadores finales y documentación de cierre (PR 5); precios, páginas legales, Garmin, límites de Strava; `og:image` si no hay asset.

## 7. Preguntas para el usuario
- **P1.** ¿Maquetas con datos simulados hechas a mano en JSX/SVG (recomendado: ligeras, con tokens, tema claro/oscuro) o capturas PNG de la app (más pesadas, no siguen el tema)?
- **P2.** ¿Incluyo un bloque de «Salud y recuperación»? Recomiendo sí (es una pantalla real de la app); si prefieres, solo 3 bloques.
- **P3.** `og:image`: no hay imagen de marca para redes. ¿Genero una desde la maqueta del hero (otro asset a mantener) o lo dejamos sin imagen por ahora? Recomiendo sin imagen.
- **P4.** ¿Cifras en banda (4 hechos) o integradas dentro de los bloques? Recomiendo banda corta, más fácil de verificar.

## 8. Riesgos
| Riesgo | Mitigación |
|---|---|
| Maquetas que parecen la app pero divergen | Mismos tokens/componentes de métrica; «Datos de ejemplo» visible |
| Peso extra en el bundle | SVG/JSX ligeros, sin imágenes; se mide antes/después |
| Capturas frágiles por `FadeIn` | Ya desactivadas en el E2E; se verifica |

---
Versión: 0.1.0 (borrador) — 2026-11-12
